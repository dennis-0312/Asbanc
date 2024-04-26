/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 * Task          Date            Author                                         Remarks
 * GAP 18        03 Jul 2023     Jeferson Mejía <jeferson.mejia@myevol.biz>     - Workflow Aprobación de Factura
 */
define(["N/runtime", "N/ui/serverWidget", "N/record"], function (runtime, serverWidget, record) {
  const beforeLoad = (context) => {
    const FN = "beforeLoad";
    try {
      if (context.type === context.UserEventType.VIEW) {
        var currentRecord = context.newRecord;
        let form = context.form;
        var estado_aprobacion = currentRecord.getValue("custbody_asb_estado_aprobacion");
        var approvalstatus = currentRecord.getValue("approvalstatus");
        var currentUser = runtime.getCurrentUser();
        var currentUserId = currentUser.id;
        var nextapprover = currentRecord.getValue("nextapprover");

        if (approvalstatus == 1 && estado_aprobacion == 1 && currentUserId == nextapprover) {
          let btnAprobar = form.addButton({
            id: "custpage_ts_btn_rechazar",
            label: "Rechazar",
            functionName: "rejectBill(" + currentRecord.id + ',"' + currentRecord.type + '")',
          });
          form.clientScriptModulePath = "../Client/TS_CS_AlertBill.js";
        }
        if (approvalstatus == 3) {
          var campoOculto = form.getField({
            id: "custbody_oc_motivo_rechazo",
          });
          // Mostrar el campo en la vista
          campoOculto.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.NORMAL,
          });
        }
      } else if (context.type === context.UserEventType.CREATE) {
        var currentRecord = context.newRecord;
        if (context.request != null) {
          var parametros = context.request.parameters;
          if (parametros.transform) {
            currentRecord.setValue("custbody_asb_creado_desde_texto", parametros.transform);
          }
        }

        var userObject = runtime.getCurrentUser();
        if (userObject.id != null) currentRecord.setValue("custbody_ts_integracion", userObject.id);
        else currentRecord.setValue("custbody_ts_integracion", 20);
      }

      log.debug("user", userObject);
    } catch (e) {
      log.error({
        title: `${FN} error`,
        details: { message: `${FN} - ${e.message || `Unexpected error`}` },
      });
      throw { message: `${FN} - ${e.message || `Unexpected error`}` };
    }
  };

  const afterSubmit = (context) => {
    const FN = "UPDATE EXCHANGE RATE";
    try {
      log.error("context.newRecord", context.newRecord);
      if (context.type === "create") {
        let recBill = record.load({ type: context.newRecord.type, id: context.newRecord.id, isDynamic: true })

      //Antes del Cambio - Inicio
      log.error("MSK", 'Antes del cambio - Inicio');
      var itemCount = recBill.getLineCount({ sublistId: 'item' });
      log.error("MSK", 'itemCount='+itemCount);
      let lstItems = []
      log.error("MSK", 'traza 1');
      for (var i = 0; i < itemCount; i++) {
        let miItem = {}
        miItem.id=i;
        miItem.rate = recBill.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i });
        lstItems.push(miItem)
      }
      log.error("MSK", lstItems);
      log.error("MSK", 'Antes del cambio - Fin');
      //Antes del Cambio - Fin

        storedExchangerate = recBill.getValue("custbody_exchange_hidden");
        log.debug("storedExchangerate", storedExchangerate);
        
        storedExchangerate1 = recBill.getValue("storedExchangerate");
        log.debug("storedExchangerate1", storedExchangerate1);

        if (storedExchangerate != "" && storedExchangerate != null) {
          recBill.setValue("exchangerate", Number(storedExchangerate));
          recBill.save({
            ignoreMandatoryFields: true,
            enableSourcing: false,
          });
        }

        //Despues del cambio - Inicio
        let recBill2 = record.load({ type: context.newRecord.type, id: context.newRecord.id, isDynamic: true })
        log.error("MSK", 'Despues del cambio - Inicio');
        log.error("MSK", 'context.newRecord.type='+context.newRecord.type);
        log.error("MSK", 'context.newRecord.id='+context.newRecord.id);
        if(lstItems.length>0){
          log.error("MSK", 'lstItems.length='+lstItems.length);
          for (var i = 0; i < itemCount; i++) {
            log.error("MSK", 'i='+i);
            recBill2.selectLine({ sublistId: 'item', line: i });
            log.error("MSK", 'traza ('+i+') 1 --> '+lstItems[i].rate);
            recBill2.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: lstItems[i].rate  });
            log.error("MSK", 'traza ('+i+') 2');
            recBill2.commitLine({ sublistId: 'item' });
            log.error("MSK", 'traza ('+i+') 3');
          }
        }
        recBill2.save({
          ignoreMandatoryFields: true,
          enableSourcing: false,
        });
        log.error("MSK", 'Despues del cambio - Fin');
        //Despues del cambio - Fin

        recBill.save({
          ignoreMandatoryFields: true,
          enableSourcing: false,
        });
        log.error("MSK", 'Fin fin fin');

      }
    } catch (e) {
      log.error({
        title: `${FN} error`,
        details: { message: `${FN} - ${e.message || `Unexpected error`}` },
      });
    }
  };

  return {
    beforeLoad: beforeLoad,
    afterSubmit: afterSubmit,
  };
});
