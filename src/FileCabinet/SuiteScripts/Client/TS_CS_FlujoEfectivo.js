/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
/**
*
* Task          Date            Author                                         Remarks
* GAP 27        28 Jun 2023     Alexander Ruesta <aruesta@myevol.biz>          - Crear vista del reporte de Flujo de Efectivo.
*
*/

define(['N/currentRecord', 'N/record', 'N/search', 'N/ui/dialog', 'N/runtime','N/format', '../Library/TS_LIB_ControlPresupuestal.js'], (currentRecord, record, search, dialog, runtime, format, libCP) => {
   
    const pageInit = (context) => {
        context.currentRecord.getField({
            fieldId: 'custpage_anio'
        }).isDisplay = false;
    }

    const  validateField = (context) => {
        let currentRecord = context.currentRecord,
            fieldId = context.fieldId;
        if(fieldId=="custpage_period_type"){
            let typePeriod = currentRecord.getValue('custpage_period_type');
            
            if(typePeriod == 2){
                context.currentRecord.getField({
                    fieldId: 'custpage_from'
                }).isDisplay = false;
                context.currentRecord.getField({
                    fieldId: 'custpage_anio'
                }).isDisplay = true;
            }else if(typePeriod == 2){
                context.currentRecord.getField({
                    fieldId: 'custpage_from'
                }).isDisplay = true;
                context.currentRecord.getField({
                    fieldId: 'custpage_anio'
                }).isDisplay = false;
            }
            return true;
        }
        return true;
    }
    
    return {
        pageInit: pageInit,
        validateField : validateField
    }
})