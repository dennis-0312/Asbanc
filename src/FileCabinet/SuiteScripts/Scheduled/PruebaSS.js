/**
*@NApiVersion 2.1
*@NScriptType ScheduledScript
*
* Task          Date            Author                                         Remarks
* GAP 94        22 Jun 2023     Alexander Ruesta <aruesta@myevol.biz>          - Envia correos 1, 2 y 3 meses antes del End Date en las SO.
*
*/


 define(['N/search','N/record'], (search, record) => {
    const execute = (context) => {
        const FN = 'execute';
        try {
            /** 1. Paso 
            var aux = record.load({ type: 'subscription', id: 14, isDynamic: false }) ;
            
            var numLines = aux.getLineCount({ sublistId: 'subscriptionline' })
            log.debug('numLines', numLines)
            for(var i = 0; i < numLines ; i++){
                let sublistName = 'item';
                var itemLine = aux.getSublistValue({ sublistId: 'subscriptionline', fieldId: 'status', line: i });
                log.error('xdd ' + itemLine)

                aux.setSublistValue({sublistId: 'subscriptionline', fieldId: 'status', value: 'PENDING_ACTIVATION', line: i})
                
            }
            aux.save();
            
            // 2. Paso 
            var  changeOrder = record.create({
              type: record.Type.SUBSCRIPTION_CHANGE_ORDER,
              defaultValues: {
                  action: "ACTIVATE",
                  subscription: 14
              }

             
          });
          var numLines = changeOrder.getLineCount({ sublistId: 'subline' });
          for(var i = 0; i < numLines ; i++){
            let sublistName = 'item';
            var itemLine = changeOrder.getSublistValue({ sublistId: 'subline', fieldId: 'apply', line: i });
            log.error('xdd ' + itemLine)

            changeOrder.setSublistValue({sublistId: 'subline', fieldId: 'apply', value: true, line: i})
            
        }
        
          var auxi2 = changeOrder.save();
                
          log.debug('auxi2', auxi2)
            
            */
             
          var  changeOrder = record.create({
            type: record.Type.SUBSCRIPTION_CHANGE_ORDER,
            defaultValues: {
                action: "TERMINATE",
                subscription: 13
            }

           
        });
        var numLines = changeOrder.getLineCount({ sublistId: 'subline' });
        for(var i = 0; i < numLines ; i++){
          let sublistName = 'item';
          var itemLine = changeOrder.getSublistValue({ sublistId: 'subline', fieldId: 'apply', line: i });
          log.error('xdd ' + itemLine)

          changeOrder.setSublistValue({sublistId: 'subline', fieldId: 'apply', value: true, line: i})
          
      }
      
        var auxi2 = changeOrder.save();
              
        log.debug('auxi2', auxi2)
          
            
        } catch (e) {
            log.error({
                title: `${FN} error`,
                details: { message: `${FN} - ${e.message || `Unexpected error`}` },
            });
            throw { message: `${FN} - ${e.message || `Unexpected error`}` };
        }
    };


    return {
        execute: execute,
    }
});