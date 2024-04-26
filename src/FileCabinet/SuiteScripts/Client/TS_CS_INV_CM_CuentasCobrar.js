/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
define(['N/search', 'N/currentRecord', 'N/ui/message'], (search, currentRecord, message) => {
    let typeMode = '';
    const SOLES = 1;
    const DOLARES = 2;
    const CUENTAS_COBRAR = 119;
    const pageInit = (scriptContext) => {
        typeMode = scriptContext.mode; //!Importante, no borrar.
    }

    const validateField = (scriptContext) => {
        const objRecord = scriptContext.currentRecord;
        try {
            const sublistFieldName = scriptContext.fieldId;
            if (typeMode == 'create' || typeMode == 'edit' || typeMode == 'copy') {
                    if (sublistFieldName == 'currency') {
                    let entity = objRecord.getValue({ fieldId: 'entity' })
                    if (entity) {
                        var customerSearch = search.lookupFields({
                            type: 'customer', id: entity, columns: ['custentity_asb_cuenta_cobrar_dolares', 'custentity_asb_cuenta_cobrar_soles']
                        });
                        var cuenta_dolares = customerSearch.custentity_asb_cuenta_cobrar_dolares[0]?.value;
                        var cuenta_soles = customerSearch.custentity_asb_cuenta_cobrar_soles[0]?.value;

                        if (objRecord.getValue(sublistFieldName) == DOLARES) {
                            if (cuenta_dolares !== undefined) {
                                objRecord.setValue({ fieldId: 'account', value: cuenta_dolares })
                            } else {
                                objRecord.setValue({ fieldId: 'account', value: CUENTAS_COBRAR })
                            }
                        } else if (objRecord.getValue(sublistFieldName) == SOLES) {
                            if (cuenta_soles !== undefined) {
                                objRecord.setValue({ fieldId: 'account', value: cuenta_soles })
                            } else {
                                objRecord.setValue({ fieldId: 'account', value: CUENTAS_COBRAR })
                            }
                        }
                    }
                }
            }
            return true
        } catch (error) {
            console.log(error)
        }
    }

    return {
        pageInit: pageInit,
        validateField: validateField,
    }
});
