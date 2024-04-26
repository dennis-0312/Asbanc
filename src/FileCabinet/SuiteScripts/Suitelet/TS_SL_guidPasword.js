var HTTPSMODULE, SFTPMODULE, SERVERWIDGETMODULE;
var HOST_KEY_TOOL_URL = 'https://ursuscode.com/tools/sshkeyscan.php?url=';

/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 *@NModuleScope Public
 */
define(["N/https", "N/sftp", "N/ui/serverWidget", "N/log", 'N/record', 'N/file', 'N/search', "N/transaction"], runSuitelet);

//********************** MAIN FUNCTION **********************
function runSuitelet(https, sftp, serverwidget, log, record, file, search, transaction) {

    NTRANSACTION = transaction
    HTTPSMODULE = https;
    SERVERWIDGETMODULE = serverwidget;
    SFTPMODULE = sftp;
    SFTPLOG = log;
    NSEARCH = search;
    NRECORD = record;
    NFILE = file;

    var returnObj = {};
    returnObj.onRequest = execute;
    return returnObj;
}

function execute(context) {


    var method = context.request.method;
    var form = getFormTemplate(method);
    if (method == 'GET') {
        form = addSelectorFields(form);
    }

    if (method == 'POST') {

        if (context.request.parameters.submitter) {
            var body = '';
        } else {
            var body = JSON.parse(context.request.body);
        }

        SFTPLOG.debug('body', body);

        var date = new Date();
        var dd = date.getDate();
        var mm = date.getMonth() + 1; //January is 0!
        var yyyy = date.getFullYear();
        mm = mm < 10 ? '0' + mm : mm;
        dd = dd < 10 ? '0' + dd : dd;

        var selectaction = context.request.parameters.selectaction;
        if (selectaction == 'getpasswordguid') {
            form = addPasswordGUID1Fields(form);

        }
        else if (selectaction == 'gethostkey') {
            form = addHostKeyFields(form);
        }
        else if (selectaction == 'downloadfile') {
            form = addDownloadFileFields(form);
        } else {

            var password = context.request.parameters.password;

            var username = context.request.parameters.username ? context.request.parameters.username : body.username;

            var passwordGuid = context.request.parameters.passwordguid ? context.request.parameters.passwordguid : body.passwordGuid;
            var url = context.request.parameters.url ? context.request.parameters.url : body.url;
            var hostKey = context.request.parameters.hostkey ? context.request.parameters.hostkey : body.hostKey;
            var hostKeyType = context.request.parameters.hostkeytype ? context.request.parameters.hostkeytype : body.hostKeyType;
            var port = context.request.parameters.port ? context.request.parameters.port : body.port;
            var directory = body.directory;
            //var directory = "/SFTP-NETSUITE-DEV/ASBANC/FTR_NS/DEUDAS";
            var timeout = context.request.parameters.timeout;
            var filename = context.request.parameters.filename;
            var namefile = body.namefile;
            var tipo = context.request.parameters.tipo ? context.request.parameters.tipo : body.tipo;
            var restricttoscriptids = context.request.parameters.restricttoscriptids;
            var restricttodomains = context.request.parameters.restricttodomains;

            if (restricttoscriptids && restricttodomains) {
                form = addPasswordGUID2Fields(form, restricttoscriptids, restricttodomains);
            }

            if (password) {
                form.addField({
                    id: 'passwordguidresponse',
                    type: SERVERWIDGETMODULE.FieldType.LONGTEXT,
                    label: 'PasswordGUID Response',
                    displayType: SERVERWIDGETMODULE.FieldDisplayType.INLINE
                }).defaultValue = password;
            }
            if (url && passwordGuid && hostKey && tipo == "MoveField") {
                try {
                    var sftpConnection = getSFTPConnection(username, passwordGuid, url, hostKey, hostKeyType, port, directory, timeout);
                    var moves = sftpConnection.move({
                        from: body.rutaOrigen,
                        to: body.rutaDestino
                    })
                    SFTPLOG.debug('Movimiento Correcto', moves);
                } catch (error) {
                    SFTPLOG.debug('Error', error);
                }

            }
            if (url && passwordGuid && hostKey && tipo == "ProcessField") {
                var downloadedFile = NFILE.load({
                    id: body.filecontet
                }).getContents();

                var validador = 0;
                var contador = 0
                var array = new Array();
                var list = new Array();
                var anular = new Array();
                var result = {};
                try {
                    do {


SFTPLOG.debug('body',  downloadedFile.substr(validador + 73, 12));
                        var invoiceSearchObj = NSEARCH.create({
                            type: "invoice",
                            filters:
                                [
                                    ["type", "anyof", "CustInvc"],

                                    "AND",
                                    ["formulatext: CONCAT({custbody_pe_serie}, {custbody_pe_number})", "is", downloadedFile.substr(validador + 73, 12)]

                                ],
                            columns:
                                [
                                    NSEARCH.createColumn({ name: "custbody_pe_ei_forma_pago", label: "forma" }),
                                    NSEARCH.createColumn({ name: "internalid", label: "External ID" }),
                                    NSEARCH.createColumn({ name: "amount", label: "Amount" }),
                                ]
                        });
                        var searchResult = invoiceSearchObj.run().getRange({ start: 0, end: 1 });
                        if (!searchResult.length) {

                            list = new Array();
                            anular = new Array();
                            break;
                        }
                        var montoEnviado = parseFloat(downloadedFile.substr(validador + 111, 13) + '.' + downloadedFile.substr(validador + 124, 2))
                        var paymentSearch = NSEARCH.create({
                            type: NSEARCH.Type.CUSTOMER_PAYMENT, // Tipo de búsqueda: Pago de cliente
                            filters: [
                                NSEARCH.createFilter({
                                    name: 'appliedtotransaction',
                                    operator: NSEARCH.Operator.ANYOF,
                                    values: searchResult[0].getValue('internalid')
                                })
                            ],
                            columns: ['amount'] // Columna para obtener el ID del pago
                        });
                        var searchResults = paymentSearch.run().getRange({ start: 0, end: 100 });
                        var montototal = 0;

                        for (var i = 0; i < searchResults.length; i++) {
                            montototal = montototal + parseInt(searchResults[i].getValue('amount'));
                        }


                        montototal = (montototal) - montoEnviado;

                        if (montototal > parseFloat(searchResult[0].getValue('amount'))) {

                            list = new Array();
                            anular = new Array();
                            break;
                        }
                        /*if (searchResult[0].getValue('custbody_pe_ei_forma_pago') == 2) {
                            var CreditoFac = record.load({
                                type: 'invoice',
                                id: searchResult[0].getValue('internalid'),
                                isDynamic: true
                            });
                            var numLines = CreditoFac.getLineCount({ sublistId: 'installment' });
                            var montoCredit;
                            for (var index = 0; index < numLines; index++) {
                                var seqnum = CreditoFac.getSublistValue({ sublistId: 'installment', fieldId: 'seqnum', line: index });
                                if (seqnum == 2) {
                                    montoCredit = CreditoFac.getSublistValue({ sublistId: 'installment', fieldId: 'amount', line: index });
                                    break;
                                }
            
                            }
            
            
                            if (montoEnviado != montoCredit) {
                                log.debug('Error', 'Montos son diferentes');
                                list = new Array();
                                break;
                            }
                        }*/

                        var accion = downloadedFile.substr(validador + 205, 1);
                        if (accion == 'P') {
                            list.push(searchResult[0].getValue('internalid'));
                        } else {
                            anular.push(searchResult[0].getValue('internalid'));
                        }

                        if (!result[searchResult[0].getValue('internalid')]) {
                            result[searchResult[0].getValue('internalid')] = {
                                monto: montoEnviado,
                                account: downloadedFile.substr(validador + 6, 20),
                                numeroOperacion: downloadedFile.substr(validador + 181, 12),
                                canalPAgo: downloadedFile.substr(validador + 193, 2),
                                formaPago: downloadedFile.substr(validador + 195, 2),
                                codigoBanco: downloadedFile.substr(validador + 206, 4),
                                accion: downloadedFile.substr(validador + 205, 1)
                            };

                        }
                        validador = validador + 242;
                    } while (downloadedFile.length > validador);

                    
                    var SFTPArchivo = NRECORD.load({
                        type: 'customrecord_archivos_sftp',
                        id: body.internalID,
                        isDynamic: true
                    });
                    if (list.length || anular.length) {
                        for (var index = 0; index < list.length; index++) {
                            var createFactura = NRECORD.transform({
                                fromType: 'invoice',
                                fromId: list[index],
                                toType: 'customerpayment',

                            })
                            createFactura.setValue({
                                fieldId: 'custbody_asb_num_ope',
                                value: result[list[index]].numeroOperacion
                            });
                            createFactura.setValue({
                                fieldId: 'custbody_asb_canal_pago',
                                value: result[list[index]].canalPAgo
                            });
                            createFactura.setValue({
                                fieldId: 'custbody_asb_forma_pago',
                                value: result[list[index]].formaPago
                            });
                            SFTPLOG.debug('result[list[index]].account', result[list[index]].account);
                            var accountSearchObj = NSEARCH.create({
                                type: "account",
                                filters:
                                    [
                                        ["custrecord_pe_bank_account", "is", result[list[index]].account.trim().replace(/\s/g, "")]
                                    ],
                                columns:
                                    [
                                        NSEARCH.createColumn({ name: "internalid", label: "Internal ID" })
                                    ]
                            });
                            var searchResultCount = accountSearchObj.runPaged().count;
                            log.debug("accountSearchObj result count", searchResultCount);
                            var accountsResult = accountSearchObj.run().getRange({ start: 0, end: 1 });
                            SFTPLOG.debug('accountsResult', accountsResult);
                            SFTPLOG.debug('cuenta', accountsResult[0].getValue('internalid'));
                            createFactura.setValue({
                                fieldId: 'undepfunds',
                                value: 'F'
                            });
                            createFactura.setValue({
                                fieldId: 'account',
                                value: accountsResult[0].getValue('internalid')
                            });

                            createFactura.setValue({
                                fieldId: 'custbody_asb_tipo_operacion',
                                value: result[list[index]].accion == 'P' ? 1 : 2
                            });
                            var Banc = NSEARCH.create({
                                type: "customrecord_asb_bancos",
                                filters:
                                    [
                                        ["custrecord_asb_cod_banco", "is", result[list[index]].codigoBanco]
                                    ],
                                columns:
                                    [
                                        NSEARCH.createColumn({ name: "internalid", label: "ID" }),
                                    ]
                            });
                            var BancResult = Banc.run().getRange({ start: 0, end: 1 });

                            createFactura.setValue({
                                fieldId: 'custbody_asb_banco_pago',
                                value: BancResult[0].getValue('internalid')
                            });
                            var numLines = createFactura.getLineCount({ sublistId: 'apply' });

                            for (var i = 0; i < numLines; i++) {
                                var AplicaPPTO = createFactura.getSublistValue({ sublistId: 'apply', fieldId: 'internalid', line: i });
                                if (AplicaPPTO == list[index]) {
                                    createFactura.setSublistValue({ sublistId: 'apply', fieldId: 'amount', line: i, value: parseFloat(result[list[index]].monto) });
                                }
                            }
                            SFTPLOG.debug('monto', result[list[index]].monto);
                            var id = createFactura.save();

                        }
                        for (var index = 0; index < anular.length; index++) {
                            var paymentSearch = NSEARCH.create({
                                type: NSEARCH.Type.CUSTOMER_PAYMENT, // Tipo de búsqueda: Pago de cliente
                                filters: [
                                    NSEARCH.createFilter({
                                        name: 'appliedtotransaction',
                                        operator: NSEARCH.Operator.ANYOF,
                                        values: anular[index]
                                    })
                                ],
                                columns: ['internalid'] // Columna para obtener el ID del pago
                            });
                            var searchResults = paymentSearch.run().getRange({ start: 0, end: 1 });

                            var paymentId = searchResults[0].getValue({ name: 'internalid' });


                            // Cargar el registro del pago
                            var voidSalesOrderId = NTRANSACTION.void({
                                type: NTRANSACTION.Type.CUSTOMER_PAYMENT, //disable Void Transactions Using Reversing Journals in Account Pref
                                id: paymentId
                            });


                        }
                        SFTPArchivo.setValue({ fieldId: 'custrecord_ns_estado', value: 3 });
                        SFTPLOG.debug('Proceso', "Completado Exitosamente");
                    } else {
                        SFTPLOG.debug('Error', "Documento no encontrado");
                        SFTPArchivo.setValue({ fieldId: 'custrecord_ns_estado', value: 2 });
                    }

                    SFTPArchivo.save();
                } catch (error) {
                    SFTPLOG.debug('Error', error);
                    var SFTPArchivo = NRECORD.load({
                        type: 'customrecord_archivos_sftp',
                        id: body.internalID,
                        isDynamic: true
                    });

                    SFTPArchivo.setValue({ fieldId: 'custrecord_ns_estado', value: 2 });
                    SFTPArchivo.save();

                }


                form.addField({
                    id: 'filecontents',
                    type: SERVERWIDGETMODULE.FieldType.LONGTEXT,
                    label: 'File Contents',
                    displayType: SERVERWIDGETMODULE.FieldDisplayType.INLINE
                }).defaultValue = 0;
            }
            if (url && passwordGuid && hostKey && tipo == "CreateField") {
                var sftpConnection = getSFTPConnection(username, passwordGuid, url, hostKey, hostKeyType, port, directory, timeout);
                SFTPLOG.debug('namefile', namefile);
                var filecontet = body.filecontet;
                var myFileToUpload = NFILE.create({
                    name: namefile,
                    fileType: NFILE.Type.PLAINTEXT,
                    contents: filecontet
                });
                sftpConnection.upload({
                    filename: namefile,
                    file: myFileToUpload,
                    replaceExisting: true
                });
                form.addField({
                    id: 'filecontents',
                    type: SERVERWIDGETMODULE.FieldType.LONGTEXT,
                    label: 'File Contents',
                    displayType: SERVERWIDGETMODULE.FieldDisplayType.INLINE
                }).defaultValue = filecontet;

            }
            if (url && passwordGuid && hostKey && tipo == "DowloadField") {


                var sftpConnection = getSFTPConnection(username, passwordGuid, url, hostKey, hostKeyType, port, directory, timeout);

                SFTPLOG.debug('sftpConnection', sftpConnection);
                var objConnection = sftpConnection.list({});
                for (var index = 0; index < objConnection.length; index++) {
                    if (!objConnection[index].directory) {

                        var invoiceSearchObj = NSEARCH.create({
                            type: "customrecord_archivos_sftp",
                            filters:
                                [
                                    ["custrecord_ns_tipo", "anyof", body.tipoconfig],
                                    "AND",
                                    ["custrecord_ns_estado", "anyof", "1", "3"],
                                    "AND",
                                    ["custrecord_nombre_archivo", "is", String(objConnection[index].name)]
                                ]
                        });
                        var srchRes = invoiceSearchObj.run().getRange(0, 10);

                        if (!srchRes.length) {
                            var downloadedFile = sftpConnection.download({
                                filename: objConnection[index].name
                            });
                            downloadedFile.folder = body.idcard;
                            var id = downloadedFile.save();
                            var objRecordArc = NRECORD.create({
                                type: 'customrecord_archivos_sftp',
                                isDynamic: true,

                            });
                            objRecordArc.setValue({ fieldId: 'custrecord_nombre_archivo', value: objConnection[index].name });
                            objRecordArc.setValue({ fieldId: 'custrecord_ns_rs_id', value: id });
                            objRecordArc.setValue({ fieldId: 'custrecord_ns_tipo', value: body.tipoconfig });
                            objRecordArc.setValue({ fieldId: 'custrecord_ns_estado', value: 1 });
                            objRecordArc.setValue({ fieldId: 'custrecord_ns_ruta', value: 'SFTP DESCARGA' });
                            objRecordArc.setValue({ fieldId: 'custrecord_ns_carpeta', value: body.idcard });
                            objRecordArc.save();
                        }
                    }

                }




                form.addField({
                    id: 'filecontents',
                    type: SERVERWIDGETMODULE.FieldType.LONGTEXT,
                    label: 'File Contents',
                    displayType: SERVERWIDGETMODULE.FieldDisplayType.INLINE
                }).defaultValue = 0;

            } else if (url) {
                var myUrl = HOST_KEY_TOOL_URL + url + "&port=" + port + "&type=" + hostKeyType;
                var theResponse = HTTPSMODULE.get({ url: myUrl }).body;
                form.addField({
                    id: 'hostkeyresponse',
                    type: SERVERWIDGETMODULE.FieldType.LONGTEXT,
                    label: 'Host Key Response',
                    displayType: SERVERWIDGETMODULE.FieldDisplayType.INLINE
                }).defaultValue = theResponse;
            }
        }
    }

    context.response.writePage(form);

}

