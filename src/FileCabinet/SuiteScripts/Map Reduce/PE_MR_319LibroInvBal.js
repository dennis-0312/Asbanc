/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                         Remarks
 * 3.19          29 Ago 2023     Alexander Ruesta <aruesta@myevol.biz>          - Creación del reporte 3.19
 *
 */

define(["N/runtime", "N/search", "N/config", "N/render", "N/record", "N/file", "../Library/PE_LIB_Libros.js"], (runtime, search, config, render, record, file, libPe) => {
  var objContext = runtime.getCurrentScript();

  /** PARAMETROS */
  var pGloblas = {};

  /** REPORTE */
  var formatReport = "pdf";
  var nameReport = "";
  var transactionFile = null;

  /** DATOS DE LA SUBSIDIARIA */
  var companyName = "";
  var companyRuc = "";
  var companyLogo = "";
  var companyDV = "";

  var featureSTXT = null;
  var featMultibook = null;
  var featSubsidiary = null;
  const FOLDER_ID = 871; //532

  const getInputData = () => {
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

      var resultTransactions = {
        dato1: dataMap[0],
        dato2: dataMap[1],
        dato3: dataMap[2],
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
    log.debug("Entro al summarize");
    getParameters();
    getSubdiary();

    pGloblas["pRecordID"] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Inventario y Balance 3.19");
    var transactionJSON = {};
    transactionJSON["parametros"] = pGloblas;
    transactionJSON["transactions"] = {};
    context.output.iterator().each((key, value) => {
      value = JSON.parse(value);
      //transactionJSON["transactions"].push(value);
      transactionJSON["transactions"][value.dato2] = value;
      return true;
    });
    log.debug("transactionJSON", transactionJSON["transactions"]);
    var jsonAxiliar = getJsonData(transactionJSON["transactions"]);
    //Validamos que TrnsactionJSON.accounts no este vacio para todos los ambientes
    log.debug("jsonAxiliar", jsonAxiliar);
    if (!isObjEmpty(transactionJSON["transactions"])) {
      var renderer = render.create();
      renderer.templateContent = getTemplate();
      renderer.addCustomDataSource({
        format: render.DataSource.OBJECT,
        alias: "input",
        data: {
          data: JSON.stringify(jsonAxiliar)
        }
      });

      /**** */
      stringXML2 = renderer.renderAsString();

      var FolderId = FOLDER_ID;

      if (FolderId != "" && FolderId != null) {
        // Crea el archivo
        var fileAux = file.create({
          name: "Auxiliar319",
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
      saldo = 0

    var employeeName = search.lookupFields({
      type: search.Type.EMPLOYEE,
      id: useID,
      columns: ["firstname", "lastname"],
    });
    var userName = employeeName.firstname + " " + employeeName.lastname;

    log.debug("transactions", transactions);

    // transactions.forEach((line) => {
    //   log.debug("line", line);
    //   totalLine3 = parseFloat(totalLine3) + parseFloat(line.col1);
    //   totalLine4 = parseFloat(totalLine4) + parseFloat(line.col2);
    //   totalLine5 = parseFloat(totalLine5) + parseFloat(line.col3);

    // });

    for (var k in transactions) {
      let IDD = transactions[k].dato2;

      if (!jsonTransacion[IDD]) {
        let dato_3 = parseFloat(transactions[k].dato3);
        log.debug('dato_3', dato_3);

        // let debitoFormat = numberWithCommas(transactions[k].debito);
        // log.debug('debitoFormat', debitoFormat);
        jsonTransacion[IDD] = {
          dato1: transactions[k].dato1,
          dato2: transactions[k].dato2,
          dato3: dato_3,
        }
        saldo += dato_3;
        // totalCredito = totalCredito + Number(transactions[k].credito);
      }
    }

    log.debug("jsonTransacion", jsonTransacion);
    let periodSearch = search.lookupFields({
      type: search.Type.ACCOUNTING_PERIOD,
      id: pGloblas.pPeriod,
      columns: ["periodname"],
    });

    let jsonCompany = {
      company: {
        firtsTitle: 'FORMATO 3.19 : "LIBRO DE INVENTARIOS Y BALANCES - ESTADO DE CAMBIOS EN EL PATRIMONIO NETO DEL 01.01 AL 31.12',
        secondTitle: periodSearch.periodname.split(" ")[1],
        thirdTitle: companyRuc.replace(/&/g, "&amp;"),
        fourthTitle: companyName.replace(/&/g, "&amp;"),
      },
      totals: {
        dato3: Number(saldo).toFixed(2),
      },
      movements: jsonTransacion,
    };

    return jsonCompany;
  };

  const saveFile = (stringValue) => {
    asinfo = "1";
    var periodAnioCon = pGloblas.anioCon;
    var getruc = getRUC(pGloblas.pSubsidiary);
    fedIdNumb = getruc;
    var fileAuxliar = stringValue;
    var urlfile = "";
    //LERRRRRRRRRRRAAAAMMDD031900CCOIM1.TXT
    nameReport = "LE" + fedIdNumb + periodAnioCon + "1231" + "031900" + "01" + "1" + asinfo + "11_" + pGloblas.pRecordID + ".pdf";
    log.debug("nameReport", nameReport);

    var folderID = FOLDER_ID;

    fileAuxliar.name = nameReport;
    fileAuxliar.folder = folderID;

    var fileID = fileAuxliar.save();

    let auxFile = file.load({
      id: fileID,
    });
    urlfile += auxFile.url;

    // log.debug('pGloblas.pRecordID', pGloblas.pRecordID)

    libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile);
  };

  const getTemplate = () => {
    var aux = file.load("../FTL/PE_Template319LibroInvBal.ftl");
    return aux.getContents();
  };

  const getTransactions = () => {
    var arrResult = [];
    var _cont = 0;

    // FORMATO 3.19 Libro Inventario y Balance
    var savedSearch = search.load({
      id: "customsearch_pe_319_lib_invbal",
    });

    if (featSubsidiary) {
      savedSearch.filters.push(
        search.createFilter({
          name: "subsidiary",
          operator: search.Operator.IS,
          values: pGloblas.pSubsidiary,
        })
      );
    }

    // savedSearch.filters.push(search.createFilter({
    //     name: 'postingperiod',
    //     operator: search.Operator.IS,
    //     values: [pGloblas.pPeriod]
    // }));

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

        // 0. CODIGO
        arrAux[0] = result.getValue(columns[0]);

        // 1. MONTO
        arrAux[1] = result.getValue(columns[1]);

        // 1. saldo
        arrAux[2] = result.getValue(columns[2]);

        arrResult.push(arrAux);
      });
    });
    log.debug("arrResult", arrResult);
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
      companyRuc = "";
    }
  };

  const getParameters = () => {
    pGloblas = objContext.getParameter("custscript_pe_319libinvbal_params"); // || {};
    pGloblas = JSON.parse(pGloblas);
    /*pGloblas = {
            recordID: '',
            reportID: 113,
            subsidiary: 3,
            periodCon: 111
        }*/
    log.debug("previo", pGloblas);

    pGloblas = {
      pRecordID: pGloblas.recordID,
      pFeature: pGloblas.reportID,
      pSubsidiary: pGloblas.subsidiary,
      pPeriod: pGloblas.periodCon,
      anioCon: pGloblas.anioCon,
    };
    log.debug("XDDD", pGloblas);

    featSubsidiary = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
  };

  const isObjEmpty = (obj) => {
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) return false;
    }

    return true;
  };

  const getRUC = (filterSubsidiary) => {
    try {
      const subLookup = search.lookupFields({
        type: search.Type.SUBSIDIARY,
        id: filterSubsidiary,
        columns: ["taxidnum"],
      });
      const ruc = subLookup.taxidnum;
      return ruc;
    } catch (e) {
      log.error({ title: "getRUC", details: e });
    }
  };

  return {
    getInputData: getInputData,
    map: map,
    // reduce: reduce,
    summarize: summarize,
  };
});
