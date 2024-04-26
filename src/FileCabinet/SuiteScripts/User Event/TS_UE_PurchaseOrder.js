/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 * Task          Date            Author                                         Remarks
 * GAP 18        10 Jul 2023     Jeferson Mejía <jeferson.mejia@myevol.biz>     - Workflow Aprobación de Ordenes de Compra
 */
define(['N/runtime', 'N/ui/serverWidget', 'N/search', '../Library/TS_LIB_Data.js'], function (runtime, serverWidget, search, libData) {
  const ANALISTA_LOGISTICA_COMPRAS = 1023;
  const ASISTENTE_LOGISTICA = 1019;
  const GERENTE_ADMINISTRACION_FINANZAS = 1025;
  const GERENTE_GENERAL = 1026;
  const administrador = 3;
  const GESTOR_LOGISTICA = 1023;
  const JEFE_LOGISTICA = 1017;
  const DIRECTOR_REDES = 1021;
  const REDES = 4;
  const beforeLoad = (context) => {
    const FN = 'beforeLoad';
    try {
      if (context.type === context.UserEventType.VIEW) {
        const currentRecord = context.newRecord;
        let form = context.form;

        let approvalstatus = currentRecord.getValue('approvalstatus');
         log.debug('approvalstatus',approvalstatus);
        let nivel_1 = currentRecord.getValue('custbody_asb_aprobacion_nivel_1');
        let nivel_2 = currentRecord.getValue('custbody_asb_aprobacion_nivel_2');
        let nivel_3 = currentRecord.getValue('custbody_asb_aprobacion_nivel_3');
        let aprobador_oc_rol = currentRecord.getValue('custbody_asb_aprobador_oc_rol');
        let empleado_solicitud = currentRecord.getValue('custbody_asb_usuario_creador');
        let aprobador_1 = currentRecord.getValue('custbody_oc_asb_aprob_exp_1');
        let aprobador_2 = currentRecord.getValue('custbody_oc_asb_aprob_exp_2');
        let aprobador_3 = currentRecord.getValue('custbody_oc_asb_aprob_exp_3');
        let aprobador_4 = currentRecord.getValue('custbody_oc_asb_aprob_exp_4');
        let aprobador_5 = currentRecord.getValue('custbody_oc_asb_aprob_exp_5');
        let estado_1 = currentRecord.getValue('custbody_oc_estado_1');
        let estado_2 = currentRecord.getValue('custbody_oc_estado_2');
        let estado_3 = currentRecord.getValue('custbody_oc_estado_3');
        let estado_4 = currentRecord.getValue('custbody_oc_estado_4');
        let estado_5 = currentRecord.getValue('custbody_oc_estado_5');
        let subsidiary = currentRecord.getValue('subsidiary');
        let aprobador_compras_usuario = currentRecord.getValue('nextapprover');

        let currentUser = runtime.getCurrentUser();
        let currentUserId = currentUser.id;
        var currentRole = currentUser.role;
     log.debug('currentRole',currentRole);
        var gestor_logistica = currentRecord.getValue('custbody_asb_gestor_logistico');
        var gerente_jefe_logistica = currentRecord.getValue('custbody_asb_jefe_logistica');
        var admin_finanzas = currentRecord.getValue('custbody_asb_gerente_admin_finanzas');
        var gerente_general_field = currentRecord.getValue('custbody_asb_gerente_general');

        if (((currentUserId == aprobador_compras_usuario && nivel_1 == false && (empleado_solicitud == '' || (empleado_solicitud != '' && aprobador_oc_rol != ''))) ||
          (currentUserId == aprobador_1 && estado_1 == 2 && nivel_1 == true && nivel_2 == false) ||
          (currentUserId == aprobador_2 && estado_2 == 2 && nivel_1 == true && nivel_2 == false) ||
          (currentUserId == aprobador_3 && estado_3 == 2 && nivel_1 == true && nivel_2 == false) ||
          (currentUserId == aprobador_4 && estado_4 == 2 && nivel_1 == true && nivel_2 == false) ||
          (currentUserId == aprobador_5 && estado_5 == 2 && nivel_1 == true && nivel_2 == false) ||
          (currentRole == GESTOR_LOGISTICA && gestor_logistica == false && nivel_2 == true && nivel_3 == false) ||
          (currentRole == JEFE_LOGISTICA && gestor_logistica == true && gerente_jefe_logistica == false && nivel_2 == true && nivel_3 == false) ||
          (currentRole == GERENTE_ADMINISTRACION_FINANZAS && gestor_logistica == true && gerente_jefe_logistica == true && admin_finanzas == false && nivel_2 == true && nivel_3 == false) ||
          (currentRole == GERENTE_GENERAL && gestor_logistica == true && gerente_jefe_logistica == true && admin_finanzas == true && gerente_general_field == false && nivel_2 == true && nivel_3 == false) ||
          (subsidiary == REDES && currentRole == DIRECTOR_REDES && nivel_1 == false && (empleado_solicitud == '' || (empleado_solicitud != '' && aprobador_oc_rol != '')))) &&
          (approvalstatus == 1)) {
          form.addButton({
            id: 'custpage_ts_btn_rechazar_po',
            label: "Rechazar",
            functionName: 'rejectPurchaseOrder(' + currentRecord.id + ',"' + currentRecord.type + '")'

          });
          form.clientScriptModulePath = '../Client/TS_CS_AlertPurchaseOrder.js';
        }
        if ((currentRole != ANALISTA_LOGISTICA_COMPRAS && currentRole != ASISTENTE_LOGISTICA && approvalstatus != 1 && currentRole != administrador) || (currentRole == ANALISTA_LOGISTICA_COMPRAS && aprobador_oc_rol != '' && approvalstatus != 1) || (currentRole == ASISTENTE_LOGISTICA && aprobador_oc_rol != '' && approvalstatus != 1) || (empleado_solicitud == '' && approvalstatus != 1 && currentRole != administrador) || (approvalstatus == 2 && currentRole != administrador) || (approvalstatus == 3 && currentRole != administrador) || (nivel_1 == true  && currentRole != administrador)) {
          form.removeButton({ id: 'edit' });
        }
        if (approvalstatus == 3) {
          var campoOculto = form.getField({
            id: 'custbody_oc_motivo_rechazo'
          });
          // Mostrar el campo en la vista
          campoOculto.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.NORMAL
          });
        }

      }
    } catch (e) {
      log.error({
        title: `${FN} error`,
        details: { message: `${FN} - ${e.message || `Unexpected error`}` },
      });
      throw { message: `${FN} - ${e.message || `Unexpected error`}` };
    }
  }
  const beforeSubmit = (context) => {
    const FN = 'beforeSubmit';
    try {

      if (context.type === context.UserEventType.EDIT) {
        const currentRecord = context.newRecord;
        let currentUser = runtime.getCurrentUser();
        let currentUserId = currentUser.id;
        currentRecord.setValue('custbody_asb_aprobador_oc_rol', currentUserId);
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
    beforeSubmit: beforeSubmit
  };
});
