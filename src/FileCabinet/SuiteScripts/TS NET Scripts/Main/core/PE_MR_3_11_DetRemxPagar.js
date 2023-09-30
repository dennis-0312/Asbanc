/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * Task                         Date            Author                                      Remarks
 * Formato 3.11                  28 Ago 2023     Giovana Guadalupe <giovana.guadalupe@myevol.biz>          LIBRO CAJA Y BANCOS - DETALLE DE LOS MOVIMIENTOS DEL EFECTIVO
 */
define(["N/runtime", "N/search", "N/config", "N/render", "N/record", "N/file", "../Library/PE_LIB_Libros.js"], (runtime, search, config, render, record, file, libPe) => {
  var objContext = runtime.getCurrentScript();

  /** PARAMETROS */
  var pGloblas = {};

  /** REPORTE */
  var formatReport = "pdf";
  var nameReport = "";
  var transactionFile = null;
  var d = new Date();
  var fechaHoraGen = d.getDate() + "" + (d.getMonth() + 1) + "" + d.getFullYear() + "" + d.getHours() + "" + d.getMinutes() + "" + d.getSeconds();

  /** DATOS DE LA SUBSIDIARIA */
  var companyName = "";
  var companyRuc = "";
  var companyLogo = "";
  var companyDV = "";

  var featureSTXT = null;
  var featMultibook = null;
  var featSubsidiary = null;

  const getInputData = () => {
    log.debug("Inicio");
    try {
      getParameters();

      return getTransactions();
    } catch (e) {
      log.error("[ Get Input Data Error ]", e);
    }
  };

  const map = (context) => {
    try {
      var key = context.key;
      var dataMap = JSON.parse(context.value);
      // log.debug("dataMap", dataMap);
      // log.debug("key", key);

      var resultTransactions = {
        key: key,
        codigo: dataMap[0],
        denominacion: dataMap[1],
        codigoTrabajador: dataMap[2],
        apellidosNombresTrabajador: dataMap[3],
        tipoDNITrabajador: dataMap[4],
        numeroDNITrabajador: dataMap[5],
        saldoFinal: dataMap[6],
      };

      context.write({
        key: key,
        value: resultTransactions,
      });
    } catch (e) {
      log.error("[ Map Error ]", e);
    }
  };

  const summarize = (context) => {
    getParameters();
    getSubdiary();

    pGloblas["pRecordID"] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.anioCon, "Formato3.11");

    var transactionJSON = {};

    transactionJSON["parametros"] = pGloblas;

    transactionJSON["transactions"] = {};
    context.output.iterator().each(function (key, value) {
      value = JSON.parse(value);
      // log.debug("value", value);
      transactionJSON["transactions"][value.key] = value;
      return true;
    });
    // log.debug("transactionJSON", transactionJSON["transactions"]);

    var jsonAxiliar = getJsonData(transactionJSON["transactions"]);

    // log.debug("jsonAxiliarFinal", jsonAxiliar);
    //Validamos que TrnsactionJSON.accounts no este vacio para todos los ambientes
    if (!isObjEmpty(transactionJSON["transactions"])) {
      var renderer = render.create();

      renderer.templateContent = getTemplate();

      renderer.addCustomDataSource({
        format: render.DataSource.OBJECT,
        alias: "input",
        data: {
          data: JSON.stringify(jsonAxiliar),
        },
      });

      /**** */
      stringXML2 = renderer.renderAsString();

      var FolderId = 871;

      if (FolderId != "" && FolderId != null) {
        // Crea el archivo
        var fileAux = file.create({
          name: "AuxiliarFormato3.11",
          fileType: file.Type.PLAINTEXT,
          contents: stringXML2,
          encoding: file.Encoding.UTF8,
          folder: FolderId,
        });

        var idfile = fileAux.save(); // Termina de grabar el archivo

        log.debug({
          title: "URL ARCHIVO TEMP",
          details: idfile,
        });
      }

      /*** */
      stringXML = renderer.renderAsPdf();
      saveFile(stringXML);

      /**** */
      log.debug("Termino");
      return true;
    } else {
      log.debug("No data");
      libPe.noData(pGloblas.pRecordID);
    }
  };

  const getJsonData = (transactions) => {
    let userTemp = runtime.getCurrentUser(),
      useID = userTemp.id,
      jsonTransacion = {},
      totalAmount = 0;

    var employeeName = search.lookupFields({
      type: search.Type.EMPLOYEE,
      id: useID,
      columns: ["firstname", "lastname"],
    });
    var userName = employeeName.firstname + " " + employeeName.lastname;

    // log.debug("transactions", transactions);

    for (var k in transactions) {
      let IDD = transactions[k].key;
      if (!jsonTransacion[IDD]) {
        let saldoFinal = Number(transactions[k].saldoFinal).toFixed(2);
        jsonTransacion[IDD] = {
          codigo: transactions[k].codigo,
          denominacion: transactions[k].denominacion.replace(/&/g, "&amp;").toLocaleUpperCase(),
          codigoTrabajador: transactions[k].codigoTrabajador,
          apellidosNombresTrabajador: transactions[k].apellidosNombresTrabajador.replace(/&/g, "&amp;").toLocaleUpperCase(),
          tipoDNITrabajador: transactions[k].tipoDNITrabajador,
          numeroDNITrabajador: transactions[k].numeroDNITrabajador,
          saldoFinal: saldoFinal,
        };
        totalAmount = totalAmount + Number(transactions[k].saldoFinal);
      }
    }

    log.debug("jsonTransacion", jsonTransacion);

    let periodSearch = search.lookupFields({
      type: search.Type.ACCOUNTING_PERIOD,
      id: pGloblas.pPeriod,
      columns: ["periodname"],
    });
    let periodname = periodSearch.periodname.split(" ");

    let jsonAxiliar = {
      company: {
        formato: 'FORMATO 3.11: "LIBRO DE INVENTARIOS Y BALANCES -  DETALLE DEL SALDO DE LA CUENTA 41 - REMUNERACIONES POR PAGAR"',
        ejercicio: "EJERCICIO: " + pGloblas.pAnio,
        ruc: "RUC: " + companyRuc,
        name: "RAZÓN SOCIAL: " + companyName.replace(/&/g, "&amp;").toLocaleUpperCase(),
      },
      total: {
        total: totalAmount.toFixed(2),
      },
      movements: jsonTransacion,
    };

    return jsonAxiliar;
  };

  const saveFile = (stringValue) => {
    var fileAuxliar = stringValue;
    var urlfile = "";
    if (featSubsidiary) {
      // nameReport = "Formato 3.11_" + companyName + "_" + fechaHoraGen + "." + formatReport;
      nameReport = "Formato 3.11_" + companyName + "." + formatReport;
    } else {
      nameReport = "Formato 3.11_" + "_" + fechaHoraGen + "." + formatReport;
    }

    var folderID = 871;

    fileAuxliar.name = nameReport;
    fileAuxliar.folder = folderID;

    var fileID = fileAuxliar.save();

    let auxFile = file.load({
      id: fileID,
    });
    log.debug("hiii auxFile", auxFile);
    urlfile += auxFile.url;

    // log.debug("pGloblas.pRecordID", pGloblas.pRecordID);
    libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile);
  };

  const getTemplate = () => {
    var aux = file.load("../FTL/PE_Template_3_11_DetRemxPagar.xml");
    return aux.getContents();
  };

  const getTransactions = () => {
    var arrResult = [];
    var _cont = 0;

    // FORMATO 3.11: "LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 41"
    var savedSearch = search.load({
      id: "customsearch_asb_3_3_libro_impreso_2_2_4",
    });

    log.debug(" pGloblas.pSubsidiary", pGloblas.pSubsidiary);
    if (featSubsidiary) {
      savedSearch.filters.push(
        search.createFilter({
          name: "subsidiary",
          operator: search.Operator.IS,
          values: pGloblas.pSubsidiary,
        })
      );
    }

    // savedSearch.filters.push(
    //   search.createFilter({
    //     name: "postingperiod",
    //     operator: search.Operator.IS,
    //     values: [pGloblas.pPeriod],
    //   })
    // );

    var pagedData = savedSearch.runPaged({
      pageSize: 1000,
    });

    var page, columns;

    pagedData.pageRanges.forEach(function (pageRange) {
      page = pagedData.fetch({
        index: pageRange.index,
      });

      page.data.forEach(function (result) {
        columns = result.columns;
        arrAux = new Array();

        // log.debug("result", result);

        // 0. CÓDIGO
        arrAux[0] = result.getValue(columns[0]);

        // 1. DENOMINACIÓN
        arrAux[1] = result.getValue(columns[1]);

        // 2. CÓDIGO TRABAJADOR
        arrAux[2] = result.getValue(columns[2]);

        //3. APELLIDOS Y NOMBRES TRABAJADOR
        arrAux[3] = result.getValue(columns[3]);

        //4. TIPO DNI TRABAJADOR
        arrAux[4] = result.getValue(columns[4]);

        //5. NÚMERO DNI TRABAJADOR
        arrAux[5] = result.getValue(columns[5]);

        //6. SALDO FINAL
        arrAux[6] = result.getValue(columns[6]);

        //7. fecha
        arrAux[7] = result.getText(columns[7]);

        // arrResult.push(arrAux);
        let year = arrAux[7].split(" ")[1];

        // log.debug("year", year);
        // log.debug("pGloblas.pAnio", pGloblas.pAnio);

        if (year == pGloblas.pAnio) {
          arrResult.push(arrAux);
        }

      });
    });
    return arrResult;
  };

  const getSubdiary = () => {
    if (featSubsidiary) {
      log.debug(pGloblas.pSubsidiary, pGloblas.pSubsidiary);
      var dataSubsidiary = record.load({
        type: "subsidiary",
        id: pGloblas.pSubsidiary,
      });
      companyName = dataSubsidiary.getValue("legalname");
      companyRuc = dataSubsidiary.getValue("federalidnumber");
    } else {
      companyName = config.getFieldValue("legalname");
    }
  };

  const getParameters = () => {
    pGloblas = objContext.getParameter("custscript_pe_3_11_detremxpagar_params"); // || {};
    pGloblas = JSON.parse(pGloblas);
    // pGloblas = { recordID: 10, reportID: 131, subsidiary: 3, anioCon: "2023", periodCon: 113 };

    pGloblas = {
      pRecordID: pGloblas.recordID,
      pFeature: pGloblas.reportID,
      pSubsidiary: pGloblas.subsidiary,
      pPeriod: pGloblas.periodCon,
      pAnio: pGloblas.anioCon,
    };
    log.debug("pGloblas", pGloblas);

    featSubsidiary = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
  };

  const isObjEmpty = (obj) => {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) return false;
    }

    return true;
  };

  return {
    getInputData: getInputData,
    map: map,
    // reduce: reduce,
    summarize: summarize,
  };
});