function addSelectorFields(form) {
    var select = form.addField({
        id: 'selectaction',
        type: SERVERWIDGETMODULE.FieldType.SELECT,
        label: 'Select Action'
    });
    select.addSelectOption({
        value: 'getpasswordguid',
        text: 'Get Password GUID',
    });
    select.addSelectOption({
        value: 'gethostkey',
        text: 'Get Host Key'
    });
    select.addSelectOption({
        value: 'downloadfile',
        text: 'Download File'
    });
    return form;
}

function addPasswordGUID1Fields(form) {
    form.addField({
        id: 'restricttoscriptids',
        type: SERVERWIDGETMODULE.FieldType.TEXT,
        label: 'Restrict To Script Ids',
    }).isMandatory = true;
    form.addField({
        id: 'restricttodomains',
        type: SERVERWIDGETMODULE.FieldType.TEXT,
        label: 'Restrict To Domains',
    }).isMandatory = true;

    return form;
}

function addPasswordGUID2Fields(form, restrictToScriptIds, restrictToDomains) {
    form.addCredentialField({
        id: 'password',
        label: 'Password',
        restrictToScriptIds: restrictToScriptIds.replace(' ', '').split(','),
        restrictToDomains: restrictToDomains.replace(' ', '').split(','),
    });
    return form;
}

