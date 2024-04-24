/**
*@NApiVersion 2.1
*@NScriptType Restlet
* Task          Date            Author                                         Remarks
* INT 11        05 Ago 2023     Alexander Ruesta <aruesta@myevol.biz>          - Creación del Restlet
*
*/

define(['N/log','N/record','N/search', '../Library/TS_LIB_BT_BalaceTarifa.js'],function(log,record,search, libBT) {

 

    function _get(context) {

        return true;

    }

 

    function _post(context) {
        try{
            let idSO = '';
            let customsearch = search.create({
                type: record.Type.SALES_ORDER,
                columns: ['internalid'],
                filters: [ ["formulatext: CASE WHEN {tranid} = '"+ context.ordenServicio + "' THEN 1 ELSE 0 END","is","1"]]
            })
            log.debug(context.ordenServicio)
            let resultCount = customsearch.runPaged().count;
            log.debug('result', resultCount)
            if (resultCount != 0) {
                let result = customsearch.run().getRange({ start: 0, end: 1 });
                idSO = result[0].getValue(customsearch.columns[0]);
            }else{
                log.debug('no existe')
                return  {
                    "codResp":'01',
                    "descResp" :'Orden de servicio no registrada'
                };
            }

            let openSO = record.load({
                type: record.Type.SALES_ORDER,
                isDynamic: true,
                id: idSO
            })
            log.debug('openSO', openSO);

            let anulado = openSO.getValue({
                fieldId: 'voided'
                }),
                dateSO = openSO.getValue({
                    fieldId: 'enddate'
                })

            let dateAux = new Date();
            //dateToday.setHours(dateEnd.getHours(),dateEnd.getMinutes(),dateEnd.getSeconds());
            //dateToday.setHours(0,0,0);
            let dateToday = new Date(dateAux.getFullYear(), dateAux.getMonth(), dateAux.getDate())
            let dateEnd = new Date(dateSO.getFullYear(), dateSO.getMonth(), dateSO.getDate())
            log.debug('statusSO', anulado + ' -> ' + dateEnd + '->> ' + dateToday)

            if(anulado == 'T' || dateEnd < dateToday){
                return {
                    codResp:"02",
                    descResp:"Orden de servicio expirada o anulado"
                }  
            }
           
            let date = openSO.getValue('trandate'),
                customer = openSO.getValue('entity'),
                currency = openSO.getValue('currency'),
                formatDate = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();

            context.listaDetalle.forEach(element => {
                openSO.selectNewLine({ sublistId: 'item' });
                var itemResult = searchItemsInternalIds(element.codigoArticulo);
                log.debug('itemID',itemResult);
                openSO.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: itemResult.itemId});
                openSO.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: element.cantidad});
                
            if( itemResult.typeItem != null && itemResult.typeItem != ''){
                let tarifa = libBT.getBalanceRate(customer, currency, itemResult.itemId, formatDate, element.cantidad, itemResult.typeItem);
                if(!Object.keys(tarifa).length == 0 ){
                    if(tarifa.type == 1){
                        openSO.setCurrentSublistValue({ sublistId: 'item', fieldId: 'amount', value: tarifa.value });
                    }else if(tarifa.type == 2){
                        openSO.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: tarifa.value });
                    }else if(tarifa.type == 3){
                        openSO.setCurrentSublistValue({ sublistId: 'item', fieldId: 'amount', value: tarifa.value });
                    }else{
                        openSO.setCurrentSublistValue({ sublistId: 'item', fieldId: 'amount', value: tarifa.value });
                    }
                }
                
                openSO.commitLine({ sublistId: 'item' });
            }else{
                return  {
                    codResp:'99',
                    descResp : 'El campo ASB - TIPO DE SERVICIO del articulo no cuenta con valor.'
                };
            }
                

            })

            openSO.save({ ignoreMandatoryFields: true, enableSourcing: false });

            return  {
                codResp:'00',
                descResp :'Procesado correctamente'
            };
        }catch (e){
            log.error('e',e)
            return  {
                codResp:'99',
                descResp :e.message
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
            columns: ["internalid", "custitem_asb_tipo_servicio"]
        });

        let searchResult = claseSearch.run().getRange({ start: 0, end: 1 });

        if (searchResult.length > 0) {
            let itemid =  searchResult[0].getValue({ name: "internalid" });
            let typeItem =  searchResult[0].getValue({ name: "custitem_asb_tipo_servicio" });
            return {
                itemId: itemid,
                typeItem: typeItem
            }
        }

        return null;
    }
 

 

 

    return {
        get: _get,
        post: _post
    }

});