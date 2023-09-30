/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                         Remarks
 * 1.1           28 Ago 2023     Ivan Morales <imorales@myevol.biz>             - Creación del reporte 1.1
 *
 */

define(['N/runtime', 'N/search', 'N/config', 'N/render', 'N/record', 'N/file', '../Library/PE_LIB_Libros.js'], (runtime, search, config, render, record, file, libPe) => {

  var objContext = runtime.getCurrentScript();

  /** PARAMETROS */
  var pGloblas = {};

  /** REPORTE */
  var formatReport = 'pdf';
  var nameReport = '';
  var transactionFile = null;

  /** DATOS DE LA SUBSIDIARIA */
  var companyName = '';
  var companyRuc = '';
  var companyLogo = '';
  var companyDV = '';

  var featureSTXT = null;
  var featMultibook = null;
  var featSubsidiary = null;

  const FOLDER_ID = 871;//532

  const getInputData = () => {
      // log.debug('MSK', 'getInputData - Inicio');
      try {
          getParameters();
          return getTransactions();
      } catch (e) {
          log.error('MSK', 'getInputData - Error:' + e);
      }
      // log.debug('MSK', 'getInputData - Fin');

  }

  const map = (context) => {
      try {
          var key = context.key;
          var dataMap = JSON.parse(context.value);
          var resultTransactions = {
              codUniOperacion: dataMap[0],
              fechaOperacion: dataMap[1],
              desOperacion: (dataMap[2] == "- None -" ? "" : dataMap[2]),
              numeroCuenta: dataMap[3],
              denominacion: dataMap[4],
              debito: dataMap[5],
              credito: dataMap[6],
          };

          context.write({
              key: key,
              value: resultTransactions
          });

      } catch (e) {
          log.error('MSK', 'map - Error:' + e);
      }
  }

  const summarize = (context) => {
      // log.debug('MSK', 'summarize - Inicio');
      getParameters();
      // generateLog();
      getSubdiary();
      pGloblas['pRecordID'] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Formato1.1")

      var transactionJSON = {};

      transactionJSON["parametros"] = pGloblas

      transactionJSON["transactions"] = {
      };
      context.output.iterator().each(function (key, value) {
          value = JSON.parse(value);

          transactionJSON["transactions"][value.codUniOperacion] = value;
          return true;

      });
      // log.debug('transactionJSON', transactionJSON["transactions"]);

      var jsonAxiliar = getJsonData(transactionJSON["transactions"]);

      //Validamos que TrnsactionJSON.accounts no este vacio para todos los ambientes
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

          if (FolderId != '' && FolderId != null) {
              // Crea el archivo
              var fileAux = file.create({
                  name: 'AuxiiliarPaPa',
                  fileType: file.Type.PLAINTEXT,
                  contents: stringXML2,
                  encoding: file.Encoding.UTF8,
                  folder: FolderId
              });


              var idfile = fileAux.save(); // Termina de grabar el archivo

              log.debug({
                  title: 'URL ARCHIVO TEMP',
                  details: idfile
              });

          }

          /*** */
          stringXML = renderer.renderAsPdf();
          saveFile(stringXML);


          /**** */
          log.debug('Termino');
          return true;

      } else {
          log.debug('No data');
          libPe.noData(pGloblas.pRecordID);
      }
      log.debug('MSK', 'summarize - Fin');

  }

  const getJsonData = (transactions) => {
      // log.debug('MSK', 'getJsonData - Inicio');
      let userTemp = runtime.getCurrentUser(),
          useID = userTemp.id,
          jsonTransacion = {},
          totalDebito = 0;
      totalCredito = 0;
      saldoDebito = 0;
      saldoCredito = 0;

      var employeeName = search.lookupFields({
          type: search.Type.EMPLOYEE,
          id: useID,
          columns: ['firstname', 'lastname']
      });
      var userName = employeeName.firstname + ' ' + employeeName.lastname;

      // log.debug('transactions', transactions);

      for (var k in transactions) {
          let IDD = transactions[k].codUniOperacion;
        if (!jsonTransacion[IDD]) {
          let creditoFormat = numberWithCommas(transactions[k].credito);
          log.debug('credito', creditoFormat);

          let debitoFormat = numberWithCommas(transactions[k].debito);
          log.debug('debitoFormat', debitoFormat);

              jsonTransacion[IDD] = {
                  codUniOperacion: transactions[k].codUniOperacion,
                  fechaOperacion: transactions[k].fechaOperacion,
                  desOperacion: transactions[k].desOperacion,
                  numeroCuenta: transactions[k].numeroCuenta,
                  denominacion: transactions[k].denominacion,
                  debito: debitoFormat,
                  credito: creditoFormat,
              }
              totalDebito = totalDebito + Number(transactions[k].debito);
              totalCredito = totalCredito + Number(transactions[k].credito);
          }
      }

      if(totalDebito > totalCredito){
          saldoDebito = totalDebito - totalCredito
      }else{
          saldoCredito = totalCredito - totalDebito
      }

      log.debug('jsonTransacion', jsonTransacion);
      let periodSearch = search.lookupFields({
          type: search.Type.ACCOUNTING_PERIOD,
          id: pGloblas.pPeriod,
          columns: ['periodname']
      });

      let periodname_completo = ""
      switch (periodSearch.periodname.substring(0, 3)) {
          case "Ene":
              periodname_completo = periodSearch.periodname.replace("Ene", "Enero")
              break;
          case "Feb":
              periodname_completo = periodSearch.periodname.replace("Feb", "Febrero")
              break;
          case "Mar":
              periodname_completo = periodSearch.periodname.replace("Mar", "Marzo")
              break;
          case "Abr":
              periodname_completo = periodSearch.periodname.replace("Abr", "Abril")
              break;
          case "May":
              periodname_completo = periodSearch.periodname.replace("May", "Mayo")
              break;
          case "Jun":
              periodname_completo = periodSearch.periodname.replace("Jun", "Junio")
              break;
          case "Jul":
              periodname_completo = periodSearch.periodname.replace("Jul", "Julio")
              break;
          case "Ago":
              periodname_completo = periodSearch.periodname.replace("Ago", "Agosto")
              break;
          case "Set":
              periodname_completo = periodSearch.periodname.replace("Set", "Setiembre")
              break;
          case "Oct":
              periodname_completo = periodSearch.periodname.replace("Oct", "Octubre")
              break;
          case "Nov":
              periodname_completo = periodSearch.periodname.replace("Nov", "Noviembre")
              break;
          case "Dic":
              periodname_completo = periodSearch.periodname.replace("Dic", "Diciembre")
              break;
          default:
              periodname_completo = periodSearch.periodname
              break;
      }

      let jsonAxiliar = {
          "company": {
              "firtTitle": companyName.replace(/&/g, '&amp;'),
              "secondTitle": 'Expresado en Moneda Nacional',
              "thirdTitle": 'FORMATO 1.1 - ' + periodSearch.periodname,
          },
          "cabecera": {
              "periodo": periodname_completo,
              "ruc": companyRuc,
              "razonSocial": companyName.replace(/&/g, '&amp;').toUpperCase()
          },
          "total": {
              "totalDebito": totalDebito.toFixed(2),
              "totalCredito": totalCredito.toFixed(2),
              "saldoDebito": saldoDebito.toFixed(2),
              "saldoCredito": saldoCredito.toFixed(2)
          },
          "movements": jsonTransacion

      };

      // log.debug('MSK - jsonAxiliar', jsonAxiliar);
      return jsonAxiliar;
  }

  const saveFile = (stringValue) => {
      var fileAuxliar = stringValue;
      var urlfile = '';
      if (featSubsidiary) {
          nameReport = 'Formato 1.1_' + companyName + '.' + formatReport;
      } else {
          nameReport = 'Formato 1.1_' + '.' + formatReport;
      }

      var folderID = FOLDER_ID;

      fileAuxliar.name = nameReport;
      fileAuxliar.folder = folderID;

      var fileID = fileAuxliar.save();

      let auxFile = file.load({
          id: fileID
      });
      log.debug('hiii', auxFile)
      urlfile += auxFile.url;

      // log.debug('pGloblas.pRecordID', pGloblas.pRecordID)

      libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile)
  }

  const getTemplate = () => {
      // log.debug('MSK', 'getTemplate - Inicio');
      var aux = file.load("../TestScript/PE_Template_Formato_1_1.xml");
      // log.debug('MSK', 'getTemplate - Fin');
      return aux.getContents();
  }

  const getTransactions = () => {
      // log.debug('MSK', 'getTransactions - Inicio');
      var arrResult = [];
      var _cont = 0;

      // FORMATO 1.1: "LIBRO CAJA Y BANCOS - DETALLE DE LOS MOVIMIENTOS DEL EFECTIVO"
      var savedSearch = search.load({
          id: 'customsearch1108'
      });

      if (featSubsidiary) {
          savedSearch.filters.push(search.createFilter({
              name: 'subsidiary',
              operator: search.Operator.IS,
              values: pGloblas.pSubsidiary
          }));
      }

      savedSearch.filters.push(search.createFilter({
          name: 'postingperiod',
          operator: search.Operator.IS,
          values: [pGloblas.pPeriod]
      }));

      var pagedData = savedSearch.runPaged({
          pageSize: 1000
      });

      var page, columns;

      pagedData.pageRanges.forEach(function (pageRange) {
          page = pagedData.fetch({
              index: pageRange.index
          });

          page.data.forEach(function (result) {
              columns = result.columns;
              arrAux = new Array();

              // 0. CÓDIGO ÚNICO DE LA OPERACIÓN
              arrAux[0] = result.getValue(columns[0]);

              // 1. FECHA DE LA OPERACIÓN	
              arrAux[1] = result.getValue(columns[1]);

              // 2. DESCRIPCIÓN DE LA OPERACIÓN
              arrAux[2] = result.getValue(columns[2]);

              // 3. CÓDIGO CUENTA CONTABLE ASOCIADA
              arrAux[3] = result.getValue(columns[3]);

              // 4. DENOMINACIÓN CUENTA CONTABLE ASOCIADA
              arrAux[4] = result.getValue(columns[4]);

              // 5. SALDO DEUDOR
              arrAux[5] = result.getValue(columns[5]);

              // 6. SALDO ACREEDOR
              arrAux[6] = result.getValue(columns[6]);

              arrResult.push(arrAux);

          });
      });
      // log.debug('MSK', 'getTransactions - Fin');
      return arrResult;
  }

  const getSubdiary = () => {
      // log.debug('MSK', 'getSubdiary - Inicio');

      if (featSubsidiary) {
          log.debug(pGloblas.pSubsidiary, pGloblas.pSubsidiary)
          var dataSubsidiary = record.load({
              type: 'subsidiary',
              id: pGloblas.pSubsidiary
          });
          companyName = dataSubsidiary.getValue('legalname');
          companyRuc = dataSubsidiary.getValue('federalidnumber');
      } else {
          companyName = config.getFieldValue('legalname');
      }
      // log.debug('MSK', 'getSubdiary - Fin');
  }

  const getParameters = () => {
      pGloblas = objContext.getParameter('custscript_pe_formato_1_1_params');
      pGloblas = JSON.parse(pGloblas);

      pGloblas = {
          pRecordID: pGloblas.recordID,
          pFeature: pGloblas.reportID,
          pSubsidiary: pGloblas.subsidiary,
          pPeriod: pGloblas.periodCon,
      }
      // log.debug('MSK - Parámetros', pGloblas);

      featSubsidiary = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
  }

  const isObjEmpty = (obj) => {
      for (var prop in obj) {
          if (obj.hasOwnProperty(prop)) return false;
      }

      return true;
  }

  const numberWithCommas = (x) => {
      x = x.toString();
      var pattern = /(-?\d+)(\d{3})/;
      while (pattern.test(x))
          x = x.replace(pattern, "$1,$2");
      return x;
  }

  return {
      getInputData: getInputData,
      map: map,
      // reduce: reduce,
      summarize: summarize
  };

});
