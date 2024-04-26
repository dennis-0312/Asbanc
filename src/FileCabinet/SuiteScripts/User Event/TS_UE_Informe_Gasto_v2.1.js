/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/log'], function (search, log) {

    const UNDEF_TAX_CODE = 5;
    const CUENTA_RENTA_CUARTA_CATEGORIA = 3215;

    const beforeLoad = () => {

    }

    const obtenerLineasWithholdingTax = (objRecord) => {
        let linesArray = [];
        try {
            let lineCount = objRecord.getLineCount('expense');
            for (let i = 0; i < lineCount; i++) {
                let apply = objRecord.getSublistValue({ sublistId: "expense", fieldId: 'custcol_4601_witaxapplies', line: i });
                let withholdingCode = objRecord.getSublistValue({ sublistId: "expense", fieldId: 'custcol_4601_witaxcode_exp', line: i });
                if (apply && withholdingCode) {
                    let accountsByWithholdingCode = getAccountsByWithholdingCodes(withholdingCode);
                    for (let j = 0; j < accountsByWithholdingCode.length; j++) {
                        let line = getLine(objRecord, i, accountsByWithholdingCode[j]);
                        linesArray.push(line);
                    }
                }
            }
        } catch (error) {
            log.error("An error ocurrs in [obtenerLineasWithholdingTax]", error);
        }
        return linesArray;
    }

    const agregarLineasWithholdingTax = (objRecord, linesArray, nroRefArray) => {
        try {
            let index = objRecord.getLineCount('expense');
            if (nroRefArray) {
                for (let i = 0; i < linesArray.length; i++) {
                    let nextNroRef = nroRefArray.findIndex(nroRef => !nroRef);
                    log.error("nextNroRef", nextNroRef);
                    addLine(objRecord, index, linesArray[i], nextNroRef);
                    nroRefArray[nextNroRef] = true;
                    index++;
                }
            } else {
                for (let i = 0; i < linesArray.length; i++) {
                    addLine(objRecord, index, linesArray[i]);
                    index++;
                }
            }

        } catch (error) {
            log.error("An error ocurrs in [agregarLineasWithholdingTax", error);
        }
    }

    const calcularWithholdingTax = (context, oldRecord, objRecord, eventType) => {
        if (eventType === context.UserEventType.CREATE) {
            let linesArray = obtenerLineasWithholdingTax(objRecord);
            agregarLineasWithholdingTax(objRecord, linesArray);
        } else if (eventType === context.UserEventType.EDIT) {
            let nroRefArray = getNroRefOldRecord(oldRecord);
            removeCustomWithholdingLines(objRecord);
            let linesArray = obtenerLineasWithholdingTax(objRecord);
            agregarLineasWithholdingTax(objRecord, linesArray, nroRefArray);
        }
    }

    const beforeSubmit = (context) => {
        let oldRecord = context.oldRecord;
        let objRecord = context.newRecord;
        let eventType = context.type;
        try {
            calcularWithholdingTax(context, oldRecord, objRecord, eventType);
            copiarMonedaYTipoCambioDeLinea(context, objRecord, eventType);
            /*
            if (eventType === context.UserEventType.CREATE) {
                let lineCount = objRecord.getLineCount('expense');
                let linesArray = [];

                for (let i = 0; i < lineCount; i++) {
                    let apply = objRecord.getSublistValue({ sublistId: "expense", fieldId: 'custcol_4601_witaxapplies', line: i });
                    let withholdingCode = objRecord.getSublistValue({ sublistId: "expense", fieldId: 'custcol_4601_witaxcode_exp', line: i });
                    if (apply && withholdingCode) {
                        let accountsByWithholdingCode = getAccountsByWithholdingCodes(withholdingCode);
                        for (let j = 0; j < accountsByWithholdingCode.length; j++) {
                            let line = getLine(objRecord, i, accountsByWithholdingCode[j]);
                            linesArray.push(line);
                        }
                    }
                }
                let count = 0;
                for (let i = 0; i < linesArray.length; i++) {
                    let index = count + lineCount;
                    addLine(objRecord, index, linesArray[i]);
                    count++;
                }
            } else if (eventType === context.UserEventType.EDIT) {
                log.error("Edit Transaction");
                let nroRefArray = getNroRefOldRecord(oldRecord);
                log.error("nroRefArray", nroRefArray);

                removeCustomWithholdingLines(objRecord);

                let lineCount = objRecord.getLineCount('expense');
                let linesArray = [];
                log.error("lineCount", lineCount);

                for (let i = 0; i < lineCount; i++) {
                    let apply = objRecord.getSublistValue({ sublistId: "expense", fieldId: 'custcol_4601_witaxapplies', line: i });
                    let withholdingCode = objRecord.getSublistValue({ sublistId: "expense", fieldId: 'custcol_4601_witaxcode_exp', line: i });
                    if (apply && withholdingCode) {
                        let accountsByWithholdingCode = getAccountsByWithholdingCodes(withholdingCode);
                        log.error("accountsByWithholdingCode", accountsByWithholdingCode);
                        for (let j = 0; j < accountsByWithholdingCode.length; j++) {
                            let line = getLine(objRecord, i, accountsByWithholdingCode[j]);
                            linesArray.push(line);
                        }
                    }
                }

                log.error("lineCount", lineCount);
                log.error("linesArray", linesArray);
                let index = lineCount;
                for (let i = 0; i < linesArray.length; i++) {
                    let nextNroRef = nroRefArray.findIndex(nroRef => !nroRef);
                    log.error("nextNroRef", nextNroRef);
                    addLine(objRecord, index, linesArray[i], nextNroRef);
                    nroRefArray[nextNroRef] = true;
                    index++;
                }
            }*/
        } catch (error) {
            log.error("error", error);
        }
    }

    const getLine = (objRecord, i, withholdingTaxValues) => {
        log.error("withholdingTaxValues", withholdingTaxValues);
        let expensedate = objRecord.getSublistValue({ sublistId: "expense", fieldId: "expensedate", line: i });
        let amount = objRecord.getSublistValue({ sublistId: "expense", fieldId: 'amount', line: i });
        let withholdingAmount = roundTwoDecimal(amount * withholdingTaxValues.rate) * -1;
        let currency = objRecord.getSublistValue({ sublistId: "expense", fieldId: 'currency', line: i });
        let exchangerate = objRecord.getSublistValue({ sublistId: "expense", fieldId: 'exchangerate', line: i });
        let department = objRecord.getSublistValue({ sublistId: "expense", fieldId: 'department', line: i });
        let _class = objRecord.getSublistValue({ sublistId: "expense", fieldId: 'class', line: i });
        let location = objRecord.getSublistValue({ sublistId: "expense", fieldId: 'location', line: i });
        let account = withholdingTaxValues.withholdingAccount;
        let vendor = objRecord.getSublistValue({ sublistId: "expense", fieldId: 'custcol_pe_ln_vendor', line: i });
        let vendorName = objRecord.getSublistValue({ sublistId: "expense", fieldId: 'custcol_pe_ln_legal_name', line: i });
        let docNumber = objRecord.getSublistValue({ sublistId: "expense", fieldId: 'custcol_pe_ln_doc_num_iden', line: i });
        let docType = objRecord.getSublistValue({ sublistId: "expense", fieldId: 'custcol_pe_ln_document_type', line: i });
        let serie = objRecord.getSublistValue({ sublistId: "expense", fieldId: 'custcol_pe_ln_serie_cxp', line: i });
        let number = objRecord.getSublistValue({ sublistId: "expense", fieldId: 'custcol_pe_ln_number', line: i });
        //let goodsService = objRecord.getSublistValue({ sublistId: "expense", fieldId: 'custcol_pe_ln_class_goods_and_service', line: i });
        return { expensedate, amount, withholdingAmount, currency, exchangerate, department, class: _class, location, account, vendor, docNumber, docType, serie, number };
        //return [i + 1, currency, withholdingAmount, department, _class, location, vendor, docNumber, docType, serie, tranid, goodsService];
    }

    const addLine = (objRecord, index, values, nextNroRef) => {
        log.error("addLine, values", { index, values, nextNroRef });
        log.error("index", index);

        objRecord.insertLine({ sublistId: "expense", line: index });
        if (nextNroRef) objRecord.setSublistValue({ sublistId: "expense", fieldId: 'refnumber', line: index, value: nextNroRef });
        objRecord.setSublistValue({ sublistId: "expense", fieldId: 'expenseaccount', line: index, value: values.account });
        objRecord.setSublistValue({ sublistId: "expense", fieldId: 'currency', line: index, value: values.currency });
        objRecord.setSublistValue({ sublistId: "expense", fieldId: 'exchangerate', line: index, value: values.exchangerate });
        objRecord.setSublistValue({ sublistId: "expense", fieldId: 'amount', line: index, value: values.withholdingAmount });
        objRecord.setSublistValue({ sublistId: "expense", fieldId: 'taxcode', line: index, value: UNDEF_TAX_CODE });
        objRecord.setSublistValue({ sublistId: "expense", fieldId: 'department', line: index, value: values.department });
        objRecord.setSublistValue({ sublistId: "expense", fieldId: 'class', line: index, value: values.class });
        objRecord.setSublistValue({ sublistId: "expense", fieldId: 'location', line: index, value: values.location });
        objRecord.setSublistValue({ sublistId: "expense", fieldId: "custcol_pe_ln_es_linea_retencion", line: index, value: true });

        if (values.vendor) objRecord.setSublistValue({ sublistId: "expense", fieldId: 'custcol_pe_ln_vendor', line: index, value: values.vendor });

        if (values.docNumber) objRecord.setSublistValue({ sublistId: "expense", fieldId: 'custcol_pe_ln_doc_num_iden', line: index, value: values.docNumber });
        if (values.docType) objRecord.setSublistValue({ sublistId: "expense", fieldId: 'custcol_pe_ln_document_type', line: index, value: values.docType });
        if (values.serie) objRecord.setSublistValue({ sublistId: "expense", fieldId: 'custcol_pe_ln_serie_cxp', line: index, value: values.serie });
        if (values.number) objRecord.setSublistValue({ sublistId: "expense", fieldId: 'custcol_pe_ln_number', line: index, value: values.number });

        objRecord.setSublistValue({ sublistId: "expense", fieldId: 'custcol_pe_ln_exchange_rate', line: index, value: values.exchangerate });
        objRecord.setSublistValue({ sublistId: "expense", fieldId: 'custcol_pe_ln_currency', line: index, value: values.currency });
    }

    const removeCustomWithholdingLines = (objRecord) => {
        let lineCount = objRecord.getLineCount('expense');
        for (let i = lineCount - 1; i >= 0; i--) {
            let isCustomWithholdingTax = objRecord.getSublistValue({ sublistId: "expense", fieldId: 'custcol_pe_ln_es_linea_retencion', line: i });
            if (isCustomWithholdingTax) objRecord.removeLine({ sublistId: "expense", line: i });
        }
    }

    const getNroRefOldRecord = (oldRecord) => {
        let refNos = [];
        refNos[500] = true;
        let existingLines = oldRecord.getLineCount("expense");
        for (let i = 0; i < existingLines; i++) {
            let refNo = oldRecord.getSublistValue("expense", 'refnumber', i);
            refNos[refNo] = true; // Agregar el número de referencia al objeto refNos
        }
        if (refNos[0] === undefined) refNos[0] = true;
        return refNos;
    }

    const roundTwoDecimal = (value) => {
        return Math.round(Number(value) * 100) / 100;
    }

    const getAccountsByWithholdingCodes = (withholdingCode) => {
        let withholdingList = getWithholdingList(withholdingCode);
        return withholdingList;
    }

    const getWithholdingList = (withholdingCode) => {
        log.error("withholdingCode", withholdingCode);
        let result = [];
        let searchResult = search.create({
            type: "customrecord_4601_witaxcode",
            filters: [
                ["internalid", "anyof", withholdingCode],
                "AND",
                [["custrecord_4601_wtc_availableon", "is", "both"], "OR", ["custrecord_4601_wtc_availableon", "is", "onpurcs"]]
            ],
            columns: [
                search.createColumn({ name: "formulanumeric", formula: "{custrecord_4601_wtc_rate}", label: "Formula (Numeric)" }),
                search.createColumn({ name: "custrecord_4601_wtc_istaxgroup", label: "Grupo de impuestos" }),
                search.createColumn({ name: "custrecord_4601_wtt_purcaccount", join: "CUSTRECORD_4601_WTC_WITAXTYPE", label: "Cuenta de impuestos de compra y pasivos" }),
                search.createColumn({ name: "custrecord_4601_gwtc_basis", join: "CUSTRECORD_4601_WTC_GROUPEDWITAXCODES", label: "Base" }),
                search.createColumn({ name: "custrecord_4601_gwtc_code", join: "CUSTRECORD_4601_WTC_GROUPEDWITAXCODES", label: "Internal ID" })
            ]
        }).run().getRange(0, 1000);
        for (let i = 0; i < searchResult.length; i++) {
            let columns = searchResult[i].columns;
            let rate = Number(searchResult[i].getValue(columns[0]));
            let istaxgroup = searchResult[i].getValue(columns[1]);
            let withholdingAccount = searchResult[i].getValue(columns[2]);
            let base = Number(searchResult[i].getValue(columns[3]));
            let individualWithholdingCode = searchResult[i].getValue(columns[4]);
            log.error("values " + i, { rate, istaxgroup, withholdingAccount, base, individualWithholdingCode });
            if (!istaxgroup) {
                result.push({ rate, withholdingAccount });
            } else {
                let withholdingCode = getWithholdingRecord(individualWithholdingCode);
                rate = roundTwoDecimal(base * withholdingCode.rate) / 100;
                result.push({ rate, withholdingAccount: withholdingCode.withholdingAccount });
            }
        }
        return result;
    }

    const getWithholdingRecord = (taxCode) => {
        let searchResult = search.lookupFields({
            type: "customrecord_4601_witaxcode",
            id: taxCode,
            columns: ["custrecord_4601_wtc_witaxtype.custrecord_4601_wtt_purcaccount", "custrecord_4601_wtc_rate"]
        });
        searchResult.withholdingAccount = searchResult["custrecord_4601_wtc_witaxtype.custrecord_4601_wtt_purcaccount"][0].value;
        searchResult.rate = parseFloat(searchResult["custrecord_4601_wtc_rate"]) / 100;
        log.error("getWithholdingRecord", searchResult);
        return searchResult;
    }

    const copiarMonedaYTipoCambioDeLinea = (context, objRecord, eventType) => {
        if (eventType === context.UserEventType.EDIT || eventType === context.UserEventType.CREATE) {
            let count = objRecord.getLineCount('expense');
            for (let i = 0; i < count; i++) {
                let exchangeRate = objRecord.getSublistValue({ sublistId: "expense", fieldId: 'exchangerate', line: i });
                let currency = objRecord.getSublistValue({ sublistId: "expense", fieldId: 'currency', line: i });
                objRecord.setSublistValue({ sublistId: 'expense', fieldId: 'custcol_pe_ln_exchange_rate', line: i, value: exchangeRate });
                objRecord.setSublistValue({ sublistId: 'expense', fieldId: 'custcol_pe_ln_currency', line: i, value: currency });
            }
        }
    }

    const afterSubmit = (context) => {

    }

    return {
        //beforeLoad,
        beforeSubmit,
        //afterSubmit
    };
})