/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
 define(["N/record", "N/log"], (record, log) => {
    function beforeLoad(context) {
      const eventType = context.type;
        if (eventType === context.UserEventType.CREATE || eventType === context.UserEventType.COPY) {
            const objRecord = context.newRecord;
            try {
                let jsonLines = Array();
                if (objRecord.type == 'vendorcredit') {
                   let tipetrans = objRecord.getText({ fieldId: 'createdfrom' }).substring(0,13);
                    if(tipetrans=='Vendor Return'){
                        var vendorreturnauthorization = record.load({ type: 'vendorreturnauthorization', id: objRecord.getValue({ fieldId: 'createdfrom' }), isDynamic: true });
                        let tipetransVendor = vendorreturnauthorization.getText({ fieldId: 'createdfrom' }).substring(0,4);
                        if(tipetransVendor=='Bill'){
                            updateCampos(vendorreturnauthorization.getValue({ fieldId: 'createdfrom' }),objRecord);
                        }
                        
                       
                    }else{
                        updateCampos(objRecord.getValue({ fieldId: 'createdfrom' }),objRecord);
                    }
                }
             } catch (error) {
                log.error('Error-beforeLoad-General', eventType + '--' + error);
            }
       } 
    }

   function updateCampos(IdVendor,objRecord){
    var bill = record.load({ type: 'vendorbill', id: IdVendor, isDynamic: true });
    var trandate = bill.getValue({ fieldId: 'trandate' });
    var exchangerate = bill.getValue({ fieldId: 'exchangerate' });
    log.debug('exchangerate',exchangerate);
    var custbody_pe_document_type = bill.getValue({ fieldId: 'custbody_pe_document_type' });
    var custbody_pe_serie_cxp = bill.getValue({ fieldId: 'custbody_pe_serie_cxp' });
    var custbody_pe_number = bill.getValue({ fieldId: 'custbody_pe_number' });
    objRecord.setValue({fieldId:'custbody_pe_document_type_ref',value:custbody_pe_document_type});
    objRecord.setValue({fieldId:'custbody_pe_document_series_ref',value:custbody_pe_serie_cxp})
    objRecord.setValue({fieldId:'custbody_pe_document_number_ref',value:custbody_pe_number})
    objRecord.setValue({fieldId:'custbody_pe_document_date_ref',value:trandate})
    objRecord.setValue({fieldId:'exchangerate',value:exchangerate})
   }

    return {
        beforeLoad: beforeLoad
        
    }
});
