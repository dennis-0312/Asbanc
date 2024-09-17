/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/config', 'N/log', 'N/query', 'N/record', 'N/search'],
    /**
 * @param{config} config
 * @param{log} log
 * @param{query} query
 * @param{record} record
 * @param{search} search
 */
    (config, log, query, record, search) => {
        const VENDOR_BILL = 'vendorbill';
        const IMPORTE_MINIMO = 700
        const IGV_PE_UNDEF_PE = 5

        const enviromentConfig = () => {
            let variables = new Object();
            let companyInfo = config.load({ type: config.Type.COMPANY_INFORMATION });
            let companyid = companyInfo.getValue({ fieldId: 'companyid' });
            const EN_SANDBOX = companyid.includes('SB');
            if (EN_SANDBOX) {
                // variables.tax_item_ns_ec = '16514'
            }
            else {//EN_PROD
                // variables.tax_item_ns_ec = '24128'
            }
            return variables;
        }

        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => { }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            let objRecord = scriptContext.newRecord;
            const eventType = scriptContext.type;
            const transactionid = scriptContext.newRecord.id;
            if (eventType === scriptContext.UserEventType.CREATE || eventType === scriptContext.UserEventType.COPY || eventType === scriptContext.UserEventType.EDIT) {
                try {
                    if (objRecord.type == VENDOR_BILL) {
                        let total = objRecord.getValue('total') * objRecord.getValue('exchangerate')
                        let taxCode = objRecord.getValue('custpage_4601_witaxcode')
                        log.debug('total', total)
                        log.debug('taxCode', taxCode)
                        if (total > IMPORTE_MINIMO) {
                            let items = objRecord.getLineCount("item");
                            let expenses = objRecord.getLineCount("expense");
                            // if (items) {
                            //     log.debug('Items', `Entry Items`);
                            //     let openRecord = record.load({ type: objRecord.type, id: transactionid, isDynamic: true });
                            //     openRecord.setValue('custbody_pe_concept_detraction', 23);
                            //     let witaxCode = getWitaxCode(openRecord.getValue('custbody_pe_percentage_detraccion'), openRecord.getValue('currencysymbol'));
                            //     log.debug('witaxCode', witaxCode);
                            //     for (let line = 0; line < items; line++) {
                            //         openRecord.selectLine({ sublistId: 'item', line: line });
                            //         openRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxapplies', value: true })
                            //         openRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxcode', value: witaxCode })
                            //         openRecord.commitLine({ sublistId: 'item' });
                            //     }
                            //     let recordId = openRecord.save({enableSourcing: true,ignoreMandatoryFields: true});
                            //     log.debug('RecordSave', recordId);
                            // }
                            if (expenses) {
                                log.debug('Expenses', `Entry Expenses`)
                                //let openRecord = record.load({ type: objRecord.type, id: transactionid, isDynamic: true });
                                objRecord.setValue('custbody_pe_concept_detraction', 23);
                                let witaxCode = getWitaxCode(objRecord.getValue('custbody_pe_percentage_detraccion'), objRecord.getValue('currencysymbol'));
                                objRecord.setValue('custpage_4601_witaxcode', witaxCode);
                                log.debug('witaxCode', witaxCode);
                                for (let line = 0; line < expenses; line++) {
                                    // objRecord.selectLine({ sublistId: 'expense', line: line });
                                    objRecord.setSublistValue({ sublistId: 'expense', fieldId: 'custcol_4601_witaxapplies', line: line, value: true })
                                    objRecord.setSublistValue({ sublistId: 'expense', fieldId: 'custcol_4601_witaxcode', value: witaxCode })
                                    objRecord.setSublistValue({ sublistId: 'expense', fieldId: 'custpage_4601_witaxcode', value: witaxCode })
                                    // objRecord.commitLine({ sublistId: 'expense' });
                                }
                                objRecord.setValue('custpage_4601_witaxcode', witaxCode);
                                // let recordId = openRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
                                // log.debug('RecordSave', recordId);
                            }
                        }
                    }
                } catch (error) {
                    log.error('Error-afterSubmit', error);
                }
            }
        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            let objRecord = scriptContext.newRecord;
            const eventType = scriptContext.type;
            const transactionid = scriptContext.newRecord.id;
            let sublidtid = '';
            let lines = 0;
            if (eventType === scriptContext.UserEventType.CREATE || eventType === scriptContext.UserEventType.COPY || eventType === scriptContext.UserEventType.EDIT) {
                try {
                    if (objRecord.type == VENDOR_BILL) {
                        let total = objRecord.getValue('total') * objRecord.getValue('exchangerate')
                        log.debug('total', total);
                        if (total > IMPORTE_MINIMO) {
                            let item = objRecord.getLineCount("item");
                            let expense = objRecord.getLineCount("expense");
                            
                            if (item) {
                                log.debug('Items', `Entry Items`);
                                let openRecord = record.load({ type: objRecord.type, id: transactionid, isDynamic: true });
                                openRecord.setValue('custbody_pe_concept_detraction', 23);
                                let witaxCode = getWitaxCode(openRecord.getValue('custbody_pe_percentage_detraccion'), openRecord.getValue('currencysymbol'));
                                log.debug('witaxCode', witaxCode);
                                for (let line = 0; line < item; line++) {
                                    openRecord.selectLine({ sublistId: 'item', line: line });
                                    if (openRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'taxcode' }) != IGV_PE_UNDEF_PE) {
                                        let grossamt = openRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'grossamt' });
                                        log.debug('grossamt', grossamt);
                                        let whtAmount = ((parseFloat(openRecord.getValue('custbody_pe_percentage_detraccion')) / 100) * grossamt) * -1
                                        openRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxapplies', value: true })
                                        openRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxcode', value: witaxCode });
                                        openRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxrate', value: openRecord.getValue('custbody_pe_percentage_detraccion') });
                                        openRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxbaseamount', value: grossamt });
                                        openRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxamount', value: whtAmount });
                                    }
                                    openRecord.commitLine({ sublistId: 'item' });
                                }
                                let recordId = openRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
                                log.debug('RecordSave', recordId);
                            } else if (expense) {
                                log.debug('Expenses', `Entry Expenses`)
                                let openRecord = record.load({ type: objRecord.type, id: transactionid, isDynamic: true });
                                openRecord.setValue('custbody_pe_concept_detraction', 23);
                                let witaxCode = getWitaxCode(openRecord.getValue('custbody_pe_percentage_detraccion'), openRecord.getValue('currencysymbol'));
                                log.debug('witaxCode', witaxCode);
                                for (let line = 0; line < expense; line++) {
                                    openRecord.selectLine({ sublistId: 'expense', line: line });
                                    if (openRecord.getCurrentSublistValue({ sublistId: 'expense', fieldId: 'taxcode' }) != IGV_PE_UNDEF_PE) {
                                        let grossamt = openRecord.getCurrentSublistValue({ sublistId: 'expense', fieldId: 'grossamt' });
                                        log.debug('grossamt', grossamt);
                                        let whtAmount = ((parseFloat(openRecord.getValue('custbody_pe_percentage_detraccion')) / 100) * grossamt) * -1
                                        openRecord.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'custcol_4601_witaxapplies', value: true })
                                        openRecord.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'custcol_4601_witaxcode', value: witaxCode });
                                        openRecord.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'custcol_4601_witaxrate', value: openRecord.getValue('custbody_pe_percentage_detraccion') });
                                        openRecord.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'custcol_4601_witaxbaseamount', value: grossamt });
                                        openRecord.setCurrentSublistValue({ sublistId: 'expense', fieldId: 'custcol_4601_witaxamount', value: whtAmount });
                                    }
                                    openRecord.commitLine({ sublistId: 'expense' });
                                }
                                let recordId = openRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
                                log.debug('RecordSave', recordId);
                            }
                        }
                    }
                } catch (error) {
                    log.error('Error-afterSubmit', error);
                }
            }
        }

        const getWitaxCode = (detraction, currecny) => {
            let filtros = [
                ["custrecord_4601_wtc_witaxtype", "anyof", "1", "5"],
                "AND",
                ["custrecord_4601_wtc_rate", "equalto", detraction]
            ]
            if (currecny == "USD") {
                filtros.push("AND", ["formulatext: SUBSTR({custrecord_4601_wtc_name},0,3)", "is", "USD"])
            } else {
                filtros.push("AND", ["formulatext: SUBSTR({custrecord_4601_wtc_name},0,3)", "isnot", "USD"])
            }
            let searchLoad = search.create({
                type: "customrecord_4601_witaxcode",
                filters: filtros,
                columns: [search.createColumn({ name: "internalid", label: "Internal ID" })]
            });
            const searchResult = searchLoad.run().getRange(0, 1);
            let column01 = searchResult[0].getValue(searchLoad.columns[0]);
            return column01;
        }

        return {
            //beforeSubmit,
            afterSubmit
        }
    });

    // sublidtid = item > 0 ? 'item' : 'expense';
                            // lines = item > 0 ? item : expense;
                            // log.debug(sublidtid, `Entry ${sublidtid}`);
                            // log.debug('lines', lines);

                            // let openRecord = record.load({ type: objRecord.type, id: transactionid, isDynamic: true });
                            // openRecord.setValue('custbody_pe_concept_detraction', 23);
                            // let witaxCode = getWitaxCode(openRecord.getValue('custbody_pe_percentage_detraccion'), openRecord.getValue('currencysymbol'));
                            // log.debug('witaxCode', witaxCode);

                            // for (let line = 0; line < lines; line++) {
                            //     openRecord.selectLine({ sublistId: sublidtid, line: line });
                            //     if (openRecord.getCurrentSublistValue({ sublistId: sublidtid, fieldId: 'taxcode' }) != IGV_PE_UNDEF_PE) {
                            //         let grossamt = openRecord.getCurrentSublistValue({ sublistId: sublidtid, fieldId: 'grossamt' }); log.debug('grossamt', grossamt);
                            //         let whtAmount = ((parseFloat(openRecord.getValue('custbody_pe_percentage_detraccion')) / 100) * grossamt); log.debug('whtAmount', whtAmount);
                            //         openRecord.setCurrentSublistValue({ sublistId: sublidtid, fieldId: 'custcol_4601_witaxapplies', value: true })
                            //         openRecord.setCurrentSublistValue({ sublistId: sublidtid, fieldId: 'custcol_4601_witaxcode', value: witaxCode });
                            //         openRecord.setCurrentSublistValue({ sublistId: sublidtid, fieldId: 'custcol_4601_witaxrate', value: openRecord.getValue('custbody_pe_percentage_detraccion') });
                            //         openRecord.setCurrentSublistValue({ sublistId: sublidtid, fieldId: 'custcol_4601_witaxbaseamount', value: grossamt });
                            //         openRecord.setCurrentSublistValue({ sublistId: sublidtid, fieldId: 'custcol_4601_witaxamount', value: whtAmount });
                            //     }
                            //     openRecord.commitLine({ sublistId: sublidtid });
                            // }

                            // let recordId = openRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
                            // log.debug('RecordSave', recordId);
