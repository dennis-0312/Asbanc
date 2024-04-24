/**
*@NApiVersion 2.1
*@NScriptType Restlet
* Task          Date            Author                                         Remarks
* INT 11        05 Ago 2023     Alexander Ruesta <aruesta@myevol.biz>          - Creación del Restlet
*
*/

define(['N/log', 'N/record', 'N/search'], function (log, record, search) {

    function _get(context) {
        return true;
    }


    function _post(context) {
        log.debug('Entro', JSON.stringify(context))
        try {
            let idSO = '';
            let customsearch = search.create({
                type: record.Type.SALES_ORDER,
                columns: ['internalid'],
                filters: [["formulatext: CASE WHEN {tranid} = '" + context.ordenServicio + "' THEN 1 ELSE 0 END", "is", "1"]]
            })
            log.debug(context.ordenServicio)
            let resultCount = customsearch.runPaged().count;
            log.debug('result', resultCount)
            if (resultCount != 0) {
                let result = customsearch.run().getRange({ start: 0, end: 1 });
                idSO = result[0].getValue(customsearch.columns[0]);
            } else {
                log.debug('no existe')
                return {
                    "codResp": '01',
                    "descResp": 'Orden de servicio no registrada'
                };
            }

            let openSO = record.load({
                type: record.Type.SALES_ORDER,
                isDynamic: false,
                id: idSO
            })
            log.debug('openSO', openSO);

            let anulado = openSO.getValue({
                fieldId: 'voided'
            })
            log.debug('statusSO', anulado)

            if (anulado == 'T') {
                return {
                    codResp: "02",
                    descResp: "Orden de servicio expirada o anulado"
                }
            }
            if (context.tipoTrama == '2') { // Mantenimiento
                let numLines = openSO.getLineCount({
                    sublistId: 'item'
                });

                for (let i = 0; i < numLines; i++) {
                    let item = openSO.getSublistText({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    })

                    context.listaDetalle.forEach(element => {
                        if (item == element.codigoArticulo) {
                            openSO.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'quantity',
                                line: i,
                                value: element.cantidad
                            }),
                                openSO.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'amount',
                                    line: i,
                                    value: element.importe
                                })
                        }
                    })


                }
                /*
            context.listaDetalle.forEach(element => {
                openSO.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: element.codigoLinea - 1,
                    value: element.cantidad
                }),
                openSO.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount',
                    line: element.codigoLinea - 1,
                    value: element.importe
                })
            });
                    */
                openSO.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                })


            } else if (context.tipoTrama == '1') { // Instalaciones
                let newTransaction = record.transform({
                    fromType: 'salesorder',
                    fromId: idSO,
                    toType: 'invoice',
                    isDynamic: true,
                });

                newTransaction.setValue({ fieldId: 'tobeemailed', value: false })
                log.debug('newTransaction', newTransaction);
                let idInvoice = newTransaction.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });
                log.debug('idInvoice', idInvoice);
            }

            return {
                codResp: '00',
                descResp: 'Procesado correctamente'
            };
        } catch (e) {
            log.error('e', e)
            return {
                codResp: '99',
                descResp: e
            };
        }





        //log.debug('orden',orden);



    }









    return {

        get: _get,

        post: _post

    }

});