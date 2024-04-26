function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
    nlapiLogExecution("DEBUG", "Inicio", 'INICIO-----------------------------');
    var account_to_credit = 0;
    var account_to_debit = 0;
    const PE_ANTICIPOS_DETRACCION_L5 = 135;
    const CUENTAS_X_PAGAR_4212101 = 4095;
    const FACTURA_COMPRA = 'vendorbill';
    const PAGO_PROVEEDOR = 'vendorpayment';
    const PAGO_ANTICIPADO = 'vendorprepayment';
    const MONEDA_SOLES = '1';
    const MONEDA_DOLARES = '2';
    const recType = transactionRecord.getRecordType();
    const currency = transactionRecord.getFieldValue('currency');  // 1: Soles, 2: US Dollar
    const exchangerate = transactionRecord.getFieldValue('exchangerate');


    nlapiLogExecution('DEBUG', 'recType', recType);

    if (recType === FACTURA_COMPRA) {

        var tipo_cambio = 1.00;
        var account_bill = 112; //ACCOUNT: Compras acumuladas
        var count_purchaseorders = transactionRecord.getLineItemCount('purchaseorders');//se setea al editar
        var podocnum = transactionRecord.getFieldValue('podocnum');//se setea al crear
        try {
            if (currency != 1) tipo_cambio = exchangerate;

            var count_transaction = transactionRecord.getLineItemCount('item');
            nlapiLogExecution('DEBUG', 'count_transaction', count_transaction);
            for (var i = 1; i <= count_transaction; i++) {

                var type_item = transactionRecord.getLineItemValue('item', 'itemtype', i);
                
                if (type_item == 'InvtPart') {

                    var id_item = transactionRecord.getLineItemValue('item', 'item', i);
                    var name_item = transactionRecord.getLineItemText('item', 'item', i);
                    var cogs_account = Number(nlapiLookupField('item', id_item, 'expenseaccount'));
                    var accountRecord = 0
                    
                    nlapiLogExecution('DEBUG', 'count_purchaseorders = ', count_purchaseorders);
                    nlapiLogExecution('DEBUG', 'podocnum', podocnum);
                     if((count_purchaseorders=="0" || count_purchaseorders==0) //EDIT
                     ||((count_purchaseorders=="-1" || count_purchaseorders==-1) && (podocnum==null || podocnum=='')))//CREATE
                     {
                         nlapiLogExecution('DEBUG', 'Info', 'No tiene Orden de Compra');
                         nlapiLogExecution('DEBUG', 'Info', 'Recuperando cuenta de activo...');
                        var search = nlapiSearchRecord('inventoryitem', null, [
                            new nlobjSearchFilter('internalid', null, 'is', id_item)
                        ], [
                            new nlobjSearchColumn('assetaccount')
                        ]);

                         for (var j = 0; search != null && j < search.length; j++){
                             var searchresult = search[j];
                             accountRecord = Number(searchresult.getValue('assetaccount'));
                         }
                         if(accountRecord==0){
                             accountRecord = Number(getAccountRecord(FACTURA_COMPRA));
                             nlapiLogExecution('DEBUG', 'Info', 'No se pudo recuperar cuenta de activo, se seteará Compras acumuladas: '+accountRecord);
                         }else{
                             nlapiLogExecution('DEBUG', 'Info', 'Se recuperó cuenta de activo con éxito: '+accountRecord);
                         }

                     }
                     else
                     {
                        nlapiLogExecution('DEBUG', 'Info', 'Sí tiene Orden de Compra');
                        accountRecord = Number(getAccountRecord(FACTURA_COMPRA));
                     }

                    const val_department = Number(transactionRecord.getLineItemValue('item', 'department', i));
                    const val_class = Number(transactionRecord.getLineItemValue('item', 'class', i));
                    nlapiLogExecution('DEBUG', 'val_class', val_class);
                    nlapiLogExecution('DEBUG', 'val_department', val_department);

                    nlapiLogExecution('DEBUG', 'accountRecord', accountRecord);
                    nlapiLogExecution('DEBUG', 'cogs_account', cogs_account);
                    var monto = transactionRecord.getLineItemValue('item', 'amount', i) * tipo_cambio
                    nlapiLogExecution('DEBUG', 'monto', monto);
                    
                    var newLine = customLines.addNewLine();
                    newLine.setCreditAmount(monto);
                    newLine.setAccountId(accountRecord);
                    newLine.setMemo(name_item);
                    newLine.setClassId(val_class);
                    newLine.setDepartmentId(val_department);

                    var newLine = customLines.addNewLine();
                    newLine.setDebitAmount(monto);
                    newLine.setAccountId(cogs_account);
                    newLine.setMemo(name_item);
                    newLine.setClassId(val_class);
                    newLine.setDepartmentId(val_department);

                }
            }

            // IMPLEMENTACIÓN PARA LOS CENTAVOS DE LAS DETRACCIONES
            // var count_expense = transactionRecord.getLineItemCount('expense');
            // for (var j = 1; j <= count_expense; j++) {
            //     var account_id = transactionRecord.getLineItemValue('expense', 'account', j);
            //     nlapiLogExecution('DEBUG', 'account_id', account_id);
            //     if (account_id == PE_ANTICIPOS_DETRACCION_L5) {
            //         var account_amount = Math.abs(transactionRecord.getLineItemValue('expense', 'amount', j) * tipo_cambio);
            //         var account_amount_redondeo = Math.round(account_amount);
            //         var account_amount_resto = account_amount - account_amount_redondeo;

            //         nlapiLogExecution('DEBUG', 'account_amount', account_amount);
            //         nlapiLogExecution('DEBUG', 'account_amount_redondeo', account_amount_redondeo);
            //         nlapiLogExecution('DEBUG', 'account_amount_resto', account_amount_resto);

            //         var account_debit_det = '';
            //         var account_credit_det = '';
            //         if (account_amount_resto > 0) {
            //             account_debit_det = PE_ANTICIPOS_DETRACCION_L5;
            //             account_credit_det = CUENTAS_X_PAGAR_4212101;
            //         } else if (account_amount_resto < 0) {
            //             account_debit_det = CUENTAS_X_PAGAR_4212101;
            //             account_credit_det = PE_ANTICIPOS_DETRACCION_L5;
            //         }

            //         if (account_debit_det && account_credit_det) {
            //             var newLine = customLines.addNewLine();
            //             newLine.setCreditAmount(Math.abs(account_amount_resto));
            //             newLine.setAccountId(account_credit_det);

            //             var newLine = customLines.addNewLine();
            //             newLine.setDebitAmount(Math.abs(account_amount_resto));
            //             newLine.setAccountId(account_debit_det);
            //         }
            //     }
            // }


        } catch (e) {
            nlapiLogExecution('ERROR', FACTURA_COMPRA, e);
        }

    } else if (recType === PAGO_PROVEEDOR) {

        try {
            //var cuenta_pago = transactionRecord.getFieldValue('custbody2');
            var accountRecord = Number(getAccountRecord(PAGO_PROVEEDOR));
            const bp_department = Number(transactionRecord.getFieldValue('department'));
            const bp_class = Number(transactionRecord.getFieldValue('class'));
            const bp_location = Number(transactionRecord.getFieldValue('location'));
            const memo_pago = 'CUENTA DE PAGO';

            if (accountRecord) {
                accountRecord = Number(accountRecord);

                var newLine = customLines.addNewLine();
                newLine.setDebitAmount(standardLines.getLine(0).getCreditAmount());
                newLine.setAccountId(standardLines.getLine(0).getAccountId());
                newLine.setEntityId(standardLines.getLine(0).getEntityId());
                newLine.setDepartmentId(bp_department);
                newLine.setClassId(bp_class);
                newLine.setLocationId(bp_location);
                newLine.setMemo(memo_pago);

                var newLine = customLines.addNewLine();
                newLine.setCreditAmount(standardLines.getLine(0).getCreditAmount());
                newLine.setAccountId(accountRecord);
                newLine.setEntityId(standardLines.getLine(0).getEntityId());
                newLine.setDepartmentId(bp_department);
                newLine.setClassId(bp_class);
                newLine.setLocationId(bp_location);
                newLine.setMemo(memo_pago);

            }

        } catch (e) {
            nlapiLogExecution('ERROR', PAGO_PROVEEDOR, e);
        }

    } else if (recType === PAGO_ANTICIPADO) {

        try {
            if (currency == MONEDA_DOLARES) {
                //var account_anticipo_dolares = obtenerCuentaAnticipo(transactionRecord);
                var account_anticipo_dolares = getAccountRecord(MONEDA_DOLARES)
                if (!account_anticipo_dolares) return;
                const memo_pa = transactionRecord.getFieldValue('memo');

                account_anticipo_dolares = Number(account_anticipo_dolares);

                const department_pa = Number(transactionRecord.getFieldValue('department'));
                const class_pa = Number(transactionRecord.getFieldValue('class'));
                const location_pa = Number(transactionRecord.getFieldValue('location'));
                const account_anticipo = Number(transactionRecord.getFieldValue('prepaymentaccount'));


                var newLine = customLines.addNewLine();
                newLine.setCreditAmount(standardLines.getLine(1).getDebitAmount());
                newLine.setAccountId(account_anticipo);
                newLine.setEntityId(standardLines.getLine(1).getEntityId());
                newLine.setDepartmentId(department_pa);
                newLine.setClassId(class_pa);
                newLine.setLocationId(location_pa);
                newLine.setMemo(memo_pa);


                var newLine = customLines.addNewLine();
                newLine.setDebitAmount(standardLines.getLine(1).getDebitAmount());
                newLine.setAccountId(account_anticipo_dolares);
                newLine.setEntityId(standardLines.getLine(1).getEntityId());
                newLine.setDepartmentId(department_pa);
                newLine.setClassId(class_pa);
                newLine.setLocationId(location_pa);
                newLine.setMemo(memo_pa);

            }

        } catch (e) {
            nlapiLogExecution('ERROR', PAGO_ANTICIPADO, e);
        }
    }
}

function obtenerCuentaAnticipo(transactionRecord) {
    try {
        var subsidiaryId = transactionRecord.getFieldValue('subsidiary');
        var subsidiaryRecord = nlapiLoadRecord('subsidiary', subsidiaryId);
        var vendorPrepaymentAccount = subsidiaryRecord.getFieldValue('custrecord_anticipo_prov_dolares');
        return vendorPrepaymentAccount;
    } catch (error) {
        nlapiLogExecution('ERROR obtenerCuentaAnticipo', PAGO_ANTICIPADO, e);
    }
}


function getAccountRecord(transactionID) {
    try {
        var customSearch = nlapiSearchRecord("customrecord_pe_account_setup",null,
            [
                ["custrecord_pe_account_setup_id","is",transactionID]
            ], 
            [
                new nlobjSearchColumn("custrecord_pe_account_setup_account")
            ]
        );
        for (var i = 0; customSearch != null && i < customSearch.length; i++){
            var searchresult = customSearch[i];
            var internalField = searchresult.getValue('custrecord_pe_account_setup_account');
            
        }

        return internalField;
    } catch (error) {
        nlapiLogExecution('ERROR obtenerCuentaAnticipo', PAGO_ANTICIPADO, e);
    }
}