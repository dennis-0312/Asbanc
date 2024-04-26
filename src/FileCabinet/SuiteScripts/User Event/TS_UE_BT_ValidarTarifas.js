/**
* @NApiVersion 2.1
* @NScriptType UserEventScript
*
* Task          Date            Author                                         Remarks
* GAP 52        29 Ago 2023     Alexander Ruesta <aruesta@myevol.biz>          - Validación de bandas y tarifas.
*
*/

define(['N/currentRecord', 'N/search', 'N/ui/dialog', 'N/runtime', '../Library/TS_LIB_BT_BalaceTarifa.js'], (currentRecord, search, dialog, runtime, libBT) => {
  
    const beforeSubmit = (context) => {
        const FN = 'Validar Tarifas';
        try {
            let transaction = context.newRecord;
            log.error('context.type',context.type)
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT || context.type == context.UserEventType.COPY) {
                let date = transaction.getValue('trandate'),
                customer = transaction.getValue('entity'),
                currency = transaction.getValue('currency'),
                formatDate = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                log.error('entro')
                var numLines = transaction.getLineCount({ sublistId: 'item' });

                for(let i = 0; i < numLines; i++){
                    let sublistName = 'item',
                        item = parseInt(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'item', line: i })),
                        amount = parseInt(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'amount', line: i })),
                        quantity = parseInt(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'quantity', line:i }));
                 
                    
                        let itemSearch = search.lookupFields({
                            type: 'serviceitem',
                            id: item,
                            columns: ['custitem_asb_tipo_servicio']
                        });
        
                        if(itemSearch.custitem_asb_tipo_servicio != null && itemSearch.custitem_asb_tipo_servicio != ''){
                            var tarifa = libBT.getBalanceRate(customer, currency, item, formatDate, quantity, itemSearch.custitem_asb_tipo_servicio[0].value);
                            log.error('tarifa', tarifa);
                            
                            if(!Object.keys(tarifa).length == 0 ){
                                if(context.newRecord.type == 'salesorder'){
                                    if(tarifa.type == 1){
                                        transaction.setSublistValue({ sublistId: sublistName, fieldId: 'amount', value: tarifa.value, line: i  });
                                    }else if(tarifa.type == 2){
                                        transaction.setSublistValue({ sublistId: sublistName, fieldId: 'rate', value: tarifa.value, line: i  });
                                    }else if(tarifa.type == 3){
                                        transaction.setSublistValue({ sublistId: sublistName, fieldId: 'amount', value: tarifa.value, line: i  });
                                    }else{
                                        transaction.setSublistValue({ sublistId: sublistName, fieldId: 'amount', value: tarifa.value, line: i  });
                                    }
                                    
                                }
                            }

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

    return {
        //beforeLoad:beforeLoad,
        beforeSubmit:beforeSubmit,
        //afterSubmit: afterSubmit
    };
});