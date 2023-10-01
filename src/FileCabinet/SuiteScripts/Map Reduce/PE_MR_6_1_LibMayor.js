/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                                    Remarks
 * 5.3           30 Ago 2023     Dennis Fernández <dennis.fernandez@myevol.biz>          - Creación del reporte 6.1
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
                numAsiento: dataMap[2],
                codCuenta: dataMap[3],
                codOp: (dataMap[4] == "- None -" ? "" : dataMap[4]),
                ceco: (dataMap[5] == "- None -" ? "" : dataMap[5]),
                tipoMoneda: dataMap[6],
                tipoDocIdentidad: (dataMap[7] == "- None -" ? "" : dataMap[7]),
                numDocIdentidad: (dataMap[8] == "- None -" ? "" : dataMap[8]),
                tipoComprob: (dataMap[9] == "- None -" ? "" : dataMap[9]),
                serieComprob: dataMap[10],
                comprobPago: dataMap[11],
                fecha: dataMap[12],
                dueDate: dataMap[13],
                fechaOp: (dataMap[14] == "- None -" ? "" : dataMap[14]),
                glosaDesc: (dataMap[15] == "- None -" ? "" : dataMap[15]),
                glosaRef: (dataMap[16] == "- None -" ? "" : dataMap[16]),
                movDebe: (dataMap[17] == "" ? 0 : dataMap[17]),
                movHaber: (dataMap[18] == "" ? 0 : dataMap[18]),
                codLibro: dataMap[19],
                codLibro2: dataMap[20],
                estadoOp: dataMap[23]
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
            movDebe = 0,
            movHaber = 0;

        var employeeName = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: useID,
            columns: ['firstname', 'lastname']
        });

        var userName = employeeName.firstname + ' ' + employeeName.lastname;
        log.debug('transactions', transactions);
        for (let k in transactions) {
            let dato_movDebe = parseFloat(transactions[k].movDebe);
            let dato_movHaber = parseFloat(transactions[k].movHaber);

            let IDD = transactions[k].cuo;
            jsonTransacion[IDD] = {
                periodoContable: transactions[k].periodoContable,
                cuo: transactions[k].cuo,
                numAsiento: transactions[k].numAsiento,
                codCuenta: transactions[k].codCuenta,
                codOp: transactions[k].codOp,
                ceco: transactions[k].ceco,
                tipoMoneda: transactions[k].tipoMoneda,
                tipoDocIdentidad: transactions[k].tipoDocIdentidad,
                numDocIdentidad: transactions[k].numDocIdentidad,
                tipoComprob: transactions[k].tipoComprob,
                serieComprob:transactions[k].serieComprob,
                comprobPago: transactions[k].comprobPago,
                fecha: transactions[k].fecha,
                dueDate: transactions[k].dueDate,
                fechaOp: transactions[k].fechaOp,
                glosaDesc: transactions[k].glosaDesc,
                glosaRef: transactions[k].glosaRef,
                movDebe: transactions[k].movDebe,
                movHaber: transactions[k].movHaber,
                codLibro: transactions[k].codLibro,
                codLibro2: transactions[k].codLibro2,
                estadoOp: transactions[k].estadoOp
            }
            movDebe += dato_movDebe;
            movHaber += dato_movHaber;
        }

        log.debug('jsonTransacion', jsonTransacion);
        let periodSearch = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: pGloblas.pPeriod,
            columns: ['periodname', "startdate"]
        });
        let monthName = months[Number(periodSearch.startdate.split("/")[1]) - 1];
        let year = periodSearch.startdate.split("/")[2];
        movDebe = parseFloat(movDebe.toFixed(2))
        movHaber = parseFloat(movHaber.toFixed(2))

        var jsonAxiliar = {
            "company": {
                "firtsTitle": 'FORMATO 6.1: INVT. PERMANENTE',
                "secondTitle": monthName.toLocaleUpperCase() + ' ' + year,
                "thirdTitle": companyRuc.replace(/&/g, '&amp;'),
                "fourthTitle": companyName.replace(/&/g, '&amp;').toLocaleUpperCase(),
            },
            "total": {
                "movDebe": numberWithCommas(movDebe),
                "movHaber": numberWithCommas(movHaber),
            },
            "movements": jsonTransacion
        };
        return jsonAxiliar;
    }


    const saveFile = (stringValue) => {
        var fileAuxliar = stringValue;
        var urlfile = '';
        if (featSubsidiary) {
            nameReport = 'Formato 6.1_' + companyName + '.' + formatReport;
        } else {
            nameReport = 'Formato 6.1_' + '.' + formatReport;
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
        var aux = file.load("../FTL/PE_Template6_1LibMay.ftl");
        return aux.getContents();
    }

    const getTransactions = () => {
        var arrResult = [];
        var _cont = 0;

        // PE - Libro Diario 6.1
        var savedSearch = search.load({ id: 'customsearch_pe_libro_mayor_6_1' });

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

        // savedSearch.columns.push(search.createColumn({
        //     name: 'formulatext',
        //     formula: "{tranid}",
        // }))

        // savedSearch.columns.push(search.createColumn({
        //     name: 'formulatext',
        //     formula: "NVL({account.displayname},'')",
        // }))

        let searchResultCount = savedSearch.runPaged().count;
        log.debug("vendorbillSearchObj result count", searchResultCount);
        var pagedData = savedSearch.runPaged({ pageSize: 1000 });
        var page, columns;
        pagedData.pageRanges.forEach(function (pageRange) {
            page = pagedData.fetch({ index: pageRange.index });
            page.data.forEach((result) => {
                columns = result.columns;
                arrAux = new Array();
                let arreglo = new Array();

                // 1. PERÍODO
                arrAux[0] = result.getValue(columns[0]);

                // 2. CUO
                arrAux[1] = result.getValue(columns[1]);

                // 3. NÚMERO CORRELATIVO DEL ASIENTO
                arrAux[2] = result.getValue(columns[2]);

                // 4. CÓDIGO DE LA CUENTA CONTABLE
                arrAux[3] = result.getValue(columns[3]);

                // 5. CÓDIGO DE UNIDAD DE OPERACIÓN
                arrAux[4] = result.getValue(columns[4]);

                // 6. CENTRO DE COSTO
                arrAux[5] = result.getValue(columns[5]);

                // 7. TIPO DE MONEDA DE ORIGEN
                arrAux[6] = result.getValue(columns[6]);

                // 8. TIPO DE DOCUMENTO DE IDENTIDAD DEL EMISOR
                arrAux[7] = result.getValue(columns[7]);

                // 9. NÚMERO DE DOCUMENTO DE IDENTIDAD DEL EMISOR
                arrAux[8] = result.getValue(columns[8]);

                // 10.TIPO DE COMPROBANTE
                arrAux[9] = result.getValue(columns[9]);

                // 11. NÚMERO DE SERIE DEL COMPROBANTE DE PAGO
                arrAux[10] = result.getValue(columns[10]);

                // 12. NÚMERO DE COMPRONBANTE DE PAGO
                arrAux[11] = result.getValue(columns[11]);

                // 13. FECHA CONTABLE
                arrAux[12] = result.getValue(columns[12]);

                // 14. FECHA DE VENCIMIENTO
                arrAux[13] = result.getValue(columns[13]);

                // 15. FECHA DE LA OPERACIÓN O EMISIÓN
                arrAux[14] = result.getValue(columns[14]);

                // 16. GLOSA O DESCRIPCIÓN DE LA NATURALEZA DE LA OPERACIÓN REGISTRADA DE SER EL CASO
                arrAux[15] = result.getValue(columns[15]);

                // 17. GLOSA REFERENCIAL
                arrAux[16] = result.getValue(columns[16]);

                // 18. MOVIMIENTOS DEL DEBE
                arrAux[17] = result.getValue(columns[17]);

                // 19. MOVIMIENTO DEL HABER
                arrAux[18] = result.getValue(columns[18]);

                // 20.  COD LIBRO
                arrAux[19] = result.getValue(columns[19]);

                // 20.1 CAMPO 1 ==== 21
                arrAux[20] = result.getValue(columns[20]);

                // 20.2 CAMPO 2
                arrAux[21] = result.getValue(columns[21]);

                // 20.3 CAMPO 3
                arrAux[22] = result.getValue(columns[22]);

                if (arrAux[20] != '' && arrAux[21] != '' && arrAux[22] != '') {
                    arreglo.push(arrAux[20], arrAux[21], arrAux[22]);
                    for (let i = 0; i < arreglo.length; i++) {
                        if ((i + 1) != arreglo.length) {
                            arrAux[20] += arreglo[i] + '&amp;';
                        } else {
                            arrAux[20] += arreglo[i]
                        }
                    }
                } else {
                    arrAux[20] = '';
                }

                // 22 INDICA EL ESTADO DE LA OPERACIÓN
                arrAux[23] = result.getValue(columns[23]);

                arrResult.push(arrAux);
            });
        });
        log.debug('ResOriginal', arrResult);
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
        pGloblas = objContext.getParameter('custscript_pe_6_1_libmay_params'); // || {};
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
