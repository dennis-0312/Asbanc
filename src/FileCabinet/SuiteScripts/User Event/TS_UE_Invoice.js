/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 * Task          Date            Author                                         Remarks
 * GAP 100       20 Jun 2023     Alexander Ruesta <aruesta@myevol.biz>          - Elimina los articulos sin estado Unico
 *
 */

define(['N/runtime', 'N/search','N/record'], (runtime, search, record) => {
    const beforeLoad = (context) => {
        const FN = 'beforeLoad';
        try {
            let transaction = context.newRecord,
                related = transaction.getValue('createdfrom');
            
            if(related){
                var transactionSO = record.load({
                    type: record.Type.SALES_ORDER,
                    id: related
                });
    
                let transactionType = transactionSO.getValue({fieldId: 'type'}),
                    project = transactionSO.getValue({fieldId: 'job'}),
                    calendar = transactionSO.getValue({fieldId: 'billingschedule'});
                log.error('project', project)
                if(transactionType == 'salesord' && project != '' && calendar != ''){
                    
                    for (var i = transaction.getLineCount({ sublistId: 'item' }) - 1; i >= 0; i--) {
                        var itemID = transaction.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });
    
                        var typeItem = search.lookupFields({
                            type: search.Type.ITEM,
                            id: itemID,
                            columns: ['custitem_asb_tipo_item']
                        });
                        
                        if((typeItem.custitem_asb_tipo_item).length != 0 && typeItem.custitem_asb_tipo_item[0].value == 1){
                            transaction.removeLine({
                                sublistId: 'item',
                                line: i,
                            });
                        }
    
                    }
    
                    let documentType = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_document_type' }),
                        serie = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_serie' }),
                        wayToPay = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_ei_pay' });
    
                    transaction.setValue({ fieldId: 'custbody_pe_document_type', value: documentType});
                    transaction.setValue({ fieldId: 'custbody_pe_serie', value: serie});
                    transaction.setValue({ fieldId: 'custbody_pe_ei_forma_pago', value: wayToPay});
                }
            }
            

        } catch (e) {
            log.error({
                title: `${FN} error`,
                details: { message: `${FN} - ${e.message || `Unexpected error`}` },
            });
            throw { message: `${FN} - ${e.message || `Unexpected error`}` };
        }
    };

    const beforeSubmit = (context) => {
        const FN = 'beforeSubmit';
        try { 
            let currentRecord = context.newRecord,
                metodoPago = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_method_payment' }),
                totalMenor = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_inv_totalmenor' }),
                totalMayor = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_inv_totalmayor' }),
                tax18 = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_inv_tax_18' }),
                tax0 = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_inv_tax_0' });
                totalTransaction = 0;

                log.error('context.type', context.type)
               
            if(context.type === context.UserEventType.CREATE){
                
                
                currentRecord.setValue({ fieldId: 'custbody_pe_payment_methods', value: metodoPago })
                var itemCount = currentRecord.getLineCount({ sublistId: 'item' });

                for (let i = 0; i < itemCount; i++) {
                    
                    var totalLine = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });
                    if(i == 0){
                        var taxRate = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxrate1', line: i });
                    }
                    var detraccion = currentRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxline', line: i });
                    if(!detraccion){
                        totalTransaction = totalTransaction + totalLine;
                    }
                }
    
                //if(totalTransaction < 700){
                //    log.error('totalTransaction', totalTransaction < 700) 
                //    currentRecord.setValue({ fieldId: 'custbody_pe_ei_operation_type', value: totalMenor })
                //}else{
                //    currentRecord.setValue({ fieldId: 'custbody_pe_ei_operation_type', value: totalMayor })
                //}
    
                if(taxRate == 18){
                    currentRecord.setValue({ fieldId: 'custbody_pe_concepto_tributario', value: tax18})
                }else if(taxRate == 0){
                    currentRecord.setValue({ fieldId: 'custbody_pe_concepto_tributario', value: tax0 })
                }
            }
           

          
        } catch (e) {
            log.error({
                title: `${FN} error`,
                details: { message: `${FN} - ${e.message || `Unexpected error`}` },
            });
            throw { message: `${FN} - ${e.message || `Unexpected error`}` };
        }
    };

    const afterSubmit = (context) => {
        const FN = 'afterSubmit';
        try {
            log.error('context.type', context.type === context.UserEventType.XEDIT)
            if (context.type === context.UserEventType.XEDIT){
                var formTransaction = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_ue_invoice_form' }),
                    prefix = '',
                    doctype = '';
                let transaction = record.load({
                    type: record.Type.INVOICE,
                    id: context.newRecord.id,
                })
                let ieStatus = transaction.getValue('custbody_psg_ei_status')
                log.error('context.type', ieStatus)
                if(ieStatus == 3){
                    
                    let memo = transaction.getValue('memo');
                    var enajenacion = memo.includes('Factura para la enajenación de activos'),
                        customform = transaction.getValue({ fieldId: 'customform' }),
                        customer = transaction.getValue({ fieldId: 'entity' }),
                        location = transaction.getValue({ fieldId: 'location' }),
                        peNumber = transaction.getValue({ fieldId: 'custbody_pe_number' });

                    let subTransaction =  record.load({ type: 'subsidiary', id: transaction.getValue({ fieldId: 'subsidiary' }), isDynamic: true })
                    let prefijo_subsidiaria =  subTransaction.getValue('tranprefix');
                        

                    if (customform == formTransaction) {
                        prefix = 'ND-';
                        doctype = '08';
                    } else {
                        let searchField = search.lookupFields({ type: search.Type.CUSTOMER, id: customer, columns: ['custentity_pe_document_type'] });
                        if (searchField.custentity_pe_document_type[0].value == 1 || searchField.custentity_pe_document_type[0].value == 4 ) {//TODO: Activar cuando tipo de documento venga de cliente
                            prefix = 'FA-';
                            doctype = '01'
                        } else {
                            prefix = 'BV-';
                            doctype = '03'
                        }
                    }
                    
                    var customsearch = search.create({
                        type: "customrecord_pe_fiscal_document_type",
                        filters:
                        [
                           ["custrecord_pe_code_document_type","is",doctype]
                        ],
                        columns:
                        [
                            search.createColumn({name: "internalid", label: "Internal ID"})
                        ]
                     });
                     
                    var searchResult = customsearch.run().getRange({ start: 0, end: 1 });
                    var idCamp = searchResult[0].getValue(customsearch.columns[0]);

                     if(peNumber == '' || peNumber == null){
                        let getserie = getSerie(doctype, location, prefix),
                        correlative = generateCorrelative(getserie.peinicio, getserie.serieid, getserie.serieimpr);
                        log.debug('correlative', correlative);
                        
                        transaction.setValue({ fieldId: 'custbody_pe_number', value: correlative.correlative });
                        transaction.setValue({ fieldId: 'custbody_pe_serie', value: getserie.serieid, ignoreFieldChange: true });
                       
                        transaction.setValue({ fieldId: 'tranid', value: prefijo_subsidiaria + correlative.numbering, ignoreFieldChange: true });
                   
                        transaction.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });
                     }
                    
                }

                
            }
        } catch (e) {
            log.error({
                title: `${FN} error`,
                details: { message: `${FN} - ${e.message || `Unexpected error`}` },
            });
            throw { message: `${FN} - ${e.message || `Unexpected error`}` };
        }
    };

    

    const generateCorrelative = (return_pe_inicio, serieid, serieimpr) => {
        let ceros;
        let correlative;
        let numbering;
        let this_number = return_pe_inicio;

        const next_number = return_pe_inicio + 1
        record.submitFields({ type: 'customrecord_pe_serie', id: serieid, values: { 'custrecord_pe_inicio': next_number } });

        if (this_number.toString().length == 1) {
            ceros = '0000000';
        } else if (this_number.toString().length == 2) {
            ceros = '000000';
        } else if (this_number.toString().length == 3) {
            ceros = '00000';
        } else if (this_number.toString().length == 4) {
            ceros = '0000';
        } else if (this_number.toString().length == 5) {
            ceros = '000';
        } else if (this_number.toString().length == 6) {
            ceros = '00';
        } else if (this_number.toString().length == 7) {
            ceros = '0';
        } else if (this_number.toString().length >= 8) {
            ceros = '';
        }

        correlative = ceros + this_number;
        numbering = serieimpr + '-' + correlative;

        return {
            'correlative': correlative,
            'numbering': numbering
        }
    }

    const getSerie = (paramDoc, paramLocation, paramPrefix) => {
        
            log.debug('ENTRA RECORD PE SERIE');
            searchLoad = search.create({
                type: 'customrecord_pe_serie',
                filters: [
                    ['custrecord_pe_tipo_documento_serie.custrecord_pe_code_document_type', 'is', paramDoc],
                    'AND',
                    ['custrecord_pe_location', 'anyof', paramLocation],
                    'AND',
                    ["custrecord_para_anulacin", "is", "F"]
                ],
                columns: [
                    {
                        name: 'internalid',
                        sort: search.Sort.ASC
                    },
                    'custrecord_pe_inicio',
                    'custrecord_pe_serie_impresion'
                ]
            });
        

        const searchResult = searchLoad.run().getRange({ start: 0, end: 1 });
        const column01 = searchResult[0].getValue(searchLoad.columns[0]);
        let column02 = searchResult[0].getValue(searchLoad.columns[1]);
        let column03 = searchResult[0].getValue(searchLoad.columns[2]);
        column03 = paramPrefix + column03;
        column02 = parseInt(column02);
        return {
            'serieid': column01,
            'peinicio': column02,
            'serieimpr': column03
        };
    }
    return {
        beforeLoad,
        beforeSubmit,
        afterSubmit,
    };
});
