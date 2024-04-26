/**
*@NApiVersion 2.1
*@NScriptType ClientScript
* Task          Date            Author                                         Remarks
* GAP 12        13 Jun 2023     Alexander Ruesta           - Configuración de Control Presupuestal
*
*/

define(['N/currentRecord', 'N/search', 'N/ui/dialog', 'N/runtime', '../Library/TS_LIB_ControlPresupuestal.js'], (currentRecord, search, dialog, runtime, libCP) => {

    let typeMode = '',
        solicitud = [];
    // DEBE FUNCIONAR PARA CARGA MASIVA?
    const pageInit = (context) => {
        typeMode = context.mode;
        //date = context.currentRecord.getValue("trandate");
    }

    const validateLine = (context) => {
        let transaction = context.currentRecord,
            sublistName = context.sublistId,
            disponible = 0;
        console.info('Type Mode => ' + typeMode);
        if (typeMode == 'create' || typeMode == 'copy' || typeMode == 'edit') {
            let date = transaction.getValue("trandate");

            if (date == '' || date == null) {
                alert('Se debe llenar el campo Fecha');
                return false;
            }

            let deparmentLine = parseInt(transaction.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'department' })),
                classLine = parseInt(transaction.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'class' })),
                currency = transaction.getValue({ fieldId: 'currency' }),
                rate = transaction.getValue({ fieldId: 'exchangerate' }),
                subsidiary = transaction.getValue({ fieldId: 'subsidiary' }),
                year = date.getFullYear();

            log.error('subsidiary', subsidiary)
            log.error('sublistName', sublistName)

            if (sublistName == 'line' || sublistName == 'expense' || sublistName == 'item') {
                if (isNaN(deparmentLine)) {
                    alert('No tiene Departamento');
                    return false;
                }

                if (isNaN(classLine)) {
                    alert('No tiene Clase.');
                    return false;
                }

                log.error('subsidiary1', subsidiary)
                log.error('subsidiary2', subsidiary)
                log.error('MSK traza', 'Inicio')

                let partida = getBudgetItem(deparmentLine, classLine, subsidiary, year); //libCP.
                let param = {
                    deparmentLine: deparmentLine,
                    classLine: classLine,
                    subsidiary: subsidiary,
                    year: year,
                    partida: partida
                };
                console.log(JSON.stringify(param));

                if (partida == 0) {
                    alert("No cuenta con una Categoria de Presupuesto valida.");
                    return false;
                }
                log.error('MSK traza-partida2', partida)

                var budgetSearch = search.lookupFields({
                    type: 'customrecord_ts_budget_item',
                    id: partida,
                    columns: ['custrecord_ts_cp_validate']
                });
                log.error('MSK traza-budgetSearch', budgetSearch)
                log.error('MSK traza-budgetSearch.custrecord_ts_cp_validate', budgetSearch.custrecord_ts_cp_validate)

                if (budgetSearch.custrecord_ts_cp_validate) {
                    if (!solicitud[partida]) {
                        solicitud[partida] = [];
                    }
                    
                    let line = transaction.getCurrentSublistIndex({ sublistId: sublistName });
                    console.log('Inicio tipo de entidad : ' + context.currentRecord.type);
                    if (context.currentRecord.type == 'journalentry') {
                        var debit = parseFloat(transaction.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'debit' }));
                        debit = debit ? debit.toFixed(2) : 0;
                        if (currency != '1') debit = (debit * rate).toFixed(2);
                        var credit = parseFloat(transaction.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'credit' }));
                        credit = credit ? credit.toFixed(2) : 0;
                        if (debit > 0) solicitud[partida][line] = debit - credit;
                    } else if (context.currentRecord.type == 'purchaserequisition') {
                        solicitud[partida][line] = parseFloat(transaction.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'estimatedamount' }));
                    } else if (context.currentRecord.type == 'expensereport') {
                        currency = transaction.getValue({ fieldId: 'expensereportcurrency' })
                        rate = transaction.getValue({ fieldId: 'expensereportexchangerate' })
                        solicitud[partida][line] = parseFloat(transaction.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'amount' }));
                        if (currency != '1') solicitud[partida][line] = parseFloat((solicitud[partida][line] * rate).toFixed(2));
                    } else {
                        solicitud[partida][line] = parseFloat(transaction.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'amount' }));
                        console.log('Valor previo : ' + solicitud[partida][line]);
                        if (currency != '1') solicitud[partida][line] = parseFloat((solicitud[partida][line] * rate).toFixed(2));
                        console.log('Moneda : ' + transaction.getText({ fieldId: 'currency' }),);
                        console.log('Cambio de valor : ' + solicitud[partida][line]);
                    }
                    log.error('Trace partida value : ', partida);
                    disponible = getDisponible(partida);

                    console.log('Disponible: ' + disponible);

                    let total = solicitud[partida].reduce((a, b) => a + b, 0);
                    /*console.log('TIFFANI solicitud Array1: ' + solicitud);
                    console.log('Fue bonito solicitud Array solicitud[partida] : ' + solicitud[partida]);
                    console.log('solicitud: ' + total);*/

                    console.log("Monto Total : " + total);

                    if (disponible >= total) {
                        console.log('Tiene presupuesto');
                    } else {
                      
                        if (typeMode == 'edit') {
                            console.log('Modo de edición');
                            let moneda = transaction.getText({ fieldId: 'currency' });
                            let countLine = transaction.getLineCount({
                                sublistId: sublistName
                            });
                            let totalAmount = 0;
                            
                            for (let i = 0; i < countLine; i++) {
                                let amount = parseFloat(transaction.getCurrentSublistValue({ sublistId: sublistName, fieldId: 'amount', line: i }));

                                if (!isNaN(amount)) {
                                    if (moneda == 'USD') {
                                        totalAmount += (parseFloat(amount) * rate).toFixed(2);
                                    } else {
                                        totalAmount += parseFloat(amount);
                                    }
                                }
                            }
                            let ejecutado = libCP.getAmountStatus(partida, 'customsearch_ts_cp_control_executed');

                            console.log('totalAmount : ' + totalAmount);

                            if (totalAmount === total) {
                                console.log('OK 136');
                            } else {
                                console.log('Else 139');
                                if (Math.abs(disponible) >= totalAmount) {
                                    console.log('Tiene Presupuesto - OK');
                                } else {
                                    let totalAmount = Number(total);
                                    let calAmount = Number(ejecutado) + Number(disponible);
                                    console.log('ED : ' + calAmount);
                                    if(totalAmount === Number(ejecutado) || totalAmount <= Number(ejecutado) || totalAmount <= Number(calAmount)) {
                                        console.log('Existe Presupuesto - OK');
                                    } else {
                                        alert('No tiene Presupuesto Asignado.');
                                        return false;
                                    }
                                }
                            }

                        } else {
                            alert('No tiene Presupuesto Asignado.');
                            return false;
                        }
                        /*alert('No tiene Presupuesto Asignado.');
                        return false;*/
                    }
                }
                log.error('MSK traza-partida3', partida)
                transaction.setCurrentSublistValue({ sublistId: sublistName, fieldId: 'custcol_ts_budget_item', value: partida });
                log.error('MSK traza', 'Fin')

            }
            return true;
        }
        return true;
    }

    const getDisponible = (paramPartida) => {
        let presupuestado = libCP.getPresupuestado(paramPartida);
        console.log('presupuestado: ' + presupuestado);
        let reservado = libCP.getAmountStatus(paramPartida, 'customsearch_ts_cp_control_reserved');
        console.log('reservado: ' + reservado);
        let comprometido = libCP.getAmountStatus(paramPartida, 'customsearch_ts_cp_control_committed');
        console.log('comprometido: ' + comprometido);
        let ejecutado = libCP.getAmountStatus(paramPartida, 'customsearch_ts_cp_control_executed');
        console.log('ejecutado: ' + ejecutado);
        let disponible = parseFloat(presupuestado) - (parseFloat(reservado) + parseFloat(comprometido) + parseFloat(ejecutado));

        return disponible;
    }

    const getBudgetItem =  (paramDepartment, paramClass, paramSub, paramAnio) => {
        try {
            log.error("LIBRERIA budget", paramDepartment + ' -> ' + paramClass + '-> ' + paramSub + '-> ' + paramAnio)
            let searchPartida = search.create({
                type: "customrecord_ts_budget_item",
                filters:
                    [
                        ["custrecord_ts_cp_department", "anyof", paramDepartment],
                        "AND",
                        ["custrecord_ts_cp_class", "anyof", paramClass],
                        "AND", 
                        ["custrecord_ts_cp_subsidiary", "anyof", paramSub],
                        "AND",
                        ["custrecord_ts_cp_detail_category.custrecord_ts_cp_detail_version","anyof","4"]
                    ],
                columns:
                    [
                        search.createColumn({name: "internalid"}),
                        search.createColumn({
                            name: "custrecord_ts_cp_detail_anio",
                            join: "CUSTRECORD_TS_CP_DETAIL_CATEGORY"
                         })
                    ]
            });
            
            let resultCount = searchPartida.runPaged().count;
            log.error('resultCount', resultCount);
            console.log('resultCount : ' + resultCount);
            if (resultCount != 0) {
                var resultSearch = searchPartida.run().getRange({ start: 0, end: 1000 });
                console.log('Resultado : '+ resultSearch);
                for (var a = 0; resultSearch && a < resultSearch.length; a++) {
                    var searchResult = resultSearch[a];
                    var columns = searchResult.columns;
                    let year = searchResult.getText(columns[1]);
                  console.log('Anio : ' +  year);
                    // log.debug('mirame', year)
                    if(year == paramAnio){
                        log.debug('entro')
                        return searchResult.getValue(columns[0]);
                    }
                }
            } else {
                return 0;
            }

            return 0;
        } catch (e) {
            log.error('getBudgetItem', e);
        }
    }
  
    return {
        pageInit: pageInit,
        // saveRecord: saveRecord,
        //fieldChanged: fieldChanged,
        //postSourcing: postSourcing,
        validateLine: validateLine,
        //sublistChanged: sublistChanged
    }
});
