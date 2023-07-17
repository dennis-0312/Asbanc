/**
 * @NApiVersion 2.x
 * @NScriptType plugintypeimpl
 */
define(['N/email', 'N/encode', 'N/format', 'N/https', 'N/record', 'N/search', 'N/file'],
    /**
     * @param{email} email
     * @param{encode} encode
     * @param{format} format
     * @param{https} https
     * @param{record} record
     * @param{search} search
     * 
     * send - This function is the entry point of our plugin script
    * @param {Object} plugInContext
    * @param {String} plugInContext.scriptId
    * @param {String} plugInContext.sendMethodId
    * @param {String} plugInContext.eInvoiceContent
    * @param {Array}  plugInContext.attachmentFileIds
    * @param {String} plugInContext.customPluginImpId
    * @param {Number} plugInContext.batchOwner
    * @param {Object} plugInContext.customer
    * @param {String} plugInContext.customer.id
    * @param {Array}  plugInContext.customer.recipients
    * @param {Object} plugInContext.transaction
    * @param {String} plugInContext.transaction.number
    * @param {String} plugInContext.transaction.id
    * @param {String} plugInContext.transaction.poNum
    * @param {String} plugInContext.transaction.tranType
    * @param {Number} plugInContext.transaction.subsidiary
    * @param {Object} plugInContext.sender
    * @param {String} plugInContext.sender.id
    * @param {String} plugInContext.sender.name
    * @param {String} plugInContext.sender.email
    * @param {Number} plugInContext.userId
    *
    * @returns {Object}  result
    * @returns {Boolean} result.success
    * @returns {String}  result.message
     */
    function (email, encode, format, https, record, search, file) {
        var recordtype = '';
        var internalId = '';
        var userId = '';
        var FOLDER_PDF = 513;


        function send(pluginContext) {
            internalId = pluginContext.transaction.id;
            userId = pluginContext.sender.id;
            var userMail = pluginContext.sender.email;
            var tranID = pluginContext.transaction.number;
            var senderDetails = pluginContext.sender;
            var customer = pluginContext.customer;
            var transaction = pluginContext.transaction;
            var recipientList = customer.recipients;
            var tranType = pluginContext.transaction.tranType
            var result = {};
            var parameters;
            var docstatus = 'Sent'
            var request;
            var send = new Array();
            var statustrasanction = '';
            var sendresponsecode = 'Completed Process';
            var docstatus1 = 'Sending Failed';
            var array = [internalId, userId];
            var getcredentials = openCredentials(array);
            // logStatus(internalId, 'Debug4 ' + JSON.stringify(transaction));
            // logStatus(internalId, 'Debug5 ' + tranType);
            var urlsendinfo = getcredentials.wsurl + 'wsParser_2_1/rest/parserWS';
            var urlgetpdf = getcredentials.wsurl + 'wsBackend/clients/getDocumentPDF';
            var urlgetinfourl = getcredentials.wsurl + 'wsBackend/clients/getPdfURL';
            var urlgetxml = getcredentials.wsurl + 'wsBackend/clients/getDocumentXML';
            var urlgetcdr = getcredentials.wsurl + 'wsBackend/clients/getDocumentCDR';

            result = {
                success: true,
                message: transaction
            };

            try {
                //var MSG_NO_EMAIL = translator.getString("ei.sending.sendernoemail");
                // var MSG_SENT_DETAILS = translator.getString("ei.sending.sentdetails");
                // if (!senderDetails.email) {
                //     parameters = {
                //         EMPLOYEENAME: senderDetails.name
                //     };
                //     stringFormatter.setString(MSG_NO_EMAIL);
                //     stringFormatter.replaceParameters(parameters);
                //     result = {
                //         success: false,
                //         message: stringFormatter.toString()
                //     };
                // } else {
                //     var invoiceSendDetails = {
                //         number: transaction.number,
                //         poNumber: transaction.poNum,
                //         transactionType: transaction.type,
                //         eInvoiceContent: pluginContext.eInvoiceContent,
                //         attachmentFileIds: pluginContext.attachmentFileIds
                //     };
                //     notifier.notifyRecipient(senderDetails.id, recipientList, invoiceSendDetails);

                //     parameters = {
                //         SENDER: senderDetails.email,
                //         RECIPIENTS: recipientList.join(", ")
                //     };
                //     stringFormatter.setString(MSG_SENT_DETAILS);
                //     stringFormatter.replaceParameters(parameters);

                //     result = {
                //         success: true,
                //         message: stringFormatter.toString()
                //     };
                // }

                var tokensend = token();
                var tokenpdf = token();
                var tokenxml = token();
                var tokencdr = token();
                var tokenurl = token();


                //Bloque de identificación de transancción ====================================================================
                // var identifydocument = getIdentifyDocument(internalId);
                // if (identifydocument == '01' || identifydocument == '03') {
                //     request = createRequest(internalId, array);
                //     recordtype = 'invoice';
                // } else if (identifydocument == '08') {
                //     request = createRequestDebitMemo(internalId, array);
                //     recordtype = 'invoice';
                // } else {
                //     request = createRequestCreditMemo(internalId, array);
                // }

                var request = getIdentifyDocument(internalId);
                //logStatus(internalId, 'Debug1 ' + JSON.stringify(request));

                //Bloque de validación si documento ya existe en OSCE ====================================================================
                var existDocument = getDocumentPDF(getcredentials.username, getcredentials.password, request.typedoccode, request.serie, request.correlativo, tokenurl, urlgetinfourl, array);
                sleep(1000);
                if (existDocument.codigo == '0') {
                    statustrasanction = '0';
                    //logStatus(internalId, 'Debug2 ' + JSON.stringify(existDocument));
                } else {
                    send = sendDocument(getcredentials.username, getcredentials.password, tokensend, urlsendinfo, request, internalId);
                    sleep(3000);
                    statustrasanction = send.responsecode;
                    logStatus(internalId, send.response);
                }

                //Bloque de ejecucíon de recuperación envío de documentos
                if (statustrasanction == '0') {
                    var getpdf = getDocumentPDF(getcredentials.username, getcredentials.password, request.typedoccode, request.serie, request.correlativo, tokenpdf, urlgetpdf, array, internalId);
                    var getxml = getDocumentXML(getcredentials.username, getcredentials.password, request.typedoccode, request.serie, request.correlativo, tokenxml, urlgetxml, array);
                    var getcdr = getDocumentCDR(getcredentials.username, getcredentials.password, request.typedoccode, request.serie, request.correlativo, tokencdr, urlgetcdr, array);
                    sleep(3000);

                    if (getpdf.mensaje == 'OK' && getxml.mensaje == 'OK' && getcdr.mensaje == 'OK') {
                        var filepdf = generateFilePDF(request.numbering, getpdf.pdf, array);
                        var filexml = generateFileXML(request.numbering, getxml.xml, array);
                        var filecdr = generateFileCDR(request.numbering, getcdr.cdr, array);
                        //var filejson = generateFileJSON(request.numbering, request.request, array);
                        //logStatus(internalId, filepdf + '-' + filexml + '-' + filecdr);
                        var recordSet = setRecord(tranType, internalId, filepdf, filexml, filecdr)
                        //logStatus(internalId, 'Record: ' + recordSet);
                        var filejson = 0;
                        // if (filepdf != '' && filexml != '' && filecdr != '' && filejson != '') {
                        //     var arrayheader = [userId, getcredentials.recipients, request.emisname, request.numbering, request.typedoc, docstatus, filepdf, filexml, filecdr, filejson, getpdf.pdf];
                        //     var arraybody = [internalId];
                        //     var sendemail = sendEmail(true, arrayheader, arraybody, recordtype, array, internalId);
                        //     logStatus(internalId, sendemail);
                        // } else {
                        //     //logError(internalId, userId, docstatus2, 'Error en envío de email');
                        //     result.success = false;
                        //     result.message = "Failure";
                        // }    
                    } else {
                        //logError(internalId, userId, docstatus2, 'Error en generación de archivos');
                        result.success = false;
                        result.message = "Failure";
                    }
                } else if (send.responsecode == '1033') {
                    //logError(internalId, userId, docstatus1, send.response);
                    result.success = false;
                    result.message = "Failure";
                } else {
                    result.success = false;
                    result.message = send;
                    // var filetxt = generateFileTXT(request.numbering, request.request, array);
                    // var res = 'Request: ' + filetxt + ' - ' + send.response;
                    // logError(internalId, userId, docstatus1, res);
                    // result.success = false;
                    // result.message = "Failure";
                }
            } catch (error) {
                result = {
                    success: false,
                    message: error.message
                };
            }
            return result;
        }


        function openCredentials(array) {
            try {
                var credentials = search.lookupFields({
                    type: 'customrecord_pe_ei_enable_features',
                    id: 1,
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


        function getIdentifyDocument(internalid) {
            try {
                var searchLoad = search.create({
                    type: "transaction",
                    filters:
                        [
                            [["type", "anyof", "CustCred"], "OR", ["type", "anyof", "CustInvc"]],
                            "AND",
                            ["internalid", "anyof", internalid]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "formulatext",
                                formula: "CASE WHEN {custbody_pe_document_type} = 'Factura' THEN '01' WHEN {custbody_pe_document_type} = 'Boleta de Venta' THEN '03' WHEN {custbody_pe_document_type} = 'Nota de Debito' THEN '08' WHEN {custbody_pe_document_type} = 'Nota de Credito' THEN '07' END",
                                label: "typedoccode"
                            }),
                            search.createColumn({ name: "formulatext", formula: "CONCAT({custbody_pe_serie}, CONCAT('-', {custbody_pe_number}))", label: "numeracion" }),
                            search.createColumn({ name: "formulanumeric", formula: "TO_NUMBER({custbody_pe_number})", label: "correlativo" }),
                            search.createColumn({ name: "custbody_pe_serie", label: "serie" }),
                            search.createColumn({ name: "internalid", join: "customer", label: "emailrec" }),
                            search.createColumn({ name: "legalname", join: "subsidiary", label: "emisname" }),
                            search.createColumn({ name: "custbody_pe_document_type", label: "typedoc" }),
                            search.createColumn({ name: "taxidnum", join: "subsidiary", label: "rucemi" }),
                            search.createColumn({ name: "custbody_pe_ei_printed_xml_req", label: "request" })
                        ]
                });

                var searchResult = searchLoad.run().getRange({ start: 0, end: 1 });
                var typedoccode = searchResult[0].getValue(searchLoad.columns[0]);
                var numbering = searchResult[0].getValue(searchLoad.columns[1]);
                var correlativo = searchResult[0].getValue(searchLoad.columns[2]);
                var serie = searchResult[0].getText({ name: "custbody_pe_serie", label: "serie" });
                var emailrec = searchResult[0].getValue({ name: "internalid", join: "customer", label: "emailrec" });
                var emisname = searchResult[0].getValue({ name: "legalname", join: "subsidiary", label: "emisname" });
                var typedoc = searchResult[0].getText({ name: "custbody_pe_document_type", label: "typedoc" });
                var rucemi = searchResult[0].getValue({ name: "taxidnum", join: "subsidiary", label: "rucemi" });
                var request = searchResult[0].getValue({ name: "custbody_pe_ei_printed_xml_req", label: "request" });
                var filename = rucemi + '-' + typedoccode + '-' + numbering;
                var filejson = file.load({ id: request });
                request = filejson.getContents();
                //logStatus(documentid, JSON.parse(request));
                return {
                    typedoccode: typedoccode,
                    numbering: numbering,
                    correlativo: correlativo,
                    serie: serie,
                    emailrec: emailrec,
                    emisname: emisname,
                    typedoc: typedoc,
                    filename: filename,
                    request: request
                }
            } catch (error) {
                logStatus(documentid, error);
                return error;
            }
        }


        function getDocumentPDF(username, password, codCPE, numSerieCPE, numCPE, token, url, array, internalId) {
            var headers1 = new Array();
            try {
                var req = JSON.stringify({
                    "user": {
                        "username": username,
                        "password": password
                    },
                    "codCPE": codCPE,
                    "numSerieCPE": numSerieCPE,
                    "numCPE": numCPE
                });
                headers1['Accept'] = '*/*';
                headers1['Content-Type'] = 'application/json';
                headers1['Authorization'] = token;
                var response = https.post({
                    url: url,
                    body: req,
                    headers: headers1
                });
                var body = JSON.parse(response.body);
                var codigo = body.codigo;
                var mensaje = body.mensaje;
                var pdf = body.pdf;

                //logStatus(internalId, 'Debug3 ' + JSON.stringify(pdf));

                return {
                    codigo: codigo,
                    mensaje: mensaje,
                    pdf: pdf
                }
            } catch (error) {
                return error;
                //logError(array[0], array[1], 'Error-getDocumentPDF', JSON.stringify(e));
            }
        }


        function getDocumentXML(username, password, codCPE, numSerieCPE, numCPE, token, url, array) {
            var headers1 = new Array();
            try {
                var req = JSON.stringify({
                    "user": {
                        "username": username,
                        "password": password
                    },
                    "codCPE": codCPE,
                    "numSerieCPE": numSerieCPE,
                    "numCPE": numCPE
                });
                headers1['Accept'] = '*/*';
                headers1['Content-Type'] = 'application/json';
                headers1['Authorization'] = token;
                var response = https.post({
                    url: url,
                    body: req,
                    headers: headers1
                });
                var body = JSON.parse(response.body);
                var mensaje = body.mensaje;
                var xml = body.xml;

                return {
                    mensaje: mensaje,
                    xml: xml
                }
            } catch (error) {
                return error;
                //logError(array[0], array[1], 'Error-getDocumentXML', JSON.stringify(e));
            }
        }


        function getDocumentCDR(username, password, codCPE, numSerieCPE, numCPE, token, url, array) {
            var headers1 = new Array();
            try {
                var req = JSON.stringify({
                    "user": {
                        "username": username,
                        "password": password
                    },
                    "codCPE": codCPE,
                    "numSerieCPE": numSerieCPE,
                    "numCPE": numCPE
                });
                headers1['Accept'] = '*/*';
                headers1['Content-Type'] = 'application/json';
                headers1['Authorization'] = token;
                var response = https.post({
                    url: url,
                    body: req,
                    headers: headers1
                });
                var body = JSON.parse(response.body);
                var mensaje = body.mensaje;
                var cdr = body.cdr;

                return {
                    mensaje: mensaje,
                    cdr: cdr
                }
            } catch (error) {
                return error;
                //logError(array[0], array[1], 'Error-getDocumentCDR', JSON.stringify(e));
            }
        }


        function sendDocument(username, password, token, url, request, internalId) {
            var headers1 = new Array();
            try {
                var encode64 = base64Encoded(request.request);
                var filename = request.filename;
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
                logStatus(internalId, error);
                return error;
                //logError(array[0], array[1], 'Error-sendDocument', JSON.stringify(e));
            }
        }


        function generateFilePDF(namefile, content, array, internalId) {
            try {
                var fileObj = file.create({
                    name: namefile + '.pdf',
                    fileType: file.Type.PDF,
                    contents: content,
                    folder: FOLDER_PDF,
                    isOnline: true
                });
                var fileid = fileObj.save();
                return fileid;
            } catch (error) {
                logStatus(internalId, error);
                //logError(array[0], array[1], 'Error-generateFilePDF', e.message);
            }
        }


        function generateFileXML(namefile, content, array) {
            try {
                var xml = base64Decoded(content);
                var fileObj = file.create({
                    name: namefile + '.xml',
                    fileType: file.Type.XMLDOC,
                    contents: xml,
                    folder: FOLDER_PDF,
                    isOnline: true
                });
                var fileid = fileObj.save();
                return fileid;
            } catch (e) {
                //logError(array[0], array[1], 'Error-generateFileXML', e.message);
            }
        }


        function generateFileCDR(namefile, content, array) {
            try {
                var cdr = base64Decoded(content);
                var fileObj = file.create({
                    name: namefile + '-CDR.xml',
                    fileType: file.Type.XMLDOC,
                    contents: cdr,
                    folder: FOLDER_PDF,
                    isOnline: true
                });
                var fileid = fileObj.save();
                return fileid;
            } catch (e) {
                //logError(array[0], array[1], 'Error-generateFileCDR', e.message);
            }
        }


        function sleep(milliseconds) {
            var start = new Date().getTime();
            for (var i = 0; i < 1e7; i++) {
                if ((new Date().getTime() - start) > milliseconds) {
                    break;
                }
            }
        }


        function random() {
            return Math.random().toString(36).substr(2); // Eliminar `0.`
        }


        function token() {
            return random() + random() + random() + random() + random(); // Para hacer el token más largo
        }


        function logStatus(internalid, docstatus) {
            try {
                var logStatus = record.create({ type: 'customrecord_pe_ei_document_status' });
                logStatus.setValue('custrecord_pe_ei_document', internalid);
                logStatus.setValue('custrecord_pe_ei_document_status', docstatus);
                logStatus.save();
            } catch (error) {
                logStatus(internalId, error);
            }
        }


        function logError(internalid, response) {
            try {
                var logError = record.create({ type: 'customrecord_pe_ei_log_documents' });
                logError.setValue('custrecord_pe_ei_log_related_transaction', internalid);
                logError.setValue('custrecord_pe_ei_log_subsidiary', 3);
                logError.setValue('custrecord_pe_ei_log_employee', plugInContext.userIdd);
                logError.setValue('custrecord_pe_ei_log_status', 'Error');
                logError.setValue('custrecord_pe_ei_log_response', response);
                logError.save();
            } catch (e) {

            }
        }


        function sendEmail(success, arrayheader, arraybody, recordtype, array) {
            try {
                var sender = arrayheader[0];
                var recipient = arrayheader[1];
                var emisname = arrayheader[2];
                var tranid = arrayheader[3];
                var typedoc = arrayheader[4];
                var docstatus = arrayheader[5];
                var pdfid = arrayheader[6];
                var xmlid = arrayheader[7];
                var cdrid = arrayheader[8];
                var jsonid = arrayheader[9];
                var encodepdf = arrayheader[10];
                var internalid = arraybody[0];

                var subject = emisname + " - " + typedoc + "  " + tranid + ": " + docstatus;
                var body = '';
                if (success) {
                    body += '<p>Este es un mensaje automático de EVOL Latinoamerica.</p>';
                    body += '<p>Se ha generado la ' + typedoc + ' <b>' + tranid + '</b> con Internal ID <b>' + internalid + '</b> y estado <b>' + docstatus + '</b>.</p>';
                } else {
                    body += '<p>Este es un mensaje de error automático de EVOL Latinoamerica .</p>';
                    body += '<p>Se produjo un error al emitir la ' + typedoc + ' <b>' + tranid + '</b> con Internal ID <b>' + internalid + '</b> y estado <b>' + docstatus + '</b>.</p>';
                    // if (mensajeError != '') {
                    //     body += '<p>El error es el siguiente:</p>';
                    //     body += '<p>' + mensajeError + '</p>';
                    // }
                }

                var filepdf = file.load({ id: pdfid });
                var filexml = file.load({ id: xmlid });
                var filecdr = file.load({ id: cdrid });
                //var filejson = file.load({ id: jsonid });

                email.send({
                    author: sender,
                    recipients: [recipient],
                    subject: subject,
                    body: body,
                    attachments: [filepdf, filexml, filecdr]
                });

                var setrecord = setRecord(recordtype, internalid, tranid, filepdf.url, filexml.url, filecdr.url, 0, encodepdf, array);
                return setrecord;
            } catch (error) {
                logStatus(internalId, error);
                //logError(array[0], array[1], 'Error-SendEmail', e.message);
            }
        }


        //function setRecord(recordtype, internalid, tranid, urlpdf, urlxml, urlcdr, urljson, encodepdf, array) {
        function setRecord(recordtype, internalid, urlpdf, urlxml, urlcdr) {
            var recordload = '';
            try {
                if (recordtype == 'invoice') {
                    recordload = record.load({ type: record.Type.INVOICE, id: internalid, isDynamic: true })
                } else if (recordtype == 'creditmemo') {
                    recordload = record.load({ type: record.Type.CREDIT_MEMO, id: internalid });
                }
                //logStatus(internalId, 'internalid: ' + internalid + '-' + urlxml);
                //recordload = record.load({ type: record.Type.INVOICE, id: internalid, isDynamic: true })
                //recordload.setValue('custbody_pe_fe_ticket_id', tranid);
                //recordload.setValue('custbody_pe_ei_printed_xml_req', urljson);
                recordload.setValue('custbody_pe_ei_printed_xml_res', urlxml);
                recordload.setValue('custbody_pe_ei_printed_cdr_res', urlcdr);
                recordload.setValue('custbody_pe_ei_printed_pdf', urlpdf);
                //recordload.setValue('custbody_pe_ei_printed_pdf_codificado', encodepdf);
                recordload.save();
                // recordload = record.create({type: 'customrecord_pe_ei_printed_fields',isDynamic: true});
                // recordload.setValue('name', tranid);
                // recordload.setValue('custrecord_pe_ei_printed_xml_req', urljson);
                // recordload.setValue('custrecord_pe_ei_printed_xml_res', urlxml);
                // recordload.setValue('custrecord_pe_ei_printed_pdf', urlpdf);
                // recordload.setValue('custrecord_pe_ei_printed_cdr_res', urlcdr);
                // recordload.save();
                return recordload;
            } catch (error) {
                logStatus(internalId, 'Error: ' + error);
                //logError(array[0], array[1], 'Error-setRecord', e.message);
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


        function base64Decoded(content) {
            var base64decoded = encode.convert({
                string: content,
                inputEncoding: encode.Encoding.BASE_64,
                outputEncoding: encode.Encoding.UTF_8
            });
            return base64decoded;
        }

        
        return {
            send: send
        };
    });
