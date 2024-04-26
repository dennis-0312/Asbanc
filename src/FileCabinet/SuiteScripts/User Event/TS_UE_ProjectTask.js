/**
* @NApiVersion 2.1
* @NScriptType UserEventScript
*
* Task          Date            Author                                         Remarks
* GAP 70        26 Jun 2023     Alexander Ruesta <aruesta@myevol.biz>         - Envio de mensajes cuando el hito esta completado.
*
*/

define(["N/search", "N/log", "N/runtime", "../Library/TS_LIB_Data.js", "../Library/TS_LIB_Email.js"], (search, log, runtime, libData, libEmail) => {
    const beforeLoad = (context) => {
        const FN = 'beforeLoad';
        try {
            

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
            let transaction = context.newRecord,
                EMPLOYID = new Array(),
                project = transaction.getValue('company'),
                statusHito = transaction.getValue('status'),
                titleHito = transaction.getValue('title'),
                ismilestone = transaction.getValue('ismilestone'),
                role = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_ue_projecttask_rol' });
            
            if(statusHito == 'COMPLETE' && ismilestone){
                log.debug('PROJECT', project)
                var searchJob = search.lookupFields({
                    type: search.Type.JOB,
                    id: project,
                    columns: ['entityid', 'projectmanager', 'custentity_asb_creado_desde.entity']
                });

                let subject = 'Aviso de Hito Completado del Proyecto ' + searchJob.entityid,
                    body = 'Se informa que el Hito ' + titleHito + ' del Proyecto ' + searchJob.entityid + ' se ha marcado como Completado. Se puede proceder con la facturación en caso aplique.'
            
                EMPLOYID = libData.getUserRoles(role);
                libEmail.sendEmail('', subject, body, EMPLOYID);
                    
                if(searchJob['custentity_asb_creado_desde.entity'][0].value){
                    var searchCustomer = search.lookupFields({
                        type: search.Type.CUSTOMER,
                        id: searchJob['custentity_asb_creado_desde.entity'][0].value,
                        columns: ['salesrep']
                    });
                    log.debug('search2',searchCustomer['salesrep'][0].value)
                    
                    if(searchCustomer['salesrep'][0].value){
                        libEmail.sendEmail(searchCustomer['salesrep'][0].value, subject, body);
                    }
                }
                if(searchJob.projectmanager[0].value){
                    libEmail.sendEmail(searchJob.projectmanager[0].value, subject, body);
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
        //beforeSubmit:beforeSubmit,
        afterSubmit: afterSubmit
    };
});
