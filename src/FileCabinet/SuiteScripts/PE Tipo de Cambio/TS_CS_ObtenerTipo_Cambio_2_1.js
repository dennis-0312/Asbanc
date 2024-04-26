/**
* @NApiVersion 2.1
* @NScriptType ClientScript
*/

define(["N/currentRecord", "N/log", "N/search"], (currentRecord, log, search,) => {

    let PEN_CURRENCY_ID = 1;
    let USD_CURRENCY_ID = 2;
    let peTipoCambioJson = {};
    let ultimoPETipoCambio = 0;

    const pageInit = (context) => {
        currentRecord = currentRecord.get();
        setTimeout(function () {
            /*let subsidiary = currentRecord.getValue("subsidiary");
            if (subsidiary) {*/
            peTipoCambioJson = obtenerPETipoCambio();

            if (context.mode == 'create' || context.mode == 'copy') {
                let currencyId = currentRecord.getValue("currency") || currentRecord.getValue("expensereportcurrency");
                let trandate = currentRecord.getText("trandate");
                if (trandate && currencyId == USD_CURRENCY_ID) {
                    let exchangerate = peTipoCambioJson[trandate];
                    setTimeout(function () {
                        if (exchangerate) {
                            currentRecord.setValue({
                                fieldId: 'exchangerate',
                                value: exchangerate,
                                ignoreFieldChange: true,
                                forceSyncSourcing: true
                            });
                            currentRecord.setValue({
                                fieldId: 'expensereportexchangerate',
                                value: exchangerate,
                                ignoreFieldChange: true,
                                forceSyncSourcing: true
                            });
                        } else {
                            alert("No se encontró un tipo de cambio Sunat");
                            if (ultimoPETipoCambio) {
                                currentRecord.setValue({
                                    fieldId: 'exchangerate',
                                    value: ultimoPETipoCambio,
                                    ignoreFieldChange: true,
                                    forceSyncSourcing: true
                                });
                                currentRecord.setValue({
                                    fieldId: 'expensereportexchangerate',
                                    value: ultimoPETipoCambio,
                                    ignoreFieldChange: true,
                                    forceSyncSourcing: true
                                });
                            }

                        }
                    }, 1000);
                }
            }
            //}
        }, 300);

        console.log(context);

    }

    const fieldChanged = (context) => {
        //let currentRecord = context.currentRecord;
        let transactionType = currentRecord.type;
        let sublistId = context.sublistId;
        let fieldId = context.fieldId;

        try {
            if (fieldId == "trandate" || fieldId == "currency") {
                let currencyId = currentRecord.getValue("currency") || currentRecord.getValue("expensereportcurrency");
                let trandate = currentRecord.getText("trandate");
                if (trandate && currencyId == USD_CURRENCY_ID) {
                    let exchangerate = peTipoCambioJson[trandate];
                    setTimeout(function () {
                        if (exchangerate) {
                            currentRecord.setValue({
                                fieldId: 'exchangerate',
                                value: exchangerate,
                                ignoreFieldChange: true,
                                forceSyncSourcing: true
                            });
                            currentRecord.setValue({
                                fieldId: 'expensereportexchangerate',
                                value: exchangerate,
                                ignoreFieldChange: true,
                                forceSyncSourcing: true
                            });
                        } else {
                            alert("No se encontró un tipo de cambio Sunat");
                            if (ultimoPETipoCambio) {
                                currentRecord.setValue({
                                    fieldId: 'exchangerate',
                                    value: ultimoPETipoCambio,
                                    ignoreFieldChange: true,
                                    forceSyncSourcing: true
                                });
                                currentRecord.setValue({
                                    fieldId: 'expensereportexchangerate',
                                    value: ultimoPETipoCambio,
                                    ignoreFieldChange: true,
                                    forceSyncSourcing: true
                                });
                            }

                        }
                    }, 3000);
                }
            }
        } catch (error) {
            console.log(error, error);
        }
    }

    const obtenerPETipoCambio = () => {
        var peTipoCambioJson = {};
        let newSearch = search.create({
            type: "customrecord_pe_tipo_cambio",
            filters: [],
            columns: [
                search.createColumn({
                    name: "custrecord_pe_tc_fecha_efectiva",
                    sort: search.Sort.DESC
                }),
                "custrecord_pe_tc_tipo_cambio"
            ]
        });
        let pagedData = newSearch.runPaged({ pageSize: 1000 });
        let primerTipoCambio = true;
        pagedData.pageRanges.forEach(function (pageRange) {
            page = pagedData.fetch({
                index: pageRange.index
            });
            page.data.forEach(function (result) {
                let columns = result.columns;
                var fechaEfectiva = result.getValue('custrecord_pe_tc_fecha_efectiva');
                var tipoCambio = Number(result.getValue("custrecord_pe_tc_tipo_cambio"));
                peTipoCambioJson[fechaEfectiva] = tipoCambio;
                if (primerTipoCambio) {
                    ultimoPETipoCambio = tipoCambio;
                    primerTipoCambio = false;
                }
            })
        })
        return peTipoCambioJson;
    }

    const formatDate = (value) => {
        return format.format({
            type: format.Type.DATE,
            value: value
        });
    }

    return {
        fieldChanged,
        pageInit
    }
})