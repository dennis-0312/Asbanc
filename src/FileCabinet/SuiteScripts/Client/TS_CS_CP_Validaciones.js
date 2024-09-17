/**
*@NApiVersion 2.1
*@NScriptType ClientScript
* Task          Date            Author                                         Remarks
* GAP 12        13 Jun 2023     Alexander Ruesta <aruesta@myevol.biz>          - Configuración de Control Presupuestal
*
*/

define(['N/currentRecord', 'N/record', 'N/search', 'N/ui/dialog', 'N/runtime', 'N/format', '../Library/TS_LIB_ControlPresupuestal.js'], (currentRecord, record, search, dialog, runtime, format, libCP) => {

    const pageInit = (context) => {
        if (context.currentRecord.type == 'customrecord_ts_budget_item') {
            if (context.mode === 'edit') {
                context.currentRecord.getField({
                    fieldId: 'custrecord_ts_cp_account'
                }).isDisabled = true;
                context.currentRecord.getField({
                    fieldId: 'custrecord_ts_cp_department'
                }).isDisabled = true;
                context.currentRecord.getField({
                    fieldId: 'custrecord_ts_cp_class'
                }).isDisabled = true;
                context.currentRecord.getField({
                    fieldId: 'custrecord_ts_cp_subsidiary'
                }).isDisabled = true;
                context.currentRecord.getField({
                    fieldId: 'custrecord_ts_cp_description'
                }).isDisabled = true;
            }
        }
        if (context.currentRecord.type == 'customrecord_ts_monthly_budget') {
            if (context.mode === 'edit') {
                context.currentRecord.getField({
                    fieldId: 'custrecord_ts_cp_detail_category'
                }).isDisabled = true;
                context.currentRecord.getField({
                    fieldId: 'custrecord_ts_cp_detail_anio'
                }).isDisabled = true;
                context.currentRecord.getField({
                    fieldId: 'custrecord_ts_cp_detail_total'
                }).isDisabled = true;
                context.currentRecord.getField({
                    fieldId: 'custrecord_ts_cp_detail_version'
                }).isDisabled = true;

                for (var j = 1; j <= 12; j++) {
                    if (j < 10) j = '0' + j;
                    fieldMes = 'custrecord_ts_cp_detail_' + j;
                    context.currentRecord.getField(fieldMes).isDisabled = true;
                }
            }
        }

        if (context.currentRecord.type === 'customrecord_ts_addition_transfer') {
            let status = context.currentRecord.getValue('custrecord_ts_cp_detail_transfer_status'),
                typeRequest = context.currentRecord.getValue('custrecord_ts_cp_detail_request');

            if (typeRequest == 0) {
                displayField(context);
            }

            if (!context.currentRecord.isNew) {
                if (status == '2') {
                    context.currentRecord.getField('custrecord_ts_cp_to_decrease').isDisabled = true;
                    context.currentRecord.getField('custrecord_ts_cp_to_increase').isDisabled = true;
                    context.currentRecord.getField('custrecord_ts_cp_date').isDisabled = true;
                    context.currentRecord.getField('custrecord_ts_cp_detail_amount').isDisabled = true;
                    context.currentRecord.getField('custrecord_ts_cp_detail_approver').isDisabled = true;
                    context.currentRecord.getField('custrecord_ts_cp_reason').isDisabled = true;
                    context.currentRecord.getField('custrecord_ts_cp_detail_transfer_status').isDisabled = true;
                }
            }
        }
    }


    const validateField = (context) => {
        let currentRecord = context.currentRecord,
            fieldId = context.fieldId;
        console.log(fieldId);
        if (fieldId == "custrecord_ts_cp_detail_request") {
            displayField(context);
            let typeRequest = currentRecord.getValue('custrecord_ts_cp_detail_request');
            if (typeRequest == 4) {
                context.currentRecord.getSublist({
                    sublistId: 'recmachcustrecord_ts_cp_item_transfers'
                }).isDisplay = true;
                let field_1 = context.currentRecord.getField({
                    fieldId: 'custrecord_ts_cp_to_decrease'
                })
                field_1.isDisplay = false;
                field_1.isMandatory = false;
                let field_2 = context.currentRecord.getField({
                    fieldId: 'custrecord_ts_cp_detail_amount'
                });
                field_2.isDisplay = false;
                field_2.isMandatory = false;
                let field_3 = context.currentRecord.getField({
                    fieldId: 'custrecord_ts_cp_detail_applicant'
                });
                field_3.isDisplay = false;
                field_3.isMandatory = false;
                let field_4 = context.currentRecord.getField({
                    fieldId: 'custrecord_ts_cp_detail_approver'
                });
                field_4.isDisplay = false;
                field_4.isMandatory = false;
            } else {

                let field_1 = context.currentRecord.getField({
                    fieldId: 'custrecord_ts_cp_detail_amount'
                });
                field_1.isDisplay = true;
                field_1.isMandatory = true;
                let field_2 = context.currentRecord.getField({
                    fieldId: 'custrecord_ts_cp_detail_applicant'
                });
                field_2.isDisplay = true;
                field_2.isMandatory = true;
                let field_3 = context.currentRecord.getField({
                    fieldId: 'custrecord_ts_cp_detail_approver'
                });
                field_3.isDisplay = true;
                field_3.isMandatory = true;
                if (typeRequest == 2) {
                    context.currentRecord.getField({
                        fieldId: 'custrecord_ts_cp_to_decrease'
                    }).isDisplay = true;
                } else if (typeRequest == 3) {
                    let total = currentRecord.getValue('custrecord_ts_cp_detail_amount');
                    if (total) {
                        currentRecord.setValue('custrecord_ts_cp_detail_amount', total * -1);
                    }
                }

                let total = currentRecord.getValue('custrecord_ts_cp_detail_amount');
                if (total < 0) {
                    currentRecord.setValue('custrecord_ts_cp_detail_amount', total * -1);
                }
            }
            return true;
        }

        if (fieldId == "custrecord_ts_cp_detail_amount") {
            let typeRequest = currentRecord.getValue('custrecord_ts_cp_detail_request');
            if (typeRequest == 3) {
                let total = currentRecord.getValue('custrecord_ts_cp_detail_amount');
                if (total > 0) {
                    currentRecord.setValue('custrecord_ts_cp_detail_amount', total * -1);
                }
            }
        }
        return true;
    }

    const saveRecord = (context) => {
        try {
            log.debug('solicitud', context.currentRecord.type)
            if (context.currentRecord.type === 'customrecord_ts_addition_transfer') {
                var solicitud = context.currentRecord.getValue('custrecord_ts_cp_detail_request')
                log.debug('solicitud', solicitud)
                if (solicitud == 2) {
                    let partidaDes = context.currentRecord.getValue('custrecord_ts_cp_to_decrease'),
                        monto = context.currentRecord.getValue('custrecord_ts_cp_detail_amount'),
                        disponible = 0;

                    disponible = getDisponible(partidaDes);
                    log.debug('disponible', disponible)
                    if (disponible < monto) {
                        alert('La partida a disminuir no cuenta con saldo disponible superior al monto seleccionado.')
                        return false;
                    }
                } else if (solicitud == 3) {
                    let partidaDes = context.currentRecord.getValue({ fieldId: 'custrecord_ts_cp_to_increase' });
                    monto = context.currentRecord.getValue('custrecord_ts_cp_detail_amount'),
                        disponible = 0;
                    log.debug('monto', monto)
                    disponible = getDisponible(partidaDes);
                    log.debug('disponible', disponible)
                    if (disponible < Math.abs(monto)) {
                        alert('La partida a disminuir no cuenta con saldo disponible superior al monto seleccionado.')
                        return false;
                    }


                } else if (solicitud == 4) {
                    let linePartida = context.currentRecord.getLineCount({ sublistId: 'recmachcustrecord_ts_cp_item_transfers' });
                    log.error('XD', linePartida);

                    for (var s = 0; s < linePartida; s++) {
                        let partida = context.currentRecord.getSublistValue({
                            sublistId: 'recmachcustrecord_ts_cp_item_transfers',
                            fieldId: 'custrecord_ts_cp_item_decrease',
                            line: s
                        });
                        let monto = context.currentRecord.getSublistValue({
                            sublistId: 'recmachcustrecord_ts_cp_item_transfers',
                            fieldId: 'custrecord_ts_cp_item_amount',
                            line: s
                        });

                        let disponible = getDisponible(partida);
                        if (monto > disponible) {
                            s++;
                            alert('La partida a disminuir en la linea ' + s + ' no cuenta con saldo disponible superior al monto seleccionado.');
                            return false;
                        }

                    }
                }


                if (solicitud == 1 || solicitud == 3 || solicitud == 4) {
                    return true;
                } else {
                    var mntTransferir = context.currentRecord.getValue('custrecord_ts_cp_detail_amount');
                    if (mntTransferir <= 0) {
                        alert('El monto a transferir debe ser mayor a 0');
                        return false;
                    }
                }



            }

            return true;
        } catch (e) {
            console.log('Error en saveRecord', e);
        }
    }

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

    const displayField = (context) => {
        context.currentRecord.getSublist({
            sublistId: 'recmachcustrecord_ts_cp_item_transfers'
        }).isDisplay = false;
        context.currentRecord.getField({
            fieldId: 'custrecord_ts_cp_to_decrease'
        }).isDisplay = false;

    }

    const statusAprobacion = (paramID, paramRecord, paramRequest) => {
        let statusTransf = paramRequest == 2 ? "aprobar" : "rechazar";
        let flag = confirm('¿Esta seguro de ' + statusTransf + ' la solicitud?');
        if (flag) {
            let recTranferencia = record.load({ type: paramRecord, id: paramID, isDynamic: true })
            let solicitud = recTranferencia.getValue('custrecord_ts_cp_detail_request'),
                partidaIncrease = recTranferencia.getValue('custrecord_ts_cp_to_increase'),
                partidaDecrease = recTranferencia.getValue('custrecord_ts_cp_to_decrease'),
                anio = recTranferencia.getValue('custrecord_ts_cp_date'),
                amount = parseFloat(recTranferencia.getValue('custrecord_ts_cp_detail_amount'));

            if (solicitud == 1 || solicitud == 3) {
                let message = (solicitud == 1) ? 'Ocurrió un error al adicionar presupuesto. Comunicarse con el área de soporte.' : 'La partida seleccionada no cuenta con este monto.';
                if (paramRequest == 2) {
                    let successInc = libCP.applyIncrease(anio, amount, partidaIncrease);
                    if (successInc == 1) {
                        alert('Operación realizada con éxito.');
                        recTranferencia.setValue('custrecord_ts_cp_detail_transfer_status', paramRequest);
                        recTranferencia.save({ ignoreMandatoryFields: true, enableSourcing: false });
                        window.location.reload();
                    } else {
                        //la partida seleccionada no cuenta con este monto
                        alert(message);
                    }
                } else {
                    recTranferencia.setValue('custrecord_ts_cp_detail_transfer_status', paramRequest);
                    recTranferencia.save({ ignoreMandatoryFields: true, enableSourcing: false });
                    window.location.reload();
                }
            } else {
                if (paramRequest == 2) {
                    let presupuestado = libCP.getPresupuestado(partidaDecrease);
                    console.log('presupuestado: ' + presupuestado);
                    let reservado = libCP.getAmountStatus(partidaDecrease, 'customsearch_ts_cp_control_reserved');
                    console.log('reservado: ' + reservado);
                    let comprometido = libCP.getAmountStatus(partidaDecrease, 'customsearch_ts_cp_control_committed');
                    console.log('comprometido: ' + comprometido);
                    let ejecutado = libCP.getAmountStatus(partidaDecrease, 'customsearch_ts_cp_control_executed');
                    console.log('ejecutado: ' + ejecutado);
                    let disponible = parseFloat(presupuestado) - (parseFloat(reservado) + parseFloat(comprometido) + parseFloat(ejecutado));
                    amountDisponible = disponible - amount;

                    if (amountDisponible >= 0) {
                        let successInc = libCP.applyIncrease(anio, amount, partidaIncrease);
                        let successDec = libCP.applyIncrease(anio, amount * -1, partidaDecrease);
                        if (successInc == 1 && successDec == 1) {
                            alert('Transferencia realizada con éxito');
                            recTranferencia.setValue('custrecord_ts_cp_detail_transfer_status', paramRequest);
                            recTranferencia.save({ ignoreMandatoryFields: true, enableSourcing: false });
                            window.location.reload();
                        } else {
                            alert('Ocurrió un error al transferir presupuesto. Comunicarse con el área de soporte.');
                        }
                    } else {
                        alert('No tiene monto disponible para transferir.');
                    }
                } else {
                    recTranferencia.setValue('custrecord_ts_cp_detail_transfer_status', paramRequest);
                    recTranferencia.save({ ignoreMandatoryFields: true, enableSourcing: false });
                    window.location.reload();
                }
            }
        }
    }

    const statusAprobacionMasiv = (paramID, paramRecord, paramRequest, paramTrasnferencia) => {
        let statusTransf = paramRequest == 2 ? "aprobar" : "rechazar";
        let flag = confirm('¿Esta seguro de ' + statusTransf + ' la solicitud?');
        if (flag) {
            let recTranferencia = record.load({ type: paramRecord, id: paramID, isDynamic: true });
            let partidaDecrease = recTranferencia.getValue('custrecord_ts_cp_item_decrease'),
                amount = parseFloat(recTranferencia.getValue('custrecord_ts_cp_item_amount'));

            var transferSearch = search.lookupFields({
                type: 'customrecord_ts_addition_transfer',
                id: paramTrasnferencia,
                columns: ['custrecord_ts_cp_to_increase', 'custrecord_ts_cp_date']
            });
            let anio = transferSearch.custrecord_ts_cp_date[0].value,
                partidaIncrease = transferSearch.custrecord_ts_cp_to_increase[0].value;
            console.log('mira' + partidaIncrease + '->' + anio)
            if (paramRequest == 2) {
                let presupuestado = libCP.getPresupuestado(partidaDecrease);
                console.log('presupuestado: ' + presupuestado);
                let reservado = libCP.getAmountStatus(partidaDecrease, 'customsearch_ts_cp_control_reserved');
                console.log('reservado: ' + reservado);
                let comprometido = libCP.getAmountStatus(partidaDecrease, 'customsearch_ts_cp_control_committed');
                console.log('comprometido: ' + comprometido);
                let ejecutado = libCP.getAmountStatus(partidaDecrease, 'customsearch_ts_cp_control_executed');
                console.log('ejecutado: ' + ejecutado);
                let disponible = parseFloat(presupuestado) - (parseFloat(reservado) + parseFloat(comprometido) + parseFloat(ejecutado));
                amountDisponible = disponible - amount;
                console.log('mira' + amountDisponible)
                if (amountDisponible >= 0) {
                    let successInc = libCP.applyIncrease(anio, amount, partidaIncrease);
                    let successDec = libCP.applyIncrease(anio, amount * -1, partidaDecrease);
                    if (successInc == 1 && successDec == 1) {
                        alert('Transferencia realizada con éxito');
                        recTranferencia.setValue('custrecord_ts_cp_item_status', paramRequest);
                        recTranferencia.save({ ignoreMandatoryFields: true, enableSourcing: false });
                        window.location.reload();
                    } else {
                        alert('Ocurrió un error al transferir presupuesto. Comunicarse con el área de soporte.');
                    }
                } else {
                    alert('No tiene monto disponible para transferir.');
                }
            } else {
                recTranferencia.setValue('custrecord_ts_cp_item_status', paramRequest);
                recTranferencia.save({ ignoreMandatoryFields: true, enableSourcing: false });
                window.location.reload();
            }

        }
    }
    return {
        pageInit: pageInit,
        validateField: validateField,
        saveRecord: saveRecord,
        statusAprobacion: statusAprobacion,
        statusAprobacionMasiv: statusAprobacionMasiv
    }
});

