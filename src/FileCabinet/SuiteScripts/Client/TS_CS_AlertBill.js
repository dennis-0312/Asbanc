/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(["N/record", "N/search", 'N/ui/dialog', 'N/record'], function (record, search, dialog, record) {
  const pageInit = (context) => {
    // Realiza las acciones que deseas en el contexto de vista
  }
  const rejectBill = (id, type) => {

    var fieldValue = prompt('Ingrese el valor para el campo ASB MOTIVO DE RECHAZO:');
    if (fieldValue !== null && fieldValue.trim() !== '') {
      var transactionId = id; // Reemplaza con el ID de la transacción correspondiente

      // Actualizar el campo de la transacción
      record.submitFields({
        type: type, // Reemplaza con el tipo de transacción adecuado
        id: transactionId,
        values: {
          'custbody_oc_motivo_rechazo': fieldValue,
          'approvalstatus': 3,
          'custbody_asb_estado_aprobacion': 3,
          //'custbody_asb_estado_rechazado': false
        },
        options: {
          enableSourcing: false,
          ignoreMandatoryFields: true
        }
      });

      // Refrescar la transacción
      location.reload();
    }

  }

  return {
    pageInit: pageInit,
    rejectBill: rejectBill,
  };
});
