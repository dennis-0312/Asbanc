/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * Task          Date                Author                                         Remarks
 * DT-0000      01 Enero 2022       name lastname <examle@gmail.com>       
*/
 define(["N/log", "N/search", "N/runtime", "N/record"], function (log, search, runtime, record) {
    const beforeLoad = (context) => {
      const FN = 'beforeLoad';
      try {
        if (context.type === context.UserEventType.VIEW) {
          let objRecord = context.newRecord; //traer los datos de nuestro formulario
          // log.debug("objRecord", objRecord);
          let memo = objRecord.getValue("memo");
          objRecord.setValue({
            fieldId: "currency",
            value: 1,
            ignoreFieldChange: true,
          });
          log.debug("memo", memo);
          // objRecord.setValue("exchangerate", memo);
          objRecord.setValue({
            fieldId: "exchangerate",
            value: memo,
            ignoreFieldChange: true,
          });
          let exchangerate2 = objRecord.getValue("exchangerate");
          log.debug("exchangerate2", exchangerate2);
        }

      } catch (e) {
        log.error({
          title: `${FN} error`,
          details: { message: `${FN} - ${e.message || `Unexpected error`}` },
        });
        // throw { message: `${FN} - ${e.message || `Unexpected error`}` };
      }
    }

    const afterSubmit = (context) => {
      const FN = 'Control Presupuestal';
      try {
        log.error('context.newRecord',context.newRecord)
          if (context.type === 'create') {
           
            let recBill = record.load({ type: context.newRecord.type, id: context.newRecord.id, isDynamic: true }),
                campitoGiovana = recBill.getValue('memo')
                log.error('campitoGiovana',campitoGiovana)
            if(campitoGiovana != '' && campitoGiovana != null){
              recBill.setValue('exchangerate', Number(campitoGiovana))
              recBill.save({
                ignoreMandatoryFields: true,
                enableSourcing: false
              })
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
      //beforeLoad: beforeLoad,
      afterSubmit: afterSubmit
    };
  });
  
