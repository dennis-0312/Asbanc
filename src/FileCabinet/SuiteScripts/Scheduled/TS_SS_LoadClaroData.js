/**
 * @NApiVersion 2.1
 * @NAmdConfig  ../Library/JsLibraryConfig.json
 * @NScriptType ScheduledScript
 *
 * Task               Date            Author                                                 Remarks
 * GAP Int Claro      14 Ago 2023     Giovana Guadalupe <giovana.guadalupe@myevol.biz>       CP validacion
 *
 */
define(["N/search", "N/record", "N/log", "N/file", "N/task", "xlsx", "../Library/TS_LIB_ControlPresupuestal.js", "N/https", "N/runtime"], (search, record, log, file, task, XLSX, libCP, https, runtime) => {
  const execute = (context) => {
    var d = new Date();
    var fechaHoraGen = d.getDate() + "" + (d.getMonth() + 1) + "" + d.getFullYear() + "" + d.getHours() + "" + d.getMinutes() + "" + d.getSeconds();

    let paramIDFile = runtime.getCurrentScript().getParameter({
      name: "custscript_ts_ss_load_claro_data_file",
    });
    log.debug("paramIDFile", paramIDFile);

    let paramCont = runtime.getCurrentScript().getParameter({
      name: "custscript_ts_ss_load_claro_data_cont",
    });
    log.debug("paramCont", paramCont);

    let paramIdJson = runtime.getCurrentScript().getParameter({
      name: "custscript_ts_ss_load_claro_data_json",
    });
    log.debug("paramIdJson", paramIdJson);
    let paramArchivoInfo = runtime.getCurrentScript().getParameter({
      name: "custscript_ts_ss_load_claro_data_info",
    });
    // log.debug("paramArchivoInfo", paramArchivoInfo);
    paramArchivoInfo = JSON.parse(paramArchivoInfo);
    log.debug("paramArchivoInfo", paramArchivoInfo);

    var jsonResult = file.load({ id: paramIDFile }).getContents();

    if (paramIdJson != 0) {
      var jsonAux = file
        .load({
          id: paramIdJson,
        })
        .getContents();
      jsonAux = JSON.parse(jsonAux);
    } else {
      var jsonAux = {};
    }

    // log.debug(typeof paramIdJson);
    // log.debug("paramCont", paramCont);

    jsonResult = JSON.parse(jsonResult);

    //length of jsonResult
    if (paramCont == 0) {
      log.debug("Info", "Total de documentos: " + Object.keys(jsonResult).length);
    }
    let executionCompleted = false;
    let fileLogs = [];
    let error_detail = "";
    let flagItem = false;
    var idFileJsonAux = 0;
    let archivo = {
      nombreArchivo: paramArchivoInfo.nombreArchivo + "_" + fechaHoraGen,
      contenido: "",
    };
    log.debug("archivo", JSON.stringify(archivo));

    for (let key in jsonResult) {
      // log.debug(key);
      let keyAuxiliar = key.split("///");
      log.debug("keyAuxiliar", keyAuxiliar[0]);
      log.debug("paramCont", paramCont);

      if (Number(paramCont) < Number(keyAuxiliar[0])) {
        log.debug("entro", "entro al if");
        let items = jsonResult[key].details;

        for (let i = 0; i < items.length; i++) {
          let itemId = items[i].itemId;
          log.debug("item datos", "itemId->" + itemId+" en la linea "+items[i].nroLinea+"del archivo");
          let classItem = 0;
          let departmentItem = 0;
          let itemId_Netsuite = 0;
          let locationItem = 0;
          //traer datos del articulo
          let filters = [search.createFilter({ name: "itemid", operator: search.Operator.CONTAINS, values: itemId })];
          let columns = [
            search.createColumn({ name: "class" }),
            search.createColumn({ name: "department" }),
            search.createColumn({ name: "internalid" }),
            search.createColumn({ name: "location" }),
          ];

          // let remainingUsage1 = runtime.getCurrentScript().getRemainingUsage();
          // log.error("memoria", "remaining usage by item::" + remainingUsage1);
          let mysearch = search.create({
            type: "serviceitem",
            filters: filters,
            columns: columns,
          });
          var searchResults = mysearch.run();
          var firstResult = searchResults.getRange({ start: 0, end: 1 })[0];

          if (firstResult) {
            classItem = firstResult.getValue({ name: "class" });
            departmentItem = firstResult.getValue({ name: "department" });
            itemId_Netsuite = firstResult.getValue({ name: "internalid" });
            locationItem = firstResult.getValue({ name: "location" });
          }
          log.debug("MSK", "datos de item->" + departmentItem + " - " + classItem + " - " + itemId_Netsuite+ " - " + locationItem);

          // try {
          if (classItem == null || classItem == 0 || departmentItem == null || departmentItem == 0 || itemId_Netsuite == null || itemId_Netsuite == 0 ) {
            flagItem = true;
            error_detail = "Documento:" + keyAuxiliar[1] + " - Error en Item: " + itemId + " Linea nro:" + items[i].nroLinea + " Datos Requeridos: Clase:" + classItem + ", Departamento:" + departmentItem + ", ItemId_Netsuite:" + itemId_Netsuite;              
            fileLogs.push(error_detail);
            log.error("ERROR", error_detail);
            imprimirLogsTXT(fileLogs, paramArchivoInfo, fechaHoraGen);

            break;
          } else {
            //guardar datos en el json
            jsonResult[key].details[i].clase = classItem;
            jsonResult[key].details[i].department = departmentItem;
            jsonResult[key].details[i].itemId_Netsuite = itemId_Netsuite;
            jsonResult[key].lineaCP.lines[i].numLine = i + 1;
            jsonResult[key].lineaCP.lines[i].clase = classItem;
            jsonResult[key].lineaCP.lines[i].department = departmentItem;
            if (locationItem != 0 || locationItem != null) {
              jsonResult[key].details[i].location = locationItem;
            } else {
              jsonResult[key].details[i].location = 0;
            }
            // log.debug("MSK", "datos de item->" + itemId + " -> className=" + classItem + ", department=" + departmentItem + ", itemId_Netsuite=" + itemId_Netsuite);
          }
        }

        //consultar control presupuestal
        if (!flagItem) {
          jsonAux[key] = Object.assign({}, jsonResult[key]);

          var remainingUsage1 = runtime.getCurrentScript().getRemainingUsage();
          log.error("memoria antes CP", "remaining usage by item::" + remainingUsage1);
          if (remainingUsage1 <= 4000) {
            log.error("memoria", "remaining usage::" + remainingUsage1);
            let jsonBills = file.create({
              name: "jsonAux.txt",
              fileType: file.Type.PLAINTEXT,
              contents: JSON.stringify(jsonAux),
              encoding: file.Encoding.UTF8,
              folder: 439,
            });

            idFileJsonAux = jsonBills.save();
            // log.error("id jsonAux", idFileJsonAux);

            var params = {
              custscript_ts_ss_load_claro_data_file: paramIDFile,
              custscript_ts_ss_load_claro_data_cont: paramCont,
              custscript_ts_ss_load_claro_data_json: idFileJsonAux,
              custscript_ts_ss_load_claro_data_info: JSON.stringify(paramArchivoInfo),

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
          
          let validCP = libCP.passesControlPresupuestal(jsonResult[key].lineaCP);
          log.error("Control Presupuestal CP", validCP);
          if (validCP.value) {

            log.error("MSK", "Pasó control presupuestal");
            //agregar partidas a las lineas
            for (let i = 0; i < validCP.partida.length; i++) {
              let partida = validCP.partida[i][0];
              let pos = validCP.partida[i][1];
              // log.debug("MSK", "datos de linea CP respuesta->" + partida + " - " + pos);
              jsonResult[key].details[pos - 1].partida = partida;
            }
            // log.debug("MSK", "datos de linea CP->" + JSON.stringify(jsonResult[key].lineaCP));
            paramCont++;
            var remainingUsage2 = runtime.getCurrentScript().getRemainingUsage();

            log.error("memoria anterior a este", "remaining usage by item::" + remainingUsage1);
            log.error("memoria antes de rellamado", "remaining usage by item::" + remainingUsage2);

            // log.debug("MSK", "datos de jsonAux->" + JSON.stringify(jsonAux));
            if (remainingUsage2 <= 5000) {
              log.error("memoria", "remaining usage::" + remainingUsage2);
              let jsonBills = file.create({
                name: "jsonAux.txt",
                fileType: file.Type.PLAINTEXT,
                contents: JSON.stringify(jsonAux),
                encoding: file.Encoding.UTF8,
                folder: 439,
              });

              idFileJsonAux = jsonBills.save();
              // log.error("id jsonAux", idFileJsonAux);

              var params = {
                custscript_ts_ss_load_claro_data_file: paramIDFile,
                custscript_ts_ss_load_claro_data_cont: paramCont,
                custscript_ts_ss_load_claro_data_json: idFileJsonAux,
                custscript_ts_ss_load_claro_data_info: JSON.stringify(paramArchivoInfo),

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
            error_detail = "Documento:" + keyAuxiliar[1] + " - Error Control Presupuestal ->" + validCP.message;
            log.error("ERROR", error_detail);
            fileLogs.push(error_detail);
            imprimirLogsTXT(fileLogs, paramArchivoInfo, fechaHoraGen);
            break;
          }
        } else {
          error_detail = "No se encontro datos de un item, No se crea Documento N°" + keyAuxiliar[1];
          log.error("ERROR", error_detail);
          archivo.contenido = error_detail;
          imprimirLogsTXT(fileLogs,paramArchivoInfo, fechaHoraGen);
          break;
        }

      } else {
        log.debug("Parametro", paramIDFile + ".> " + paramCont);
        log.debug("key", key);
        log.debug("keyAuxiliar", "termino ejecución");
        log.debug("paramCont", paramCont);
      }
      
      var numberOfItems = Object.keys(jsonResult).length;
      // log.debug("jsonResult.length", numberOfItems);
      if (paramCont == numberOfItems) {
        executionCompleted = true;
      }
    }

    if (executionCompleted) {
      // log.debug("paramCont", paramCont);
      // log.debug("paramIDFile", paramIDFile);

      let jsonBills = file.create({
        name: "jsonAux.txt",
        fileType: file.Type.PLAINTEXT,
        contents: JSON.stringify(jsonAux),
        encoding: file.Encoding.UTF8,
        folder: 439,
      });
      idFileJsonAux = jsonBills.save();
      log.debug("Execution Completed", idFileJsonAux);

      var paramsCreate = {
        custscript_ts_ss_create_claro_file: idFileJsonAux,
        custscript_ts_ss_create_claro_data_cont: 0,
        custscript_ts_ss_create_claro_data_file: paramArchivoInfo,
      };

      // log.debug("paramsCreate", paramsCreate);
      var scriptCreateTask = task.create({
        taskType: task.TaskType.SCHEDULED_SCRIPT,
        scriptId: "customscript_ts_ss_createclarodata",
        deploymentId: "customdeploy_ts_ss_createclarodata",
        params: paramsCreate,
      });
      scriptCreateTask.submit();
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
