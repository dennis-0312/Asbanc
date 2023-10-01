/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                                    Remarks
 * 5.3           30 Ago 2023     Dennis Fernández <dennis.fernandez@myevol.biz>          - Creación del reporte 5.3
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

    const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

    const getInputData = () => {
        try {
            getParameters();
            return getTransactions();
        } catch (e) {
            log.error('[ Get Input Data Error ]', e);
        }
    }

    const map = (context) => {
        try {
            var key = context.key;
            var dataMap = JSON.parse(context.value);
            var resultTransactions = {
                periodoContable: dataMap[0],
                cuentaContable: dataMap[1],
                descripcionContable: dataMap[2],
                planCuentas: dataMap[3],
                descripcionCuentas: dataMap[4],
                cuentaCorporativa: dataMap[5],
                descripcionCorporativa: dataMap[6],
                estadoOperacion: dataMap[7]
            };

            context.write({
                key: key,
                value: resultTransactions
            });

        } catch (e) {
            log.error('[ Map Error ]', e);
        }
    }

    const summarize = (context) => {
        log.debug('Entro al summarize');
        getParameters();
        getSubdiary();
        pGloblas['pRecordID'] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Formato5.1")
        var transactionJSON = {};
        transactionJSON["parametros"] = pGloblas
        transactionJSON["transactions"] = [];
        context.output.iterator().each(function (key, value) {
            value = JSON.parse(value);
            transactionJSON["transactions"].push(value);
            return true;
        });
        log.debug('transactionJSON', transactionJSON["transactions"]);
        var jsonAxiliar = getJsonData(transactionJSON["transactions"]);
        //Validamos que TrnsactionJSON.accounts no este vacio para todos los ambientes
        if ((transactionJSON["transactions"]).lengt != 0) {
            log.debug('mirame', JSON.stringify(jsonAxiliar));
            log.debug('mirame de nuevo', JSON.stringify(jsonAxiliar.movements))
            var renderer = render.create();
            renderer.templateContent = getTemplate();
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "input",
                data: {
                    data: JSON.stringify(jsonAxiliar)
                }
            });
            stringXML = renderer.renderAsPdf();
            saveFile(stringXML);
            log.debug('Termino');
            return true;

        } else {
            log.debug('No data');
            libPe.noData(pGloblas.pRecordID);
        }

    }

    const getJsonData = (transactions) => {
        let userTemp = runtime.getCurrentUser(),
            useID = userTemp.id,
            jsonTransacion = {},
            totalDebit = 0,
            totalCredit = 0;

        var employeeName = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: useID,
            columns: ['firstname', 'lastname']
        });
        var userName = employeeName.firstname + ' ' + employeeName.lastname;

        //log.debug('transactions', transactions);

        for (let k in transactions) {
            let IDD = transactions[k].cuentaContable;
            jsonTransacion[IDD] = {
                periodoContable: transactions[k].periodoContable,
                cuentaContable: transactions[k].cuentaContable,
                descripcionContable: transactions[k].descripcionContable,
                planCuentas: transactions[k].planCuentas,
                descripcionCuentas: transactions[k].descripcionCuentas,
                cuentaCorporativa: transactions[k].cuentaCorporativa,
                descripcionCorporativa: transactions[k].descripcionCorporativa,
                estadoOperacion: transactions[k].estadoOperacion
            }
        }

        //log.debug('jsonTransacion', jsonTransacion);
        let periodSearch = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: pGloblas.pPeriod,
            columns: ['periodname', "startdate"]
        });
        let monthName = months[Number(periodSearch.startdate.split("/")[1]) - 1];
        let year = periodSearch.startdate.split("/")[2];

        var jsonAxiliar = {
            "company": {
                "firtsTitle": 'FORMATO 5.1: LIBRO DIARIO',
                "secondTitle": monthName.toLocaleUpperCase() + ' ' + year,
                "thirdTitle": companyRuc.replace(/&/g, '&amp;'),
                "fourthTitle": companyName.replace(/&/g, '&amp;').toLocaleUpperCase(),
            },
            "movements": jsonTransacion
        };
        return jsonAxiliar;
    }


    const saveFile = (stringValue) => {
        var fileAuxliar = stringValue;
        var urlfile = '';
        if (featSubsidiary) {
            nameReport = 'Formato 5.3_' + companyName + '.' + formatReport;
        } else {
            nameReport = 'Formato 5.3_' + '.' + formatReport;
        }

        var folderID = 871;

        fileAuxliar.name = nameReport;
        fileAuxliar.folder = folderID;

        var fileID = fileAuxliar.save();

        let auxFile = file.load({ id: fileID });
        // log.debug('hiii', auxFile)
        urlfile += auxFile.url;
        log.debug('pGloblas.pRecordID', pGloblas.pRecordID)
        libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile)

    }

    const getTemplate = () => {
        var aux = file.load("../FTL/PE_Template5_3LibroDiario.ftl");
        return aux.getContents();
    }

    const getTransactions = () => {
        var arrResult = [];
        var _cont = 0;

        // PE - Libro Diario 5.3
        var savedSearch = search.load({ id: 'customsearch_pe_libro_diario_5_3_2' });

        if (featSubsidiary) {
            savedSearch.filters.push(search.createFilter({
                name: 'subsidiary',
                operator: search.Operator.IS,
                values: pGloblas.pSubsidiary
            }));
        }

        // savedSearch.filters.push(search.createFilter({
        //     name: 'postingperiod',
        //     operator: search.Operator.IS,
        //     values: [pGloblas.pPeriod]
        // }));

        // savedSearch.columns.push(search.createColumn({
        //     name: 'formulatext',
        //     formula: "{tranid}",
        // }))

        // savedSearch.columns.push(search.createColumn({
        //     name: 'formulatext',
        //     formula: "NVL({account.displayname},'')",
        // }))

        // let searchResultCount = savedSearch.runPaged().count;
        // log.debug("vendorbillSearchObj result count", searchResultCount);
        var pagedData = savedSearch.runPaged({ pageSize: 1000 });
        var page, columns;
        pagedData.pageRanges.forEach(function (pageRange) {
            page = pagedData.fetch({ index: pageRange.index });
            page.data.forEach((result) => {
                columns = result.columns;
                arrAux = new Array();

                // 0. PERÍODO
                arrAux[0] = result.getValue(columns[0]);

                // 1. CÓDIGO DE LA CUENTA CONTABLE
                arrAux[1] = result.getValue(columns[1]);

                // 2. DESCRIPCIÓN DE LA CUENTA CONTABLE
                arrAux[2] = result.getValue(columns[2]);

                // 4. CÓDIGO DEL PLAN DE CUENTAS
                arrAux[3] = result.getValue(columns[3]);

                // 5. DESCRIPCIÓN DEL PLAN DE CUENTA UTILIZADO
                arrAux[4] = result.getValue(columns[4]);

                // 6.  CÓDIGO DE LA CUENTA CONTABLE CORPORATIVA
                arrAux[5] = result.getValue(columns[5]);

                // 7. DESCRIPCIÓN DE LA CUENTA CONTABLE CORPORATIVA
                arrAux[6] = result.getValue(columns[6]);

                // 8. INDICA EL ESTADO DE LA OPERACIÓN
                arrAux[7] = result.getValue(columns[7]);

                arrResult.push(arrAux);
            });
        });
        return arrResult;
    }

    const getSubdiary = () => {
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
            companyRuc = ''
        }
    }

    const getParameters = () => {
        pGloblas = objContext.getParameter('custscript_pe_5_3_librod_params'); // || {};
        pGloblas = JSON.parse(pGloblas);
        //log.debug('previo', pGloblas)
        pGloblas = {
            pRecordID: pGloblas.recordID,
            pFeature: pGloblas.reportID,
            pSubsidiary: pGloblas.subsidiary,
            pPeriod: pGloblas.periodCon,
        }
        //log.debug('XDDD', pGloblas);

        featSubsidiary = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
    }

    const isObjEmpty = (obj) => {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }
        return true;
    }

    return {
        getInputData: getInputData,
        map: map,
        // reduce: reduce,
        summarize: summarize
    };

});
