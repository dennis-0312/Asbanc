/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript

 */
define(['N/record', "N/file", "N/email", "N/encode", "N/search", "N/https", "N/log", "N/sftp", "N/url", 'N/error'],
    function (record, file, email, encode, search, https, log, sftp, url, error) {

        var recordtype = '';
        var FOLDER_PDF = 384; //SB: 421
        var FOLDER_EXCEPTIONS = 1403; //SB: 1403
        var internalId = '';
        var userId = '';
        var correlativo;
        var docstatus2 = 'Parsing Failed';

        function beforeLoad(context) {
            var objRecord = context.newRecord;
        }

        const completarEmail = (objRecord) => {
            var entity = objRecord.getValue('entity');
            if (!entity) return;
            var location = objRecord.getValue('location');
            var department = objRecord.getValue('department');
            var email = objRecord.getValue('email');
            var id = objRecord.getValue('id');

            var contactSearchObj = search.create({
                type: "contact",
                filters: [
                    ["company", "anyof", entity],
                    "AND",
                    ["custentity_asb_envio_fel", "is", "T"]
                ],
                columns: [
                    search.createColumn({ name: "custentity_asb_departamento", label: "ASB Departamento " }),
                    search.createColumn({ name: "email", label: "Email" })
                ]
            });
            var searchResultcontacto = contactSearchObj.run().getRange({ start: 0, end: 1000 });
            for (let index = 0; index < searchResultcontacto.length; index++) {
                var asbdepartamento = searchResultcontacto[index].getValue({ name: "custentity_asb_departamento" });
                var contactEmail = searchResultcontacto[index].getValue({ name: "email" });

                /*if (asbdepartamento == '') {
                    email = email + ';' + searchResultcontacto[index].getValue({ name: "email" });
                }*/
                if (asbdepartamento == department) {
                    if (email.indexOf(contactEmail) == -1) {
                        email = email + ";" + contactEmail;
                    }
                }
            }
            log.error("email", email);
            objRecord.setValue({ fieldId: 'email', value: email });
        }

        function beforeSubmit(context) {
            var objRecord = context.newRecord;

            completarEmail(objRecord);

            var isJEVoid = objRecord.getValue('void');
            if (isJEVoid) {
                try {
                    var date = new Date();
                    var dd = date.getDate();
                    var mm = date.getMonth() + 1; //January is 0!
                    var yyyy = date.getFullYear();
                    mm = mm < 10 ? '0' + mm : mm;
                    dd = dd < 10 ? '0' + dd : dd;
                    var date = yyyy + '-' + mm + '-' + dd;
                    log.debug(date, date);
                    var json = new Array();
                    var jsonLeyenda = new Array();
                    var jsonMain = new Array();
                    var jsonIDE = new Array();
                    var jsonEMI = new Array();
                    var jsonCBR = new Array();
                    var jsonDBR = new Array();
                    var arrayCAB = new Array();
                    var searchLoad = search.create({
                        type: "transaction",
                        filters:
                            [
                                ["type", "anyof", "CustInvc"],
                                "AND",
                                ["internalid", "anyof", id]
                            ],
                        columns:
                            [
                                // IDE---------------------------------------------------------------------------------------------------------------------
                                search.createColumn({ name: "formulatext", formula: "CONCAT({custbody_pe_serie}, CONCAT('-', {custbody_pe_number}))", label: "numeracion" }),//0
                                search.createColumn({ name: "trandate", label: "2 Date" }),
                                search.createColumn({ name: "datecreated", label: "3 Date Created" }),
                                search.createColumn({ name: "formulatext", formula: "CASE WHEN {custbody_pe_document_type} = 'Factura' THEN '01' WHEN {custbody_pe_document_type} = 'Boleta de Venta' THEN '03' END", label: "codTipoDocumento" }),//3
                                search.createColumn({ name: "symbol", join: "Currency", label: "5 Symbol" }),
                                search.createColumn({ name: "otherrefnum", join: "createdFrom", label: "6 PO/Check Number" }),
                                // EMI---------------------------------------------------------------------------------------------------------------------
                                search.createColumn({ name: "formulanumeric", formula: "6", label: "7 Doc. Type ID EMI" }),//6
                                search.createColumn({ name: "taxidnum", join: "subsidiary", label: "8 Tax ID" }),
                                search.createColumn({ name: "formulatext", formula: "{subsidiary.name}", label: "9 Trade Name" }),//8
                                search.createColumn({ name: "legalname", join: "subsidiary", label: "10 Legal Name" }),
                                search.createColumn({ name: "address1", join: "location", label: "11 Address 1" }),
                                search.createColumn({ name: "address2", join: "location", label: "12 Address 2" }),
                                search.createColumn({ name: "address1", join: "subsidiary", label: "13 Address 1" }),
                                search.createColumn({ name: "state", join: "subsidiary", label: "14 State/Province" }),
                                search.createColumn({ name: "address3", join: "subsidiary", label: "15 Address 3" }),
                                search.createColumn({ name: "billcountrycode", label: "16 Billing Country Code" }),
                                search.createColumn({ name: "phone", join: "subsidiary", label: "17 Phone" }),
                                search.createColumn({ name: "email", join: "subsidiary", label: "18 Email" }),
                                search.createColumn({ name: "formulatext", formula: "'0000'", label: "19 Cod Sunat" }),//18
                                // REC---------------------------------------------------------------------------------------------------------------------
                                search.createColumn({ name: "formulatext", formula: "CASE WHEN {customer.custentity_pe_document_type} = 'Registro Unico De Contribuyentes' THEN '6' WHEN {customer.custentity_pe_document_type} = 'Documento Nacional De Identidad (DNI)' THEN '1' WHEN {customer.custentity_pe_document_type} = 'Otros Tipos De Documentos' THEN '0' END", label: "20 Doc. Type ID REC" }),//19
                                search.createColumn({ name: "custentity_pe_document_number", join: "customer", label: "21 Tax Number" }),
                                search.createColumn({ name: "companyname", join: "customer", label: "22 Company Name" }),
                                search.createColumn({ name: "billaddress1" }),
                                search.createColumn({ name: "billaddress2", label: "24 Address 2" }),
                                search.createColumn({ name: "city", join: "customer", label: "25 City" }),
                                search.createColumn({ name: "state", join: "customer", label: "26 State/Province" }),
                                search.createColumn({ name: "address3", join: "customer", label: "27 Address 3" }),
                                search.createColumn({ name: "countrycode", join: "customer", label: "28 Country Code" }),
                                search.createColumn({ name: "phone", join: "customer", label: "29 Phone" }),
                                search.createColumn({ name: "email", join: "customer", label: "30 Email" }),
                                // CAB---------------------------------------------------------------------------------------------------------------------
                                search.createColumn({ name: "custrecord_pe_cod_fact_2", join: "CUSTBODY_PE_EI_OPERATION_TYPE", label: "31 PE Cod Fact" }),
                                search.createColumn({ name: "duedate", label: "32 Due Date/Receive By" }),
                                // ADI---------------------------------------------------------------------------------------------------------------------
                                search.createColumn({ name: "custbody_pe_ei_forma_pago", label: "33 PE EI Forma de Pago" }),
                                // COM---------------------------------------------------------------------------------------------------------------------
                                search.createColumn({ name: "custbody_pe_document_type", label: "34 PE Document Type" }),
                                search.createColumn({ name: "custbody_pe_serie", label: "35 PE Serie" }),
                                // REC---------------------------------------------------------------------------------------------------------------------
                                search.createColumn({ name: "internalid", join: "customer", label: "36 Internal ID" }),
                                // COM---------------------------------------------------------------------------------------------------------------------
                                search.createColumn({ name: "formulanumeric", formula: "TO_NUMBER({custbody_pe_number})", label: "37 Formula (Numeric)" }),//36
                                search.createColumn({ name: "createdfrom", label: "38 Created From" }),
                                // ADI---------------------------------------------------------------------------------------------------------------------
                                search.createColumn({ name: "location", label: "39 Location" }),
                                search.createColumn({ name: "formulatext", formula: "CONCAT({salesRep.firstname}, CONCAT(' ', {salesRep.lastname}))", label: "40 Formula (Text)" }),//39
                                // IDE---------------------------------------------------------------------------------------------------------------------
                                search.createColumn({ name: "tranid", join: "createdFrom", label: "41 Document Number" }),
                                // REC---------------------------------------------------------------------------------------------------------------------
                                search.createColumn({ name: "formulatext", formula: "CONCAT({customer.firstname}, CONCAT('-', {customer.lastname}))", label: "42 Formula (Text)" }),//41
                                search.createColumn({ name: "custbody_pe_free_operation", label: "43 Transferencia Libre" }),
                                // ADI DETRACCION---------------------------------------------------------------------------------------------------------------------
                                search.createColumn({ name: "custbody_pe_ei_forma_pago", label: "formaPagoDetr" }),
                                search.createColumn({ name: "custbody_pe_concept_detraction", label: "conceptDetr" }),
                                search.createColumn({ name: "custrecord_pe_detraccion_account", join: "subsidiary", label: "numCuentaBcoNacionDetr" }),
                                search.createColumn({ name: "custcol_4601_witaxamount", label: "montoDetrac" }),
                                search.createColumn({ name: "custbody_pe_percentage_detraccion", label: "porcentajeDetr" }),
                                search.createColumn({ name: "exchangerate", label: "Exchange Rate" }),
                                search.createColumn({ name: "custbody_psg_ei_status", label: "estado" }),
                                search.createColumn({ name: "status", label: "status" }),
                                search.createColumn({ name: "custbody_pe_serie", label: "PEserie" }),
                                search.createColumn({ name: "custbody_pe_number", label: "PEnumber" }),
                                search.createColumn({ name: "custbody_pe_free_operation", label: "43 Transferencia Libre" }),
                            ]
                    });
                    var searchResult = searchLoad.run().getRange({ start: 0, end: 200 });
                    var fechaEmision = searchResult[0].getValue({ name: "trandate" });

                    var codTipoDocumento = searchResult[0].getValue(searchLoad.columns[3]);
                    fechaEmision = fechaEmision.split('/');
                    fechaEmision = fechaEmision[2] + '-' + fechaEmision[1] + '-' + fechaEmision[0];
                    var dateComprobar = new Date(fechaEmision);
                    var fechaActual = new Date();
                    var diferenciaEnMilisegundos = fechaActual - dateComprobar;
                    var diferenciaEnDias = Math.floor(diferenciaEnMilisegundos / (1000 * 60 * 60 * 24));
                    if (diferenciaEnDias > 5) {
                        var myCustomError = error.create({
                            name: 'EventError',
                            message: 'El comprobante no puede ser dado de baja por exceder el plazo desde su fecha de emision',
                            notifyOff: false
                        });
                        throw myCustomError;
                    }
                    var column05 = searchResult[0].getValue({ name: "symbol", join: "Currency" });
                    var column07 = searchResult[0].getValue(searchLoad.columns[6]);
                    var column20 = searchResult[0].getValue(searchLoad.columns[19]);
                    var column21 = searchResult[0].getValue({ name: "custentity_pe_document_number", join: "customer" });
                    var column08 = searchResult[0].getValue({ name: "taxidnum", join: "subsidiary" });
                    var column09 = searchResult[0].getValue(searchLoad.columns[8]);
                    var column10 = searchResult[0].getValue({ name: "legalname", join: "subsidiary" });
                    var codubigeo = getUbigeo();
                    var column13 = searchResult[0].getValue({ name: "address1", join: "subsidiary" });
                    var column16 = searchResult[0].getValue({ name: "billcountrycode" });
                    var column17 = searchResult[0].getValue({ name: "phone", join: "subsidiary" });
                    var column18 = searchResult[0].getValue({ name: "email", join: "subsidiary" });
                    var estado_envio = searchResult[0].getValue({ name: "custbody_psg_ei_status", label: "estado" });
                    var PEserie = searchResult[0].getText({ name: "custbody_pe_serie", label: "PEserie" });
                    var PEnumber = searchResult[0].getValue({ name: "custbody_pe_number", label: "PEnumber" });

                    var column43 = searchResult[0].getValue({ name: "custbody_pe_free_operation" });
                    var tipodocumento = searchResult[0].getValue({ name: "custbody_pe_document_type" });
                    var detail = getDetail(id, column43 /*objPromocion*/);
                    var customrecord_pe_serieSearchObj = search.create({
                        type: "customrecord_pe_serie",
                        filters:
                            [
                                ["custrecord_para_anulacin", "is", "T"],
                                "AND",
                                ["custrecord_pe_tipo_documento_serie", "is", tipodocumento],
                                "AND",
                                ["custrecord_pe_location", "is", location]
                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "name",
                                    sort: search.Sort.ASC,
                                    label: "Name"
                                }),
                                search.createColumn({ name: "custrecord_pe_inicio", label: "PE Inicio" }),
                                search.createColumn({ name: "internalid" })
                            ]
                    });
                    var searchResultCorrelativo = customrecord_pe_serieSearchObj.run().getRange({ start: 0, end: 10 });
                    correlativo = searchResultCorrelativo[0].getValue({ name: "custrecord_pe_inicio" });
                    var internalID = searchResultCorrelativo[0].getValue({ name: "internalid" });
                    var namefile = yyyy + '' + mm + dd + '-' + correlativo;
                    var peSerie = record.load({ type: 'customrecord_pe_serie', id: internalID });
                    var correlativoCambio = peSerie.getValue({ fieldId: 'custrecord_pe_inicio' });
                    log.debug('correlativoCambio', correlativoCambio);
                    peSerie.setValue('custrecord_pe_inicio', parseInt(correlativoCambio) + 1);
                    peSerie.save();
                    jsonCAB = {
                        inicializador: 'Inicializador, debe ser borrado'
                    }
                    if (column43 == false) {
                        var grav = detail.gravadas;
                        var aplydiscount = new Array();
                        if (grav != 'Vacio') {
                            if (detail.anydiscoutnigv === 'any') {
                                jsonCAB.gravadas = detail.gravadas;
                                aplydiscount = detail.totalimpuestosgra.pop();
                                var newtotalimpuestosgra = {
                                    idImpuesto: aplydiscount.idImpuesto,
                                    montoImpuesto: detail.montototalimpuestos.toString()
                                }
                                arrayCAB.push(newtotalimpuestosgra);
                            } else {
                                jsonCAB.gravadas = detail.gravadas;
                                arrayCAB.push(detail.totalimpuestosgra.pop());
                            }
                        }
                        var ina = detail.inafectas;
                        if (ina != 'Vacio') {
                            jsonCAB.inafectas = detail.inafectas;
                            arrayCAB.push(detail.totalimpuestosina.pop());
                        }

                        var exo = detail.exoneradas;
                        if (exo != 'Vacio') {
                            jsonCAB.exoneradas = detail.exoneradas;
                            arrayCAB.push(detail.totalimpuestosexo.pop());
                        }
                    } else if (column43 == true) {
                        jsonLeyenda.push({
                            'codigo': '1002',
                            'descripcion': 'TRANSFERENCIA GRATUITA DE UN BIEN Y/O SERVICIO PRESTADO GRATUITAMENTE'
                        });

                        var grav = detail.gravadas;
                        var totalVentasGra = 0;
                        var montoImpuestoGra = 0;
                        var aplydiscount = new Array();
                        if (grav != 'Vacio') {
                            if (detail.anydiscoutnigv === 'any') {
                                jsonCAB.gravadas = detail.gravadas;
                                aplydiscount = detail.totalimpuestosgra.pop();
                                var newtotalimpuestosgra = {
                                    idImpuesto: aplydiscount.idImpuesto,
                                    montoImpuesto: detail.montototalimpuestos.toString()
                                }
                                arrayCAB.push(newtotalimpuestosgra);
                            } else {
                                totalVentasGra = detail.gravadas.totalVentas;
                                montoImpuestoGra = detail.totalimpuestosgra.pop();
                                montoImpuestoGra = montoImpuestoGra.montoImpuesto;
                            }
                        }

                        var ina = detail.inafectas;
                        var totalVentasIna = 0;
                        var montoImpuestoIna = 0;
                        if (ina != 'Vacio') {
                            totalVentasIna = detail.inafectas.totalVentas;
                            montoImpuestoIna = detail.totalimpuestosina.pop();
                            montoImpuestoIna = montoImpuestoIna.montoImpuesto;
                        }

                        var exo = detail.exoneradas;
                        var totalVentasExo = 0;
                        var montoImpuestoExo = 0;
                        if (exo != 'Vacio') {
                            totalVentasExo = detail.exoneradas.totalVentas;
                            montoImpuestoExo = detail.totalimpuestosexo.pop();
                            montoImpuestoExo = montoImpuestoExo.montoImpuesto;
                        }

                        jsonCAB.gratuitas = {
                            "codigo": "05",
                            "totalVentas": (parseFloat(totalVentasGra) + parseFloat(totalVentasIna) + parseFloat(totalVentasExo)).toFixed(2)
                        }

                        arrayCAB.push({
                            "idImpuesto": "9999",
                            "montoImpuesto": (parseFloat(montoImpuestoGra) + parseFloat(montoImpuestoIna) + parseFloat(montoImpuestoExo)).toFixed(2)
                        });
                    }

                    var icbper = detail.totalimpuestoicbper;
                    if (icbper.length != '') {
                        arrayCAB.push(icbper.pop());
                    }

                    jsonCAB.totalImpuestos = arrayCAB;
                    jsonCAB.importeTotal = column43 == true ? '0.00' : detail.importetotal.toString();




                    if (typeof detail.cargodescuento != 'undefined') {
                        jsonCAB.totalDescuentos = detail.totaldescuentos;
                        jsonCAB.cargoDescuento = detail.cargodescuento;
                    }
                    delete jsonCAB.inicializador;


                    log.debug('detail', detail);
                    log.debug('jsonCAB', jsonCAB);
                    log.debug('codTipoDocumento', codTipoDocumento);
                    // IDE---------------------------------------------------------------------------------------------------------------------

                    var filename = column08;
                    log.debug('filename', filename);
                    if (codTipoDocumento == '01') {
                        filename = filename + '-RA-' + namefile;
                        jsonIDE = {
                            numeracion: 'RA-' + namefile,
                            fechaEmision: date
                        }
                        jsonEMI = {
                            tipoDocId: column07,
                            numeroDocId: column08,
                            nombreComercial: column09,
                            razonSocial: column10,
                            ubigeo: codubigeo.ubigeo,
                            direccion: column13,
                            codigoPais: column16,
                            telefono: column17,
                            correoElectronico: column18,

                        }
                        jsonCBR = {
                            fechaReferencia: fechaEmision
                        }
                        jsonDBR = [{
                            numeroItem: "1",
                            tipoComprobanteItem: codTipoDocumento,
                            serieItem: PEserie,
                            correlativoItem: PEnumber,
                            motivoBajaItem: "Anulación"
                        }]
                        jsonMain = {
                            IDE: jsonIDE,
                            EMI: jsonEMI,
                            CBR: jsonCBR,
                            //DRF: jsonDRF,
                            DBR: jsonDBR,


                        }
                        json = JSON.stringify({ "comunicacionBaja": jsonMain });
                    } else if (codTipoDocumento == '03') {
                        filename = filename + '-RC-' + namefile;
                        jsonIDE = {
                            numeracion: 'RC-' + namefile,
                            fechaEmision: date,
                            fechaReferencia: date
                        }
                        jsonEMI = {
                            tipoDocId: column07,
                            numeroDocId: column08,
                            nombreComercial: column09,
                            razonSocial: column10,
                            ubigeo: codubigeo.ubigeo,
                            direccion: column13,
                            codigoPais: column16,
                            telefono: column17,
                            correoElectronico: column18,

                        }


                        jsonMain = {
                            IDE: jsonIDE,
                            EMI: jsonEMI,
                            DET: [jsonCAB]


                        }
                        jsonMain.DET[0].monedaItem = column05;
                        jsonMain.DET[0].numeroItem = '1';
                        jsonMain.DET[0].numeracionItem = PEserie + '-' + PEnumber;
                        jsonMain.DET[0].tipoComprobanteItem = codTipoDocumento;
                        jsonMain.DET[0].numeroDocIdAdq = column21;
                        jsonMain.DET[0].tipoDocIdAdq = column20;
                        jsonMain.DET[0].estadoItem = '3';
                        json = JSON.stringify({ "resumenComprobantes": jsonMain });
                    }
                    log.debug('json', json);
                    var filejson = generateFileJSON(filename, json);
                    var filejson = file.load({ id: filejson });
                    log.debug('filejson', filejson);
                    var request = filejson.getContents();
                    var array = [id, 21];
                    var getcredentials = openCredentials(array);
                    // logStatus(internalId, 'Debug4 ' + JSON.stringify(transaction));
                    // logStatus(internalId, 'Debug5 ' + tranType);
                    var urlsendinfo = getcredentials.wsurl + 'wsParser/rest/parserWS';
                    var urlgetpdf = getcredentials.wsurl + 'wsBackend/clients/getDocumentPDF';
                    var urlgetinfourl = getcredentials.wsurl + 'wsBackend/clients/getPdfURL';
                    var urlgetxml = getcredentials.wsurl + 'wsBackend/clients/getDocumentXML';
                    var urlgetcdr = getcredentials.wsurl + 'wsBackend/clients/getDocumentCDR';


                    var tokensend = token();
                    var tokenpdf = token();
                    var tokenxml = token();
                    var tokencdr = token();
                    var tokenurl = token();
                    send = sendDocument(getcredentials.username, getcredentials.password, tokensend, urlsendinfo, request, filename, id);
                    sleep(3000);
                    statustrasanction = send.responsecode;
                    log.debug('statustrasanction', statustrasanction);
                    if (statustrasanction == '0') {
                        log.debug('send2', send.response);
                    }
                    log.debug('send', send.response);



                } catch (e) {
                    var myCustomError = error.create({
                        name: 'EventError',
                        message: e,
                        notifyOff: false
                    });
                    throw myCustomError;
                }
            }
        }

        function getUnit(itemid) {
            var unit = '';
            try {
                var getunit = search.lookupFields({
                    type: search.Type.ITEM,
                    id: itemid,
                    columns: ['custitem_pe_cod_measure_unit']
                });
                var unit = getunit.custitem_pe_cod_measure_unit;
                return unit;
            } catch (e) {

            }
        }
        function sendDocument(username, password, token, url, request, filename, internalId) {
            var headers1 = new Array();
            try {
                var encode64 = base64Encoded(request);
                var filename = filename;
                //logStatus(internalId, filename);
                var req = JSON.stringify({
                    "customer": {
                        "username": username,
                        "password": password
                    },
                    "fileName": filename + '.json',
                    "fileContent": encode64
                });
                headers1['Accept'] = '*/*';
                headers1['Content-Type'] = 'application/json';
                headers1['Authorization'] = token;

                var myresponse = https.post({
                    url: url,
                    body: req,
                    headers: headers1
                });

                var body = JSON.parse(myresponse.body);
                var responsecode = body.responseCode;
                //logStatus(internalId, responsecode);
                var response = body.responseContent;
                return {
                    responsecode: responsecode,
                    response: response,
                    filename: filename
                }
            } catch (error) {
                log.debug(internalId, error);
                return error;
                //logError(array[0], array[1], 'Error-sendDocument', JSON.stringify(e));
            }
        }

        function openCredentials(array) {
            try {
                var accountSearch = search.create({
                    type: 'invoice',
                    filters: [
                        search.createFilter({
                            name: "internalid", operator: search.Operator.IS, values: [array[0]]
                        })
                    ],
                    columns: ["subsidiary"]
                });

                var searchResult = accountSearch.run().getRange({ start: 0, end: 1 });
                var accountSearchs = search.create({
                    type: 'customrecord_pe_ei_enable_features',
                    filters: [
                        search.createFilter({
                            name: "custrecord_pe_ei_subsidiary", operator: search.Operator.IS, values: [searchResult[0].getValue({ name: "subsidiary" })]
                        })
                    ],
                    columns: ["internalid"]
                });

                var searchResults = accountSearchs.run().getRange({ start: 0, end: 1 });
                var credentials = search.lookupFields({
                    type: 'customrecord_pe_ei_enable_features',
                    id: searchResults[0].getValue({ name: "internalid" }),
                    columns: ['custrecord_pe_ei_url_ws', 'custrecord_pe_ei_user', 'custrecord_pe_ei_password', 'custrecord_pe_ei_employ_copy']
                });

                return {
                    wsurl: credentials.custrecord_pe_ei_url_ws,
                    username: credentials.custrecord_pe_ei_user,
                    password: credentials.custrecord_pe_ei_password,
                    recipients: credentials.custrecord_pe_ei_employ_copy[0].value
                }
            } catch (e) {
                //logError(array[0], array[1], 'Error-openCredentials', e.message);
            }
        }
        function base64Encoded(content) {
            var base64encoded = encode.convert({
                string: content,
                inputEncoding: encode.Encoding.UTF_8,
                outputEncoding: encode.Encoding.BASE_64
            });
            return base64encoded;
        }
        function generateFileJSON(namefile, content) {

            var fileObj = file.create({
                name: namefile + '.json',
                fileType: file.Type.JSON,
                contents: content,
                folder: FOLDER_PDF,
                isOnline: true
            });
            var fileid = fileObj.save();

            return fileid;


        }
        function random() {
            return Math.random().toString(36).substr(2); // Eliminar `0.`
        }

        function sleep(milliseconds) {
            var start = new Date().getTime();
            for (var i = 0; i < 1e7; i++) {
                if ((new Date().getTime() - start) > milliseconds) {
                    break;
                }
            }
        }
        function token() {
            return random() + random() + random() + random() + random(); // Para hacer el token más largo
        }
        function getDetail(documentid, freeop /*_objPromocion*/) {
            var json = new Array();
            var jsonGravadas = ['Vacio'];
            var jsonInafectas = ['Vacio'];
            var jsonExoneradas = ['Vacio'];
            var jsonTotalImpuestosGRA = new Array();
            var jsonTotalImpuestosINA = new Array();
            var jsonTotalImpuestosEXO = new Array();
            var jsonTotalImpuestoICBPER = new Array();
            var jsonCargoDescuento = new Array();
            var jsonTotalDescuentos = new Array();
            var jsonReturn = new Array();
            var sumtotalVentasGRA = 0.0;
            var summontoImpuestoGRA = 0.0;
            var sumtotalVentasINA = 0.0;
            var summontoImpuestoINA = 0.0;
            var sumtotalVentasEXO = 0.0;
            var summontoImpuestoEXO = 0.0;
            // Params for subtotal
            var montobasecargodescuento = '';
            //Flag discount
            var anydiscoutnigv = '';
            // var jsontest = new Array();
            const TAX_CODE_GRAVADA = 'IGV_PE:S-PE'
            const TAX_CODE_INAFECTA = 'IGV_PE:Inaf-PE'
            const TAX_CODE_EXENTA = 'IGV_PE:E-PE'
            const TAXT_CODE_UNDEF = 'IGV_PE:UNDEF-PE'
            var applyDetr = false;


            var openRecord = '';
            openRecord = record.load({ type: record.Type.INVOICE, id: documentid, isDynamic: true });

            var total = openRecord.getValue({ fieldId: 'total' });
            var taxtotal = openRecord.getValue({ fieldId: 'taxtotal' });
            var codcustomer = openRecord.getText({ fieldId: 'entity' });
            codcustomer = codcustomer.split(' ');
            codcustomer = codcustomer[0];
            var linecount = openRecord.getLineCount({ sublistId: 'item' });
            //logStatus(documentid, linecount);
            // SE AGREGARON PARA LOS CASOS DE PROMOCIONES GLOBALES
            var subtotal_global_prom = openRecord.getValue({ fieldId: 'subtotal' });
            var taxcode_display_prom = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxcode_display', line: 0 });
            var codigocargodescuento_prom = taxcode_display_prom == TAX_CODE_GRAVADA ? "02" : "03";

            //Inicio for
            for (var i = 0; i < linecount; i++) {
                var jsonTotalImpuestos = new Array();
                var jsonCargoDescuentoLines = new Array();
                var precioVentaUnitario = 0.0;
                var idimpuesto = '';
                var codigo = '';
                var tipoAfectacion = '';
                var itemtype_discount = 'notExist';
                var anydiscountline = '';

                //Params for discount
                var indicadorcargodescuento = '';
                var codigocargocescuento = '';
                var factorcargodescuento = 0.0;
                var montocargodescuento = 0.0;
                var round = 0.0;
                var taxcode_display_discount = '';


                var item_display = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'item_display', line: i });
                // item_display = item_display.split(' ');
                // item_display = item_display[0];
                //logStatus(documentid, item_display);
                var is_discount_line = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_is_discount_line', line: i });
                var description = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i });
                var quantity = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                var item = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                var unit = getUnit(item);

                var rate = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i }));
                var rateopfree = rate;

                var taxcode_display = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxcode_display', line: i });
                var amount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });

                var itemtype = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });
                var taxrate1 = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxrate1', line: i }));
                var tax1amt = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i }));
                var directtax1amt = tax1amt
                var directamount = amount
                //logStatus(documentid, 'tax1amt1: ' + tax1amt);
                var montoimpuesto = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i }));
                var isicbp = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_pe_is_icbp', line: i });
                var applywh = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_4601_witaxapplies', line: i });
                if (applyDetr == false) {
                    applyDetr = applywh;
                }

                //logStatus(documentid, 'Entré a DESCUENTO: ' + taxcode_display);

                if (itemtype == 'InvtPart' || itemtype == 'Service' || itemtype == 'NonInvtPart') {
                    precioVentaUnitario = (rate + (rate * (taxrate1 / 100)));
                    //logStatus(documentid, precioVentaUnitario);
                    round = precioVentaUnitario.toString().split('.');
                    if (typeof round[1] != 'undefined') {
                        precioVentaUnitario = round[1].length > 7 ? precioVentaUnitario.toFixed(7) : precioVentaUnitario;
                    }

                    if (taxcode_display == TAX_CODE_GRAVADA) {  // GRAVADAS
                        if (freeop == true) {
                            idimpuesto = '9999'; // Gratuito
                            codigo = '04'; // Total valor de venta – Operaciones gratuitas
                            tipoAfectacion = '11'; // Gravado – Retiro por premio
                            sumtotalVentasGRA += amount;
                            summontoImpuestoGRA += montoimpuesto;
                            jsonGravadas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasGRA
                            }
                            rate = '0.00';
                            precioVentaUnitario = '0.00';
                        } else {
                            idimpuesto = '1000'; // Igv impuesto general a las ventas
                            codigo = '01'; // Total valor de venta - operaciones gravadas
                            tipoAfectacion = '10'; // Gravado - Operación Onerosa
                            sumtotalVentasGRA += amount;
                            summontoImpuestoGRA += montoimpuesto;
                        }

                        try {
                            itemtype_discount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i + 1 });
                            taxcode_display_discount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxcode_display', line: i + 1 });
                        } catch (error) { }

                        if (itemtype_discount == 'Discount' && taxcode_display_discount != TAXT_CODE_UNDEF) {
                            anydiscountline = 'any';
                        } else {
                            jsonGravadas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasGRA
                            }
                            jsonTotalImpuestosGRA.push({
                                idImpuesto: idimpuesto,
                                montoImpuesto: summontoImpuestoGRA.toFixed(2)
                            });
                        }
                        // jsonGravadas = {
                        //     codigo: codigo,
                        //     totalVentas: sumtotalVentasGRA
                        // }
                        // jsonTotalImpuestosGRA.push({
                        //     idImpuesto: idimpuesto,
                        //     montoImpuesto: summontoImpuestoGRA.toFixed(2)
                        // });

                    } else if (taxcode_display == TAX_CODE_EXENTA) { // EXONERADAS
                        if (freeop == true) {
                            idimpuesto = '9999'; // Gratuito
                            codigo = '04'; // Total valor de venta - operaciones exoneradas
                            tipoAfectacion = '21'; // Exonerado – Transferencia Gratuita
                            sumtotalVentasEXO += amount;
                            summontoImpuestoEXO += montoimpuesto;
                            jsonExoneradas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasEXO.toFixed(2)
                            }
                            rate = '0.00';
                            precioVentaUnitario = '0.00';
                        } else {
                            idimpuesto = '9999'; //Exonerado
                            codigo = '03'; // Total valor de venta - operaciones exoneradas
                            tipoAfectacion = '20'; // Exonerado - Operación Onerosa
                            sumtotalVentasEXO += amount;
                            summontoImpuestoEXO += montoimpuesto;
                        }

                        try {
                            itemtype_discount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i + 1 });
                            taxcode_display_discount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxcode_display', line: i + 1 });
                            //log.debug('AnyDiscount', itemtype_discount);
                        } catch (error) { }

                        if (itemtype_discount == 'Discount' && taxcode_display_discount != TAXT_CODE_UNDEF) {
                            anydiscountline = 'any';
                        } else {
                            jsonExoneradas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasEXO.toFixed(2)
                            }
                        }

                        jsonTotalImpuestosEXO.push({
                            idImpuesto: idimpuesto,
                            montoImpuesto: summontoImpuestoEXO.toFixed(2)
                        });
                    } else if (taxcode_display == TAX_CODE_INAFECTA) { // INAFECTAS
                        if (freeop == true) {
                            idimpuesto = '9999'; // Gratuito
                            codigo = '04'; // Total valor de venta - operaciones inafectas
                            tipoAfectacion = '35'; // Inafecto – Retiro por premio
                            sumtotalVentasINA += amount;
                            summontoImpuestoINA += montoimpuesto;
                            jsonInafectas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasINA.toFixed(2)
                            }
                            rate = '0.00';
                            precioVentaUnitario = '0.00';
                        } else {
                            idimpuesto = '9999'; // Inafecto
                            codigo = '02'; // Total valor de venta - operaciones inafectas
                            tipoAfectacion = '30'; // Inafecto - Operación Onerosa
                            sumtotalVentasINA += amount;
                            summontoImpuestoINA += montoimpuesto;
                        }
                        try {
                            itemtype_discount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i + 1 });
                            taxcode_display_discount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxcode_display', line: i + 1 });
                        } catch (error) { }

                        if (itemtype_discount == 'Discount' && taxcode_display_discount != TAXT_CODE_UNDEF) {
                            anydiscountline = 'any';
                        } else {
                            jsonInafectas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasINA.toFixed(2)
                            }
                        }
                        jsonTotalImpuestosINA.push({
                            idImpuesto: idimpuesto,
                            montoImpuesto: summontoImpuestoINA.toFixed(2)
                        });
                    }

                    //logStatus(documentid, precioVentaUnitario);
                    if (anydiscountline == 'any') {
                        var rate_discount_line = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i + 1 }));
                        var amount_discount_line = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i + 1 });
                        var tax1amt_discount_line = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i + 1 });

                        tax1amt_discount_line = parseFloat(tax1amt_discount_line.toString().replace('-', ''));
                        rate_discount_line = rate_discount_line.toString().replace('-', '').replace('%', '');
                        factorcargodescuento = rate_discount_line / 100;
                        round = factorcargodescuento.toString().split('.');
                        if (typeof round[1] != 'undefined') {
                            round[1].length > 5 ? factorcargodescuento = factorcargodescuento.toFixed(5) : factorcargodescuento
                        }
                        amount_discount_line = parseFloat(amount_discount_line.toString().replace('-', ''));
                        montocargodescuento = parseFloat(amount_discount_line) * parseFloat(factorcargodescuento);
                        var dsctoVentaUnitario = parseFloat(precioVentaUnitario) * parseFloat(factorcargodescuento);
                        precioVentaUnitario = parseFloat(precioVentaUnitario) - dsctoVentaUnitario;

                        var montobasecargodscto = amount
                        amount = amount - amount_discount_line;
                        tax1amt = tax1amt - tax1amt_discount_line;
                        //logStatus(documentid, 'tax1amt2: ' + tax1amt);

                        if (taxcode_display == TAX_CODE_GRAVADA) {  // GRAVADAS
                            indicadorcargodescuento = 'false'; // (cargo = true , Descuento = false)
                            codigocargocescuento = '00'; // Descuentos que afectan la base imponible del IGV
                            sumtotalVentasGRA -= amount_discount_line;
                            jsonGravadas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasGRA
                            }
                            summontoImpuestoGRA -= tax1amt_discount_line;
                            jsonTotalImpuestosGRA.push({
                                idImpuesto: idimpuesto,
                                montoImpuesto: summontoImpuestoGRA.toFixed(2)
                            });
                        } else if (taxcode_display == TAX_CODE_EXENTA) {
                            indicadorcargodescuento = 'false'; // (cargo = true , Descuento = false)
                            codigocargocescuento = '00'; // Descuentos que no afectan la base imponible del IGV
                            sumtotalVentasEXO -= amount_discount_line;
                            jsonExoneradas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasEXO.toFixed(2)
                            }
                        } else if (taxcode_display == TAX_CODE_INAFECTA) {
                            indicadorcargodescuento = 'false'; // (cargo = true , Descuento = false)
                            codigocargocescuento = '00'; // Descuentos que no afectan la base imponible del IGV
                            sumtotalVentasINA -= amount_discount_line;
                            jsonInafectas = {
                                codigo: codigo,
                                totalVentas: sumtotalVentasINA.toFixed(2)
                            }
                        }

                        jsonCargoDescuentoLines.push({
                            indicadorCargoDescuento: indicadorcargodescuento,
                            codigoCargoDescuento: codigocargocescuento,
                            factorCargoDescuento: factorcargodescuento.toString(),
                            montoCargoDescuento: amount_discount_line.toFixed(2),
                            montoBaseCargoDescuento: montobasecargodscto.toString()
                        });
                    }
                    //logStatus(documentid, 'tax1amt3: ' + tax1amt);
                    if (tax1amt == 0) {
                        tax1amt = directtax1amt
                    }
                    if (amount == 0) {
                        amount = directamount
                    }
                    jsonTotalImpuestos.push({
                        idImpuesto: idimpuesto,
                        montoImpuesto: tax1amt.toFixed(2),
                        tipoAfectacion: tipoAfectacion,
                        montoBase: amount.toFixed(2).toString(),
                        porcentaje: taxrate1.toString()
                    });

                    //logStatus(documentid, JSON.stringify(isicbp));
                    if (itemtype == 'NonInvtPart' || isicbp == true) {
                        //logStatus(documentid, 'Entré a ICBP: ' + isicbp);
                        var montoImp = 0.5 * parseInt(quantity);
                        tax1amt = (tax1amt + montoImp).toFixed(2);
                        taxtotal = parseFloat(taxtotal) + montoImp;
                        //total = parseFloat(total) + montoImp;

                        jsonTotalImpuestoICBPER.push({
                            idImpuesto: '7152',
                            montoImpuesto: montoImp.toFixed(2)
                        });

                        jsonTotalImpuestos.push({
                            idImpuesto: '7152',
                            montoImpuesto: montoImp.toFixed(2),
                            tipoAfectacion: tipoAfectacion,
                            montoBase: quantity.toString(),
                            porcentaje: '0.50'
                        });
                    }

                    if (freeop == true) {
                        json.push({
                            numeroItem: (i + 1).toString(),
                            codigoProducto: item_display,
                            descripcionProducto: description,
                            //cantidadItems: '1',
                            cantidadItems: quantity.toString(),
                            unidad: unit,
                            valorUnitario: rate.toString(),
                            precioVentaUnitario: precioVentaUnitario.toString(),
                            totalImpuestos: jsonTotalImpuestos,
                            valorVenta: amount.toFixed(2).toString(),
                            valorRefOpOnerosas: rateopfree.toFixed(2).toString(),
                            montoTotalImpuestos: '0.00'
                        });
                    } else if (anydiscountline == 'any') {
                        json.push({
                            numeroItem: (i + 1).toString(),
                            codigoProducto: item_display,
                            descripcionProducto: description,
                            cantidadItems: quantity.toString(),
                            unidad: unit,
                            valorUnitario: rate.toString(),
                            precioVentaUnitario: precioVentaUnitario.toFixed(6).toString(),
                            cargoDescuento: jsonCargoDescuentoLines,
                            totalImpuestos: jsonTotalImpuestos,
                            valorVenta: amount.toFixed(2).toString(),
                            montoTotalImpuestos: parseFloat(tax1amt).toFixed(2)
                        });
                    } else {
                        //logStatus(documentid, 'Json: ' + precioVentaUnitario);
                        json.push({
                            numeroItem: (i + 1).toString(),
                            codigoProducto: item_display,
                            descripcionProducto: description,
                            cantidadItems: quantity.toString(),
                            unidad: unit,
                            valorUnitario: rate.toString(),
                            precioVentaUnitario: precioVentaUnitario.toString(),
                            totalImpuestos: jsonTotalImpuestos,
                            valorVenta: amount.toFixed(2).toString(),
                            montoTotalImpuestos: tax1amt.toString()
                        });
                    }
                } else if (itemtype == 'Subtotal') {
                    montobasecargodescuento = amount; //subtotal
                } else if (itemtype == 'Discount' && is_discount_line == false && taxcode_display != TAXT_CODE_UNDEF) {
                    if (taxcode_display == TAX_CODE_GRAVADA) {  // GRAVADAS
                        indicadorcargodescuento = 'false'; // (cargo = true , Descuento = false)
                        codigocargocescuento = '02'; // Descuentos globales que afectan la base imponible del IGV
                        anydiscoutnigv = 'any';
                    } else {
                        indicadorcargodescuento = 'false'; // (cargo = true , Descuento = false)
                        codigocargocescuento = '03'; // Descuentos globales que no afectan la base imponible del IGV
                    }
                    rate = rate.toString().replace('-', '').replace('%', '');
                    factorcargodescuento = rate / 100
                    round = factorcargodescuento.toString().split('.');
                    if (typeof round[1] != 'undefined') {
                        round[1].length > 5 ? factorcargodescuento = factorcargodescuento.toFixed(5) : factorcargodescuento
                    }
                    amount = amount.toString().replace('-', '')
                    jsonTotalDescuentos.push({
                        codigo: "2005",
                        totalDescuentos: amount
                    });

                    jsonCargoDescuento.push({
                        indicadorCargoDescuento: indicadorcargodescuento,
                        codigoCargoDescuento: codigocargocescuento,
                        factorCargoDescuento: factorcargodescuento.toString(),
                        montoCargoDescuento: amount,
                        montoBaseCargoDescuento: montobasecargodescuento.toString()
                    });
                }

            }

            if (anydiscoutnigv == 'any') {
                var newcalculate = jsonGravadas.totalVentas - amount;
                jsonGravadas.totalVentas = newcalculate.toFixed(2);
            } else {
                if (jsonGravadas != 'Vacio') {
                    jsonGravadas = {
                        codigo: jsonGravadas.codigo,
                        totalVentas: jsonGravadas.totalVentas.toFixed(2)
                    }
                }
            }

            // if (jsonGravadas != 'Vacio') {
            //     jsonGravadas = {
            //         codigo: jsonGravadas.codigo,
            //         totalVentas: jsonGravadas.totalVentas.toFixed(2)
            //     }
            // }

            jsonReturn = {
                det: json,
                gravadas: jsonGravadas,
                inafectas: jsonInafectas,
                exoneradas: jsonExoneradas,
                totalimpuestosgra: jsonTotalImpuestosGRA,
                totalimpuestosina: jsonTotalImpuestosINA,
                totalimpuestosexo: jsonTotalImpuestosEXO,
                totalimpuestoicbper: jsonTotalImpuestoICBPER,
                importetotal: total.toFixed(2),
                montototalimpuestos: taxtotal.toFixed(2),
                codigocliente: codcustomer,
                anydiscoutnigv: anydiscoutnigv,
                applywh: applyDetr
            }

            //! ACTIVAR PARA DESCUENTOS
            if (jsonCargoDescuento.length != 0) {
                if (codigocargocescuento == '03') {
                    jsonReturn.totaldescuentos = jsonTotalDescuentos;
                }
                jsonReturn.cargodescuento = jsonCargoDescuento;

                // }
                // else if (jsonCargoDescuento.length == 0 && _objPromocion != null && _objPromocion['p_dsctoglobal']) {
                //     var amount_prom = (_objPromocion.monto_dscto).replace('-', '');
                //     var jsonTotalDescuentosProm = new Array();
                //     var jsonCargoDescuentoProm = new Array();
                //     if (codigocargodescuento_prom == '03') {
                //         jsonTotalDescuentosProm.push({ codigo: "2005", totalDescuentos: amount_prom })
                //         jsonReturn.totaldescuentos = jsonTotalDescuentosProm;
                //     }

                //     jsonCargoDescuentoProm.push({
                //         indicadorCargoDescuento: 'false',
                //         codigoCargoDescuento: codigocargodescuento_prom,
                //         factorCargoDescuento: _objPromocion.p_descuento,
                //         montoCargoDescuento: amount_prom,
                //         montoBaseCargoDescuento: subtotal_global_prom.toString()
                //     });
                //     jsonReturn.cargodescuento = jsonCargoDescuentoProm
            }

            return jsonReturn;

        }
        function getUbigeo() {
            try {
                var subsidiarySearchObj = search.create({
                    type: "subsidiary",
                    filters:
                        [
                            ["internalid", "anyof", "3"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "custrecord_pe_cod_ubigeo",
                                join: "address",
                                label: "PE Cod Ubigeo"
                            }),
                            search.createColumn({
                                name: "custrecord_pe_ubigeo",
                                join: "address",
                                label: "PE Ubigeo"
                            })
                        ]
                });
                var searchResult = subsidiarySearchObj.run().getRange({ start: 0, end: 1 });
                var ubigeo = searchResult[0].getValue(subsidiarySearchObj.columns[0]);
                var ubigeolocalidad = searchResult[0].getText(subsidiarySearchObj.columns[1]);
                return {
                    ubigeo: ubigeo,
                    ubigeolocalidad: ubigeolocalidad
                }
            } catch (e) {

            }
        }
        return {
            beforeSubmit: beforeSubmit,
        }
    });