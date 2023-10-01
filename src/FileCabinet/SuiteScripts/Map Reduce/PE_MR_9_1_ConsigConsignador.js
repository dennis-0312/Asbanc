/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                                    Remarks
 * 9.1           01 Oct 2023     Dennis Fernández <dennis.fernandez@myevol.biz>          - Creación del reporte 9.1
 *
 */

define(['N/runtime',
    'N/search',
    'N/config',
    'N/render',
    'N/record',
    'N/file',
    '../Library/PE_LIB_Libros.js'
],
    (runtime, search, config, render, record, file, libPe) => {
        let objContext = runtime.getCurrentScript();
        /** PARAMETROS */
        let pGloblas = {};
        /** REPORTE */
        let formatReport = 'pdf';
        let nameReport = '';
        let transactionFile = null;
        /** DATOS DE LA SUBSIDIARIA */
        let companyName = '';
        let companyRuc = '';
        let companyLogo = '';
        let companyDV = '';
        let featureSTXT = null;
        let featMultibook = null;
        let featSubsidiary = null;
        const FOLDER = 871;

        const months = [
            "enero",
            "febrero",
            "marzo",
            "abril",
            "mayo",
            "junio",
            "julio",
            "agosto",
            "septiembre",
            "octubre",
            "noviembre",
            "diciembre"
        ];

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
                    periodoContable: (dataMap[0] == "- None -" ? "" : dataMap[0]),
                    fecha: (dataMap[1] == "- None -" ? "" : dataMap[1]),
                    tipoExistencia: dataMap[2],
                    serieGuia: (dataMap[3] == "- None -" ? "" : dataMap[3]),
                    nroGuia: (dataMap[4] == "- None -" ? "" : dataMap[4]),
                    serieComprobante: (dataMap[5] == "- None -" ? "" : dataMap[5]),
                    nroComprobante: (dataMap[6] == "- None -" ? "" : dataMap[6]),
                    fechaEntDev: (dataMap[7] == "- None -" ? "" : dataMap[7]),
                    tipoDoc: (dataMap[8] == "- None -" ? "" : dataMap[8]),
                    ruc: (dataMap[9] == "- None -" ? "" : dataMap[9]),
                    razonSocial: (dataMap[10] == "- None -" ? "" : dataMap[10]),
                    sumEntregada: (dataMap[11] == "" ? 0 : dataMap[11]),
                    sumDevuelta: (dataMap[12] == "" ? 0 : dataMap[12]),
                    sumVendida: (dataMap[13] == "" ? 0 : dataMap[13]),
                    sumSaldo: (dataMap[14] == "" ? 0 : dataMap[14])
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
            pGloblas['pRecordID'] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Formato9.1")
            var transactionJSON = {};
            transactionJSON["parametros"] = pGloblas
            transactionJSON["transactions"] = [];
            context.output.iterator().each(function (key, value) {
                value = JSON.parse(value);
                transactionJSON["transactions"].push(value);
                return true;
            });

            //log.debug('transactionJSON', transactionJSON["transactions"]);
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
                sumEntregada = 0,
                sumDevuelta = 0,
                sumVendida = 0,
                sumSaldo = 0;

            // let employeeName = search.lookupFields({
            //     type: search.Type.EMPLOYEE,
            //     id: useID,
            //     columns: ['firstname', 'lastname']
            // });
            // let userName = employeeName.firstname + ' ' + employeeName.lastname;

            //log.debug('transactions', transactions);
            for (let k in transactions) {
                let dato_sumEntregada = parseFloat(transactions[k].sumEntregada);
                let dato_sumDevuelta = parseFloat(transactions[k].sumDevuelta);
                let dato_sumVendida = parseFloat(transactions[k].sumVendida);
                let dato_sumSaldo = parseFloat(transactions[k].sumSaldo);
                let IDD = transactions[k].ruc;
                jsonTransacion[IDD] = {
                    periodoContable: transactions[k].periodoContable,
                    fecha: transactions[k].fecha,
                    tipoExistencia: transactions[k].tipoExistencia,
                    serieGuia: transactions[k].serieGuia,
                    nroGuia: transactions[k].nroGuia,
                    serieComprobante: transactions[k].serieComprobante,
                    nroComprobante: transactions[k].nroComprobante,
                    fechaEntDev: transactions[k].fechaEntDev,
                    tipoDoc: transactions[k].tipoDoc,
                    ruc: transactions[k].ruc,
                    razonSocial: transactions[k].razonSocial,
                    sumEntregada: transactions[k].sumEntregada,
                    sumDevuelta: transactions[k].sumDevuelta,
                    sumVendida: transactions[k].sumVendida,
                    sumSaldo: transactions[k].sumSaldo
                }
                sumEntregada += dato_sumEntregada;
                sumDevuelta += dato_sumDevuelta;
                sumVendida += dato_sumVendida;
                sumSaldo += dato_sumSaldo;
            }

            //log.debug('jsonTransacion', jsonTransacion);
            let periodSearch = search.lookupFields({
                type: search.Type.ACCOUNTING_PERIOD,
                id: pGloblas.pPeriod,
                columns: ['periodname', "startdate"]
            });
            let monthName = months[Number(periodSearch.startdate.split("/")[1]) - 1];
            let year = periodSearch.startdate.split("/")[2];
            sumEntregada = parseFloat(sumEntregada.toFixed(2))
            sumDevuelta = parseFloat(sumDevuelta.toFixed(2))
            sumVendida = parseFloat(sumVendida.toFixed(2))
            sumSaldo = parseFloat(sumSaldo.toFixed(2))

            let jsonAxiliar = {
                "company": {
                    "firtsTitle": 'FORMATO 9.1: CONSG. CONSIGNADOR',
                    "secondTitle": monthName.toLocaleUpperCase() + ' ' + year,
                    "thirdTitle": companyRuc.replace(/&/g, '&amp;'),
                    "fourthTitle": companyName.replace(/&/g, '&amp;').toLocaleUpperCase(),
                },
                "total": {
                    "sumEntregada": numberWithCommas(sumEntregada),
                    "sumDevuelta": numberWithCommas(sumDevuelta),
                    "sumVendida": numberWithCommas(sumVendida),
                    "sumSaldo": numberWithCommas(sumSaldo)
                },
                "movements": jsonTransacion
            };
            return jsonAxiliar;
        }

        const saveFile = (stringValue) => {
            let fileAuxliar = stringValue;
            let urlfile = '';
            if (featSubsidiary) {
                nameReport = 'Formato 9.1_' + companyName + '.' + formatReport;
            } else {
                nameReport = 'Formato 9.1_' + '.' + formatReport;
            }
            fileAuxliar.name = nameReport;
            fileAuxliar.folder = FOLDER;
            let fileID = fileAuxliar.save();
            let auxFile = file.load({ id: fileID });
            urlfile += auxFile.url;
            log.debug('pGloblas.pRecordID', pGloblas.pRecordID)
            libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile)
        }

        const getTemplate = () => {
            var aux = file.load("../FTL/PE_Template9_1ConsigConsignador.ftl");
            return aux.getContents();
        }

        const getTransactions = () => {
            var arrResult = [];
            var _cont = 0;
            // PE - Libro Diario 9.1
            var savedSearch = search.load({ id: 'customsearch_asb_9_1_libro_impreso' });

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

            let searchResultCount = savedSearch.runPaged().count;
            log.debug("vendorbillSearchObj result count", searchResultCount);
            let pagedData = savedSearch.runPaged({ pageSize: 1000 });
            let page, columns;
            pagedData.pageRanges.forEach(function (pageRange) {
                page = pagedData.fetch({ index: pageRange.index });
                page.data.forEach((result) => {
                    columns = result.columns;
                    arrAux = new Array();

                    // 1. PERÍODO
                    arrAux[0] = result.getValue(columns[0]);

                    // 2. FECHA
                    arrAux[1] = result.getValue(columns[1]);

                    // 3. TIPO DE EXISTENCIA
                    arrAux[2] = result.getValue(columns[2]);

                    // 4. SERIE DE GUÍA DE REMISIÓN
                    arrAux[3] = result.getValue(columns[3]);

                    // 5. NÚMERO DE GUÍA DE REMISIÓN
                    arrAux[4] = result.getValue(columns[4]);

                    // 6. SERIE DE COMPROBANTE DE PAGO
                    arrAux[5] = result.getValue(columns[5]);

                    // 7. NÚMERO DE COMPROBANTE DE PAGO
                    arrAux[6] = result.getValue(columns[6]);

                    // 8. FECHA DE ENTREGA O DEVOLUCIÓN
                    arrAux[7] = result.getValue(columns[7]);

                    // 9. TIPO DE DOCUMENTO
                    arrAux[8] = result.getValue(columns[8]);

                    // 10.RUC
                    arrAux[9] = result.getValue(columns[9]);

                    // 11. RAZÓN SOCIAL
                    arrAux[10] = result.getValue(columns[10]);

                    // 12. SUM OF CANTIDAD ENTREGADA
                    arrAux[11] = result.getValue(columns[11]);

                    // 13. SUM OF CANTIDAD DEVUELTA
                    arrAux[12] = result.getValue(columns[12]);

                    // 14. SUM OF CANTIDAD VENDIDA
                    arrAux[13] = result.getValue(columns[13]);

                    // 15. SUM OF SALDO DE LOS BIENES EN CONSIGNACIÓN
                    arrAux[14] = result.getValue(columns[14]);

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
            pGloblas = objContext.getParameter('custscript_pe_9_1_consignador_params'); // || {};
            pGloblas = JSON.parse(pGloblas);
            pGloblas = {
                pRecordID: pGloblas.recordID,
                pFeature: pGloblas.reportID,
                pSubsidiary: pGloblas.subsidiary,
                pPeriod: pGloblas.periodCon,
            }
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
