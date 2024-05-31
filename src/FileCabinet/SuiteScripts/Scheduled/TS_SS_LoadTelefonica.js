/**
 * @NApiVersion 2.1
 * @NAmdConfig  ../Library/JsLibraryConfig.json
 * @NScriptType ScheduledScript
 *
 * Task          Date            Author                                         Remarks
 * GAP Int Telefónica      14 Ago 2023     Giovana Guadalupe <giovana.guadalupe@myevol.biz>     - Validacion y tipo de cambi de Telefónica
 *
 */
define(["N/search", "N/record", "N/log", "N/file", "N/task", "xlsx", "../Library/TS_LIB_ControlPresupuestal.js", "N/https", "N/runtime"], (search, record, log, file, task, XLSX, libCP, https, runtime) => {
  const execute = (context) => {
    const FN = "execute";
    var aprobadorServicios = 60;//IVAN ESTRADA iestrada@asbanc.com.pe
    var aprobadorLineasTelefonicas = 89;//JOSE MELENDEZ jmelendez@asbanc.com.pe
    var d = new Date();
    var fechaHoraGen = d.getDate() + "" + (d.getMonth() + 1) + "" + d.getFullYear() + "" + d.getHours() + "" + d.getMinutes() + "" + d.getSeconds();
    try {
      let fileLogs = [];

      let fileCabinetResult = searchFileCabinet();
      // log.debug("fileCabinetResult", fileCabinetResult);
      const archivo = fileCabinetResult[0];
      log.debug("archivo", archivo);
      if (!archivo) {
        log.error("error", "No hay archivos para procesar");
        return;
      } else {
        // searchFileCabinet().forEach(function (archivo) {
        log.error("archivo", "Archivo: " + archivo.nombreArchivo);
        const excelFile = file.load({ id: archivo.carpeta });
        fileLogs.push(`Archivo ${archivo.nombreArchivo} leído`);
        if (excelFile && excelFile.fileType === "EXCEL") {
          let excelContents = excelFile.getContents();
          let workbook = XLSX.read(excelContents, {
            type: "base64",
            cellDates: true,
          });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          // log.debug("rows", rows);

          let fechaEmisionLineas = rows[0].indexOf("FECHA EMISION");
          let fechaEmisionServicios = rows[0].indexOf("fecemi");

          const bills = {};

          let flagInvalid = false;
          if (fechaEmisionServicios > -1) {
            //Servicios Telefónica
            log.debug("validando", "archivo de servicios Telefónica");

            //finding index of the column
            const factura = rows[0].indexOf("factura");
            const fecemi = rows[0].indexOf("fecemi");
            const fecven = rows[0].indexOf("fecven");
            const moneda = rows[0].indexOf("moneda");
            const referenciaNota = rows[0].indexOf("ReferenciaNota");
            const idinstprod = rows[0].indexOf("idinstprod");
            const cantidad = rows[0].indexOf("cantidad");
            const desde = rows[0].indexOf("desde");
            const hasta = rows[0].indexOf("hasta");
            const monto = rows[0].indexOf("monto");
            const monto_ing_igv = rows[0].indexOf("monto_ing_igv");
            const impuesto = rows[0].indexOf("impuesto");
            const tipoCambio = rows[0].indexOf("tipocambio");
            const cid = rows[0].indexOf("cid");

            for (let i = 1; i < rows.length; i++) {
              let row = rows[i];

              let facturaValue = 0;
              let tipo_documento = 0;
              let serieNumeroArray = 0;
              let serie = 0;
              let numero = 0;
              if (row[factura]) {
                facturaValue = String(row[factura]);
                facturaValue = facturaValue.substring(4);
                serieNumeroArray = facturaValue.split("-");
                serie = serieNumeroArray[0];
                numero = serieNumeroArray[1];
                if (serie.includes("F")) {
                  tipo_documento = "103";
                } else if (serie.includes("SS") || serie.includes("SB")) {
                  tipo_documento = "109";
                } else if (serie.includes("SG")) {
                  tipo_documento = "106";
                } else {
                  // log.debug(serie);
                  serie = 0;
                }
              } else {
                fileLogs.push(`Error en la fila: ${i} - columna: factura  - Documento: ${row[factura]} - Hay datos invalidos`);
                flagInvalid = true;
              }
              let fecemiDate = 0;
              if (row[fecemi]) {
                fecemiDate = convertirFechaISOaFormato(row[fecemi]);
              } else {
                fileLogs.push(`Error en la fila: ${i} - columna: fecemi - Documento: ${row[factura]} - Hay datos invalidos`);
                flagInvalid = true;
              }

              if (serie) {
                if (fecemiDate) {
                  let fecvenDate = 0;
                  if (row[fecven]) {
                    fecvenDate = convertirFechaISOaFormato(row[fecven]);
                  } else {
                    fileLogs.push(`Error en la fila: ${i} - columna: fecven - Documento: ${row[factura]} - Hay datos invalidos`);
                    flagInvalid = true;
                  }
                  let currency = 0;
                  let typeAccount = 0;
                  const currencyArr = { soles: "1", dolares: "2" };
                  if (String(row[moneda])) {
                    currency = String(row[moneda]).toLocaleLowerCase();
                    currency = currencyArr[currency];
                    if (currency == 1) {
                      typeAccount = 5945; //4212101 
                    } else if (currency == 2) {
                      typeAccount = 5947; //4212201 
                    } else {
                      fileLogs.push(`Error en la fila: ${i} - No se pudo setear la cuenta contable el tipo de moneda, la moneda no coincide con ninguna`);
                      flagInvalid = true;
                    }
                  } else {
                    fileLogs.push(`Error en la fila: ${i} - columna: moneda - Documento: ${row[factura]} - Hay datos invalidos`);
                    flagInvalid = true;
                  }
                  let exchangeRate = false;
                  // if (row[tipoCambio]) {
                  //   exchangeRate = row[tipoCambio];
                  // }
                  let idinstprodValue = 0; //codigo del articulo
                  if (row[idinstprod]) {
                    idinstprodValue = String(row[idinstprod]);
                  } else {
                    fileLogs.push(`Error en la fila: ${i} - columna: idinstprod - Documento: ${row[factura]} - Hay datos invalidos`);
                    flagInvalid = true;
                  }
                  let cantidadValue = 0;
                  if (row[cantidad]) {
                    cantidadValue = row[cantidad];
                  }
                  let desdeValue = "";
                  if (String(row[desde]) != null && String(row[desde]).trim().length > 1) {
                    desdeValue = convertirFecha(row[desde]);
                    if (String(desdeValue) == "NaN/NaN/NaN") {
                      desdeValue = "";                   
                    }
                  }
                  let hastaValue = "";
                  if (String(row[hasta]) != null && String(row[hasta]).trim().length > 1) {
                    hastaValue = convertirFecha(row[hasta])
                    if (String(hastaValue) == "NaN/NaN/NaN") {
                      hastaValue = "";
                    }
                  }
                  let montoValue = row[monto]; //Sin IGV
                  let monto_ing_igvValue = row[monto_ing_igv]; //Con IGV (Importe Bruto)

                  let impuestoValue = 6; //IGV_PE:S-PE; Default

                  let referenciaNotaValue = 0;
                  if (row[referenciaNota]) {
                    referenciaNotaValue = row[referenciaNota];
                  }
                  let cidValue = 0;
                  if (String(row[cid])) {
                    cidValue = row[cid];
                  }

                  // var itemId = "1627"; //!Articulo en duro
                  var itemId = String(idinstprodValue);
                  let departamento = 0;
                  let clase = 0;
                  var itemId_Netsuite = 0;

                  var header = {
                    documentoValue: facturaValue,
                    fechaEmisionValue: fecemiDate,
                    fechaVencValue: fecvenDate,
                    referenciaNotaValue: referenciaNotaValue,
                    tipoMoneda: currency,
                    tipoCambio: exchangeRate,
                    serie: serie,
                    numero: numero,
                    tipoDocumento: tipo_documento,
                    cid: cidValue,
                    typeAccount: typeAccount,
                    docReferenciaValue: 0,
                    aprobador: aprobadorServicios,
                  };

                  var detailBill = {
                    codArticuloServicio: idinstprodValue,
                    cantidadValue: cantidadValue,
                    montoConIGVValue: monto_ing_igvValue,
                    fechaInicioValue: desdeValue,
                    fechaFinValue: hastaValue,
                    impuestoValue: impuestoValue,
                    department: departamento,
                    clase: clase,
                    itemId_Netsuite: itemId_Netsuite,
                    itemId: itemId,
                    partida: 0,
                    rate: montoValue,
                    location: 0,
                    tipoLinea: 0,
                    nroLinea: i + 1,
                  };

                  var lineaCP = {
                    anio: new Date(fecemiDate).getFullYear(),
                    currency: currency,
                    rate: exchangeRate,
                    subsidiary: 3,
                    lines: [],
                  };

                  if (bills[facturaValue]) {
                    bills[facturaValue].details.push(detailBill);
                  } else {
                    bills[facturaValue] = {
                      details: [detailBill],
                      header: header,
                      lineaCP: lineaCP,
                    };
                  }
                } else {
                  fileLogs.push(`Error en la fila: ${i} -  Fecha Emision ${fecemiDate} - Documento ${row[factura]} - Hay datos invalidos`);
                  flagInvalid = true;
                }
              }
            } //Fin de Rows
          } else if (fechaEmisionLineas > -1) {
            //lineas telefonicas
            log.debug("validando", "archivo de lineas telefonicas");

            const documento = rows[0].indexOf("DOCUMENTO");
            const fechaEmision = rows[0].indexOf("FECHA EMISION");
            const fechaVenc = rows[0].indexOf("FECHA VENCIMIENTO");
            const moneda = rows[0].indexOf("MONEDA");
            const cuentaContable = rows[0].indexOf("CUENTA CONTABLE");
            const centroCostos = rows[0].indexOf("CENTRO COSTOS");
            const centroGestor = rows[0].indexOf("CENTRO GESTOR");
            const docReferencia = rows[0].indexOf("DOC REFERENCIA");
            const codArticulo = rows[0].indexOf("COD ARTICULO");
            const cantidad = rows[0].indexOf("CANTIDAD");
            const descripcion = rows[0].indexOf("DESCRIPCION");
            const fechaInicio = rows[0].indexOf("FECHA INICIO");
            const fechaFin = rows[0].indexOf("FECHA FIN");
            const montoSinIGV = rows[0].indexOf("MONTO SIN IGV");
            const montoConIGV = rows[0].indexOf("MONTO CON IGV");
            const tipoLinea = rows[0].indexOf("TIPO LINEA");

            for (let i = 1; i < rows.length; i++) {
              let row = rows[i];

              let facturaValue = 0;
              let tipo_documento = 0;
              let serieNumeroArray = 0;
              let serie = 0;
              let numero = 0;
              if (row[documento]) {
                facturaValue = String(row[documento]);
                serieNumeroArray = facturaValue.split("-");
                serie = serieNumeroArray[0];
                numero = serieNumeroArray[1];
                var regex = /^[A-EG-RT-Z]/;//cualquier letra
                let firstLetter = serie.charAt(0).toLocaleUpperCase();
                if (firstLetter == "F") {
                  tipo_documento = "103"; //Factura
                } else if (firstLetter == "S") {
                  tipo_documento = "109"; //Recibo x servicios
                } else if (regex.test(firstLetter)) {
                  tipo_documento = "45"; //Otros
                } else {                  
                  // fileLogs.push(`Error en la fila: ${i} - No se pudo setear el tipo de documento, la serie no coincide con ninguna`);
                  serie = 0;
                }
              } else {
                fileLogs.push(`Error en la fila: ${i} - columna: DOCUMENTO  - Documento: ${row[documento]} - Hay datos invalidos`);
                flagInvalid = true;
              }
              let fechaEmisionValue = 0;
              if (row[fechaEmision]) {
                fechaEmisionValue = convertirFechaISOaFormato(row[fechaEmision]);
              } else {
                fileLogs.push(`Error en la fila: ${i} - columna: FECHA EMISION - Documento: ${row[documento]} - Hay datos invalidos`);
                flagInvalid = true;
              }

              if (serie) {
                if (fechaEmisionValue) {
                  let fechaVencValue = 0;
                  if (row[fechaVenc]) {
                    fechaVencValue = convertirFechaISOaFormato(row[fechaVenc]);
                  } else {
                    fileLogs.push(`Error en la fila: ${i} - columna: fecven - Documento: ${row[documento]} - Hay datos invalidos`);
                    flagInvalid = true;
                  }
                  let currency = 0;
                  let typeAccount = 0;
                  const currencyArr = { PEN: "1", USD: "2" };
                  if (String(row[moneda])) {
                    currency = String(row[moneda]).toLocaleUpperCase();
                    currency = currencyArr[currency];
                    if (currency == 1) {
                      typeAccount = 5945; //4212101 
                    } else if (currency == 2) {
                      typeAccount = 5947; //4212201 
                    } else {
                      fileLogs.push(`Error en la fila: ${i} - No se pudo setear la cuenta contable el tipo de moneda, la moneda no coincide con ninguna`);
                      flagInvalid = true;
                    }
                  } else {
                    fileLogs.push(`Error en la fila: ${i} - columna: moneda - Documento: ${row[documento]} - Hay datos invalidos`);
                    flagInvalid = true;
                  }
                  let exchangeRate = false;

                  let codArticuloValue = 0; //codigo del articulo
                  if (row[codArticulo]) {
                    codArticuloValue = String(row[codArticulo]);
                  } else {
                    fileLogs.push(`Error en la fila: ${i} - columna: codArticulo - Documento: ${row[documento]} - Hay datos invalidos`);
                    flagInvalid = true;
                  }
                  let cantidadValue = 0;
                  if (row[cantidad]) {
                    cantidadValue = row[cantidad];
                  }
                  // else {
                  //   fileLogs.push(`Error en la fila: ${i} - columna: cantidad - Documento: ${row[factura]} - Hay datos invalidos`);
                  //   flagInvalid = true;
                  // }
                  let desdeValue = "";
                  if (String(row[fechaInicio]) != null && String(row[fechaInicio]).trim().length > 1) {
                    desdeValue = convertirFecha(row[fechaInicio]);
                    if (String(desdeValue) == "NaN/NaN/NaN") {
                      desdeValue = "";                   
                    }
                  }

                  let hastaValue = "";
                  if (String(row[fechaFin]) != null && String(row[fechaFin]).trim().length > 1) {
                    hastaValue = convertirFecha(row[fechaFin])
                    if (String(hastaValue) == "NaN/NaN/NaN") {
                      hastaValue = "";                  
                    }
                  }

                  let montoValue = row[montoSinIGV]; //Sin IGV
                  let monto_ing_igvValue = row[montoConIGV]; //Con IGV (Importe Bruto)

                  let impuestoValue = 6; //IGV_PE:S-PE; Default
                  let docReferenciaValue = 0;
                  if (row[docReferencia]) {
                    docReferenciaValue = row[docReferencia];
                  }
                  let tipoLineaValue = 0;
                  if (row[tipoLinea]) {
                    tipoLineaValue = row[tipoLinea];
                  }

                  let cidValue = 0;

                  // var itemId = "1627"; //!Articulo en duro
                  var itemId = String(codArticuloValue);
                  let departamento = 0;
                  let clase = 0;
                  var itemId_Netsuite = 0;

                  var header = {
                    documentoValue: facturaValue,
                    fechaEmisionValue: fechaEmisionValue,
                    fechaVencValue: fechaVencValue,
                    referenciaNotaValue: 0,
                    tipoMoneda: currency,
                    tipoCambio: exchangeRate,
                    serie: serie,
                    numero: numero,
                    tipoDocumento: tipo_documento,
                    cid: cidValue,
                    typeAccount: typeAccount,
                    docReferenciaValue: docReferenciaValue,
                    aprobador : aprobadorLineasTelefonicas,
                  };

                  var detailBill = {
                    codArticuloServicio: codArticuloValue,
                    cantidadValue: cantidadValue,
                    montoConIGVValue: monto_ing_igvValue,
                    fechaInicioValue: desdeValue,
                    fechaFinValue: hastaValue,
                    impuestoValue: impuestoValue,
                    department: departamento,
                    clase: clase,
                    itemId_Netsuite: itemId_Netsuite,
                    itemId: itemId,
                    partida: 0,
                    rate: montoValue,
                    location: 0,
                    tipoLinea: tipoLineaValue,
                    nroLinea: i + 1,
                  };

                  var lineaCP = {
                    anio: new Date(fechaEmisionValue).getFullYear(),
                    currency: currency,
                    rate: exchangeRate,
                    subsidiary: 3,
                    lines: [],
                  };

                  if (bills[facturaValue]) {
                    bills[facturaValue].details.push(detailBill);
                  } else {
                    bills[facturaValue] = {
                      details: [detailBill],
                      header: header,
                      lineaCP: lineaCP,
                    };
                  }
                } else {
                  fileLogs.push(`Error en la fila: ${i} -  Fecha Emision ${fechaEmisionValue} - Documento ${row[documento]} - Hay datos invalidos`);
                  flagInvalid = true;
                }
              }
            } //Fin de Rows
          } else {
            log.error("ERROR", `archivo no contiene la columna fecemi o FECHA EMISION`);
            fileLogs.push(`Error - ${archivo.nombreArchivo} - archivo no contiene la columna fecemi o FECHA EMISION`);
          }

          var newData = {};
          let i = 1;
          let flagMoneda = false;

          for (let bill in bills) {
            // var remainingUsage = runtime.getCurrentScript().getRemainingUsage();
            // log.error("memoria", "remaining usage::" + remainingUsage);
            //validando tipo de cambio
            if (!bills[bill].header.tipoCambio) {
              if (bills[bill].header.tipoMoneda == "2") {
                log.debug("fechaEmisionValue", bills[bill].header.fechaEmisionValue);
                bills[bill].header.tipoCambio = getTipoCambio(bills[bill].header.fechaEmisionValue);
                log.debug("tipoCambio", bills[bill].header.tipoCambio);
                bills[bill].lineaCP.rate = bills[bill].header.tipoCambio;
              } else if (bills[bill].header.tipoMoneda == "1") {
                bills[bill].header.tipoCambio = "1.00";
                bills[bill].lineaCP.rate = bills[bill].header.tipoCambio;
              } else {
                let error = "Error - " + bills[bill].header.documentoValue + " No se pudo setear el tipo de cambio, tipo de moneda no coincide con ninguna";
                // log.debug("tipoCambio", error);
                fileLogs.push(error);
                flagMoneda = true;
              }
            }

            //agrupando detalles iguales si fechafin y fechaIni son iguales, montos se suman
            var factura = bills[bill];
            var detallesAgrupadosPorFactura = {};
            var detalles = bills[bill].details;
            detalles.forEach((detalle) => {
              const detalleKey = `${detalle.fechaInicioValue}_${detalle.fechaFinValue}_${detalle.codArticuloServicio}`;

              if (!detallesAgrupadosPorFactura[detalleKey]) {
                detallesAgrupadosPorFactura[detalleKey] = detalle;
              } else {
                detallesAgrupadosPorFactura[detalleKey].rate += detalle.rate;
              }
            });
            factura.details = Object.values(detallesAgrupadosPorFactura);
            let j = 0;
            factura.details.forEach((detalle) => {
              let line = {
                numLine: j + 1,
                department: detalle.department,
                clase: detalle.clase,
                amount: detalle.rate,
              };
              factura.lineaCP.lines[j] = line;
              j++;
            });
            var newKey = i + "///" + bill;
            newData[newKey] = factura;

            i++;
          }



          if (!flagInvalid && !flagMoneda && Object.keys(newData).length > 0) {

            let totalValidBills = Object.keys(newData).length;
            log.error("Execution Completed", "Documentos válidos: " + totalValidBills + "! ");

            let jsonBills = file.create({
              name: "jsonhelper.txt",
              fileType: file.Type.PLAINTEXT,
              contents: JSON.stringify(newData),
              encoding: file.Encoding.UTF8,
              folder: 441,
            });
            var idFile = jsonBills.save();
            log.error("File generated!", idFile);
            log.error("Execution Completed", "Documentos válidos: " + totalValidBills + "! ");

            var params = {
              custscript_ts_ss_load_tf_data_file: idFile,
              custscript_ts_ss_load_tf_data_cont: 0,
              custscript_ts_ss_load_tf_data_json: 0,
              custscript_ts_ss_load_tf_data_info: archivo,
            };

            var redirectSchdl = task.create({
              taskType: task.TaskType.SCHEDULED_SCRIPT,
              scriptId: "customscript_ts_ss_loadtelefonicadata",
              deploymentId: "customdeploy_ts_ss_loadtelefonicadata",
              params: params,
            });

            redirectSchdl.submit();
          } else {
            let errorLog = "Error - " + archivo.nombreArchivo + " - No se pudo procesar el archivo, hay datos invalidos";
            fileLogs.push(errorLog);
            imprimirLogsEnCSV(fileLogs, fechaHoraGen, archivo);
            record.submitFields({
              type: "customrecord_archivos_sftp",
              id: archivo.internalId,
              values: { custrecord_ns_estado: 2 },
            });
          }
        }
        // });
      }
    } catch (e) {
      log.error("error", e.message);
    }
  };

  const searchFileCabinet = () => {
    const FN = "searchFileCabinet";
    try {
      let searchObj = search.create({
        type: "customrecord_archivos_sftp",
        filters: [["custrecord_ns_tipo", "anyof", "4"], "AND", ["custrecord_ns_estado", "anyof", "1"], "AND", ["custrecord_nombre_archivo", "contains", ".xlsx"]],
        columns: [
          search.createColumn({
            name: "custrecord_ns_rs_id",
            label: "Carpeta",
          }),
          search.createColumn({
            name: "custrecord_nombre_archivo",
            label: "Nombre",
          }),
          search.createColumn({ name: "internalid", label: "Internal ID" }),
        ],
      });

      let array_id_file_cabinet = [];

      // Configurar los límites de la paginación
      let pageSize = 1000;
      let pageIndex = 0;
      let resultCount = 0;

      // Realizar la búsqueda y obtener los resultados en páginas
      let searchResult = searchObj.run();

      do {
        let page = searchResult.getRange({
          start: pageIndex * pageSize,
          end: (pageIndex + 1) * pageSize,
        });

        page.forEach(function (result) {
          let carpeta = result.getValue({ name: "custrecord_ns_rs_id" });
          let nombreArchivo = result.getValue({
            name: "custrecord_nombre_archivo",
          });
          let internalId = result.getValue({ name: "internalid" });
          array_id_file_cabinet.push({ carpeta, nombreArchivo, internalId });
        });

        resultCount += page.length;
        pageIndex++;
      } while (resultCount < searchResult.count);

      return array_id_file_cabinet;
    } catch (e) {
      log.error({
        title: `${FN} error`,
        details: { message: `${FN} - ${e.message || `Unexpected error`}` },
      });
      throw { message: `${FN} - ${e.message || `Unexpected error`}` };
    }
  };

  const getTipoCambio = (fecha) => {
    let myRestletHeaders = new Array();
    myRestletHeaders["Accept"] = "*/*";
    myRestletHeaders["Content-Type"] = "application/json";
    let DatosRuc = {
      data: {
        fecha: fecha,
      },
    };
    let myRestletResponse = https.requestRestlet({
      body: JSON.stringify(DatosRuc),
      deploymentId: "customdeploy_ts_consultatipocambio",
      scriptId: "customscript_ts_consultatipocambio",
      headers: myRestletHeaders,
    });
    let response = myRestletResponse.body;
    response = JSON.parse(response);
    log.debug("response -> ", response);
    if (response.success == true) {
      return response.data.venta;
    } else {
      return 0;
    }
  };

  const convertirFechaISOaFormato = (fechaISO) => {
    const fecha = new Date(fechaISO);
    const anio = fecha.getFullYear();
    const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
    const dia = fecha.getDate().toString().padStart(2, "0");

    return `${anio}/${mes}/${dia}`;
  };

  const imprimirLogsEnCSV = (fileLogs, fechaHoraGen, archivo) => {
    const logsContent = [...fileLogs].join("\n");
    let nombreArchivo = archivo.nombreArchivo + "_" + fechaHoraGen + ".txt";
    const fileObj = file.create({
      name: nombreArchivo,
      fileType: file.Type.PLAINTEXT,
      contents: logsContent,
      encoding: file.Encoding.UTF8,
      folder: 441,
      isOnline: true,
    });
    const fileId = fileObj.save();
    log.error({
      title: "ERROR",
      details: "FILE LOG: " + nameFile,
    });
  };

  const convertDateFormat = (inputDate) => {
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/;
    if (!dateRegex.test(inputDate)) {
      log.error("error date", 'Formato de fecha incorrecto. Debe ser "DD/MM/AAAA".');
      return null;
    } else {
      const parts = inputDate.split("/");
      const day = parts[0];
      const month = parts[1];
      let year = parts[2];
      if (year.length == 2) {
        year = parseInt(parts[2]) + parseInt(2000);
      }
      return `${year}/${month}/${day}`;
    }
  };

  const convertirFecha = (fecha) => {
    log.debug("fecha", fecha);
    const fechaObj = new Date(fecha);
    log.debug("fechaObj", fechaObj);
    if (fechaObj == null) {
      return null;
    }
    const dia = fechaObj.getDate();
    const mes = fechaObj.getMonth() + 1;
    const año = fechaObj.getFullYear();
  
    // Asegurarse de que el día y el mes tengan dos dígitos
    const diaFormato = dia < 10 ? `0${dia}` : dia;
    const mesFormato = mes < 10 ? `0${mes}` : mes;
  
    return `${diaFormato}/${mesFormato}/${año}`;
  }

  return {
    execute: execute,
  };
});
