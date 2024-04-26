/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
 define(['N/log', 'N/search', 'N/record', 'N/https', 'N/runtime', '../Library/TS_LIB_ControlPresupuestal.js'], function (log, search, record, https, runtime, libCP) {



    function _post(context) {
        log.error('todo bien')
        var factura = context.nroFacturaSUNAT.split('-');
        var trandate = context.fechaEmision.split('/');
        var duedate = context.fechaVencimiento.split('/');
        var moneda = 1;
        //var tipoDocumento = 101;

        var customsearch = search.create({
            type: "customrecord_pe_fiscal_document_type",
            filters:
                [
                    ["custrecord_pe_code_document_type", "is", context.tipoDocumento]
                ],
            columns:
                [
                    search.createColumn({ name: "internalid", label: "Internal ID" })
                ]
        });

        var searchResult = customsearch.run().getRange({ start: 0, end: 1 });
        var tipoDocumento = searchResult[0].getValue(customsearch.columns[0]);


        let response = 0;

        log.debug('todo bien')
        try {
            let aprobador = runtime.getCurrentScript().getParameter({
                    name: 'custscript_ts_zigleet_proveedo_aprovador'
                }),
                accountPEN = runtime.getCurrentScript().getParameter({
                    name: 'custscript_ts_zigleet_proveedo_soles'
                }),
                accountUSD = runtime.getCurrentScript().getParameter({
                    name: 'custscript_ts_zigleet_proveedo_dolares'
                }),
                codeDetraccion = runtime.getCurrentScript().getParameter({
                    name: 'custscript_ts_zigleet_proveedo_detrac'
                });
                taxCodeUSD = runtime.getCurrentScript().getParameter({
                    name: 'custscript_ts_zigleet_proveedo_tax_usd'
                }); // Deberian crear 2 campos en el record PE Concept Detraction, lo deje bonito en TsNet pero sin probar.
                taxCodePEN = runtime.getCurrentScript().getParameter({
                    name: 'custscript_ts_zigleet_proveedo_tax_pen'
                });

            var account = accountPEN;

            /** Detracción */
            var subSearch = search.lookupFields({
                type: 'subsidiary',
                id: 3,
                columns: ['custrecord_pe_detraccion_account', 'custrecord_pe_detraccion_account_dol']
            });
           
            if(context.monedaFactura == "USD") var accountDetracción = subSearch.custrecord_pe_detraccion_account_dol[0].value, taxCode = taxCodeUSD;
            else var accountDetracción = subSearch.custrecord_pe_detraccion_account[0].value, taxCode = taxCodePEN;
            
            var discountitemSearchObj = search.create({
                type: "discountitem",
                filters:
                [
                   ["type","anyof","Discount"], 
                   "AND", 
                   ["account","anyof",accountDetracción]
                ],
                columns:
                [
                   search.createColumn({name: "internalid", label: "Internal ID"})
                ]
             });
           
            var searchResultCount = discountitemSearchObj.run().getRange(0,1);
            if(searchResultCount.length != 0){
                var columns = searchResultCount[0].columns;
                var itemDis = searchResultCount[0].getValue(columns[0]);
                
            }

            var detraccionSeach = search.lookupFields({
                type: 'customrecord_pe_concept_detraction',
                id: codeDetraccion,
                columns: ['custrecord_pe_percentage_detraction']
            });

            let auxiliar = (detraccionSeach.custrecord_pe_percentage_detraction).split('%');
            var porcentaje_entero = Number(auxiliar[0]);
            var porcentaje_decimal = Number(auxiliar[0])/100;

            /***/

            var tipoCampio = 1.00;
            var newBill = record.create({ type: 'vendorbill', isDynamic: true });

            newBill.setValue({ fieldId: 'entity', value: searchVendorInternalIds(context.ruc) });
            newBill.setValue({ fieldId: 'trandate', value: new Date(trandate[2] + '/' + trandate[1] + '/' + trandate[0]) });
            newBill.setValue({ fieldId: 'duedate', value: new Date(duedate[2] + '/' + duedate[1] + '/' + duedate[0]) });

            if (context.monedaFactura == "USD") {
                log.debug('todo bien 1')
                account = accountUSD
                moneda = 2;
                let myRestletHeaders = new Array();
                myRestletHeaders['Accept'] = '*/*';
                myRestletHeaders['Content-Type'] = 'application/json';
                let PxAdmin = {
                    "data": {
                        "fecha": trandate[2] + '-' + trandate[1] + '-' + trandate[0]
                    }
                }
                let myRestletResponse = https.requestRestlet({
                    body: JSON.stringify(PxAdmin),
                    deploymentId: 'customdeploy_ts_consultatipocambio',
                    scriptId: 'customscript_ts_consultatipocambio',
                    headers: myRestletHeaders,
                });
                response = JSON.parse(myRestletResponse.body);
                tipoCampio = response.data.venta;
            }

            newBill.setValue({ fieldId: 'currency', value: moneda });
            newBill.setValue({ fieldId: 'account', value: account });
            //newBill.setValue({ fieldId: 'exchangerate', value: tipoCampio });
            newBill.setValue({ fieldId: 'custbody_exchange_hidden', value: tipoCampio });
            newBill.setValue({ fieldId: 'nextapprover', value: aprobador });

            newBill.setValue({ fieldId: 'subsidiary', value: 3 });
            newBill.setValue({ fieldId: 'custbody_pe_document_type', value: tipoDocumento });
            newBill.setValue({ fieldId: 'custbody_pe_serie_cxp', value: factura[0] });
            newBill.setValue({ fieldId: 'custbody_pe_number', value: factura[1] });

            var jsonCP = {
                subsidiary: 3,
                anio: trandate[2],
                currency: moneda,
                rate: tipoCampio,
                lines: [
                ]
            };

            var arrLines = [];
            const sumasPorCodigoServicio = {};


            context.listaDetalle.forEach(obj => {
                const codigoServicio = obj.codigoServicio;
                const montoSinIGV = obj.MontosinIGV;
                const cantidad = parseInt(obj.cantidad, 10);

                if (sumasPorCodigoServicio[codigoServicio]) {

                    sumasPorCodigoServicio[codigoServicio] += montoSinIGV * cantidad;
                } else {

                    sumasPorCodigoServicio[codigoServicio] = montoSinIGV * cantidad;
                }
            });
            const keys = Object.keys(sumasPorCodigoServicio);
            const values = Object.values(sumasPorCodigoServicio);
            const objectFinal = {};
              log.debug('keys',keys);
            for (let i = 0; i < keys.length; i++) {
                let result = searchItemsInternalIds(keys[i]);
               
                jsonCP.lines.push({
                    department: result.department,
                    clase: result.classi,
                    amount: values[i],
                    numLine: i
                })
               objectFinal[keys[i]]={
                  department: result.department,
                  clase: result.classi,
                  itemid : result.itemid,
                  partida:'',
                  numLine: i
               }
                
            }
            
            var resultsItems = libCP.passesControlPresupuestal(jsonCP);
           log.error('jsonCP', jsonCP);
             log.error('resultsItems', resultsItems);
             if (!resultsItems.value) {
                 return {
                     codResp: '99',
                     descResp: 'ERROR_CONTROL_PRESUPUESTAL - ' + resultsItems.message
                 };
             } 
            var totalRetencion = 0;

            for (let index = 0; index < context.listaDetalle.length; index++) {
                newBill.selectNewLine({ sublistId: 'item' });
                let dateIni = (context.listaDetalle[index].fechaInicio).split('/'),
                    dateFin = (context.listaDetalle[index].fechaFin).split('/');

                if(index == 0){
                    var classIndex = objectFinal[context.listaDetalle[index].codigoServicio].clase;
                    var departmentIndex = objectFinal[context.listaDetalle[index].codigoServicio].department;
                    var partidaIndex = resultsItems.partida[objectFinal[context.listaDetalle[index].codigoServicio].numLine][0];
                }

                newBill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value:  objectFinal[context.listaDetalle[index].codigoServicio].itemid });
                newBill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'description', value: context.listaDetalle[index].descServicio });
                newBill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_asb_fec_ini_ln', value: new Date(dateIni[2] + '/' + dateIni[1] + '/' + dateIni[0]) });
                newBill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_asb_fec_fin_ln', value: new Date(dateFin[2] + '/' + dateFin[1] + '/' + dateFin[0]) });
                newBill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: context.listaDetalle[index].cantidad });
                newBill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'amount', value: context.listaDetalle[index].MontosinIGV });
                newBill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: context.listaDetalle[index].MontosinIGV/context.listaDetalle[index].cantidad });
                newBill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'taxcode', value: 6 }); //Setearon esto, arreglenlo. Aunque es un valor de Netsuite, quzia sirva.
                /** Montos de la Detraccion */
                var retencion_fila = 0;
                var total_fila =  context.listaDetalle[index].MontoconIGV;
                retencion_fila = porcentaje_decimal * total_fila;

                newBill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxamount', line: i, value: -retencion_fila });
                newBill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxapplies', line: i, value: true });
                newBill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxbaseamount', line: i, value: total_fila });
                newBill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxcode', line: i, value: taxCode });
                newBill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxrate', line: i, value: porcentaje_entero });
                
                totalRetencion = Number(totalRetencion) + Number(retencion_fila);
                log.debug('totalRetencion', totalRetencion)

                newBill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'department', value: objectFinal[context.listaDetalle[index].codigoServicio].department });
                newBill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'class', value: objectFinal[context.listaDetalle[index].codigoServicio].clase });
                newBill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ts_budget_item', value: resultsItems.partida[objectFinal[context.listaDetalle[index].codigoServicio].numLine][0] });

                newBill.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: 1 });

                


                newBill.commitLine({
                    sublistId: 'item'
                });
            }

            

            // Guardar la factura
            var billId = newBill.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            log.debug('Result', billId);

           
            var recBill = record.load({ type: 'vendorbill', id: billId, isDynamic: true })
            recBill.setValue('custbody_pe_concept_detraction', codeDetraccion);
            log.debug('mirame', recBill.getValue('custpage_4601_witaxcode'));
            var details_item = recBill.getLineCount('item');
              
            var totalAmount = 0;
            for (var k = 0; k < details_item; k++) {
                var amount = recBill.getSublistValue({ sublistId: 'item', fieldId: 'grossamt', line: k });
               
                if (amount != 0) {
                    totalAmount += amount
                }            
            }
            log.debug('mirame 2', totalAmount)
            log.debug('mirame 2', totalAmount * porcentaje_decimal)
            var retencion = totalAmount * porcentaje_decimal;

            var itemLine = recBill.selectNewLine({ sublistId: 'item' });
            itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: itemDis});
            //recordLoad.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', line: details_item, value: recordLoad.getSublistValue({ sublistId: ITEM, fieldId: 'quantity', line: 0 }) });
            //recordLoad.setCurrentSublistValue({ sublistId: 'item', fieldId: 'description', line: details_item, value: recordLoad.getSublistValue({ sublistId: ITEM, fieldId: 'description', line: 0 }) });
            itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: - (retencion).toFixed(2) });
            itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'taxcode', value: 5 }); // Sera?
            itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'department', value: departmentIndex});
            itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'class', value: classIndex});
            itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_ts_budget_item', value: partidaIndex });
            itemLine.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxline', value: true });
            recBill.commitLine({
                sublistId: 'item'
            });
        
              recBill.save({
                      ignoreMandatoryFields: true,
                      enableSourcing: false,
                    });
          
            return {
                codResp: '00',
                descResp: 'Procesado correctamente'
            };
        } catch (error) {
            log.error('Error-POST', error);
            return {
                codResp: '99',
                descResp: error.message
            };

        }
    }

    const searchVendorInternalIds = (clase) => {

        let searchFilter = search.createFilter({
            name: "custentity_pe_document_number",
            operator: search.Operator.CONTAINS,
            values: clase
        });

        let claseSearch = search.create({
            type: 'vendor',
            filters: [searchFilter],
            columns: ["internalid"]
        });

        let searchResult = claseSearch.run().getRange({ start: 0, end: 1 });

        if (searchResult.length > 0) {
            return searchResult[0].getValue({ name: "internalid" });
        }

        return null;
    }
    const searchItemsInternalIds = (clase) => {

        let searchFilter = search.createFilter({
            name: "itemid",
            operator: search.Operator.CONTAINS,
            values: clase
        });

        let claseSearch = search.create({
            type: 'serviceitem',
            filters: [searchFilter],
            columns: ["internalid", "department", "class"]
        });

        let searchResult = claseSearch.run().getRange({ start: 0, end: 1 });

        if (searchResult.length > 0) {
            let itemid = searchResult[0].getValue({ name: "internalid" });
            let department = searchResult[0].getValue({ name: "department" });
            let classi = searchResult[0].getValue({ name: "class" });
            
            return {
                itemid: itemid,
                department: department,
                classi: classi
            }
        }

        return null;
    }

    return {

        post: _post,

    }
});