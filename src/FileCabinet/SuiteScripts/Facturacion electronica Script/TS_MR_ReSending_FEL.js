/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(["N/search", "N/runtime", "N/https", "N/file", "N/encode", "N/record"], function (search, runtime, https, file, encode, record) {

    // Estados de Estado de EI
    const FALLO_ENVIO_STATUS_EI = "8";
    const ENVIADO_STATUS_EI = "7";
    // Eventos historial auditoría EI
    const ENVIADO_STATUS_HISTORY_AUDIT_EI = "4";
    const FOLDER_PDF = 384;
    let user = runtime.getCurrentUser();

    const getInputData = (context) => {
        try {
            let documentosElectronicos = obtenerDocumentosPorReenviar();
            return documentosElectronicos;
        } catch (error) {
            log.error("error", error);
        }
    }

    const map = (context) => {
        log.error("map", "map");
        let key = context.key;
        let result = JSON.parse(context.value);
        log.error("result", result);
        try {
            let status = obtenerEstadoTransaccion(result.recordType, result.internalId);
            if (status != FALLO_ENVIO_STATUS_EI) return;
            let getcredentials = obtenerCredenciales(result.subsidiary);
            let { tokenpdf, tokenxml, tokencdr } = getTokens();
            let { urlgetpdf, urlgetxml, urlgetcdr } = getUrls(getcredentials.wsurl);

            var pdfResponse = getDocument(getcredentials.username, getcredentials.password, result.documentType, result.serie, result.number, tokenpdf, urlgetpdf);
            var xmlResponse = getDocument(getcredentials.username, getcredentials.password, result.documentType, result.serie, result.number, tokenxml, urlgetxml);
            var cdrResponse = getDocument(getcredentials.username, getcredentials.password, result.documentType, result.serie, result.number, tokencdr, urlgetcdr);

            if (pdfResponse.mensaje == 'OK' && xmlResponse.mensaje == 'OK' && cdrResponse.mensaje == 'OK') {
                var fileName = `${result.serie}-${result.number}`;
                var filepdf = generateFilePDF(fileName, pdfResponse.pdf);
                var filexml = generateFileXML(fileName, xmlResponse.xml);
                var filecdr = generateFileCDR(fileName, cdrResponse.cdr);

                var recordId = setRecord(result.recordType, result.internalId, filepdf, filexml, filecdr)
                if (filepdf != '' && filexml != '' && filecdr != '') {
                    log.error("Sent", recordId);
                    logStatus(result.internalId, 'Envio Valido');
                    historialAuditoriaDocumentoElectronico(result.internalId, result.entity, user.id.toString(), result);
                } else {
                    log.error("Error", "Error en la creación de los archivos en Netsuite");
                    logError(result.internalId, user.id, "Error Archivos", 'Error en la creación de los archivos en Netsuite');
                }
            } else {
                log.error("Error", "Error en la recuperación de los archivos del proveedor");
                logError(result.internalId, user.id, "Error Archivos", 'Error en la recuperación de los archivos del proveedor');
            }

        } catch (error) {
            log.error("Error in [Map] function", error);

        }
    }

    const obtenerDocumentoFiscal = () => {
        let documentJson = {};
        let searchResult = search.create({
            type: "customrecord_pe_fiscal_document_type",
            filters: [],
            columns: ["internalid", "custrecord_pe_code_document_type"]
        }).run().getRange(0, 1000);

        for (let i = 0; i < searchResult.length; i++) {
            let id = searchResult[i].getValue("internalid");
            let documentTypeCode = searchResult[i].getValue("custrecord_pe_code_document_type");
            documentJson[id] = documentTypeCode;
        }
        return documentJson;
    }

    const obtenerDocumentosPorReenviar = () => {
        let documentosResult = [];
        let documentoFiscalJson = obtenerDocumentoFiscal();
        try {
            let newSearch = search.create({
                type: "customrecord_ts_resend_e_documents_files",
                filters: [
                    ["custrecord_ts_resend_edoc_file_status", "anyof", FALLO_ENVIO_STATUS_EI],
                    "AND",
                    ["custrecord_ts_resend_edoc_file_transacti.mainline", "is", "T"],
                    "AND",
                    ["isinactive", "is", "F"]
                ],
                columns: [
                    "CUSTRECORD_TS_RESEND_EDOC_FILE_TRANSACTI.internalid",
                    "CUSTRECORD_TS_RESEND_EDOC_FILE_TRANSACTI.recordtype",
                    "CUSTRECORD_TS_RESEND_EDOC_FILE_TRANSACTI.subsidiary",
                    "CUSTRECORD_TS_RESEND_EDOC_FILE_TRANSACTI.custbody_pe_document_type",
                    "CUSTRECORD_TS_RESEND_EDOC_FILE_TRANSACTI.custbody_pe_serie",
                    "CUSTRECORD_TS_RESEND_EDOC_FILE_TRANSACTI.custbody_pe_number",
                    "CUSTRECORD_TS_RESEND_EDOC_FILE_TRANSACTI.name"
                ]
            });

            let pagedData = newSearch.runPaged({
                pageSize: 1000
            });

            pagedData.pageRanges.forEach(function (pageRange) {
                page = pagedData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    let columns = result.columns;
                    let reSendRecordId = result.id;
                    let internalId = result.getValue(columns[0]);
                    let recordType = result.getValue(columns[1]);
                    let subsidiary = result.getValue(columns[2]);
                    let documentType = documentoFiscalJson[result.getValue(columns[3])];
                    let serie = result.getText(columns[4]);
                    let number = result.getValue(columns[5]);
                    let entity = result.getValue(columns[6]);
                    documentosResult.push({
                        reSendRecordId,
                        internalId,
                        recordType,
                        subsidiary,
                        documentType,
                        serie,
                        number,
                        entity
                    });
                });
            });
        } catch (error) {
            log.error("Error in [obtenerDocumentosPorReenviar]", error);
        }
        return documentosResult;
    }

    const obtenerEstadoTransaccion = (type, id) => {
        let transaccion = search.lookupFields({
            type,
            id,
            columns: ["custbody_psg_ei_status"]
        });
        let status = transaccion.custbody_psg_ei_status.length ? transaccion.custbody_psg_ei_status[0].value : "";
        return status;
    }

    const obtenerCredenciales = (subsidiary) => {
        try {
            var accountSearchs = search.create({
                type: 'customrecord_pe_ei_enable_features',
                filters: [
                    ["custrecord_pe_ei_subsidiary", "anyof", subsidiary]
                ],
                columns: [
                    "custrecord_pe_ei_url_ws",
                    "custrecord_pe_ei_user",
                    "custrecord_pe_ei_password",
                    "custrecord_pe_ei_employ_copy"
                ]
            }).run().getRange(0, 1);

            return {
                wsurl: accountSearchs[0].getValue("custrecord_pe_ei_url_ws"),
                username: accountSearchs[0].getValue("custrecord_pe_ei_user"),
                password: accountSearchs[0].getValue("custrecord_pe_ei_password"),
                recipients: accountSearchs[0].getValue("custrecord_pe_ei_employ_copy")
            };
        } catch (error) {
            log.error("Error in obtenerCredenciales", error);
        }
    }

    const random = () => {
        return Math.random().toString(36).substr(2); // Eliminar `0.`
    }


    const token = () => {
        return random() + random() + random() + random() + random(); // Para hacer el token más largo
    }

    const getTokens = () => {
        return {
            tokenpdf: token(),
            tokenxml: token(),
            tokencdr: token()
        };
    }

    const getUrls = (wsUrl) => {
        return {
            urlgetpdf: wsUrl + 'wsBackend/clients/getDocumentPDF',
            urlgetxml: wsUrl + 'wsBackend/clients/getDocumentXML',
            urlgetcdr: wsUrl + 'wsBackend/clients/getDocumentCDR'
        }
    }

    // POST Returns: PDF: {codigo, mensaje, pdf}, XML: {codigo, mensaje, xml}, CDR: {codigo, mensaje, cdr} 
    const getDocument = (username, password, codCPE, numSerieCPE, numCPE, token, url) => {
        try {
            var headers = getHeaders(token);
            var body = getBody(username, password, codCPE, numSerieCPE, numCPE);
            var response = https.post({ url, body, headers });
            log.error("response getDocument", response);
            var body = JSON.parse(response.body);
            log.error("response body", body);

            return body;
        } catch (error) {
            log.error("error in [getDocument]", error);
        }
    }
    const getHeaders = (token) => {
        let headers = {};
        headers['Accept'] = '*/*';
        headers['Content-Type'] = 'application/json';
        headers['Authorization'] = token;
        return headers;
    }

    const getBody = (username, password, codCPE, numSerieCPE, numCPE) => {
        var body = JSON.stringify({
            user: {
                username: username,
                password: password
            },
            codCPE: codCPE,
            numSerieCPE: numSerieCPE,
            numCPE: numCPE
        });
        return body;
    }

    const generateFilePDF = (namefile, contents) => {
        try {
            var fileObj = file.create({
                name: namefile + '.pdf',
                fileType: file.Type.PDF,
                contents,
                folder: FOLDER_PDF,
                isOnline: true
            });
            return fileObj.save();
        } catch (error) {
            log.error("Error in [generateFilePDF]", error)
        }
    }

    const generateFileXML = (namefile, content) => {
        try {
            var xml = base64Decoded(content);
            var fileObj = file.create({
                name: namefile + '.xml',
                fileType: file.Type.XMLDOC,
                contents: xml,
                folder: FOLDER_PDF,
                isOnline: true
            });
            return fileObj.save();
        } catch (error) {
            log.error("Error in [generateFileXML]", error)
        }
    }

    const generateFileCDR = (namefile, content) => {
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
        } catch (error) {
            log.error("Error in [generateFileCDR]", error);
        }
    }

    const base64Decoded = (content) => {
        var base64decoded = encode.convert({
            string: content,
            inputEncoding: encode.Encoding.BASE_64,
            outputEncoding: encode.Encoding.UTF_8
        });
        return base64decoded;
    }

    const setRecord = (recordType, internalid, urlpdf, urlxml, urlcdr) => {
        try {
            var recordId = record.submitFields({
                type: recordType,
                id: internalid,
                values: {
                    custbody_psg_ei_status: ENVIADO_STATUS_EI,
                    custbody_pe_ei_printed_xml_res: urlxml,
                    custbody_pe_ei_printed_cdr_res: urlcdr,
                    custbody_pe_ei_printed_pdf: urlpdf
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });
            return recordId;
        } catch (error) {
            log.error("Error in [generateFileCDR]", error);
        }
    }

    const logStatus = (internalid, docstatus) => {
        try {
            var newRecord = record.create({ type: 'customrecord_pe_ei_document_status' });
            newRecord.setValue('custrecord_pe_ei_document', internalid);
            newRecord.setValue('custrecord_pe_ei_document_status', docstatus);
            newRecord.save();
        } catch (error) {
            log.error("Error in [logStatus]", error);
        }
    }

    const logError = (internalid, userid, docstatus, response) => {
        try {
            var logError = record.create({ type: 'customrecord_pe_ei_log_documents' });
            logError.setValue('custrecord_pe_ei_log_related_transaction', internalid);
            logError.setValue('custrecord_pe_ei_log_subsidiary', 1);
            //logError.setValue('custrecord_pe_ei_log_employee', userid);
            logError.setValue('custrecord_pe_ei_log_status', docstatus);
            logError.setValue('custrecord_pe_ei_log_response', response);
            logError.save();
        } catch (error) {
            log.error("Error in [logError]", error)
        }
    }

    const historialAuditoriaDocumentoElectronico = (transactionId, entityId, userId, detail) => {
        try {
            log.error("historialAuditoriaDocumentoElectronico", { transactionId, entityId, userId, detail });
            var newRecord = record.create({ type: "customrecord_psg_ei_audit_trail" });
            newRecord.setValue("custrecord_psg_ei_audit_transaction", transactionId);
            newRecord.setValue("custrecord_psg_ei_audit_entity", entityId);
            newRecord.setValue("custrecord_psg_ei_audit_event", ENVIADO_STATUS_HISTORY_AUDIT_EI);
            //newRecord.setValue("custrecord_psg_ei_audit_owner", userId);
            newRecord.setValue("custrecord_psg_ei_audit_details", JSON.stringify(detail));
            newRecord.save({ enableSourcing: false, ignoreMandatoryFields: true });
        } catch (error) {
            log.error("Error in [historialAuditoriaDocumentoElectronico]", error);
        }
    }

    return {
        getInputData,
        map
    };
})