/**
* @NApiVersion 2.1
* @NScriptType UserEventScript
*
* Task          Date            Author                                         Remarks
* GAP 51        24 Jul 2023     Jeferson Mejia <jeferson.mejia@myevol.biz>    - Cuentas a Cobrar Clientes
*
*/

define(["N/search", "N/log"], (search, log) => {
    const CUENTAS_COBRAR = 119;
    const SOLES = 1;
    const DOLARES = 2;


    const beforeLoad = (context) => {
        const FN = 'beforeSubmit';
        try {
            log.debug('context.type',context.type);
            if(context.type === context.UserEventType.CREATE){ // GAP 51
                let objRecord = context.newRecord;
                let entity = objRecord.getValue({ fieldId: 'entity' })
                let createdfrom = objRecord.getValue({ fieldId: 'createdfrom' })
                //if (!createdfrom){
                    if (entity) {
                        var customerSearch = search.lookupFields({
                            type: 'customer', id: entity, columns: ['custentity_asb_cuenta_cobrar_dolares','custentity_asb_cuenta_cobrar_soles']
                        });
                        var cuenta_dolares = customerSearch.custentity_asb_cuenta_cobrar_dolares[0]?.value;
                        var cuenta_soles = customerSearch.custentity_asb_cuenta_cobrar_soles[0]?.value;
                        if (objRecord.getValue('currency') == DOLARES) {
                            if(cuenta_dolares !== undefined){
                                objRecord.setValue({ fieldId: 'account' , value: cuenta_dolares})
                            }else{
                                objRecord.setValue({ fieldId: 'account' , value: CUENTAS_COBRAR})
                            }
                        }else if(objRecord.getValue('currency') == SOLES){
                            if(cuenta_soles !== undefined){
                                objRecord.setValue({ fieldId: 'account' , value: cuenta_soles})
                            }else{
                                objRecord.setValue({ fieldId: 'account' , value: CUENTAS_COBRAR})
                            }
                        }
                    }
                //}
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
        beforeLoad:beforeLoad,
        //beforeSubmit:beforeSubmit,
        //afterSubmit: afterSubmit
    };
});
