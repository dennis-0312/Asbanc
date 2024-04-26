/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/record', 'N/search', '../Library/TS_LIB_BT_BalaceTarifa.js'], function (log, record, search, libBT) {

    function _get(context) {
        return true;
    }

    function _post(context) {
       
        try {
            log.debug('holaaa')
            var objInvoice = search.create({
                type: "salesorder",
                filters:
                    [
                        ["internalid", "anyof", context.OrdenPedidoVenta]
                    ]

            });
            var searchResultCount = objInvoice.runPaged().count;

            if (searchResultCount > 0) {
                let orden = record.load({ type: 'salesorder', id: context.OrdenPedidoVenta, isDynamic: true });

                let date = orden.getValue('trandate'),
                    customer = orden.getValue('entity'),
                    currency = orden.getValue('currency'),
                    formatDate = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                for (var i = 0; i < context.listaDetalle.length; i++) {
                    var datos = searchItemsInternalIds(context.listaDetalle[i].CodArticuloRecurrente);
                    
                    orden.selectNewLine({sublistId: 'item'})
                    orden.setCurrentSublistValue({sublistId: 'item',fieldId: 'item',value:datos.itemid});
                    orden.setCurrentSublistValue({sublistId: 'item',fieldId: 'taxcode',value: 6});
                    orden.setCurrentSublistValue({sublistId: 'item',fieldId: 'quantity',value: context.listaDetalle[i].cantidad });
                    let itemSearch = search.lookupFields({
                        type: 'serviceitem',
                        id: datos.itemid,
                        columns: ['custitem_asb_tipo_servicio']
                    });
               
                    let tarifa = libBT.getBalanceRate(customer, currency,  datos.itemid, formatDate, context.listaDetalle[i].cantidad, itemSearch.custitem_asb_tipo_servicio[0].value);
                
                    if(!Object.keys(tarifa).length == 0 ){
                        if(tarifa.type == 1){
                            orden.setCurrentSublistValue({ sublistId: 'item', fieldId: 'amount', value: tarifa.value, line: i });
                        }else if(tarifa.type == 2){
                            orden.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: tarifa.value, line: i });
                        }else if(tarifa.type == 3){
                            orden.setCurrentSublistValue({ sublistId: 'item', fieldId: 'amount', value: tarifa.value, line: i });
                        }else{
                            orden.setCurrentSublistValue({ sublistId: 'item', fieldId: 'amount', value: tarifa.value, line: i });
                        }
                    }
                    orden.commitLine({
                        sublistId: 'item'
                    });
                    
                  

                }
                var save = orden.save();
                log.debug('save',save);
                return {
                    codResp: '00',
                    descResp: 'Procesado correctamente'
                };
            } else {
                return {
                    codResp: '01',
                    descResp: 'Orden de servicio no registrada'
                };
            };


        } catch (error) {
           return {
              codResp: '99',
                descResp: error
            };
        }





        //log.debug('orden',orden);

    }

    const searchItemsInternalIds = (clase) => {

        let searchFilter = search.createFilter({
            name: "itemid",
            operator: search.Operator.CONTAINS,
            values: clase
        });

        let claseSearch = search.create({
            type: 'serviceitem',
            filters: [searchFilter],
            columns: ["internalid", "department", "class"]
        });

        let searchResult = claseSearch.run().getRange({ start: 0, end: 1 });

        if (searchResult.length > 0) {
            let itemid = searchResult[0].getValue({ name: "internalid" });
            let department = searchResult[0].getValue({ name: "department" });
            let classi = searchResult[0].getValue({ name: "class" });
            return {
                itemid: itemid,
                department: department,
                classi: classi
            }
        }

        return null;
    }


    return {
        get: _get,
        post: _post
    }
});
