/**
* @NApiVersion 2.1
* @NModuleScope Public
* 
* Task          Date            Author                                         Remarks
* GAP 52        28 Ago 2023     Alexander Ruesta <aruesta@myevol.biz>          - Creación de la libreria
*
*/

define(['N/search', 'N/record'], (search, record) => {
   
    const getBalanceRate =  (paramCustomer, paramCurrency, paramItem, paramDate, paramQuantity, paramType) => {
        try {
            let jsonResult = [],
                result = 0,
                type = '';
            log.debug('entro', paramDate)
            let customSearch = search.create({
                type: "customrecord_asb_rate_detail",
                filters:
                [
                   ["custrecord_asb_rate_detail_related.custrecord_asb_rate_client","anyof", paramCustomer], 
                   "AND", 
                   ["custrecord_asb_rate_detail_related.custrecord_asb_rate_item","anyof", paramItem], 
                   "AND", 
                   ["custrecord_asb_rate_detail_related.custrecord_asb_rate_currency","anyof", paramCurrency], 
                   "AND", 
                   ["custrecord_asb_rate_detail_related.custrecord_asb_rate_date_from","onorbefore", paramDate], 
                   "AND", 
                   ["custrecord_asb_rate_detail_related.custrecord_asb_rate_date_to","onorafter", paramDate]
                ],
                columns:
                [
                   search.createColumn({
                      name: "custrecord_asb_rate_detail_min",
                      sort: search.Sort.ASC,
                      label: "Minimo"
                   }),
                   search.createColumn({name: "custrecord_asb_rate_detail_max", label: "Maximo"}),
                   search.createColumn({name: "custrecord_asb_rate_detail_quantity", label: "Cantidad"}),
                   search.createColumn({name: "custrecord_asb_rate_detail_amount", label: "Importe Total"}),
                   search.createColumn({name: "custrecord_asb_rate_detail_price", label: "Precio Unitario"})
                ]
             });
            
             let lengt = customSearch.runPaged().count;
            
            if(lengt == 0){ return {} }         
            
            var resultSearch = customSearch.run().getRange({ start: 0, end: 1000 });
            
            
            for (var a = 0; resultSearch && a < resultSearch.length; a++) {
                var searchResult = resultSearch[a];
                var columns = searchResult.columns;
                jsonResult.push({
                    min     : searchResult.getValue(columns[0]),
                    max     : searchResult.getValue(columns[1]),
                    quantoty: searchResult.getValue(columns[2]),
                    amount  : searchResult.getValue(columns[3]),
                    price   : searchResult.getValue(columns[4]),
                })
            }
           
            if(paramType == 1 || paramType == 2){ // FTR y Monitoreo de alarmas
                type = 1;
                jsonResult.forEach(line =>{
                    if(line.min <= paramQuantity && line.max >= paramQuantity){
                        result = line.amount
                    }
                })
            }else if(paramType == 3){ // Convenio
                type = 2;
                jsonResult.forEach(line =>{
                    result = line.price
                })
            }else if(paramType == 11 || paramType == 12){ // SERVERFACT y Control Tecnico
                let unitPrice = 0,
                    rest = 0;
                    type = 3;
                    for (let id = 0; id < jsonResult.length; id++) {
                        let line = jsonResult[id];
                        if(line.max <= paramQuantity){
                            result = Number(result) + Number(line.amount);
                            unitPrice = line.price;
                            rest = paramQuantity - line.max;
                        }else{
                            result = Number(result) + Number(rest* unitPrice);
                            if(result == 0){
                                result = Number(result) + Number(line.amount);
                            }
                            break;
                        }
                        
                        
                    }
            }else{
                type = 4;
                jsonResult.forEach(line =>{
                    result = line.amount
                })
            }

            return {
                type: type,
                value : result
            }
            
        } catch (e) {
            log.error('getBalanceRate', e);
        }
    }

  
    return ({ 
        getBalanceRate : getBalanceRate
    })

})