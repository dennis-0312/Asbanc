/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 * Task          Date            Author                                         Remarks
 * GAP 81        16 Jun 2023     Alexander Ruesta <aruesta@myevol.biz>          - Creación del botón GENERAR PROYECTO
 * GAP 56        20 Jun 2023     Jeferson Mejía <jeferson.mejia@myevol.biz>     - Cerrar la SALES ORDER
 * GAP 84        20 Jun 2023     Alexander Ruesta <aruesta@myevol.biz>          - Bloqueo del boton GENERAR PROYECTO
 */

define(["N/search"], (search) => {
    const STAND_BY = 2;

    const beforeLoad = (context) => {
        const FN = 'beforeLoad';
        try {
            if (context.type === context.UserEventType.VIEW) {
                let form = context.form,
                    transaction = context.newRecord,
                    flag = false;
                // GAP 81
                let jobSearch = search.create({
                    type: 'job',
                    columns: ['internalid', 'custentity_asb_estado_generico', 'custentity_asb_estado_det_n1'],
                    filters: ['custentity_asb_creado_desde', 'anyof', transaction.id]
                });
        
                let resultJob = jobSearch.run().getRange(0, 1000);
                log.debug('Result', resultJob)
                log.debug('ResultLenght', resultJob.length)
                if (resultJob.length == 0) {
                    let btnAprobar = form.addButton({
                        id: 'custpage_ts_btn_aprobar',
                        label: "Generar Proyecto",
                        functionName: "generateTransaction(" + transaction.id + ",'" + transaction.type + "','job')"          
                    });
                }else{
                    // GAP 84
                    for (var i = 0; i < resultJob.length; i++) {
                        columns = resultJob[i].columns;
                        
                        log.debug('Resultados', resultJob[i].getValue(columns[1]) + '.>' + resultJob[i].getValue(columns[2]))
                        if(resultJob[i].getValue(columns[1]) == 3 && resultJob[i].getValue(columns[2]) == 5){
                            flag = true
                        }else{
                            return true;
                        }
                    }
                    if(flag){
                        let btnAprobar = form.addButton({
                            id: 'custpage_ts_btn_aprobar',
                            label: "Generar Proyecto",
                            functionName: "generateTransaction(" + transaction.id + ",'" + transaction.type + "','job')"    
                                
                        });
                    }   
                }

                context.form.clientScriptModulePath = "../Library/TS_LIB_Data.js";

            }
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
            var currentRecord = context.newRecord;
            var estadoOrdenServicio = currentRecord.getValue('custbody_estado_orden_serv');
            //GAP 56 
            if(estadoOrdenServicio == STAND_BY){
                const lineItemCount = currentRecord.getLineCount({ sublistId: 'item' });

                for (let i = 0; i < lineItemCount; i++) {
                    currentRecord.setSublistValue({sublistId: 'item', fieldId: 'isclosed', line: i, value: true});
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

    const afterSubmit = (context) => {
        const FN = 'afterSubmit';
        try {

        } catch (e) {
            log.error({
                title: `${FN} error`,
                details: { message: `${FN} - ${e.message || `Unexpected error`}` },
            });
            throw { message: `${FN} - ${e.message || `Unexpected error`}` };
        }
    };

    return {
        beforeLoad,
        beforeSubmit,
        //afterSubmit,
    };
});