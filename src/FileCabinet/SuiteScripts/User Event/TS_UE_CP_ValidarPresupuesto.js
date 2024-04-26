/**
* @NApiVersion 2.1
* @NScriptType UserEventScript
*
* Task          Date            Author                                         Remarks
* GAP 12        13 Jul 2023     Alexander Ruesta <aruesta@myevol.biz>          - Configuración Control Presupuestal.
*
*/

define(["N/record", "N/log", "N/runtime",'N/url','N/search','N/email', 'N/error', '../Library/TS_LIB_ControlPresupuestal.js'], (record, log, runtime, url, search, email, error, libCP) => {
    
    const beforeSubmit = (context) => {
        const FN = 'Control Presupuestal';
        try {
            let transaction = context.newRecord,
            disponible = 0,
            solicitud = [];
            //log.debug(context.type)
            log.debug('MSK', 'context.type='+context.type)
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT || context.type == context.UserEventType.COPY) {
              
                var oldRecord = context.oldRecord;
                var newRecord = context.newRecord;

                var oldCustomField = oldRecord.getValue({ fieldId: 'custbody_pe_anular_cp' });
                var newCustomField = newRecord.getValue({ fieldId: 'custbody_pe_anular_cp' });
                log.debug('MSK', 'oldCustomField='+oldCustomField)
                log.debug('MSK', 'newCustomField='+newCustomField)

                if(oldCustomField=="T" || oldCustomField==true || newCustomField=="T" || newCustomField==true){
                    log.debug('MSK', 'Se anula el Control Presupuestal')
                }else{
                    let date = transaction.getValue("trandate"), 
                        currency = transaction.getValue({fieldId: 'currency'}),
                        rate = transaction.getValue({fieldId: 'exchangerate'}),
                        subsidiary = transaction.getValue({fieldId: 'subsidiary'});
                        
                    if(date == '' || date == null){
                        let myCustomError = error.create({
                            name: 'ERROR_CONTROL_PRESUPUESTAL',
                            message: 'Debe completar el campo Fecha.',
                            notifyOff: false
                        });
                        throw myCustomError;
                    }
                    var numLines = transaction.getLineCount({ sublistId: 'item' });
                    log.debug('prueba bill',numLines )
                    for(let i = 0; i < numLines; i++){
                        let sublistName = 'item',
                            deparmentLine = parseInt(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'department', line: i })),
                            classLine = parseInt(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'class', line:i })),
                            partidaAsignada = parseInt(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'custcol_ts_budget_item', line: i })),
                            year = date.getFullYear();
                    
                        if (isNaN(deparmentLine)) {
                            let myCustomError = error.create({
                                name: 'ERROR_CONTROL_PRESUPUESTAL',
                                message: 'Debe completar el campo Departamento.',
                                notifyOff: false
                            });
                            throw myCustomError;
                        }
                        
                        if (isNaN(classLine)) {
                            let myCustomError = error.create({
                                name: 'ERROR_CONTROL_PRESUPUESTAL',
                                message: 'Debe completar el campo Clase.',
                                notifyOff: false
                            });
                            throw myCustomError;
                        }

                        log.debug('partidaAsignada',partidaAsignada)
                        log.debug('partidaAsignada',isNaN(partidaAsignada))
                        if(isNaN(partidaAsignada)){
                            let partida = libCP.getBudgetItem(deparmentLine, classLine,subsidiary, year);
                            log.debug(partida);
                            
                            if(partida == 0) {
                                let myCustomError = error.create({
                                    name: 'ERROR_CONTROL_PRESUPUESTAL',
                                    message: 'No cuenta con una Categoria de Presupuesto valida',
                                    notifyOff: false
                                });
                                throw myCustomError;
                            }
                            var budgetSearch = search.lookupFields({
                                type: 'customrecord_ts_budget_item',
                                id: partida,
                                columns: ['custrecord_ts_cp_validate']
                            });
            
                            if(budgetSearch.custrecord_ts_cp_validate){
                                if(!solicitud[partida]){
                                    solicitud[partida] = [];
                                }

                                if(transaction.type == 'journalentry'){
                                    var debit = parseFloat(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'debit', line: i }));
                                    debit = debit ? debit.toFixed(2) : 0;
                                    if(currency != '1') debit = (debit * rate).toFixed(2);
                                    var credit = 0;
                                    solicitud[partida][i] = parseFloat(debit - credit);
                                }else if(transaction.type == 'purchaserequisition'){
                                    solicitud[partida][i] = parseFloat(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'estimatedamount', line: i }));
                                }else if(transaction.type == 'expensereport'){ 
                                    currency = transaction.getValue({fieldId: 'expensereportcurrency'})
                                    rate = transaction.getValue({fieldId: 'expensereportexchangerate'})
                                    solicitud[partida][i] = parseFloat(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'amount', line: i }));
                                    if(currency != '1') solicitud[partida][i] = parseFloat((solicitud[partida][i] * rate).toFixed(2));
                                }else{
                                    solicitud[partida][i] = parseFloat(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'amount', line: i  }));
                                    if(currency != '1') solicitud[partida][i] = parseFloat((solicitud[partida][i] * rate).toFixed(2));
                                }
                                disponible = getDisponible(partida);
                                
                                log.debug('disponible: ' + disponible);
                                let total = solicitud[partida].reduce((a, b) => a + b, 0);
                                log.debug('solicitud Array: ' + solicitud[partida]);
                                log.debug('solicitud: ' + solicitud);
                                log.debug('Total', total)
                                if(disponible >= total){
                                    transaction.setSublistValue({ sublistId: sublistName, fieldId: 'custcol_ts_budget_item', value: partida, line: i });                 
                                }else{
                                    let myCustomError = error.create({
                                        name: 'ERROR_CONTROL_PRESUPUESTAL',
                                        message: 'No tiene presupuesto asignado.',
                                        notifyOff: false
                                    });
                                    throw myCustomError;
                                }
                            }else{
                                transaction.setSublistValue({ sublistId: sublistName, fieldId: 'custcol_ts_budget_item', value: partida, line: i });
                            }
                        }
                        
                    }      
                    
                    var numLines = transaction.getLineCount({ sublistId: 'expense' });

                    for(let i = 0; i < numLines; i++){
                        let sublistName = 'expense',
                            deparmentLine = parseInt(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'department', line: i })),
                            classLine = parseInt(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'class', line:i })),
                            partidaAsignada = parseInt(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'custcol_ts_budget_item', line: i })),
                            year = date.getFullYear();
                    
                        if (isNaN(deparmentLine)) {
                            let myCustomError = error.create({
                                name: 'ERROR_CONTROL_PRESUPUESTAL',
                                message: 'Debe completar el campo Departamento.',
                                notifyOff: false
                            });
                            throw myCustomError;
                        }
                        
                        if (isNaN(classLine)) {
                            let myCustomError = error.create({
                                name: 'ERROR_CONTROL_PRESUPUESTAL',
                                message: 'Debe completar el campo Clase.',
                                notifyOff: false
                            });
                            throw myCustomError;
                        }

                        if(isNaN(partidaAsignada)){
                            let partida = libCP.getBudgetItem(deparmentLine, classLine,subsidiary, year);
                            log.debug(partida);
                            
                            if(partida == 0) {
                                let myCustomError = error.create({
                                    name: 'ERROR_CONTROL_PRESUPUESTAL',
                                    message: 'No cuenta con una Categoria de Presupuesto valida',
                                    notifyOff: false
                                });
                                throw myCustomError;
                            }
                            var budgetSearch = search.lookupFields({
                                type: 'customrecord_ts_budget_item',
                                id: partida,
                                columns: ['custrecord_ts_cp_validate']
                            });
            
                            if(!budgetSearch.custrecord_ts_cp_validate){
                                if(!solicitud[partida]){
                                    solicitud[partida] = 0;
                                }
                                if(transaction.type == 'journalentry'){
                                    var debit = parseFloat(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'debit', line: i }));
                                    debit = debit ? debit.toFixed(2) : 0;
                                    if(currency != '1') debit = (debit * rate).toFixed(2);
                                    var credit = 0;
                                    solicitud[partida][i] = parseFloat(debit - credit);
                                }else if(transaction.type == 'purchaserequisition'){
                                    solicitud[partida][i] = parseFloat(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'estimatedamount', line: i }));
                                }else if(transaction.type == 'expensereport'){ 
                                    currency = transaction.getValue({fieldId: 'expensereportcurrency'})
                                    rate = transaction.getValue({fieldId: 'expensereportexchangerate'})
                                    solicitud[partida][i] = parseFloat(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'amount', line: i }));
                                    if(currency != '1') solicitud[partida][i] = parseFloat((solicitud[partida][i] * rate).toFixed(2));
                                }else{
                                    solicitud[partida][i] = parseFloat(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'amount', line: i  }));
                                    if(currency != '1') solicitud[partida][i] = parseFloat((solicitud[partida][i] * rate).toFixed(2));
                                }
                                solicitud[partida] =  solicitud[partida] + amount;  
                                disponible = getDisponible(partida);
                                
                                log.debug('disponible: ' + disponible);
                                log.debug('solicitud Array: ' + solicitud[partida]);
                                log.debug('solicitud: ' + solicitud);
                                if(disponible >= solicitud[partida]){
                                    transaction.setSublistValue({ sublistId: sublistName, fieldId: 'custcol_ts_budget_item', value: partida, line: i });                 
                                }else{
                                    let myCustomError = error.create({
                                        name: 'ERROR_CONTROL_PRESUPUESTAL',
                                        message: 'No tiene presupuesto asignado.',
                                        notifyOff: false
                                    });
                                    throw myCustomError;
                                }
                            }else{
                                transaction.setSublistValue({ sublistId: sublistName, fieldId: 'custcol_ts_budget_item', value: partida, line: i });
                            }
                        }

                        
                        
                        
                    }     
                    var numLines = transaction.getLineCount({ sublistId: 'line' });
                    log.debug('numeLines', numLines)

                    for(let i = 0; i < numLines; i++){
                        let sublistName = 'line',
                            deparmentLine = parseInt(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'department', line: i })),
                            classLine = parseInt(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'class', line:i })),
                            partidaAsignada = parseInt(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'custcol_ts_budget_item', line: i })),
                            year = date.getFullYear();
                        
                        if (isNaN(deparmentLine)) {
                            let myCustomError = error.create({
                                name: 'ERROR_CONTROL_PRESUPUESTAL',
                                message: 'Debe completar el campo Departamento.',
                                notifyOff: false
                            });
                            throw myCustomError;
                        }
                        
                        if (isNaN(classLine)) {
                            let myCustomError = error.create({
                                name: 'ERROR_CONTROL_PRESUPUESTAL',
                                message: 'Debe completar el campo Clase.',
                                notifyOff: false
                            });
                            throw myCustomError;
                        }
                    log.debug('partida UE',partidaAsignada )
                        if(isNaN(partidaAsignada)){
                            let partida = libCP.getBudgetItem(deparmentLine, classLine,subsidiary, year);
                            log.debug(partida);
                            
                            if(partida == 0) {
                                let myCustomError = error.create({
                                    name: 'ERROR_CONTROL_PRESUPUESTAL',
                                    message: 'No cuenta con una Categoria de Presupuesto valida',
                                    notifyOff: false
                                });
                                throw myCustomError;
                            }
                            var budgetSearch = search.lookupFields({
                                type: 'customrecord_ts_budget_item',
                                id: partida,
                                columns: ['custrecord_ts_cp_validate']
                            });
            
                            if(budgetSearch.custrecord_ts_cp_validate){
                                if(!solicitud[partida]){
                                    solicitud[partida] = [];
                                }
        
                                if(transaction.type == 'journalentry'){
                                    var debit = parseFloat(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'debit', line: i }));
                                    debit = debit ? debit.toFixed(2) : 0;
                                    if(currency != '1') debit = (debit * rate).toFixed(2);
                                    var credit = 0;
                                    solicitud[partida][i] = parseFloat(debit - credit);
                                }else if(transaction.type == 'purchaserequisition'){
                                    solicitud[partida][i] = parseFloat(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'estimatedamount', line: i }));
                                }else if(transaction.type == 'expensereport'){ 
                                    currency = transaction.getValue({fieldId: 'expensereportcurrency'})
                                    rate = transaction.getValue({fieldId: 'expensereportexchangerate'})
                                    solicitud[partida][i] = parseFloat(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'amount', line: i }));
                                    if(currency != '1') solicitud[partida][i] = parseFloat((solicitud[partida][i] * rate).toFixed(2));
                                }else{
                                    solicitud[partida][i] = parseFloat(transaction.getSublistValue({ sublistId: sublistName, fieldId: 'amount', line: i  }));
                                    if(currency != '1') solicitud[partida][i] = parseFloat((solicitud[partida][i] * rate).toFixed(2));
                                }
                                disponible = getDisponible(partida);
                                
                                log.debug('disponible: ' + disponible);
                                let total = solicitud[partida].reduce((a, b) => a + b, 0);
                                log.debug('solicitud Array: ' + solicitud[partida]);
                                log.debug('solicitud: ' + solicitud);
                                log.debug('Total', total)
                                if(disponible >= total){
                                    transaction.setSublistValue({ sublistId: sublistName, fieldId: 'custcol_ts_budget_item', value: partida, line: i });                 
                                }else{
                                    let myCustomError = error.create({
                                        name: 'ERROR_CONTROL_PRESUPUESTAL',
                                        message: 'No tiene presupuesto asignado.',
                                        notifyOff: false
                                    });
                                    throw myCustomError;
                                }
                            }else{
                                transaction.setSublistValue({ sublistId: sublistName, fieldId: 'custcol_ts_budget_item', value: partida, line: i });  
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

    const getDisponible = (paramPartida) => {
        let presupuestado = libCP.getPresupuestado(paramPartida);
        log.debug('presupuestado: ' + presupuestado);
        let reservado = libCP.getAmountStatus(paramPartida,'customsearch_ts_cp_control_reserved');
        log.debug('reservado: ' + reservado);
        let comprometido = libCP.getAmountStatus(paramPartida,'customsearch_ts_cp_control_committed');
        log.debug('comprometido: ' + comprometido);
        let ejecutado = libCP.getAmountStatus(paramPartida,'customsearch_ts_cp_control_executed');
        log.debug('ejecutado: ' + ejecutado);
        let disponible = parseFloat(presupuestado) - (parseFloat(reservado) + parseFloat(comprometido) + parseFloat(ejecutado));
        
        return disponible;
    }
    
    return {
        //beforeLoad:beforeLoad,
        beforeSubmit:beforeSubmit,
        //afterSubmit: afterSubmit
    };
});