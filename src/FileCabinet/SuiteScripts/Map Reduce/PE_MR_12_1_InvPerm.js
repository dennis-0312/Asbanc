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
                cuo: dataMap[1],
                correlativo: dataMap[2],
                codigoCatalogo: dataMap[3],
                codigoCatalogo2: (dataMap[4] == "- None -" ? "" : dataMap[4]),
                tipoExistencia: (dataMap[5] == "- None -" ? "" : dataMap[5]),
                propioExistencia: dataMap[6],
                codigoCatalogo3: (dataMap[7] == "- None -" ? "" : dataMap[7]),
                propioExistencia2: (dataMap[8] == "- None -" ? "" : dataMap[8]),
                fechaEmision: (dataMap[9] == "- None -" ? "" : dataMap[9]),
                tipoDocumento: dataMap[10],
                serieDocumento: dataMap[11],
                nroDocumento: dataMap[12],
                codOperacion: dataMap[13],
                descExistencia: (dataMap[14] == "- None -" ? "" : dataMap[14]),
                unidMedida: (dataMap[15] == "- None -" ? "" : dataMap[15]),
                entradasUnidFisicas: (dataMap[16] == "" ? 0 : dataMap[16]),
                salidaUnidFisicas: (dataMap[17] == "" ? 0 : dataMap[17]),
                estadoOp: dataMap[18]
            };
            context.write({ key: key, value: resultTransactions });
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
        if ((transactionJSON["transactions"]).lengt != 0) {
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
            entradasUnidFisicas = 0,
            salidaUnidFisicas = 0;

        var employeeName = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: useID,
            columns: ['firstname', 'lastname']
        });
        var userName = employeeName.firstname + ' ' + employeeName.lastname;

        //log.debug('transactions', transactions);

        for (let k in transactions) {
            let dato_entradasUnidFisicas = parseFloat(transactions[k].entradasUnidFisicas);
            let dato_salidaUnidFisicas = parseFloat(transactions[k].salidaUnidFisicas);
            let IDD = transactions[k].cuo;
            jsonTransacion[IDD] = {
                periodoContable: transactions[k].periodoContable,
                cuo: transactions[k].cuo,
                correlativo: transactions[k].correlativo,
                codigoCatalogo: transactions[k].codigoCatalogo,
                codigoCatalogo2: transactions[k].codigoCatalogo2,
                tipoExistencia: transactions[k].tipoExistencia,
                propioExistencia: transactions[k].propioExistencia,
                codigoCatalogo3: transactions[k].codigoCatalogo3,
                propioExistencia2: transactions[k].propioExistencia2,
                fechaEmision: transactions[k].fechaEmision,
                tipoDocumento: transactions[k].tipoDocumento,
                serieDocumento: transactions[k].serieDocumento,
                nroDocumento: transactions[k].nroDocumento,
                codOperacion: transactions[k].codOperacion,
                descExistencia: transactions[k].descExistencia,
                unidMedida: transactions[k].unidMedida,
                estadoOp: transactions[k].estadoOp,
                entradasUnidFisicas: transactions[k].entradasUnidFisicas,
                salidaUnidFisicas: transactions[k].salidaUnidFisicas
            }
            entradasUnidFisicas += dato_entradasUnidFisicas;
            salidaUnidFisicas += dato_salidaUnidFisicas;
        }

        //log.debug('jsonTransacion', jsonTransacion);
        let periodSearch = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: pGloblas.pPeriod,
            columns: ['periodname', "startdate"]
        });
        let monthName = months[Number(periodSearch.startdate.split("/")[1]) - 1];
        let year = periodSearch.startdate.split("/")[2];
        entradasUnidFisicas = parseFloat(entradasUnidFisicas.toFixed(2))
        salidaUnidFisicas = parseFloat(salidaUnidFisicas.toFixed(2))

        var jsonAxiliar = {
            "company": {
                "firtsTitle": 'FORMATO 12.1: INVT. PERMANENTE',
                "secondTitle": monthName.toLocaleUpperCase() + ' ' + year,
                "thirdTitle": companyRuc.replace(/&/g, '&amp;'),
                "fourthTitle": companyName.replace(/&/g, '&amp;').toLocaleUpperCase(),
            },
            "total":{
                "entradasUnidFisicas": numberWithCommas(entradasUnidFisicas),
                "salidaUnidFisicas": numberWithCommas(salidaUnidFisicas)
            },
            "movements": jsonTransacion
        };
        return jsonAxiliar;
    }


    const saveFile = (stringValue) => {
        var fileAuxliar = stringValue;
        var urlfile = '';
        if (featSubsidiary) {
            nameReport = 'Formato 12.1_' + companyName + '.' + formatReport;
        } else {
            nameReport = 'Formato 12.1_' + '.' + formatReport;
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
        var aux = file.load("../FTL/PE_Template12_1InvPerm.ftl");
        return aux.getContents();
    }

    const getTransactions = () => {
        var arrResult = [];
        var _cont = 0;

        // PE - Libro Diario 12.1
        var savedSearch = search.load({ id: 'customsearchpe_ripv_2_2' });

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

                // 1. PERÍODO
                arrAux[0] = result.getValue(columns[0]);

                // 2. CUO
                arrAux[1] = result.getValue(columns[1]);

                // 3. CORRELATIVO
                arrAux[2] = result.getValue(columns[2]);

                // 4. CÓDIGO DEL CATÁLOGO UTILIZADO
                arrAux[3] = result.getValue(columns[3]);

                // 5. CÓDIGO DEL CATÁLOGO UTILIZADO 2
                arrAux[4] = result.getValue(columns[4]);

                // 6.  TIPO DE EXISTENCIA
                arrAux[5] = result.getValue(columns[5]);

                // 7. CÓDIGO PROPIO DE EXISTENCIA EN EL CAMPO 5
                arrAux[6] = result.getValue(columns[6]);

                // 8. CÓDIGO DEL CATÁLOGO UTILIZADO 3
                arrAux[7] = result.getValue(columns[7]);

                // 9. CÓDIGO PROPIO DE EXISTENCIA EN EL CAMPO 8
                arrAux[8] = result.getValue(columns[8]);

                // 10. FECHA DE EMISIÓN
                arrAux[9] = result.getValue(columns[9]);

                // 11. TIPO DE DOCUMENTO
                arrAux[10] = result.getValue(columns[10]);

                // 12. NÚMERO DE SERIE DEL DOCUMENTO
                arrAux[11] = result.getValue(columns[11]);

                // 13. NÚMERO DEL DOCUMENTO
                arrAux[12] = result.getValue(columns[12]);

                // 14. CÓDIGO DE OPERACIÓN
                //arrAux[13] = result.getValue(columns[13]);
                arrAux[13] = "Revisar búsqueda";

                // 15. DESCRIPCIÓN DE LA EXISTENCIA
                arrAux[14] = result.getValue(columns[14]);

                // 16. CÓDIGO DE LA UNIDAD DE MEDIDA
                arrAux[15] = result.getValue(columns[15]);

                // 17. ENTRADAS DE LAS UNIDADES FÍSICAS TOTAL
                arrAux[16] = result.getValue(columns[16]);

                // 18. SALIDAS DE LAS UNIDADES FÍSICAS TOTAL
                arrAux[17] = result.getValue(columns[17]);

                // 19. INDICA EL ESTADO DE LA OPERACIÓN
                arrAux[18] = result.getValue(columns[18]);

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
        pGloblas = objContext.getParameter('custscript_pe_12_1_invper_params'); // || {};
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
