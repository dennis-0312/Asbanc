/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 *
 * Task          Date            Author                                         Remarks
 * GAP 18        03 Jul 2023     Jeferson Mejía <jeferson.mejia@myevol.biz>     - Email Rechazado Workflow Aprobación de Factura
 */

define(['N/runtime', 'N/url', '../Library/TS_LIB_Email.js', '../Library/TS_LIB_Data.js'], function (runtime, url, libEmail, libData) {
  const JEFE_LOGISTICA = 1017;
  const onAction = (context) => {
    const FN = 'onAction';
    try {
      const currentRecord = context.newRecord;
      const transactionId = currentRecord.id;
      const currentUser = runtime.getCurrentUser();
      const senderId = currentUser.id;
      let tranID = currentRecord.getValue('tranid');
      let vendor = currentRecord.getText('entity');
      let amount = currentRecord.getValue('total');
      let moneda = currentRecord.getText('currency');
      let role = [JEFE_LOGISTICA];
      let EMPLOYID = libData.getUserRoles(role);
      let formattedNumber = formatNumberWithCommaAndDecimal(amount, 2);
      let subject = 'ORDEN DE COMPRA: ' + tranID + ' PENDIENTE DE APROBACIÓN';
      let body = '<p>Buen día,<br><br>Usted tiene una Orden de Compra Pendiente de Aprobación:<br><br>Proveedor: ' + vendor + '<br><br>Monto: ' + formattedNumber + '<br><br>Moneda: ' + moneda + '<br><br>Se adjunta link para su aprobación.<br><br>Gracias.</p>';
      const transactionLink = getTransactionLink(transactionId);
      body += '<a href="' + transactionLink + '"><strong>Ver Registro</strong></a>';
      EMPLOYID.forEach(function (employees) {
        libEmail.sendEmail(employees.id, subject, body, '', senderId);
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
    }) + '/app/accounting/transactions/purchord.nl?id=' + transactionId + '&whence=';
  }
  return {
    onAction: onAction
  };
});
