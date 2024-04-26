/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/log',
'N/search',
'N/record',
'N/https',
'N/url'], function(log, search, record,https,url) {

    function validateField(context) {
      
         var currentRecord = context.currentRecord;
         var fieldValue = currentRecord.getValue('custentity_pe_document_number');
    
    if (fieldValue != '') {
        var parameterValue = fieldValue; // Reemplaza con el valor que deseas enviar
        
      
        window.location.replace(window.location.href);
      
       
        return true; // Cancelar el guardado del registro
    }
    
    return true; // Permitir el guardado del registro

    }


    return {
        
        validateField: validateField
        
    }
});
