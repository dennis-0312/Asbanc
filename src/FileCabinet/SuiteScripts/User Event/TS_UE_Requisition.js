/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 * Task          Date            Author                                         Remarks
 * GAP 18        10 Jul 2023     Jeferson Mejía <jeferson.mejia@myevol.biz>     - Workflow Aprobación de Ordenes de Compra
 */
define(['N/runtime', 'N/url', 'N/ui/serverWidget', 'N/search', '../Library/TS_LIB_Email.js', '../Library/TS_LIB_Data.js'], function (runtime, url, serverWidget, search, libEmail, libData) {
    const ANALISTA_LOGISTICA_COMPRAS = 1023;
    const ASISTENTE_LOGISTICA = 1019;
    const beforeLoad = (context) => {
        const FN = 'beforeLoad';
        try {
            if (context.type === context.UserEventType.VIEW) {
                const currentRecord = context.newRecord;

                let form = context.form;

                let approvalstatus = currentRecord.getValue('approvalstatus');
                let nivel_1_sc = currentRecord.getValue('custbody_asb_aprobacion_nivel_1_sc');
                let entity = currentRecord.getValue('custbody_asb_aprobador_solicitud_rol');
                let aprobador_solicitud_rol = currentRecord.getValue('custbody_asb_aprobador_solicitud_rol');
                let currentUser = runtime.getCurrentUser();
                var currentRole = currentUser.role;
                let currentUserId = currentUser.id;
                let aprobador_1 = currentRecord.getValue('custbody_sc_asb_aprob_exp_1');
                let aprobador_2 = currentRecord.getValue('custbody_sc_asb_aprob_exp_2');
                let aprobador_3 = currentRecord.getValue('custbody_sc_asb_aprob_exp_3');
                let aprobador_4 = currentRecord.getValue('custbody_sc_asb_aprob_exp_4');
                let aprobador_5 = currentRecord.getValue('custbody_sc_asb_aprob_exp_5');
                let estado_1 = currentRecord.getValue('custbody_sc_estado_1');
                let estado_2 = currentRecord.getValue('custbody_sc_estado_2');
                let estado_3 = currentRecord.getValue('custbody_sc_estado_3');
                let estado_4 = currentRecord.getValue('custbody_sc_estado_4');
                let estado_5 = currentRecord.getValue('custbody_sc_estado_5');

                if (((currentUserId == entity && nivel_1_sc == false && aprobador_solicitud_rol != '') ||
                    (currentRole == ANALISTA_LOGISTICA_COMPRAS && nivel_1_sc == false && aprobador_solicitud_rol != '') ||
                    (currentRole == ASISTENTE_LOGISTICA && nivel_1_sc == false && aprobador_solicitud_rol != '') ||
                    (currentUserId == aprobador_1 && estado_1 == 2 && nivel_1_sc == true) ||
                    (currentUserId == aprobador_2 && estado_2 == 2 && nivel_1_sc == true) ||
                    (currentUserId == aprobador_3 && estado_3 == 2 && nivel_1_sc == true) ||
                    (currentUserId == aprobador_4 && estado_4 == 2 && nivel_1_sc == true) ||
                    (currentUserId == aprobador_5 && estado_5 == 2 && nivel_1_sc == true)) && approvalstatus == 1) {
                    form.addButton({
                        id: 'custpage_ts_btn_rechazar',
                        label: "Rechazar",
                        functionName: 'rejectRequisition(' + currentRecord.id + ',"' + currentRecord.type + '")'

                    });
                    form.clientScriptModulePath = '../Client/TS_CS_AlertRequisition.js';
                }
                if ((currentRole != ANALISTA_LOGISTICA_COMPRAS && currentRole != ASISTENTE_LOGISTICA) ||
                    approvalstatus == 2 || approvalstatus == 3) {
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
        const currentRecord = context.newRecord;
        try {
            if (context.type === context.UserEventType.CREATE) {

                currentRecord.setValue('custbody_asb_usuario_creador', '');
                currentRecord.setValue('custbody_asb_aprobador_solicitud_rol', '');
            }
            var valuenew = currentRecord.getValue('custbody_asb_aprobador_solicitud_rol');
            if (context.type === context.UserEventType.EDIT && valuenew === '') {
                var entity = currentRecord.getValue('entity');
                var objInvoice = search.create({
                    type: "employee",
                    filters:
                        [
                            ["internalid", "anyof", entity]
                        ],
                    columns: ["purchaseorderapprover"]

                });
                let searchResult = objInvoice.run().getRange({ start: 0, end: 1 });

                const transactionId = currentRecord.id;
                const currentUser = runtime.getCurrentUser();
                const senderId = currentUser.id;
                let tranID = currentRecord.getValue('tranid');

                let vendor = currentRecord.getText('entity');
                let amount = currentRecord.getValue('estimatedtotal');
                let moneda = currentRecord.getText('currency');

                let formattedNumber = formatNumberWithCommaAndDecimal(amount, 2);
                let subject = 'SOLICITUD DE COMPRA: ' + tranID + ' PENDIENTE DE APROBACIÓN';
                let body = '<p>Buen día,<br><br>Usted tiene una Solicitud de Compra Pendiente de Aprobación:<br><br>Empleado: ' + vendor + '<br><br>Monto: ' + formattedNumber + '<br><br>Moneda: ' + moneda + '<br><br>Se adjunta link para su aprobación.<br><br>Gracias.</p>';
                const transactionLink = getTransactionLink(transactionId);
                body += '<a href="' + transactionLink + '"><strong>Ver Registro</strong></a>';

                libEmail.sendEmail(searchResult[0].getValue({ name: "purchaseorderapprover" }), subject, body, '', senderId);


                currentRecord.setValue('custbody_asb_usuario_creador', entity);
                currentRecord.setValue('custbody_asb_aprobador_solicitud_rol', searchResult[0].getValue({ name: "purchaseorderapprover" }));

            }

        } catch (e) {
            log.error({
                title: `${FN} error`,
                details: { message: `${FN} - ${e.message || `Unexpected error`}` },
            });
            throw { message: `${FN} - ${e.message || `Unexpected error`}` };
        }
    }
    const afterSubmit = (context) => {
       /* if (context.type === context.UserEventType.CREATE) {
             var tiempoInicio = new Date().getTime();
                var tiempoTranscurrido = 0;
                while (tiempoTranscurrido < 30000) {
                  tiempoTranscurrido = new Date().getTime() - tiempoInicio;
                }
            const currentRecord = context.newRecord;
            const transactionId = currentRecord.id;
            const currentUser = runtime.getCurrentUser();
            const senderId = currentUser.id;
            let tranID = currentRecord.getValue('tranid');
            let transactionnumber = currentRecord.getValue('transactionnumber');
            log.debug('tranID', tranID);
            log.debug('transactionnumber', transactionnumber);
            let vendor = currentRecord.getText('entity');
            let amount = currentRecord.getValue('estimatedtotal');
            let moneda = currentRecord.getText('currency');
            let role = [ANALISTA_LOGISTICA_COMPRAS, ASISTENTE_LOGISTICA];
            let EMPLOYID = libData.getUserRoles(role);
            let formattedNumber = formatNumberWithCommaAndDecimal(amount, 2);
            let subject = 'SOLICITUD DE COMPRA: ' + tranID + ' PENDIENTE DE APROBACIÓN';
            let body = '<p>Buen día,<br><br>Usted tiene una Solicitud de Compra Pendiente de Aprobación:<br><br>Empleado: ' + vendor + '<br><br>Monto: ' + formattedNumber + '<br><br>Moneda: ' + moneda + '<br><br>Se adjunta link para su aprobación.<br><br>Gracias.</p>';
            const transactionLink = getTransactionLink(transactionId);
            body += '<a href="' + transactionLink + '"><strong>Ver Registro</strong></a>';
            EMPLOYID.forEach(function (employees) {
                libEmail.sendEmail(employees.id, subject, body, '', senderId);
            })
        }*/


    }
    const getTransactionLink = (transactionId) => {
        return 'https://' + url.resolveDomain({
            hostType: url.HostType.APPLICATION
        }) + '/app/accounting/transactions/purchreq.nl?id=' + transactionId + '&whence=';
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
    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit

    };
});
