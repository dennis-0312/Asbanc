/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 *
 * Task          Date            Author                                         Remarks
 * GAP 18        03 Jul 2023     Jeferson Mejía <jeferson.mejia@myevol.biz>     - Email Rechazado Workflow Aprobación de Factura
 */

define(['N/runtime', 'N/url', '../Library/TS_LIB_Email.js', '../Library/TS_LIB_Data.js'], function (runtime, url, libEmail, libData) {
  const ANALISTA_LOGISTICA_COMPRAS = 1019;
  const ROL2 = 1023;
  const onAction = (context) => {
    const FN = 'onAction';
    try {
      const currentRecord = context.newRecord;
      const transactionId = currentRecord.id;
      const currentUser = runtime.getCurrentUser();
      const senderId = currentUser.id;
      let tranID = currentRecord.getValue('tranid');
      let empleadoID = currentRecord.getValue('entity');
      let empleado = currentRecord.getText('entity');
      let amount = currentRecord.getValue('estimatedtotal');
      let moneda = currentRecord.getText('currency');
      let motivo_rechazo = currentRecord.getValue('custbody_oc_motivo_rechazo');
      let role = ANALISTA_LOGISTICA_COMPRAS;
      let EMPLOYID = libData.getUserRoles(role);
      let ROLs2 = libData.getUserRoles(ROL2);
      let formattedNumber = formatNumberWithCommaAndDecimal(amount, 2);
      let subject = 'SOLICITUD DE COMPRA: ' + tranID + ' RECHAZADA';
      let body = '<p>Buen día,<br><br>Usted tiene una Solicitud de Compra Rechazada:<br><br>Empleado: ' + empleado + '<br><br>Monto: ' + formattedNumber + '<br><br>Moneda: ' + moneda + '<br><br>Motivo de Rechazo: ' + motivo_rechazo + '<br><br>Se adjunta link para su aprobación.<br><br>Gracias.</p>';
      const transactionLink = getTransactionLink(transactionId);
      body += '<a href="' + transactionLink + '"><strong>Ver Registro</strong></a>';
      libEmail.sendEmail(empleadoID, subject, body, '', senderId);
     EMPLOYID.forEach(function (employees) {
        libEmail.sendEmail(employees.id, subject, body, '', senderId);
      })
      ROLs2.forEach(function (rol) {
        libEmail.sendEmail(rol.id, subject, body, '', senderId);
      })
    } catch (e) {
      log.error({
        title: `${FN} error`,
        details: { message: `${FN} - ${e.message || `Unexpected error`}` },
      });
      throw { message: `${FN} - ${e.message || `Unexpected error`}` };
    }
  }

  const formatNumberWithCommaAndDecimal = (number, decimalPlaces) => {
    let formattedNumber = parseFloat(number).toFixed(decimalPlaces).toString();

    let parts = formattedNumber.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    if (parts.length < 2) {
      parts.push('0'.repeat(decimalPlaces));
    }

    return parts.join(",");
  }

  const getTransactionLink = (transactionId) => {
    return 'https://' + url.resolveDomain({
      hostType: url.HostType.APPLICATION
    }) + '/app/accounting/transactions/purchreq.nl?id=' + transactionId + '&whence=';
  }
  return {
    onAction: onAction
  };
});
