/**
*@NApiVersion 2.1
*@NScriptType ClientScript
* Task          Date            Author                                         Remarks
* GAP 52        29 Ago 2023     Alexander Ruesta <aruesta@myevol.biz>          - Validación de bandas y tarifas.
*
*/

define(['N/currentRecord', 'N/search', 'N/ui/dialog', 'N/runtime', '../Library/TS_LIB_BT_BalaceTarifa.js'], (currentRecord, search, dialog, runtime, libBT) => {
   
    let typeMode = '',
        solicitud = [];
    
    const pageInit = (context) => {
        typeMode = context.mode;
    }

    const validateLine = (context) => {
        let transaction = context.currentRecord,
            sublistName = context.sublistId,
            disponible = 0;
            
        if (sublistName == 'item' && (typeMode == 'create' || typeMode == 'copy' || typeMode == 'edit')) {
            let date = transaction.getValue('trandate'),
                customer = transaction.getValue('entity'),
                currency = transaction.getValue('currency'),
                formatDate = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();

            let item = parseInt(transaction.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'item' })),
                quantity = parseInt(transaction.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'quantity' }));

            let itemSearch = search.lookupFields({
                type: 'serviceitem',
                id: item,
                columns: ['custitem_asb_tipo_servicio']
            });

            console.log('formatDate', formatDate);
            
            if(itemSearch.custitem_asb_tipo_servicio != null && itemSearch.custitem_asb_tipo_servicio != ''){
                let tarifa = libBT.getBalanceRate(customer, currency, item, formatDate, quantity, itemSearch.custitem_asb_tipo_servicio[0].value);
                console.log('tarifa', JSON.stringify(tarifa));

                if(!Object.keys(tarifa).length == 0 ){
                    if(tarifa.type == 1){
                        transaction.setCurrentSublistValue({ sublistId: sublistName, fieldId: 'amount', value: tarifa.value });
                    }else if(tarifa.type == 2){
                        transaction.setCurrentSublistValue({ sublistId: sublistName, fieldId: 'rate', value: tarifa.value });
                    }else if(tarifa.type == 3){
                        transaction.setCurrentSublistValue({ sublistId: sublistName, fieldId: 'amount', value: tarifa.value });
                    }else{
                        transaction.setCurrentSublistValue({ sublistId: sublistName, fieldId: 'amount', value: tarifa.value });
                    }
                }
            }
            return true;
        }
        return true;
    }


    return {
        pageInit: pageInit,
        //saveRecord: saveRecord,
        //fieldChanged: fieldChanged,
        //postSourcing: postSourcing,
        validateLine: validateLine,
        //sublistChanged: sublistChanged
    }
});
