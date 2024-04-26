/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 * Task          Date            Author                                         Remarks
 * GAP 99        20 Jun 2023     Jeferson Mejía <jeferson.mejia@myevol.biz>     - Actualizar el CALENDARIO DE FACTURACIÓN
 * GAP 81        20 Jun 2023     Alexander Ruesta <aruesta@myevol.biz>          - Actualizar el campo JOBID
 * GAP 98        23 Jun 2023     Alexander Ruesta <aruesta@myevol.biz>          - Creación de botón Cronograma Creado
 *
 */

define(["N/record", "N/log", "N/runtime", "../Library/TS_LIB_Data.js", "N/search"], (record, log, runtime, libData, search) => {
    const beforeLoad = (context) => {
        const FN = 'beforeLoad';
        try {
            if (context.type === context.UserEventType.VIEW) {
                let form = context.form,
                    transaction = context.newRecord,
                    EMPLOYID = new Array(),
                    jobID = transaction.getValue('entityid'),
                    role = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_ue_project_rol' });

                EMPLOYID = libData.getUserRoles(role);

                let subject = 'Culminación del Cronograma del Proyecto ' + jobID + '.',
                    body = 'Se informa que se culminó con la creación del Cronograma de Tareas del Proyecto ' + jobID + '.';
                log.error('entro al UE')
                context.form.addButton({
                    id: 'custpage_ts_btn_cronograma',
                    label: "Cronograma Creado",
                    functionName: "sendEmail('','" + subject + "','" + body + "'," + JSON.stringify(EMPLOYID) + ")"
                });

                context.form.clientScriptModulePath = "../Library/TS_LIB_Email.js";
            }

        } catch (e) {
            log.error({
                title: `${FN} error`,
                details: { message: `${FN} - ${e.message || `Unexpected error`}` },
            });
            throw { message: `${FN} - ${e.message || `Unexpected error`}` };
        }
    };
    const holamundo = (context) => {
        log.debug('xddd')
    }
    const beforeSubmit = (context) => {
        const FN = 'beforeSubmit';
        try {

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
            //GAP 81
            if (context.type === context.UserEventType.CREATE) {
                let transaction = context.newRecord,
                    transactionID = transaction.id;
                newJobID = transaction.getValue('custentity_asb_internal_jobid');

                if (newJobID) {

                    let auxiliar = record.load({
                        type: record.Type.JOB,
                        id: transactionID,
                    })

                    record.submitFields({
                        type: record.Type.JOB,
                        id: transactionID,
                        values: {
                            'entityid': newJobID
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });

                    transaction.setValue({ fieldId: 'entityid', value: newJobID });

                }

            }

            // GAP 99
            if (context.type === context.UserEventType.EDIT) {
                var currentRecord = context.newRecord;
                var custAsbCreadoDesde = currentRecord.getValue('custentity_asb_creado_desde');
                var jobbillingtype = currentRecord.getValue('jobbillingtype');
                var billingSchedule = currentRecord.getValue('billingschedule'),
                    estadoGenerico = currentRecord.getValue('custentity_asb_estado_generico'),
                    estadoProduccion = currentRecord.getValue('custentity_asb_estado_prod'),
                    subscription = currentRecord.getValue('custentity_ts_subscription_hidden'),
                    subscriptionFinalizada = currentRecord.getValue('custentity_ts_subscription_ter_hidden');
                if (custAsbCreadoDesde && jobbillingtype == 'FBM') {
                    record.submitFields({
                        type: record.Type.SALES_ORDER,
                        id: custAsbCreadoDesde,
                        values: {
                            'job': currentRecord.id,
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });
                }

                if(estadoGenerico == 2 && !subscription){
                    let recTranferencia = record.load({ type: record.Type.SALES_ORDER, id: custAsbCreadoDesde, isDynamic: true })
                    
                    recTranferencia.setValue('custbody_estado_orden_serv', 3);
                    var numLines = recTranferencia.getLineCount({ sublistId: 'item' });

                    for(var i = numLines - 1; i >= 0 ; i--){
                        let sublistName = 'item';
                        var itemLine = parseInt(recTranferencia.getSublistValue({ sublistId: sublistName, fieldId: 'item', line: i }));
                        
                        var subscriptionplanSearch = search.create({
                            type: "subscriptionplan",
                            filters:
                            [
                            ["type","anyof","SubscriPlan"], 
                            "AND", 
                            ["memberitem.internalid","anyof",itemLine]
                            ],
                            columns:
                            [
                            search.createColumn({name: "internalid", label: "Internal ID"})
                            ]
                        });
        
                        let subscriptionplanResult = subscriptionplanSearch.run().getRange(0,1);
                        if(subscriptionplanResult.length != 0){
                            
                            var subscriptionplan = subscriptionplanResult[0].getValue(subscriptionplanSearch.columns[0]);
                            
                            recTranferencia.removeLine({
                                sublistId: 'item',
                                line: i
                            })
                        }
                    }
                    log.error('hollaaa', subscriptionplan + ' .>> ' + recTranferencia.getLineCount({ sublistId: 'item' }))
                    
                    var billingSearch = search.create({
                        type: "billingaccount",
                        filters:
                        [
                        ["customer","anyof",recTranferencia.getValue("entity")], 
                        "AND", 
                        ["currency","anyof",recTranferencia.getValue("currency")]
                        ],
                        columns:
                        [
                        search.createColumn({name: "internalid", label: "Internal ID"})
                        ]
                    });

                    let billingResult = billingSearch.run().getRange(0,1);
                    if(billingResult.length != 0){
                        var billing = billingResult[0].getValue(billingSearch.columns[0]);
                    }

                    var obj = record.create({ type: record.Type.SUBSCRIPTION, isDynamic: true});
                    obj.setValue('customer', recTranferencia.getValue("entity"));
                    obj.setValue('billingaccount', billing);
                    obj.setValue('subscriptionplan', subscriptionplan);
                    obj.setValue('initialterm', recTranferencia.getValue("custbody_asb_initial_terms"));

                    let subscriptionID = obj.save();
                    log.error('Suscripción creada',subscriptionID);
                    
                    var itemLine = recTranferencia.selectNewLine({ sublistId: 'item' });
                    itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'subscription', value: subscriptionID, ignoreFieldChange: false });
                    recTranferencia.commitLine({ sublistId: 'item' });
                    recTranferencia.save({ ignoreMandatoryFields: true, enableSourcing: false });

                    // Activar Suscripción

                    var customSuscription = record.load({ type: 'subscription', id: subscriptionID, isDynamic: false }) ;
                
                    var numLines = customSuscription.getLineCount({ sublistId: 'subscriptionline' })
                    log.debug('numLines', numLines)
                    for(var i = 0; i < numLines ; i++){
                        customSuscription.setSublistValue({sublistId: 'subscriptionline', fieldId: 'status', value: 'PENDING_ACTIVATION', line: i})
                    }
                    customSuscription.save();

                    var  changeOrder = record.create({
                        type: record.Type.SUBSCRIPTION_CHANGE_ORDER,
                        defaultValues: {
                            action: "ACTIVATE",
                            subscription: subscriptionID
                        }
        
                    });
                    var numLines = changeOrder.getLineCount({ sublistId: 'subline' });
                    for(var i = 0; i < numLines ; i++){
                        changeOrder.setSublistValue({sublistId: 'subline', fieldId: 'apply', value: true, line: i})
                    }
                    var auxiliar_1 = changeOrder.save();
                        
                    log.debug('Change Order', auxiliar_1)
                    var transactionPj = record.load({
                        type: 'job',
                        id:  context.newRecord.id
                    });

                    transactionPj.setValue({ fieldId: 'custentity_ts_subscription_hidden', value: subscriptionID });

                    transactionPj.save();

                }

                log.debug('mirame', estadoProduccion)
                log.debug('mirame 1', subscription)
                log.debug('mirame 2', subscriptionFinalizada)
                if(estadoProduccion == 2 && subscription && !subscriptionFinalizada){
                    subscription = Number(subscription);
                    var  changeOrder = record.create({
                        type: record.Type.SUBSCRIPTION_CHANGE_ORDER,
                        defaultValues: {
                            action: "TERMINATE",
                            subscription: subscription
                        }
                       
                    });
                    var numLines = changeOrder.getLineCount({ sublistId: 'subline' });
                    for(var i = 0; i < numLines ; i++){
                        changeOrder.setSublistValue({sublistId: 'subline', fieldId: 'apply', value: true, line: i})
                    }
                  
                    var auxiliar_2 = changeOrder.save();
                    log.debug('Change Order Terminada', auxiliar_2)

                    var transactionPj = record.load({
                        type: 'job',
                        id:  context.newRecord.id
                    });

                    transactionPj.setValue({ fieldId: 'custentity_ts_subscription_ter_hidden', value: true });

                    transactionPj.save();
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
        beforeLoad: beforeLoad,
        //beforeSubmit:beforeSubmit,
        afterSubmit: afterSubmit
    };
});