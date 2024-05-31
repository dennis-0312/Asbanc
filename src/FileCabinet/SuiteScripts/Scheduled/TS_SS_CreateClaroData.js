/**
 * @NApiVersion 2.1
 * @NAmdConfig  ../Library/JsLibraryConfig.json
 * @NScriptType ScheduledScript
 *
 * Task          Date            Author                                         Remarks
 * GAP Int       14 Ago 2023     Giovana Guadalupe <giovana.guadalupe@myevol.biz>     - Crear facturas de Claro
 *
 */
define(["N/search", "N/record", "N/log", "N/file", "N/task", "xlsx", "../Library/TS_LIB_ControlPresupuestal.js", "N/https", "N/runtime", "N/format"], (search, record, log, file, task, XLSX, libCP, https, runtime, format) => {
  const execute = (context) => {
    var d = new Date();
    var fechaHoraGen = d.getDate() + "" + (d.getMonth() + 1) + "" + d.getFullYear() + "" + d.getHours() + "" + d.getMinutes() + "" + d.getSeconds();
    let paramIDFile = runtime.getCurrentScript().getParameter({
      name: "custscript_ts_ss_create_claro_file",
    });
    let paramCont = runtime.getCurrentScript().getParameter({
      name: "custscript_ts_ss_create_claro_data_cont",
    });
    let paramInfoFile = runtime.getCurrentScript().getParameter({
      name: "custscript_ts_ss_create_claro_data_file",
    });

    //get current user id
    var currentUser = runtime.getCurrentUser();
    var currentUserId = currentUser.id;


    let archivo = JSON.parse(paramInfoFile);

    // log.debug("paramFile", paramIDFile);
    var jsonResult = file.load({ id: paramIDFile }).getContents();

    jsonResult = JSON.parse(jsonResult);
    // log.debug("jsonResult", jsonResult);

    let numberOfItems = Object.keys(jsonResult).length;

    if (paramCont == 0) {
      log.debug("Info", "Total de documentos: " + Object.keys(jsonResult).length);
    }
    let executionCompleted = false;
    var fileLogs = [];

    for (let key in jsonResult) {
      // log.debug("key", key);
      let keyAuxiliar = key.split("///");

      var createBillResult = createbill(jsonResult[key], paramCont, numberOfItems, currentUserId );


      if (paramCont < keyAuxiliar[0]) {
        var remainingUsage = runtime.getCurrentScript().getRemainingUsage();

        if (remainingUsage <= 1000) {
          log.error("memoria", "remaining usage::" + remainingUsage);
          var params = {
            custscript_ts_ss_create_claro_file: paramIDFile,
            custscript_ts_ss_create_claro_data_cont: paramCont,
          };
          var scriptTask = task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT,
            scriptId: runtime.getCurrentScript().id,
            deploymentId: runtime.getCurrentScript().deploymentId,
            params: params,
          });

          scriptTask.submit();
          log.error("Memoria insuficiente", "Rellamando al SCHDL");

          return;
        }
      } else {
        executionCompleted = true;
      }
      paramCont++;
      // log.debug("numberOfItems", numberOfItems);
      // log.debug("paramCont", paramCont);
      // log.debug("createBillResult", createBillResult.status);


      if ((createBillResult.status == true) && (paramCont == numberOfItems)) {
        log.error("Execution completed",  " Documentos procesados correctamente: "+numberOfItems);
        record.submitFields({
          type: "customrecord_archivos_sftp",
          id: archivo.internalId,
          values: { custrecord_ns_estado: 3 },
        });
        // return;
      } else if (createBillResult.state == "error") {
        //salto de linea  
        let c = paramCont - 1;
        let msg = " Documentos procesados: "+c+" de "+numberOfItems+"\n";
         msg += "Documento: " + keyAuxiliar[1] + " - " + createBillResult.message;
        log.error("INFO", msg);
        fileLogs.push(msg);
        imprimirLogsTXT(fileLogs, archivo, fechaHoraGen);

        break;
      }

      // var numberOfItems = Object.keys(jsonResult).length;
    }
  };

  const createbill = (bill, paramCont, numberOfItems) => {
    const FN = "createBill";
    try {
      let counter = paramCont;
      counter++;
      log.error("INFO", "Creando documento: " + JSON.stringify(bill.header.numero)+" - " + counter + " de " + numberOfItems);

      const billRecord = record.create({
        type: "vendorbill",
        isDynamic: true,
      });

      billRecord.setValue({
        fieldId: "entity",
        value: 3430, //P-20467534026 AMERICA MOVIL PERU S.A.C.
        // value: 5628,
      });

      // log.debug("bill.header.tipoCambio", bill.header.tipoCambio);
      billRecord.setValue({
        fieldId: "exchangerate",
        value: bill.header.tipoCambio,
      });

      if (bill.header.tipoMoneda == "2") {
        billRecord.setValue({
          fieldId: "custbody_exchange_hidden",
          value: bill.header.tipoCambio,
        });
      }
      //log.debug("fechaEmisionValue", bill.header.fechaEmisionValue);
      let fec_emision = bill.header.fechaEmisionValue.split("-");
      fec_emision = fec_emision[1] + "/" + fec_emision[2] + "/" + fec_emision[0];
      billRecord.setValue({
        fieldId: "trandate",
        value: new Date(fec_emision),
      });

      //log.debug("fechaVencValue", bill.header.fechaVencValue);
      let fec_venc = bill.header.fechaVencValue.split("-");
      fec_venc = fec_venc[1] + "/" + fec_venc[2] + "/" + fec_venc[0];     

      billRecord.setValue({
        fieldId: "duedate",
        value: new Date(fec_venc),
      });

      billRecord.setValue({
        fieldId: "currency",
        value: bill.header.tipoMoneda,
      });

      billRecord.setValue({
        fieldId: "account",
        value: bill.header.typeAccount,
      });

      billRecord.setValue({
        fieldId: "custbody_ts_integracion",
        value: bill.header.aprobador,
      });

      billRecord.setValue({
        fieldId: "nextapprover",
        value: bill.header.aprobador,
      });

      billRecord.setValue({ fieldId: "subsidiary", value: 3 });

      billRecord.setValue({
        fieldId: "custbody_pe_document_type",
        value: bill.header.tipoDocumento,
      });

      billRecord.setValue({
        fieldId: "custbody_pe_serie_cxp",
        value: bill.header.serie,
      });

      billRecord.setValue({
        fieldId: "custbody_pe_number",
        value: bill.header.numero,
      });
      if (bill.header.cid != 0) {
        billRecord.setValue({
          fieldId: "custbody_asb_cid_cod_grupo",
          value: bill.header.cid,
        });
      }


      // Setear detalle
      bill.details.forEach((detail) => {
        // log.debug("creando Factura", "articulo: " + detail.codArticuloServicio);

        billRecord.selectNewLine({ sublistId: "item" });

        billRecord.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "item",
          value: detail.itemId_Netsuite,
          // value: 573,
        });

        billRecord.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "quantity",
          value: detail.cantidadValue,
        });

        billRecord.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "taxcode",
          value: 6, //Codigo de Impuesto, IGV_PE:S-PE
        });

        if (detail.department) {
          billRecord.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "department",
            value: detail.department,
          });
        }

        if (detail.clase) {
          billRecord.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "class",
            value: detail.clase,
          });
        }

        let monto = String(detail.rate).replace(",", ".");
        billRecord.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "rate",
          value: parseFloat(monto),
        });

        // log.debug("detail.fechaInicioValue", detail.fechaInicioValue);
        if (String(detail.fechaInicioValue).length > 0)  {
          var parsedDateStringAsRawDateObject = format.parse({
            value: detail.fechaInicioValue,
            type: format.Type.DATE
          });

          billRecord.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "custcol_asb_fec_ini_ln",
            value: parsedDateStringAsRawDateObject,
          });
        }

        if (String(detail.fechaFinValue).length > 0) {
          var parsedDateStringAsRawDateObjectFin = format.parse({
            value: detail.fechaInicioValue,
            type: format.Type.DATE
          });
            
            billRecord.setCurrentSublistValue({
              sublistId: "item",
              fieldId: "custcol_asb_fec_fin_ln",
              value: parsedDateStringAsRawDateObjectFin,
            });
        }
        // log.debug("detail.location", detail.location);
        if (String(detail.location).length > 0) {
        // log.debug("detail.location entrooo", detail.location);

          billRecord.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "location",
            value: parseInt(detail.location),
          });
        }

        billRecord.setCurrentSublistValue({
          sublistId: "item",
          fieldId: "custcol_ts_budget_item",
          value: detail.partida,
        });

        if (String(detail.tipoLinea).length > 0) {
          billRecord.setCurrentSublistValue({
            sublistId: "item",
            fieldId: "custbody_asb_tipo_linea",
            value: detail.tipoLinea,
          });
        }

        billRecord.commitLine({
          sublistId: "item",
        });
      });
      let newBill = billRecord.save({
        enableSourcing: true,
        ignoreMandatoryFields: true,
      });
      log.error("INFO", "Documento creado - ID = "+newBill);

      // if (newBill) {
      //   var objRecord = record.load({
      //     type: "vendorbill",
      //     id: newBill,
      //     isDynamic: true,
      //   });

      //   var otherId = record.submitFields({
      //     type: "vendorbill",
      //     id: newBill,
      //     values: {
      //       exchangeRate: bill.header.tipoCambio,
      //     },
      //   });
      //   // log.debug("exchangeRate otherId", otherId);
      // }

      let result = {
        status: true,
        message: `Se creo la factura ${bill.header.numero}`,
        billId: newBill,
      };

      return result;
    } catch (e) {
      let result = {
        state: "error",
        message: e.message,
      };
      log.error("ERROR", e);
      return result;
    }
  };

  const imprimirLogsTXT = (fileLogs, archivo, fechaHoraGen) => {
    const logsContent = [...fileLogs].join("\n");
    let nombreArchivo = archivo.nombreArchivo + "_" + fechaHoraGen + ".txt";
    const fileObj = file.create({
      name: nombreArchivo,
      fileType: file.Type.PLAINTEXT,
      contents: logsContent,
      encoding: file.Encoding.UTF8,
      folder: 439,
      isOnline: true,
    });
    record.submitFields({
      type: "customrecord_archivos_sftp",
      id: archivo.internalId,
      values: { custrecord_ns_estado: 2 },
    });
    const fileId = fileObj.save();

    log.error({
      title: "ERROR",
      details: "FILE LOG: " + nombreArchivo,
    });
  };

  return {
    execute: execute,
  };
});
