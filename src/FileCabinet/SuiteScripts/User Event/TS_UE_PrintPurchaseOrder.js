  /**
   * @NApiVersion 2.1
   * @NScriptType UserEventScript
   *
   * Task          Date            Author                                         Remarks
   * GAP 18        10 Jul 2023     Jeferson Mejía <jeferson.mejia@myevol.biz>     - Workflow Aprobación de Ordenes de Compra
   */
  define(['N/runtime', 'N/ui/serverWidget', 'N/search', '../Library/TS_LIB_Data.js'], function (runtime, serverWidget, search, libData) {
    const ADMINISTRADOR = 3;
    const beforeLoad = (context) => {
      const FN = 'beforeLoad';
      try {
        if (context.type === context.UserEventType.VIEW) {
          const currentRecord = context.newRecord;
          let form = context.form;
         
          form.addButton({
            id: 'custpage_ts_btn_print_pdf',
            label: "Imprimir PDF",
            functionName: 'printPurchaseOrder(' + currentRecord.id + ',"' + currentRecord.type + '")'

          });
          form.clientScriptModulePath = '../Client/TS_CS_PrintPurchaseOrder.js';
          
        }
      } catch (e) {
        log.error({
          title: `${FN} error`,
          details: { message: `${FN} - ${e.message || `Unexpected error`}` },
        });
        throw { message: `${FN} - ${e.message || `Unexpected error`}` };
      }
    }

    return {
      beforeLoad: beforeLoad,
    };
  });
