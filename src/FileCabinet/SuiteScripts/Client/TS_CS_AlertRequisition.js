/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/runtime',"N/record", "N/search", 'N/ui/dialog', 'N/record'], function (runtime, record, search, dialog, record) {
  const pageInit = (context) => {
    // Realiza las acciones que deseas en el contexto de vista
  }
  const rejectRequisition = (id, type) => {
    var currentUser = runtime.getCurrentUser();
    var currentUserId = currentUser.id;
    var fieldValue = prompt('Ingrese el valor para el campo ASB MOTIVO DE RECHAZO:');
    if (fieldValue !== null && fieldValue.trim() !== '') {
      var transactionId = id; // Reemplaza con el ID de la transacción correspondiente
      var requisitionsFields = search.lookupFields({
        type: type,
        id: id,
        columns: ['custbody_sc_asb_aprob_exp_1', 'custbody_sc_asb_aprob_exp_2', 'custbody_sc_asb_aprob_exp_3', 'custbody_sc_asb_aprob_exp_4', 'custbody_sc_asb_aprob_exp_5', 'custbody_sc_estado_1', 'custbody_sc_estado_2', 'custbody_sc_estado_3', 'custbody_sc_estado_4', 'custbody_sc_estado_5']
    });
    var aprobador_1 = requisitionsFields.custbody_sc_asb_aprob_exp_1[0]?.value;
    var aprobador_2 = requisitionsFields.custbody_sc_asb_aprob_exp_2[0]?.value;
    var aprobador_3 = requisitionsFields.custbody_sc_asb_aprob_exp_3[0]?.value;
    var aprobador_4 = requisitionsFields.custbody_sc_asb_aprob_exp_4[0]?.value;
    var aprobador_5 = requisitionsFields.custbody_sc_asb_aprob_exp_5[0]?.value;
    var estado_1 = requisitionsFields.custbody_sc_estado_1[0]?.value;
    var estado_2 = requisitionsFields.custbody_sc_estado_2[0]?.value;
    var estado_3 = requisitionsFields.custbody_sc_estado_3[0]?.value;
    var estado_4 = requisitionsFields.custbody_sc_estado_4[0]?.value;
    var estado_5 = requisitionsFields.custbody_sc_estado_5[0]?.value;
      // Actualizar el campo de la transacción
      record.submitFields({
        type: type, // Reemplaza con el tipo de transacción adecuado
        id: transactionId,
        values: {
          'custbody_oc_motivo_rechazo': fieldValue,
          'approvalstatus': 3,
          'custbody_sc_estado_1': (currentUserId == aprobador_1) ? 3 : estado_1,
          'custbody_sc_estado_2': (currentUserId == aprobador_2) ? 3 : estado_2,
          'custbody_sc_estado_3': (currentUserId == aprobador_3) ? 3 : estado_3,
          'custbody_sc_estado_4': (currentUserId == aprobador_4) ? 3 : estado_4,
          'custbody_sc_estado_5': (currentUserId == aprobador_5) ? 3 : estado_5
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
    rejectRequisition: rejectRequisition,
  };
});
