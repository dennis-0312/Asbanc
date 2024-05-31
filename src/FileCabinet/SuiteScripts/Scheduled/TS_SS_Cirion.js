/**
*@NApiVersion 2.1
*@NScriptType ScheduledScript
*
* Task          Date            Author                                         Remarks
* CIRION        16 Jul 2023     Ivan Morales <imorales@myevol.biz>             Creación de VendorBill
*
*/


define(['N/xml', 'N/runtime', "N/file", "N/record", "N/https", "N/search"], (xml, runtime, file, record, https, search) => {
    const execute = (context) => {
        const FN = 'execute';
        try {
            log.debug('MSK', '');
            log.debug('MSK', 'INICIO DEL PROCESO CIRION');

            /*
            const billRecord = record.create({ type: "vendorbill", isDynamic: true });
            billRecord.setValue({ fieldId: "entity", value: 5628 });        
            billRecord.setValue({ fieldId: "custbody_ts_integracion", value: 22 })
            billRecord.setValue({ fieldId: "nextapprover", value: 13 }); 
            billRecord.setValue({ fieldId: "trandate", value: new Date() });
            billRecord.setValue({ fieldId: "duedate", value: new Date() });
            billRecord.setValue({ fieldId: "currency", value: 1, });
            billRecord.setValue({ fieldId: "exchangerate", value: 1 });
            billRecord.setValue({ fieldId: "subsidiary", value: 3 });
            billRecord.setValue({ fieldId: "custbody_pe_document_type", value: 103 });
            billRecord.setValue({ fieldId: "custbody_pe_serie_cxp", value: 'F003' });
            billRecord.setValue({ fieldId: "custbody_pe_number", value: '000000102' });
            
            billRecord.selectNewLine({ sublistId: 'item' });
            billRecord.setCurrentSublistValue({ sublistId: "item", fieldId: "item", value: 1945, });        
            billRecord.setCurrentSublistValue({ sublistId: "item", fieldId: "item_display", value: "Saldos Iniciales CxP" });        
            billRecord.setCurrentSublistValue({ sublistId: "item", fieldId: "quantity", value: 1 });        
            billRecord.setCurrentSublistValue({ sublistId: "item", fieldId: "taxcode", value: 6 });        
            billRecord.setCurrentSublistValue({ sublistId: "item", fieldId: "department", value: 1209 });        
            billRecord.setCurrentSublistValue({ sublistId: "item", fieldId: "class", value: 8 });        
            billRecord.setCurrentSublistValue({ sublistId: "item", fieldId: "location", value: 1 });        
            billRecord.commitLine({ sublistId: "item", });
            let newBill = billRecord.save({ ignoreMandatoryFields: true, enableSourcing: true });
            log.debug({ title: "newBill", details: newBill });
*/







            /**/
            //! 1. llamar a "Lista de Archivos SFTP" con tipo "CIRION" y estado "Descargado"
            // log.debug('MSK', 'Traza 1');
            var customrecord_archivos_sftpSearchObj = search.create({
                type: 'customrecord_archivos_sftp',
                filters: [
                    ['custrecord_ns_tipo', 'is', '5'],//CIRION
                    'AND',
                    ['custrecord_ns_estado', 'is', '1']//Descargado
                ],
                columns: ['internalid', 'custrecord_ns_rs_id', 'custrecord_nombre_archivo']
            });

            var searchResults = customrecord_archivos_sftpSearchObj.run().getRange({
                start: 0,
                end: 100//No habrá muchas facturas al mes por parte de CIRION
            });

            //! 2. Recorrer los archivos encontrados
            // log.debug('MSK', 'Traza 2');
            searchResults.forEach(function (result) {
                // log.debug('MSK', '----');
                var id = result.getValue({ name: 'internalid' });
                var rsId = result.getValue({ name: 'custrecord_ns_rs_id' });
                var nombreArchivo = result.getValue({ name: 'custrecord_nombre_archivo' });

                // Realizar operaciones con los valores recuperados
                log.debug('MSK', 'ID del Archivo en Lista de Archivo SFTP = ' + id);
                log.debug('MSK', 'ID del archivo en NetSuite = ' + rsId);
                log.debug('MSK', 'Nombre del Archivo = ' + nombreArchivo);

                try {
                    //! 2.1 Leer archivo XML
                    // log.debug('MSK', 'Traza 2.1');
                    log.debug('MSK', 'Leyendo archivo XML ' + nombreArchivo + " ...");
                    var xmlFileContent = file.load(rsId).getContents();
                    var xmlDocument = xml.Parser.fromString(xmlFileContent);
                    var invoiceElement = xmlDocument.getElementsByTagName("Invoice")[0];

                    let invoice = {}
                    //ID
                    var nro_factura_sunat = invoiceElement.getElementsByTagName("cbc:ID")[0].textContent;

                    //PRoveedor RUC
                    var AccountingSupplierParty = invoiceElement.getElementsByTagName("cac:AccountingSupplierParty")[0];
                    var Party = AccountingSupplierParty.getElementsByTagName("cac:Party")[0];
                    var PartyIdentification = Party.getElementsByTagName("cac:PartyIdentification")[0];
                    var proveedor_ruc = PartyIdentification.getElementsByTagName("cbc:ID")[0].textContent;
                    
                    var subsidiaria_valor="";
                    //Cliente RUC
                    var AccountingCustomerParty = invoiceElement.getElementsByTagName("cac:AccountingCustomerParty")[0];
                    var c_Party = AccountingCustomerParty.getElementsByTagName("cac:Party")[0];
                    var c_PartyIdentification = c_Party.getElementsByTagName("cac:PartyIdentification")[0];
                    var cliente_ruc = c_PartyIdentification.getElementsByTagName("cbc:ID")[0].textContent;

                    log.debug("RUC-Cliente = "+cliente_ruc)
                    if(cliente_ruc=="20139491077"){
                        subsidiaria_valor="3"
                    }else if(cliente_ruc=="20548993513"){
                        subsidiaria_valor="4"
                    }else{
                        subsidiaria_valor="3"
                    }
                    log.debug("subsidiaria_valor = "+subsidiaria_valor)

                    //Cabecera
                    var fecha_emision = invoiceElement.getElementsByTagName("cbc:IssueDate")[0].textContent;
                    var fecha_vencimiento = invoiceElement.getElementsByTagName("cbc:DueDate")[0].textContent;
                    var tipo_documento = invoiceElement.getElementsByTagName("cbc:InvoiceTypeCode")[0].textContent;
                    var moneda = invoiceElement.getElementsByTagName("cbc:DocumentCurrencyCode")[0].textContent;

                    var invoiceLines = invoiceElement.getElementsByTagName("cac:InvoiceLine");

                    var Items = [];
                    for (var i = 0; i < invoiceLines.length; i++) {
                        let item = {}
                        let description_item = null
                        let codigo_item = null
                        let fecha_inicio = null
                        let fecha_fin = null
                        let monto_sin_igv = null
                        let igv = null
                        let monto_con_igv = null
                        let porcentaje_igv = null

                        var invoiceLine = invoiceLines[i];

                        //Descripcion
                        var itemElements = invoiceLine.getElementsByTagName("cac:Item");
                        if (itemElements.length > 0) {
                            var descriptionElement = itemElements[0].getElementsByTagName("cbc:Description")[0];
                            var description = descriptionElement.childNodes[0].nodeValue.trim();
                            description_item = description
                            codigo_item = description_item.length >= 5 ? description.substring(0, 5) : description_item
                            var ultimosVeintiTresCaracteres = description_item.substring(description_item.length - 23);
                            fecha_inicio = ultimosVeintiTresCaracteres.split('-')[0].trim()
                            fecha_fin = ultimosVeintiTresCaracteres.split('-')[1].trim()
                            //cambiando formato de dd/mm/yyyy a yyyy-mm-dd
                            fecha_inicio = fecha_inicio.split('/')[2]+"-"+fecha_inicio.split('/')[1]+"-"+fecha_inicio.split('/')[0]
                            fecha_fin = fecha_fin.split('/')[2]+"-"+fecha_fin.split('/')[1]+"-"+fecha_fin.split('/')[0]
                        }

                        //Cantidad
                        var cantidad = invoiceLine.getElementsByTagName("cbc:InvoicedQuantity")[0].textContent;

                        //Monto
                        var taxTotalElements = invoiceLine.getElementsByTagName("cac:TaxTotal");
                        if (taxTotalElements.length > 0) {
                            var taxSubTotalElements = invoiceLine.getElementsByTagName("cac:TaxSubtotal");
                            if (taxSubTotalElements.length > 0) {
                                var TaxableAmount = taxSubTotalElements[0].getElementsByTagName("cbc:TaxableAmount")[0];
                                var mi_TaxableAmount = TaxableAmount.childNodes[0].nodeValue.trim();
                                var TaxAmount = taxSubTotalElements[0].getElementsByTagName("cbc:TaxAmount")[0];
                                var mi_TaxAmount = TaxAmount.childNodes[0].nodeValue.trim();
                                monto_sin_igv = mi_TaxableAmount
                                igv = mi_TaxAmount
                                if (taxSubTotalElements.length > 0) {
                                    var TaxCategoryElements = invoiceLine.getElementsByTagName("cac:TaxCategory");
                                    if (TaxCategoryElements.length > 0) {
                                        var Percent = TaxCategoryElements[0].getElementsByTagName("cbc:Percent")[0];
                                        var mi_Percent = Percent.childNodes[0].nodeValue.trim();
                                        porcentaje_igv = mi_Percent
                                    }
                                }
                            }
                        }

                        //Monto
                        var pricingReferenceElements = invoiceLine.getElementsByTagName("cac:PricingReference");
                        if (pricingReferenceElements.length > 0) {
                            var AlternativeConditionPriceElements = invoiceLine.getElementsByTagName("cac:AlternativeConditionPrice");
                            if (AlternativeConditionPriceElements.length > 0) {
                                var PriceAmount = AlternativeConditionPriceElements[0].getElementsByTagName("cbc:PriceAmount")[0];
                                var mi_PriceAmount = PriceAmount.childNodes[0].nodeValue.trim();
                                monto_con_igv = mi_PriceAmount
                            }
                        }

                        item.codigo_item = codigo_item
                        item.description_item = description_item
                        item.fecha_inicio = fecha_inicio
                        item.fecha_fin = fecha_fin
                        item.cantidad = cantidad
                        item.monto_sin_igv = monto_sin_igv
                        item.igv = igv
                        item.monto_con_igv = monto_con_igv
                        item.porcentaje_igv = porcentaje_igv
                        item.departamento = ""
                        item.clase = ""
                        item.ubicacion = ""
                        Items.push(item);
                        // log.debug('MSK-Item['+(i+1)+']', item);
                    }

                    invoice.nro_factura_sunat = nro_factura_sunat
                    invoice.proveedor_ruc = proveedor_ruc
                    invoice.fecha_emision = fecha_emision
                    invoice.fecha_vencimiento = fecha_vencimiento
                    invoice.tipo_documento = tipo_documento
                    invoice.moneda = moneda
                    invoice.tipo_cambio = getTipoCambio(fecha_emision);
                    invoice.cuenta = (invoice.moneda == "PEN" ? "4212101" : "4212201")
                    invoice.departamento = ""
                    invoice.clase = ""
                    invoice.ubicacion = ""
                    invoice.periodo_contable = getPeriodoByFecha(invoice.fecha_emision)
                    invoice.subsidiaria = 'ASBANC'
                    invoice.Items = Items

                    //! 2.2 Crear el Vendor Bill
                    log.debug('MSK', 'Creando Vendor Bill ...');
                    // Crear un nuevo registro de factura
                    var billRecord = record.create({ type: record.Type.VENDOR_BILL, isDynamic: true });
                    billRecord.setValue({ fieldId: 'entity', value: '3797' });// CIRION
                    billRecord.setValue({ fieldId: 'custbody_pe_document_type', value: 103 });// Tipo Factura
                    billRecord.setValue({ fieldId: 'custbody_pe_serie_cxp', value: invoice.nro_factura_sunat.split('-')[0] });//Serie
                    billRecord.setValue({ fieldId: 'custbody_pe_number', value: (invoice.nro_factura_sunat.split('-')[1]).padStart(8, '0') });//Correlativo

                    log.debug('MSK','invoice.fecha_emision='+invoice.fecha_emision)
                    log.debug('MSK','invoice.fecha_vencimiento='+invoice.fecha_vencimiento)
                    invoice.fecha_emision = invoice.fecha_emision.split('-')[1]+'-'+invoice.fecha_emision.split('-')[2]+'-'+invoice.fecha_emision.split('-')[0]
                    invoice.fecha_vencimiento = invoice.fecha_vencimiento.split('-')[1]+'-'+invoice.fecha_vencimiento.split('-')[2]+'-'+invoice.fecha_vencimiento.split('-')[0]
                    
                    log.debug('MSK','cambio...')
                    log.debug('MSK','invoice.fecha_emision='+invoice.fecha_emision)
                    log.debug('MSK','invoice.fecha_vencimiento='+invoice.fecha_vencimiento)
                    log.debug('MSK','new Date(invoice.fecha_emision)='+new Date(invoice.fecha_emision))
                    log.debug('MSK','new Date(invoice.fecha_vencimiento)='+new Date(invoice.fecha_vencimiento))

                    billRecord.setValue({ fieldId: 'trandate', value: new Date(invoice.fecha_emision) });//Fecha emision
                    billRecord.setValue({ fieldId: 'duedate', value: new Date(invoice.fecha_vencimiento) });//Fecha vencimiento
                    billRecord.setValue({ fieldId: 'currency', value: (invoice.moneda == "PEN" ? "1" : "2") });//Moneda
                    billRecord.setValue({ fieldId: 'exchangerate', value: invoice.tipo_cambio });//Moneda
                    // billRecord.setValue({ fieldId: 'subsidiary', value: 3 });//Subsidiaria Asbanc
                    billRecord.setValue({ fieldId: 'subsidiary', value: subsidiaria_valor });//Subsidiaria Asbanc
                    billRecord.setValue({ fieldId: 'nextapprover', value: '251' });//!Siguiente aprobador en duro (E-474 OSWALDO ASPILCUETA SALAS)
                    billRecord.setValue({ fieldId: 'custbody_ts_integracion', value: '251' });//!User email en duro (E-474 OSWALDO ASPILCUETA SALAS)
                    //billRecord.setValue({ fieldId: "custbody_ts_integracion", value: 22 })
                    billRecord.setValue({ fieldId: "custbody_exchange_hidden", value: invoice.tipo_cambio })//20231010

                    let error_detale = "";
                    for (var i = 0; i < invoice.Items.length; i++) {
                        // var itemId = '1627';//!Articulo en duro

                        var itemId_cirion = invoice.Items[i].description_item.split(' ')[0].trim();
                        log.debug("MSK-PRD","invoice.Items[i].description_item="+invoice.Items[i].description_item)
                        log.debug("MSK-PRD","itemId_cirion="+itemId_cirion)
                        // var itemId_cirion = "V-9-VA-064_SERVICIOS GENERALESSaldos Iniciales CxP"// Es el articulo con ID 1627

                        let depa_class_valido = false
                        var department = 0
                        var className = 0
                        var itemId_Netsuite = 0

                        // var filters = [ ["itemid", "is", itemId_cirion] ];
                        var filters = [
                            search.createFilter({ name: 'itemid', operator: search.Operator.IS, values: itemId_cirion })
                        ];
                        // var columns = [ "class", "department", "id" ];
                        var columns = [
                            search.createColumn({ name: 'class' }),
                            search.createColumn({ name: 'department' }),
                            search.createColumn({ name: 'internalid' })
                        ];
                        // var searchResults = nlapiSearchRecord("serviceitem", null, filters, columns);
                        var misearch = search.create({
                            type: 'serviceitem',
                            filters: filters,
                            columns: columns
                        });
                        var searchResults = misearch.run();
                        var firstResult = searchResults.getRange({ start: 0, end: 1 })[0];

                        if (firstResult) {
                            className = firstResult.getValue({ name: 'class' });
                            department = firstResult.getValue({ name: 'department' });
                            itemId_Netsuite = firstResult.getValue({ name: 'internalid' });
                        }

                        try {
                            if (className == null || className == 0 || department == null || department == 0 || itemId_Netsuite == null || itemId_Netsuite == 0) {
                                error_detale += "Error fila [" + (i + 1) + "] -> className=" + className + ", department=" + department + ", itemId_Netsuite=" + itemId_Netsuite + ", \n"
                            } else {
                                depa_class_valido = true
                            }
                        } catch (err) {
                            error_detale += "Error fila [" + (i + 1) + "] -> No se pudo recuperar departamento, clase y idNetsuite con el itemId_cirion(" + itemId_cirion + ")\n"
                        }
                        // log.debug('MSK', 'department ->'+department);
                        // log.debug('MSK', 'className ->'+className);
                        if (depa_class_valido) {
                            billRecord.selectNewLine({ sublistId: 'item' });

                            billRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: itemId_Netsuite });
                            billRecord.setCurrentSublistValue({ sublistId: "item", fieldId: "item_display", value: "Saldos Iniciales CxP" });
                            billRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'description', value: invoice.Items[i].description_item });//Descripción
                            billRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: invoice.Items[i].cantidad });//Cantidad
                            billRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'taxcode', value: '6' });//Codigo de Impuesto, IGV_PE:S-PE
                            billRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'department', value: department });
                            billRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'class', value: className });
                            billRecord.setCurrentSublistValue({ sublistId: "item", fieldId: "location", value: 1 });
                            
                            // log.debug('MSK', 'pre-commit[' + (i + 1) + '] --> '+invoice.Items[i].fecha_inicio+"  "+invoice.Items[i].fecha_fin);
                            billRecord.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol_asb_fec_ini_ln", value: new Date(invoice.Items[i].fecha_inicio) });
                            billRecord.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol_asb_fec_fin_ln", value: new Date(invoice.Items[i].fecha_fin) });

                            billRecord.setCurrentSublistValue({ sublistId: "item", fieldId: "rate", value: invoice.Items[i].monto_sin_igv });
                            //billRecord.setCurrentSublistValue({ sublistId: "item", fieldId: "rate", value: 150.00 });
                            
                            log.debug('MSK-monto_sin_igv['+(i+1)+']', invoice.Items[i].monto_sin_igv);

                            billRecord.commitLine({ sublistId: 'item' });
                        }

                    }

                    if (error_detale == "") {
                        var billId = billRecord.save({
                            ignoreMandatoryFields: true,
                            enableSourcing: true,
                        });
                        log.debug('MSK', 'Vendor Bill creada con ID: ' + billId);

                        //!2.3 Update al archivo del SFTP (estado 3)
                        var archivoSFTPRecord = record.load({ type: 'customrecord_archivos_sftp', id: id });
                        if (archivoSFTPRecord) {
                            archivoSFTPRecord.setValue({ fieldId: 'custrecord_ns_estado', value: '3' });
                            archivoSFTPRecord.save();
                            log.debug('MSK', 'Archivo del SFTP [' + id + '] actualizado a Correcto');
                        } else {
                            log.debug('MSK', 'Archivo del SFTP [' + id + '] no encontrado');
                        }
                    } else {
                        log.debug('MSK', 'error_detale=' + error_detale);
                        //!2.4 Update al archivo del SFTP (estado 2)
                        var archivoSFTPRecord = record.load({ type: 'customrecord_archivos_sftp', id: id });
                        if (archivoSFTPRecord) {
                            archivoSFTPRecord.setValue({ fieldId: 'custrecord_ns_estado', value: '2' });
                            archivoSFTPRecord.save();
                            log.debug('MSK', 'Archivo del SFTP [' + id + '] actualizado a Error');
                        } else {
                            log.debug('MSK', 'Archivo del SFTP [' + id + '] no encontrado');
                        }

                        //!2.5 Creando archivo Log csv
                        var today = new Date();
                        var formattedDate = (
                            today.getFullYear() +
                            ('0' + (today.getMonth() + 1)).slice(-2) +
                            ('0' + today.getDate()).slice(-2) +
                            ('0' + today.getHours()).slice(-2) +
                            ('0' + today.getMinutes()).slice(-2) +
                            ('0' + today.getSeconds()).slice(-2)
                        );

                        var files = file.create({
                            name: nombreArchivo.split('.')[0] + "_" + formattedDate + '.csv',
                            fileType: file.Type.CSV,
                            contents: error_detale,//!error_detale
                            folder: 438 // ID de la carpeta en la que deseas guardar el archivo, reemplaza con el valor correcto.
                        });
                        var fileId = files.save();
                    }

                }
                catch (ex) {
                    log.debug('MSK', 'Error -> ' + ex);
                    //!2.4 Update al archivo del SFTP (estado 3)
                    var archivoSFTPRecord = record.load({ type: 'customrecord_archivos_sftp', id: id });
                    if (archivoSFTPRecord) {
                        archivoSFTPRecord.setValue({ fieldId: 'custrecord_ns_estado', value: '2' });
                        archivoSFTPRecord.save();
                        log.debug('MSK', 'Archivo del SFTP [' + id + '] actualizado a Error');
                    } else {
                        log.debug('MSK', 'Archivo del SFTP [' + id + '] no encontrado');
                    }

                    //!2.5 Creando archivo Log csv
                    var today = new Date();
                    var formattedDate = (
                        today.getFullYear() +
                        ('0' + (today.getMonth() + 1)).slice(-2) +
                        ('0' + today.getDate()).slice(-2) +
                        ('0' + today.getHours()).slice(-2) +
                        ('0' + today.getMinutes()).slice(-2) +
                        ('0' + today.getSeconds()).slice(-2)
                    );

                    var files = file.create({
                        name: nombreArchivo.split('.')[0] + "_" + formattedDate + '.csv',
                        fileType: file.Type.CSV,
                        contents: ex.message,//!ex.message
                        folder: 438 // ID de la carpeta en la que deseas guardar el archivo, reemplaza con el valor correcto.
                    });
                    var fileId = files.save();
                }

            });

            /**/
        } catch (e) {
            log.debug('MSK', "error general -> " + e);
        }
    };

    function getTipoCambio(fecha) {
        try {

            let myRestletHeaders = new Array();
            myRestletHeaders['Accept'] = '*/*';
            myRestletHeaders['Content-Type'] = 'application/json';
            let DatosRuc = {
                "data": {
                    "fecha": fecha
                }
            }
            let myRestletResponse = https.requestRestlet({
                body: JSON.stringify(DatosRuc),
                deploymentId: 'customdeploy_ts_consultatipocambio',
                scriptId: 'customscript_ts_consultatipocambio',
                headers: myRestletHeaders,
            });
            let response = myRestletResponse.body;
            log.debug('MSK', 'JSON.parse(response) = ' + JSON.parse(response))
            log.debug('MSK', 'JSON.parse(response).data = ' + JSON.parse(response).data)
            log.debug('MSK', 'fecha del tipo de cambio = ' + fecha)
            log.debug('MSK', 'Tipo de cambio que recupero = ' + JSON.parse(response).data.venta)
            return JSON.parse(response).data.venta
        }
        catch (error) {
            log.debug('MSK', 'Error al llamar al TipoCambio: ' + error)
            log.debug('MSK', 'De todas maneras seguiré')
            return "1"
        }
    }

    function getPeriodoByFecha(fecha) {
        const meses = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const [year, month] = fecha.split("-");

        const periodoContable = `${meses[parseInt(month) - 1]}-${year}`;

        return periodoContable;
    }


    return {
        execute: execute,
    }
});