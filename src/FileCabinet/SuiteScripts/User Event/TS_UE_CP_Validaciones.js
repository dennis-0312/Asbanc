/**
* @NApiVersion 2.1
* @NScriptType UserEventScript
*
* Task          Date            Author                                         Remarks
* GAP 12        13 Jul 2023     Alexander Ruesta <aruesta@myevol.biz>          - Configuración Control Presupuestal.
*
*/

define(["N/record", "N/log", "N/runtime", 'N/url', 'N/search', 'N/email', 'N/ui/serverWidget', 'N/error', '../Library/TS_LIB_ControlPresupuestal.js'], (record, log, runtime, url, search, email, serverWidget, error, libCP) => {
    const beforeLoad = (context) => {
        const FN = 'Control Presupuestal';
        try {
            let entity = context.newRecord,
                form = context.form,
                currentRecord = context.newRecord;
            if (entity.type === 'customrecord_ts_budget_item' || entity.type === 'customrecord_ts_monthly_budget') {
                if (context.type === 'view') {
                    let editButton = form.getButton('edit');
                    if (editButton != null)
                        editButton.isDisabled = true;
                }
            }

            if (entity.type === 'customrecord_ts_addition_transfer') {
                let transfAprobador = currentRecord.getValue('custrecord_ts_cp_detail_approver'),
                    sessionObj = runtime.getCurrentUser().id,
                    statusTransf = currentRecord.getValue('custrecord_ts_cp_detail_transfer_status'),
                    request = currentRecord.getValue('custrecord_ts_cp_detail_request');

                if (context.type === 'view') {
                    if (statusTransf == '1' && request != '4') {
                        if (transfAprobador == sessionObj) {
                            let btnAprobar = form.addButton({ id: 'custpage_ts_btn_aprobar', label: "Aprobar", functionName: 'statusAprobacion(' + currentRecord.id + ',"' + currentRecord.type + '", 2)' });
                            let btnRechazar = form.addButton({ id: 'custpage_ts_btn_rechazar', label: "Rechazar", functionName: 'statusAprobacion(' + currentRecord.id + ',"' + currentRecord.type + '", 3)' });
                        }
                    } else if (statusTransf == '2') {
                        var editTransfer = form.getButton('edit');
                        if (editTransfer != null) editTransfer.isDisabled = true;
                    }
                    let formSublist = form.getSublist({ id: 'recmachcustrecord_ts_cp_item_transfers' });
                    formSublist.displayType = serverWidget.SublistDisplayType.HIDDEN;
                    if (request == 1 || request == 3) {
                        form.getField({ id: 'custrecord_ts_cp_to_decrease' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    } else if (request == 4) {
                        formSublist.displayType = serverWidget.SublistDisplayType.NORMAL;
                        form.getField({ id: 'custrecord_ts_cp_to_decrease' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                        form.getField({ id: 'custrecord_ts_cp_detail_amount' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                        form.getField({ id: 'custrecord_ts_cp_detail_applicant' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                        form.getField({ id: 'custrecord_ts_cp_detail_approver' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    }
                }
            }

            if (entity.type === 'customrecord_ts_cp_item_decrease') {
                let transfAprobador = currentRecord.getValue('custrecord_ts_cp_item_approver'),
                    sessionObj = runtime.getCurrentUser().id,
                    statusTransf = currentRecord.getValue('custrecord_ts_cp_item_status'),
                    transferencia = currentRecord.getValue('custrecord_ts_cp_item_transfers');
                if (context.type === 'view') {
                    if (statusTransf == '1') {
                        if (transfAprobador == sessionObj) {
                            let btnAprobar = form.addButton({ id: 'custpage_ts_btn_aprobar', label: "Aprobar", functionName: 'statusAprobacionMasiv(' + currentRecord.id + ',"' + currentRecord.type + '", 2,' + transferencia + ')' });
                            let btnRechazar = form.addButton({ id: 'custpage_ts_btn_rechazar', label: "Rechazar", functionName: 'statusAprobacionMasiv(' + currentRecord.id + ',"' + currentRecord.type + '", 3,' + transferencia + ')' });
                        }
                    } else if (statusTransf == '2') {
                        var editTransfer = form.getButton('edit');
                        if (editTransfer != null) editTransfer.isDisabled = true;
                    }
                }
            }
            form.clientScriptModulePath = '../Client/TS_CS_CP_Validaciones.js';

        } catch (e) {
            log.error({
                title: `${FN} error`,
                details: { message: `${FN} - ${e.message || `Unexpected error`}` },
            });
            throw { message: `${FN} - ${e.message || `Unexpected error`}` };
        }
    };

    const beforeSubmit = (context) => {
        const FN = 'Control Presupuestal';
        try {
            if (context.type == context.UserEventType.CREATE) {
                if (context.newRecord.type == 'customrecord_ts_monthly_budget') {
                    let id = context.newRecord.id,
                        objRecord = context.newRecord,
                        montoTotal = 0;
                    var partidaSearch = search.lookupFields({
                        type: 'customrecord_ts_budget_item',
                        id: objRecord.getValue({ fieldId: 'custrecord_ts_cp_detail_category' }),
                        columns: ['custrecord_ts_cp_department', 'custrecord_ts_cp_class']
                    });

                    var department = partidaSearch.custrecord_ts_cp_department[0].value;
                    var clase = partidaSearch.custrecord_ts_cp_class[0].value;
                    var anio = objRecord.getValue({ fieldId: 'custrecord_ts_cp_detail_anio' });
                    var version = objRecord.getValue({ fieldId: 'custrecord_ts_cp_detail_version' });
                    log.debug('Filtros', department + '->> ' + clase + '->>' + anio + '->>' + version)
                    var customSearch = search.create({
                        type: "customrecord_ts_budget_item",
                        filters:
                            [
                                ["custrecord_ts_cp_department", "anyof", department],
                                "AND",
                                ["custrecord_ts_cp_class", "anyof", clase],
                                "AND",
                                ["custrecord_ts_cp_detail_category.custrecord_ts_cp_detail_anio", "anyof", anio],
                                "AND",
                                ["custrecord_ts_cp_detail_category.custrecord_ts_cp_detail_version", "anyof", version]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "name", sort: search.Sort.ASC, label: "ID" })
                            ]
                    });

                    let resultCount = customSearch.runPaged().count;
                    log.debug('Result', resultCount)
                    if (resultCount != 0) {
                        let myCustomError = error.create({
                            name: 'ERROR_CONTROL_PRESUPUESTAL',
                            message: 'Ya existe una Partida Presupuestal con la misma configuración.',
                            notifyOff: false
                        });
                        throw myCustomError;
                    }

                    for (let i = 1; i < 13; i++) {
                        let value = i < 10 ? '0' + i : i;
                        montoTotal = montoTotal + objRecord.getValue({ fieldId: 'custrecord_ts_cp_detail_' + value })
                    }
                    objRecord.setValue({ fieldId: 'custrecord_ts_cp_detail_total', value: montoTotal });
                }

                if (context.newRecord.type == 'customrecord_ts_budget_item') {
                    let objRecord = context.newRecord,
                        department = objRecord.getValue({ fieldId: 'custrecord_ts_cp_department' }),
                        clase = objRecord.getValue({ fieldId: 'custrecord_ts_cp_class' }),
                        subsidiary = objRecord.getValue({ fieldId: 'custrecord_ts_cp_subsidiary' })
                    anio = '';

                    let numItems = objRecord.getLineCount({ sublistId: 'recmachcustrecord_ts_cp_detail_category' });
                    log.debug('numItems', numItems)
                    for (let j = 0; j < numItems; j++) {
                        let montoTotal = 0;
                        for (let i = 1; i < 13; i++) {
                            let value = i < 10 ? '0' + i : i;
                            montoTotal = montoTotal + objRecord.getSublistValue({ sublistId: 'recmachcustrecord_ts_cp_detail_category', fieldId: 'custrecord_ts_cp_detail_' + value, line: j })
                        }
                        anio = objRecord.getSublistValue({ sublistId: 'recmachcustrecord_ts_cp_detail_category', fieldId: 'custrecord_ts_cp_detail_anio', line: j });
                        objRecord.setSublistValue({ sublistId: 'recmachcustrecord_ts_cp_detail_category', fieldId: 'custrecord_ts_cp_detail_total', line: j, value: montoTotal });
                    }



                    if (numItems >= 0) {

                        var customSearch = search.create({
                            type: "customrecord_ts_budget_item",
                            filters:
                                [
                                    ["custrecord_ts_cp_department", "anyof", department],
                                    "AND",
                                    ["custrecord_ts_cp_class", "anyof", clase],
                                    "AND",
                                    ["custrecord_ts_cp_subsidiary", "anyof", subsidiary],
                                    "AND",
                                    ["custrecord_ts_cp_detail_category.custrecord_ts_cp_detail_anio", "anyof", anio]
                                ],
                            columns:
                                [
                                    search.createColumn({
                                        name: "name",
                                        sort: search.Sort.ASC,
                                        label: "ID"
                                    })
                                ]
                        });

                        let resultCount = customSearch.runPaged().count;

                        if (resultCount != 0) {
                            let myCustomError = error.create({
                                name: 'ERROR_CONTROL_PRESUPUESTAL',
                                message: 'Ya existe una Partida Presupuestal con la misma configuración.',
                                notifyOff: false
                            });
                            throw myCustomError;
                        }
                    }
                }

                if (context.newRecord.type == 'customrecord_ts_addition_transfer') {
                    let objRecord = context.newRecord,
                        monto = objRecord.getValue('custrecord_ts_cp_detail_amount'),
                        solicitud = objRecord.getValue('custrecord_ts_cp_detail_request'),
                        disponible = 0;
                    log.debug('solicitud', solicitud)
                    if (solicitud == 2) {
                        let partidaDes = objRecord.getValue({ fieldId: 'custrecord_ts_cp_to_decrease' });
                        log.debug('Entro', monto)
                        disponible = getDisponible(partidaDes);
                        log.debug('disponible', disponible)
                        if (disponible < Math.abs(monto)) {
                            let myCustomError = error.create({
                                name: 'ERROR_CONTROL_PRESUPUESTAL',
                                message: 'La partida a disminuir no cuenta con saldo disponible superior al monto seleccionado.',
                                notifyOff: false
                            });
                            throw myCustomError;

                        }
                    } else if (solicitud == 3) {
                        let partidaDes = objRecord.getValue({ fieldId: 'custrecord_ts_cp_to_increase' });
                        log.debug('Entro', monto)
                        disponible = getDisponible(partidaDes);
                        log.debug('disponible', disponible)
                        if (disponible < Math.abs(monto)) {
                            let myCustomError = error.create({
                                name: 'ERROR_CONTROL_PRESUPUESTAL',
                                message: 'La partida a disminuir no cuenta con saldo disponible superior al monto seleccionado.',
                                notifyOff: false
                            });
                            throw myCustomError;

                        }
                    } else if (solicitud == 4) {

                        let linePartida = objRecord.getLineCount({ sublistId: 'recmachcustrecord_ts_cp_item_transfers' });
                        log.error('XD', linePartida);

                        for (var s = 0; s < linePartida; s++) {
                            let partida = objRecord.getSublistValue({
                                sublistId: 'recmachcustrecord_ts_cp_item_transfers',
                                fieldId: 'custrecord_ts_cp_item_decrease',
                                line: s
                            });
                            let monto = objRecord.getSublistValue({
                                sublistId: 'recmachcustrecord_ts_cp_item_transfers',
                                fieldId: 'custrecord_ts_cp_item_amount',
                                line: s
                            });

                            let disponible = getDisponible(partida);
                            if (monto > disponible) {
                                s++;
                                let myCustomError = error.create({
                                    name: 'ERROR_CONTROL_PRESUPUESTAL',
                                    message: 'La partida a disminuir en la linea ' + s + ' no cuenta con saldo disponible superior al monto seleccionado.',
                                    notifyOff: false
                                });
                                throw myCustomError;
                            }

                        }

                    }

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

    const afterSubmit = (context) => {
        const FN = 'Control Presupuestal';
        try {

            if (context.newRecord.type === 'customrecord_ts_addition_transfer') {
                if (context.type === 'create') {
                    let recTransf = record.load({ type: context.newRecord.type, id: context.newRecord.id, isDynamic: true });
                    recTransf.setValue('custrecord_ts_cp_detail_transfer_status', 1);
                    recTransf.save({ ignoreMandatoryFields: true, enableSourcing: false });

                    let author = context.newRecord.getValue('custrecord_ts_cp_detail_applicant'),
                        solicitud = context.newRecord.getValue('custrecord_ts_cp_detail_request')
                    subject = '',
                        body = '';
                    if (solicitud != '4') {
                        let host = url.resolveDomain({
                            hostType: url.HostType.APPLICATION
                        });

                        let relativePath = url.resolveRecord({
                            recordType: context.newRecord.type,
                            recordId: context.newRecord.id,
                            isEditMode: false
                        });

                        if (solicitud == '1') {
                            subject = 'Aprobar Adición ';
                            body = "<p>Estimado <br><br> Por favor realizar la aprobación de la <a href='https://" + host + relativePath + "'><font color='#1067CA'>Adición</font></a> en el sistema Oracle Netsuite. <br><br> Saludos.</p>";
                        } else if (solicitud == 2) {
                            subject = 'Aprobar Transferencia ';
                            body = "<p>Estimado <br><br> Por favor realizar la aprobación de la <a href='https://" + host + relativePath + "'><font color='#1067CA'>Transferencia</font></a> en el sistema Oracle Netsuite. <br><br> Saludos.</p>";
                        } else {
                            subject = 'Aprobar Disminución ';
                            body = "<p>Estimado <br><br> Por favor realizar la aprobación de la <a href='https://" + host + relativePath + "'><font color='#1067CA'>Disminución</font></a> en el sistema Oracle Netsuite. <br><br> Saludos.</p>";
                        }

                        var employeeSearchObj = search.create({
                            type: "employee",
                            filters:
                                [
                                    ["email", "is", author]
                                ],
                            columns:
                                [
                                    search.createColumn({ name: "internalid", label: "Internal ID" })
                                ]
                        });
                        var searchResultCount = employeeSearchObj.run().getRange(0, 1);
                        var idAuthor = searchResultCount[0].getValue("internalid");

                        email.send({
                            author: idAuthor,
                            recipients: context.newRecord.getValue('custrecord_ts_cp_detail_approver'),
                            subject: subject,
                            body: body

                        });
                    } else {
                        log.debug('Entro')
                        let recTransf = record.load({ type: 'customrecord_ts_addition_transfer', id: context.newRecord.id, isDynamic: true });

                        let lineCount = recTransf.getLineCount({ sublistId: 'recmachcustrecord_ts_cp_item_transfers' });
                        log.debug('lineCount', lineCount)
                        for (let id = 0; id < lineCount; id++) {
                            let internalID = recTransf.getSublistValue({
                                sublistId: 'recmachcustrecord_ts_cp_item_transfers',
                                fieldId: 'id',
                                line: id
                            });

                            let author = recTransf.getSublistValue({
                                sublistId: 'recmachcustrecord_ts_cp_item_transfers',
                                fieldId: 'custrecord_ts_cp_item_applicant',
                                line: id
                            });

                            let aprovador = recTransf.getSublistValue({
                                sublistId: 'recmachcustrecord_ts_cp_item_transfers',
                                fieldId: 'custrecord_ts_cp_item_approver',
                                line: id
                            });


                            var employeeSearchObj = search.create({
                                type: "employee",
                                filters:
                                    [
                                        ["email", "is", author]
                                    ],
                                columns:
                                    [
                                        search.createColumn({ name: "internalid", label: "Internal ID" })
                                    ]
                            });
                            var searchResultCount = employeeSearchObj.run().getRange(0, 1);
                            var idAuthor = searchResultCount[0].getValue("internalid");

                            let host = url.resolveDomain({
                                hostType: url.HostType.APPLICATION
                            });

                            let relativePath = url.resolveRecord({
                                recordType: 'customrecord_ts_cp_item_decrease',
                                recordId: internalID,
                                isEditMode: false
                            });

                            let subject = 'Aprobar Transferencia Masiva',
                                body = "<p>Estimado <br><br> Por favor realizar la aprobación de la <a href='https://" + host + relativePath + "'><font color='#1067CA'>Transferencia Masiva</font></a> en el sistema Oracle Netsuite. <br><br> Saludos.</p>";

                            log.debug('linea', id + '->> ' + internalID + '->' + author + '->' + aprovador)

                            email.send({
                                author: idAuthor,
                                recipients: aprovador,
                                subject: subject,
                                body: body

                            });

                        }
                    }

                }
            }

            if (context.newRecord.type === 'customrecord_ts_cp_item_decrease') {
                if (context.type === 'create') {
                    let recTransf = record.load({ type: context.newRecord.type, id: context.newRecord.id, isDynamic: true });
                    recTransf.setValue('custrecord_ts_cp_item_status', 1);
                    recTransf.save({ ignoreMandatoryFields: true, enableSourcing: false });

                    let host = url.resolveDomain({
                        hostType: url.HostType.APPLICATION
                    });

                    let relativePath = url.resolveRecord({
                        recordType: context.newRecord.type,
                        recordId: context.newRecord.id,
                        isEditMode: false
                    });

                    let author = context.newRecord.getValue('custrecord_ts_cp_item_applicant'),
                        subject = 'Aprobar Transferencia Masiva',
                        body = "<p>Estimado <br><br> Por favor realizar la aprobación de la <a href='https://" + host + relativePath + "'><font color='#1067CA'>Transferencia Masiva</font></a> en el sistema Oracle Netsuite. <br><br> Saludos.</p>";

                    var employeeSearchObj = search.create({
                        type: "employee",
                        filters:
                            [
                                ["email", "is", author]
                            ],
                        columns:
                            [
                                search.createColumn({ name: "internalid", label: "Internal ID" })
                            ]
                    });
                    var searchResultCount = employeeSearchObj.run().getRange(0, 1);
                    var idAuthor = searchResultCount[0].getValue("internalid");

                    email.send({
                        author: idAuthor,
                        recipients: context.newRecord.getValue('custrecord_ts_cp_item_approver'),
                        subject: subject,
                        body: body

                    });
                }
                if (context.type === 'edit') {
                    let flag = false;
                    let recTranferencia = record.load({
                        type: 'customrecord_ts_addition_transfer',
                        id: context.newRecord.getValue('custrecord_ts_cp_item_transfers'),
                        isDynamic: true
                    })
                    log.debug('recTranferencia', recTranferencia);
                    let numItems = recTranferencia.getLineCount({ sublistId: 'recmachcustrecord_ts_cp_item_transfers' });
                    log.debug('numeros', numItems);
                    for (let j = 0; j < numItems; j++) {
                        let status = recTranferencia.getSublistValue({ sublistId: 'recmachcustrecord_ts_cp_item_transfers', fieldId: 'custrecord_ts_cp_item_status', line: j });
                        if (status == '1') {
                            flag = true;
                        }
                    }
                    if (!flag) {
                        recTranferencia.setValue({ fieldId: 'custrecord_ts_cp_detail_transfer_status', value: 4 });
                        recTranferencia.save({ ignoreMandatoryFields: true, enableSourcing: false });
                    }
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

    const getDisponible = (paramPartida) => {
        let presupuestado = libCP.getPresupuestado(paramPartida);
        log.debug('presupuestado: ' + presupuestado);
        let reservado = libCP.getAmountStatus(paramPartida, 'customsearch_ts_cp_control_reserved');
        log.debug('reservado: ' + reservado);
        let comprometido = libCP.getAmountStatus(paramPartida, 'customsearch_ts_cp_control_committed');
        log.debug('comprometido: ' + comprometido);
        let ejecutado = libCP.getAmountStatus(paramPartida, 'customsearch_ts_cp_control_executed');
        log.debug('ejecutado: ' + ejecutado);
        let disponible = parseFloat(presupuestado) - (parseFloat(reservado) + parseFloat(comprometido) + parseFloat(ejecutado));

        return disponible;
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
});