function addHostKeyFields(form) {
    form.addField({
        id: 'url',
        type: SERVERWIDGETMODULE.FieldType.TEXT,
        label: 'URL (Required)',
    });

    form.addField({
        id: 'port',
        type: SERVERWIDGETMODULE.FieldType.INTEGER,
        label: 'Port (Optional)',
    });

    form.addField({
        id: 'hostkeytype',
        type: SERVERWIDGETMODULE.FieldType.TEXT,
        label: 'Type (Optional)',
    });
    return form;
}

function addDownloadFileFields(form) {
    var sftp = NRECORD.load({ type: 'customrecord_ns_sftp_conect', id: 2, isDynamic: true });
    var url = sftp.getValue({ fieldId: 'custrecord_ns_rs_url' });
    var user = sftp.getValue({ fieldId: 'custrecord_ns_user' });
    var password = sftp.getValue({ fieldId: 'custrecord_ns_password' });
    var host_key = sftp.getValue({ fieldId: 'custrecordns_host_key' });
    var ns = sftp.getValue({ fieldId: 'custrecord_ns_host_key' });
    var port = sftp.getValue({ fieldId: 'custrecord_ns_port' });
    var timeout = sftp.getValue({ fieldId: 'custrecord_ns_timeout' });
    var directory = sftp.getValue({ fieldId: 'custrecord_ns_directory' });
    var tipo = form.addField({
        id: 'tipo',
        type: SERVERWIDGETMODULE.FieldType.TEXT,
        label: 'Type',
    });
    tipo.defaultValue = "DowloadField";
    var urlForm = form.addField({
        id: 'url',
        type: SERVERWIDGETMODULE.FieldType.TEXT,
        label: 'URL (Required)',
    });
    urlForm.defaultValue = url;

    var username = form.addField({
        id: 'username',
        type: SERVERWIDGETMODULE.FieldType.TEXT,
        label: 'Username',
    });
    username.defaultValue = user;
    var passForm = form.addField({
        id: 'passwordguid',
        type: SERVERWIDGETMODULE.FieldType.LONGTEXT,
        label: 'PasswordGuid (Required)',
    });
    passForm.defaultValue = password;
    var hostkeyForm = form.addField({
        id: 'hostkey',
        type: SERVERWIDGETMODULE.FieldType.LONGTEXT,
        label: 'Host Key (Required)',
    });
    hostkeyForm.defaultValue = host_key;
    var hostkeytypeForm = form.addField({
        id: 'hostkeytype',
        type: SERVERWIDGETMODULE.FieldType.TEXT,
        label: 'Host Key Type',
    });
    hostkeytypeForm.defaultValue = ns;


    var portForm = form.addField({
        id: 'port',
        type: SERVERWIDGETMODULE.FieldType.INTEGER,
        label: 'Port',
    });
    portForm.defaultValue = port;


    var timeoutForm = form.addField({
        id: 'timeout',
        type: SERVERWIDGETMODULE.FieldType.INTEGER,
        label: 'Timeout',
    });
    timeoutForm.defaultValue = timeout;
    return form;
}

function getFormTemplate() {
    var form = SERVERWIDGETMODULE.createForm({
        title: 'SFTP Helper Tool'
    });
    form.addSubmitButton({
        label: 'Submit'
    });

    return form;
}

function getSFTPConnection(username, passwordGuid, url, hostKey, hostKeyType, port, directory, timeout) {
    var preConnectionObj = {};
    preConnectionObj.passwordGuid = passwordGuid;
    preConnectionObj.url = url;
    preConnectionObj.hostKey = hostKey;
    if (username) { preConnectionObj.username = username; }
    if (hostKeyType) { preConnectionObj.hostKeyType = hostKeyType; }
    if (port) { preConnectionObj.port = Number(port); }
    if (directory) { preConnectionObj.directory = directory; }
    if (timeout) { preConnectionObj.timeout = Number(timeout); }

    var connectionObj = SFTPMODULE.createConnection(preConnectionObj);
    return connectionObj;
}