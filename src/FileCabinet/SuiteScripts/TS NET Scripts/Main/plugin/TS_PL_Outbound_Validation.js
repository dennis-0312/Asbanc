/**
 * @NApiVersion 2.x
 * @NScriptType plugintypeimpl
 * @NModuleScope Public
 */
define(['N/config', 'N/email', 'N/encode', 'N/file', 'N/format', 'N/https', 'N/record', 'N/runtime', 'N/search', 'N/log'],
    /**
     * @param{config} config
     * @param{email} email
     * @param{encode} encode
     * @param{file} file
     * @param{format} format
     * @param{https} https
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search!
     */
    /**
    * @param {Object} pluginContext
.   * @param {String} pluginContext.content
    * @param {String} pluginContext.transactionInfo.transactionId
    * @param {String} pluginContext.transactionInfo.transactionType
    * @param {Number} pluginContext.userId
    * @returns {Object} result
    * @returns {string} result.success
    * @returns {String} result.message
    */

    function (config, email, encode, file, format, https, record, runtime, search, log) {
        var FOLDER_PDF = 513;          //SB: 513   PR: ? - ok
        var internalId = '';
        var userId = '';
        var FORMA_PAGO_CREDITO = 2;
        var REASON_AUMENTO_DE_VALOR = 4;
        var FACTURA = 1;
        var BOLETA = 3;
        var NOTA_CREDITO = 7;
        var NOTA_DEBITO = 8;
        var GUIA_REMISION = 9;

        function validate(pluginContext) {
            log.debug({
                title: 'Custom Log - Debug',
                details: 'This is a debug message.'
            });
            var result = { success: false, message: "Validation failed." };
            try {
                var transactionId = pluginContext.transactionInfo.transactionId;
                var tranType = pluginContext.transactionInfo.transactionType
                var response;
                switch (tranType) {
                    case 'invoice':
                        response = createRequest(transactionId);
                        break;
                    case 'creditmemo':
                        response = createRequestCreditMemo(transactionId);
                        break;

                    default:
                        result.success = false;
                        result.message = 'Tracacción no válida';
                        break;
                }
                result.success = true;
                result.message = response;
                return result;
            } catch (error) {
                result.success = false;
                result.message = "Val " + error.message;
            }
            return result;
        }


        function createRequest(documentid) {
            var json = new Array();
            var jsonMain = new Array();
            var jsonIDE = new Array();
            var jsonEMI = new Array();
            var jsonREC = new Array();
            var jsonDRF = new Array();
            var jsonCAB = new Array();
            var arrayCAB = new Array();
            var jsonLeyenda = new Array();
            var jsonADI = new Array();
            var jsonCUO = new Array();
            var jsonADI2 = new Array();
            var factura = new Array();
            var fulfillment = 0;

            try {
                var searchLoad = search.create({
                    type: "transaction",
                    filters:
                        [
                            ["type", "anyof", "CustInvc"],
                            "AND",
                            ["internalid", "anyof", documentid]
                        ],
                    columns:
                        [
                            // IDE---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({ name: "formulatext", formula: "CONCAT({custbody_pe_serie}, CONCAT('-', {custbody_pe_number}))", label: "numeracion" }),//0
                            search.createColumn({ name: "trandate", label: "2 Date" }),
                            search.createColumn({ name: "datecreated", label: "3 Date Created" }),
                            search.createColumn({ name: "formulatext", formula: "CASE WHEN {custbody_pe_document_type} = 'Factura' THEN '01' WHEN {custbody_pe_document_type} = 'Boleta de Venta' THEN '03' WHEN {custbody_pe_document_type} = 'Nota de Debito' THEN '08' END", label: "codTipoDocumento" }),//3
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
                            search.createColumn({ name: "custbody_pe_reason", label: "reason" }),
                            // IMM:REFERENCIA
                            search.createColumn({ name: "formulatext", formula: "CASE WHEN {custbody_pe_document_type_ref} = 'Factura' THEN '01' WHEN {custbody_pe_document_type_ref} = 'Boleta de Venta' THEN '03' END", label: "tipoDocRelacionado" }),
                            search.createColumn({ name: "custbody_pe_document_series_ref", label: "ref_series" }),
                            search.createColumn({ name: "custbody_pe_document_number_ref", label: "ref_number" }),
                        ]
                });
                var searchResult = searchLoad.run().getRange({ start: 0, end: 200 });
                // IDE---------------------------------------------------------------------------------------------------------------------
                var numeracion = searchResult[0].getValue(searchLoad.columns[0]);
                var reason = searchResult[0].getValue({ name: "custbody_pe_reason", label: "reason" });
                // IMM:REFERENCIA
                var ref_tipo_doc = searchResult[0].getValue({ name: "formulatext", label: "tipoDocRelacionado" });
                var series_ref = searchResult[0].getValue({ name: "custbody_pe_document_series_ref", label: "series_ref" });
                var ref_number = searchResult[0].getValue({ name: "custbody_pe_document_number_ref", label: "ref_number" });

                var fechaEmision = searchResult[0].getValue({ name: "trandate" });
                fechaEmision = fechaEmision.split('/');
                fechaEmision = fechaEmision[2] + '-' + fechaEmision[1] + '-' + fechaEmision[0];
                var horaEmision = searchResult[0].getValue({ name: "datecreated" });
                horaEmision = horaEmision.split(' ');
                horaEmision = horaEmision[1] + ':00';
                var codTipoDocumento = searchResult[0].getValue(searchLoad.columns[3]);
                var column05 = searchResult[0].getValue({ name: "symbol", join: "Currency" });
                var column06 = searchResult[0].getValue({ name: "otherrefnum", join: "createdFrom" });
                // EMI---------------------------------------------------------------------------------------------------------------------
                var column07 = searchResult[0].getValue(searchLoad.columns[6]);
                var column08 = searchResult[0].getValue({ name: "taxidnum", join: "subsidiary" });
                var column09 = searchResult[0].getValue(searchLoad.columns[8]);
                var column10 = searchResult[0].getValue({ name: "legalname", join: "subsidiary" });
                var codubigeo = getUbigeo();
                var column11 = searchResult[0].getValue({ name: "address1", join: "location" });
                var column12 = searchResult[0].getValue({ name: "address2", join: "location" });
                var column13 = searchResult[0].getValue({ name: "address1", join: "subsidiary" });
                var column14 = searchResult[0].getValue({ name: "state", join: "subsidiary" });
                var column15 = searchResult[0].getValue({ name: "address3", join: "subsidiary" });
                var column16 = searchResult[0].getValue({ name: "billcountrycode" });
                var column17 = searchResult[0].getValue({ name: "phone", join: "subsidiary" });
                var column18 = searchResult[0].getValue({ name: "email", join: "subsidiary" });
                var column19 = searchResult[0].getValue(searchLoad.columns[18]);
                // REC---------------------------------------------------------------------------------------------------------------------
                var column20 = searchResult[0].getValue(searchLoad.columns[19]);
                //var column21 = searchResult[0].getValue({ name: "vatregnumber", join: "customer" });
                var column21 = searchResult[0].getValue({ name: "custentity_pe_document_number", join: "customer" });
                var column22 = searchResult[0].getValue({ name: "companyname", join: "customer" });
                var column23 = searchResult[0].getValue({ name: "billaddress1" });
                var column24 = searchResult[0].getValue({ name: "billaddress2" });
                var column25 = searchResult[0].getValue({ name: "city", join: "customer" });
                var column26 = searchResult[0].getValue({ name: "state", join: "customer" });
                var column27 = searchResult[0].getValue({ name: "address3", join: "customer" });
                var column28 = searchResult[0].getValue({ name: "countrycode", join: "customer" });
                var column29 = searchResult[0].getValue({ name: "phone", join: "customer" });
                var column30 = searchResult[0].getValue({ name: "email", join: "customer" });
                // CAB---------------------------------------------------------------------------------------------------------------------
                var column31 = searchResult[0].getValue({ name: "custrecord_pe_cod_fact_2", join: "CUSTBODY_PE_EI_OPERATION_TYPE" });
                var column32 = searchResult[0].getValue({ name: "duedate" });
                if (column32 != '') {
                    column32 = column32.split('/');
                    column32 = column32[2] + '-' + column32[1] + '-' + column32[0];
                }
                // ADI---------------------------------------------------------------------------------------------------------------------
                var formaPagoDetr = searchResult[0].getText({ name: "custbody_pe_ei_forma_pago", label: "formaPagoDetr" });
                var formaPagoDetrVal = searchResult[0].getValue({ name: "custbody_pe_ei_forma_pago", label: "formaPagoDetr" });
                var metodoPagoDetr = 'VISA';
                var conceptDetr = searchResult[0].getText({ name: "custbody_pe_concept_detraction", label: "conceptDetr" });
                if (conceptDetr.length > 0) {
                    conceptDetr = conceptDetr.split(' ')[0];
                }

                var numCuentaBcoNacionDetr = searchResult[0].getValue({ name: "custrecord_pe_detraccion_account", join: "subsidiary", label: "numCuentaBcoNacionDetr" });
                numCuentaBcoNacionDetr = '12-312-312345'
                var montoDetr = 0;
                var suma = 0
                for (var i in searchResult) {
                    montoDetr = searchResult[i].getValue({ name: "custcol_4601_witaxamount", label: "montoDetr" });
                    //logStatus(documentid, 'montoDetr: ' + i + ' - ' + montoDetr);
                    if (montoDetr.length > 0) {
                        suma += parseFloat(montoDetr)
                        // break;
                    }
                }
                montoDetr = suma.toFixed(2);
                var medioPagoDetr = '001';
                var porcentajeDetr = searchResult[0].getValue({ name: "custbody_pe_percentage_detraccion", label: "porcentajeDetr" });
                if (porcentajeDetr.includes("%")) {
                    porcentajeDetr = porcentajeDetr.replace(/%/g, '');
                }
                var tipoCambio = searchResult[0].getValue({ name: "exchangerate", label: "Exchange Rate" });


                // FREE--------------------------------------------------------------------------------------------------------------------
                var column43 = searchResult[0].getValue({ name: "custbody_pe_free_operation" });

                //*********************************** CONSTRUCCION DE TRAMA ***************************************/
                var nmro_documento = '';
                var razon_social = '';
                var direccion_cliente = '';

                nmro_documento = column21;
                razon_social = column22;
                direccion_cliente = column23 + ' ' + column24;
                // column05 = 'PEN' //TODO: Arreglar ===============

                jsonIDE = {
                    numeracion: numeracion,
                    fechaEmision: fechaEmision,
                    //horaEmision: horaEmision,
                    codTipoDocumento: codTipoDocumento,
                    tipoMoneda: column05,
                    //numeroOrdenCompra: column45,
                    formaPago: formaPagoDetr
                }

                jsonEMI = {
                    tipoDocId: column07,
                    numeroDocId: column08,
                    nombreComercial: column09,
                    razonSocial: column10,
                    ubigeo: codubigeo.ubigeo,
                    direccion: column13,
                    departamento: column11 + ' ' + column12,
                    provincia: column14,
                    distrito: column15,
                    codigoPais: column16,
                    telefono: column17,
                    correoElectronico: column18,
                    codigoAsigSUNAT: column19
                }


                //logStatus(documentid, codubigeo.ubigeo);

                jsonREC = {
                    tipoDocId: column20,
                    numeroDocId: nmro_documento,
                    razonSocial: razon_social,
                    direccion: direccion_cliente,
                    departamento: column25,
                    provincia: column26,
                    distrito: column27,
                    codigoPais: column28,
                    telefono: column29,
                    correoElectronico: column30
                }

                var detail = getDetail(documentid, column43 /*objPromocion*/);
                var monto = '';
                if (column05 == 'PEN') {
                    monto = NumeroALetras(detail.importetotal, { plural: 'SOLES', singular: 'SOLES', centPlural: 'CENTIMOS', centSingular: 'CENTIMO' });
                } else {
                    monto = NumeroALetrasDolar(detail.importetotal, { plural: 'DOLARES AMERICANOS', singular: 'DOLAR AMERICANO', centPlural: 'CENTAVOS', centSingular: 'CENTAVO' });
                }

                jsonLeyenda = [
                    {
                        codigo: "1000",
                        descripcion: monto
                    }
                ]

                //Objeto comodín para inicializar el json, luego será eliminado
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
                        "codigo": "1004",
                        "totalVentas": (parseFloat(totalVentasGra) + parseFloat(totalVentasIna) + parseFloat(totalVentasExo)).toFixed(2)
                    }

                    arrayCAB.push({
                        "idImpuesto": "9996",
                        "montoImpuesto": (parseFloat(montoImpuestoGra) + parseFloat(montoImpuestoIna) + parseFloat(montoImpuestoExo)).toFixed(2)
                    });
                }

                var icbper = detail.totalimpuestoicbper;
                if (icbper.length != '') {
                    arrayCAB.push(icbper.pop());
                }
                jsonCAB.totalImpuestos = arrayCAB;


                /* The code is checking the values of two variables, `detail.applywh` and `column43`,
                and based on their values, it sets the value of `jsonCAB.importeTotal`. Probar para mañanaa detracción */
                if (detail.applywh == true) {
                    var importe = parseFloat(detail.importetotal) + parseFloat(montoDetr);
                    jsonCAB.importeTotal = importe.toString();
                } else if (column43 == true) {
                    jsonCAB.importeTotal = '0.00';
                } else {
                    jsonCAB.importeTotal = detail.importetotal.toString();
                }


                //jsonCAB.importeTotal = column43 == true ? '0.00' : detail.importetotal.toString();
                jsonCAB.tipoOperacion = column31;
                jsonCAB.leyenda = jsonLeyenda;
                jsonCAB.montoTotalImpuestos = column43 == true ? '0.00' : detail.montototalimpuestos.toString();

                if (typeof detail.cargodescuento != 'undefined') {
                    jsonCAB.totalDescuentos = detail.totaldescuentos;
                    jsonCAB.cargoDescuento = detail.cargodescuento;
                }
                delete jsonCAB.inicializador;

                // jsonDRF = [
                //     {
                //         tipoDocRelacionado: tipoDocRelacionado,
                //         numeroDocRelacionado: numeroDocRelacionado,
                //         codigoMotivo: codigoMotivo,
                //         descripcionMotivo: descripcionMotivo
                //     }
                // ]


                //^Operación sujeta al Sistema de Pago de Obligaciones Tributarias.\nDepositar a la cuenta del Banco de la Nación \nNro. 12-312-312345.\nMedio de Pago: 001 - Depósito en cuenta\nMonto: 991.20\nTipo de Cambio: 3.50000\nPorcentaje: 12.00%
                var detracciones = 'Operación sujeta al Sistema de Pago de Obligaciones Tributarias.\nDepositar a la cuenta del Banco de la Nación \nNro ' + numCuentaBcoNacionDetr + '.\nMedio de Pago:' + medioPagoDetr + '\nMonto: ' + montoDetr + '\nTipo de Cambio: ' + tipoCambio + '\nPorcentaje: ' + porcentajeDetr

                jsonADI = []
                jsonCUO = []

                if (formaPagoDetrVal == FORMA_PAGO_CREDITO) {
                    jsonCUO = getCuotes(documentid);
                    jsonIDE.montoNetoPendientePago = jsonCUO.suma.toString();
                } else {
                    jsonIDE.fechaVencimiento = column32
                }

                jsonMain = {
                    IDE: jsonIDE,
                    EMI: jsonEMI,
                    REC: jsonREC,
                    //DRF: jsonDRF,
                    CAB: jsonCAB,
                    DET: detail.det,
                    CUO: jsonCUO,
                    ADI: jsonADI

                }
                if (codTipoDocumento == NOTA_DEBITO && reason == REASON_AUMENTO_DE_VALOR) {
                    //IMM: se agregó este caso para ubicar bien a jsonDRF
                    jsonMain = {
                        IDE: jsonIDE,
                        EMI: jsonEMI,
                        REC: jsonREC,
                        DRF: jsonDRF,
                        CAB: jsonCAB,
                        DET: detail.det,
                        CUO: jsonCUO,
                        ADI: jsonADI
                    }
                }


                if (formaPagoDetrVal == FORMA_PAGO_CREDITO) {
                    jsonMain.CUO = jsonCUO.jsonCUO;
                }

                //logStatus(documentid, detail.applywh);
                if (detail.applywh == true) {
                    jsonADI = [
                        {
                            tituloAdicional: "Forma de Pago",
                            valorAdicional: formaPagoDetr
                        },
                        {
                            tituloAdicional: "Detracciones",
                            valorAdicional: detracciones
                        },
                        {
                            tituloAdicional: "METODO DE PAGO",
                            valorAdicional: metodoPagoDetr
                        },
                        {
                            tituloAdicional: "@@codBienServDetr",
                            valorAdicional: conceptDetr
                        },
                        {
                            tituloAdicional: "@@numCuentaBcoNacionDetr",
                            valorAdicional: numCuentaBcoNacionDetr
                        },
                        {
                            tituloAdicional: "@@medioPagoDetr",
                            valorAdicional: medioPagoDetr
                        },
                        {
                            tituloAdicional: "@@montoDetr",
                            valorAdicional: montoDetr
                        },
                        {
                            tituloAdicional: "@@porcDetr",
                            valorAdicional: porcentajeDetr
                        }
                    ]

                    jsonLeyenda.push({
                        "codigo": "2006",
                        "descripcion": "OPERACION SUJETA AL SISTEMA DE PAGO DE OBLIGACIONES TRIBUTARIAS"
                    })
                    jsonMain.ADI = jsonADI;
                }


                var filename = column08 + '-' + codTipoDocumento + '-' + numeracion;
                var ticket = codTipoDocumento + '-' + numeracion
                if (codTipoDocumento == FACTURA) {
                    json = JSON.stringify({ "factura": jsonMain });
                } else if (codTipoDocumento == BOLETA) {
                    json = JSON.stringify({ "boleta": jsonMain });
                } else if (codTipoDocumento == NOTA_DEBITO) {
                    if (reason == 14) {
                        jsonDRF = [{
                            codigoMotivo: "03",
                            descripcionMotivo: "Penalidades/ otros conceptos"
                        }];
                        jsonMain.DRF = jsonDRF;
                        jsonMain.CAB.sumOtrosCargos = "0.00";
                        jsonMain.CAB.totalAnticipos = "0.00";
                    }

                    //IMM: ND Tipo 02 Aumento en el Valor
                    if (reason == 4) {

                        jsonDRF = [{
                            tipoDocRelacionado: ref_tipo_doc,
                            numeroDocRelacionado: series_ref + "-" + (ref_number.toString().padStart(8, '0')),
                            codigoMotivo: "02",
                            descripcionMotivo: "Aumento en el valor"
                        }];
                        jsonMain.DRF = jsonDRF;

                        //Eliminando campos innecesarios
                        delete jsonMain.IDE.codTipoDocumento;
                        delete jsonMain.IDE.fechaVencimiento;
                        delete jsonMain.EMI.departamento;
                        delete jsonMain.EMI.provincia;
                        delete jsonMain.EMI.distrito;
                        delete jsonMain.REC.departamento;
                        delete jsonMain.REC.provincia;
                        delete jsonMain.REC.distrito;
                        delete jsonMain.REC.codigoPais;
                        delete jsonMain.REC.telefono;
                        delete jsonMain.CAB.tipoOperacion;
                    }

                    json = JSON.stringify({ "notaDebito": jsonMain });
                }

                var filejson = generateFileJSON(filename, json);
                var filejson = file.load({ id: filejson });
                setRecord(codTipoDocumento, documentid, ticket, /*urlpdf, urlxml, urlcdr,*/ filejson.id /*encodepdf, array*/)
                return 'Transacción ' + ticket + ' generada ' + ' - ' + detail.applywh;
            } catch (error) {
                //logError(array[0], array[1], 'Error-createRequest', JSON.stringify(e));
                return error;
            }
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

            try {
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
                                idimpuesto = '9996'; // Gratuito
                                codigo = '1004'; // Total valor de venta – Operaciones gratuitas
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
                                codigo = '1001'; // Total valor de venta - operaciones gravadas
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
                                idimpuesto = '9996'; // Gratuito
                                codigo = '1004'; // Total valor de venta - operaciones exoneradas
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
                                idimpuesto = '9997'; //Exonerado
                                codigo = '1003'; // Total valor de venta - operaciones exoneradas
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
                                idimpuesto = '9996'; // Gratuito
                                codigo = '1004'; // Total valor de venta - operaciones inafectas
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
                                idimpuesto = '9998'; // Inafecto
                                codigo = '1002'; // Total valor de venta - operaciones inafectas
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
                            log.debug('MSK', 'description 1: ' + description)
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
                            log.debug('MSK', 'description 2: ' + description)
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
                            log.debug('MSK', 'description 3: ' + description)
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
            } catch (error) {
                //logError(array[0], array[1], 'Error-getDetail', JSON.stringify(e));
                return error;
            }
        }


        function generateFileJSON(namefile, content) {
            try {
                var fileObj = file.create({
                    name: namefile + '.json',
                    fileType: file.Type.JSON,
                    contents: content,
                    folder: FOLDER_PDF,
                    isOnline: true
                });
                var fileid = fileObj.save();
                return fileid;
            } catch (error) {
                return error;
            }
        }

        //!NOTA DE CREDITO ============================================================================================================================
        function createRequestCreditMemo(documentid) {
            var json = new Array();
            var jsonMain = new Array();
            var jsonIDE = new Array();
            var jsonEMI = new Array();
            var jsonREC = new Array();
            var jsonDRF = new Array();
            var jsonCAB = new Array();
            var arrayCAB = new Array();
            var arrayImporteTotal = new Array();
            var jsonLeyenda = new Array();
            var jsonADI = new Array();
            var jsonADI2 = new Array();
            var sumaImporteTotal = 0.0;
            try {
                var searchLoad = search.create({
                    type: "creditmemo",
                    filters:
                        [
                            ["type", "anyof", "CustCred"],
                            "AND",
                            ["internalid", "anyof", documentid]
                        ],
                    columns:
                        [
                            //?FORMULAS ===========================================================================================================================================
                            // IDE---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({ name: "formulatext", formula: "CONCAT({custbody_pe_serie}, CONCAT('-', {custbody_pe_number}))", label: "numeracion" }),
                            search.createColumn({ name: "formulatext", formula: "'07'", label: "codTipoDocumento" }),
                            // EMI---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({ name: "formulanumeric", formula: "6", label: "tipoDocId" }),
                            search.createColumn({ name: "formulatext", formula: "CASE WHEN {subsidiary.name} = 'Ibero Librerías' THEN 'Ibero Librerías' END", label: "nombreComercial" }),
                            search.createColumn({ name: "formulatext", formula: "'0000'", label: "codigoAsigSUNAT" }),
                            // REC---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({ name: "formulatext", formula: "CASE WHEN {customer.custentity_pe_document_type} = 'Registro Unico De Contribuyentes' THEN '6' WHEN {customer.custentity_pe_document_type} = 'Documento Nacional De Identidad (DNI)' THEN '1' WHEN {customer.custentity_pe_document_type} = 'Otros Tipos De Documentos' THEN '0' END", label: "tipoDocIdREC" }),
                            search.createColumn({ name: "formulatext", formula: "CONCAT({customer.firstname}, CONCAT('-', {customer.lastname}))", label: "rucREC" }),
                            // DRF---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({ name: "formulatext", formula: "CASE WHEN {custbody_pe_document_type_ref} = 'Factura' THEN '01' WHEN {custbody_pe_document_type_ref} = 'Boleta de Venta' THEN '03' END", label: "tipoDocRelacionado" }),
                            search.createColumn({ name: "formulatext", formula: "CONCAT({custbody_pe_document_series_ref}, CONCAT('-', {custbody_pe_document_number_ref}))", label: "numeroDocRelacionado" }),
                            // COM---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({ name: "formulanumeric", formula: "TO_NUMBER({custbody_pe_number})", label: "correlativo" }),
                            search.createColumn({ name: "createdfrom", join: "createdFrom", label: "fulfillment" }),
                            // ADI---------------------------------------------------------------------------------------------------------------------
                            // search.createColumn({ name: "createdfrom", join: "createdFrom", label: "ordenCompraADI" }),
                            // search.createColumn({ name: "formulatext", formula: "CONCAT({createdFrom.custbody_pe_driver_name}, CONCAT(' ', {createdFrom.custbody_pe_driver_last_name}))", label: "transportistaADI" }),
                            // search.createColumn({ name: "formulatext", formula: "CONCAT({salesRep.firstname}, CONCAT(' ', {salesRep.lastname}))", label: "vendedorADI" }),
                            //?====================================================================================================================================================
                            // IDE---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({ name: "trandate", label: "fechaEmision" }),
                            search.createColumn({ name: "symbol", join: "Currency", label: "tipoMoneda" }),
                            search.createColumn({ name: "otherrefnum", label: "numeroOrdenCompra" }),
                            search.createColumn({ name: "duedate", join: "createdFrom", label: "fechaVencimiento" }),
                            // EMI---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({ name: "taxidnum", join: "subsidiary", label: "numeroDocId" }),
                            search.createColumn({ name: "legalname", join: "subsidiary", label: "razonSocial" }),
                            search.createColumn({ name: "address1", join: "location", label: "direccion1" }),
                            search.createColumn({ name: "address2", join: "location", label: "direccion2" }),
                            search.createColumn({ name: "city", join: "subsidiary", label: "departamento" }),
                            search.createColumn({ name: "state", join: "subsidiary", label: "provincia" }),
                            search.createColumn({ name: "address3", join: "subsidiary", label: "distrito" }),
                            search.createColumn({ name: "billcountrycode", label: "codigoPais" }),
                            search.createColumn({ name: "phone", join: "subsidiary", label: "telefono" }),
                            search.createColumn({ name: "email", join: "subsidiary", label: "correoElectronico" }),
                            // REC---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({ name: "custentity_pe_document_number", join: "customer", label: "numeroDocIdREC" }),
                            search.createColumn({ name: "companyname", join: "customer", label: "razonSocialREC" }),
                            search.createColumn({ name: "billaddress1", label: "direccionREC1" }),
                            search.createColumn({ name: "billaddress2", label: "direccionREC2" }),
                            search.createColumn({ name: "city", join: "customer", label: "departamentoREC" }),
                            search.createColumn({ name: "state", join: "customer", label: "provinciaREC" }),
                            search.createColumn({ name: "address3", join: "customer", label: "distritoREC" }),
                            search.createColumn({ name: "email", join: "customer", label: "correoElectronicoREC" }),
                            search.createColumn({ name: "internalid", join: "customer", label: "emailrec" }),
                            // DRF---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({ name: "custrecord_pe_codigo_motivo_2", join: "CUSTBODY_PE_REASON", label: "codigoMotivo" }),
                            search.createColumn({ name: "name", join: "CUSTBODY_PE_REASON", label: "descripcionMotivo" }),
                            // CAB---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({ name: "custrecord_pe_cod_fact_2", join: "CUSTBODY_PE_EI_OPERATION_TYPE", label: "tipoOperacion" }),
                            // COM---------------------------------------------------------------------------------------------------------------------
                            search.createColumn({ name: "custbody_pe_document_type", label: "typedoc" }),
                            search.createColumn({ name: "custbody_pe_serie", label: "serie" }),
                            // ADI---------------------------------------------------------------------------------------------------------------------
                            // search.createColumn({ name: "custbody_pe_document_date_ref", label: "fechaVencADI" }),
                            // search.createColumn({ name: "custbody_pe_ei_forma_pago", label: "condPagoADI" }),
                            // search.createColumn({ name: "location", label: "moduloADI" }),
                            // search.createColumn({ name: "custbody_pe_delivery_address", join: "createdFrom", label: "dirDestinoADI" }),
                            // search.createColumn({ name: "custbody_pe_car_plate", join: "createdFrom", label: "placaVehicADI" }),
                            // search.createColumn({ name: "custbody_pe_ruc_empresa_transporte", join: "createdFrom", label: "rucTransportistaADI" }),
                        ]
                });

                var searchResult = searchLoad.run().getRange({ start: 0, end: 1 });
                //?FORMULAS ======================================================================================================================================================
                // IDE---------------------------------------------------------------------------------------------------------------------
                var numeracion = searchResult[0].getValue(searchLoad.columns[0]);
                var codTipoDocumento = searchResult[0].getValue(searchLoad.columns[1]);
                // EMI---------------------------------------------------------------------------------------------------------------------
                var tipoDocId = searchResult[0].getValue(searchLoad.columns[2]);
                var nombreComercial = searchResult[0].getValue(searchLoad.columns[3]);
                var codigoAsigSUNAT = searchResult[0].getValue(searchLoad.columns[4]);
                // REC---------------------------------------------------------------------------------------------------------------------
                var tipoDocIdREC = searchResult[0].getValue(searchLoad.columns[5]);
                var rucREC = searchResult[0].getValue(searchLoad.columns[6]);
                if (tipoDocRelacionado == '03') {
                    razonSocialREC = rucREC;
                }
                // DRF---------------------------------------------------------------------------------------------------------------------
                var tipoDocRelacionado = searchResult[0].getValue(searchLoad.columns[7]);
                var numeroDocRelacionado = searchResult[0].getValue(searchLoad.columns[8]);
                // COM---------------------------------------------------------------------------------------------------------------------
                var correlativo = searchResult[0].getValue(searchLoad.columns[9]);
                var fulfillment = searchResult[0].getValue(searchLoad.columns[10]);
                // ADI---------------------------------------------------------------------------------------------------------------------
                // var ordenCompraADI = searchResult[0].getText(searchLoad.columns[11]);
                // ordenCompraADI = ordenCompraADI.split('#');
                // ordenCompraADI = ordenCompraADI[1];
                // var transportistaADI = searchResult[0].getValue(searchLoad.columns[12]);
                // var vendedorADI = searchResult[0].getValue(searchLoad.columns[13]);
                //?====================================================================================================================================================
                var fechaEmision = searchResult[0].getValue({ name: "trandate", label: "fechaEmision" });
                fechaEmision = fechaEmision.split('/');
                fechaEmision = fechaEmision[2] + '-' + fechaEmision[1] + '-' + fechaEmision[0];
                var tipoMoneda = searchResult[0].getValue({ name: "symbol", join: "Currency", label: "tipoMoneda" });
                var numeroOrdenCompra = searchResult[0].getValue({ name: "otherrefnum", label: "numeroOrdenCompra" });
                var fechaVencimiento = searchResult[0].getValue({ name: "duedate", join: "createdFrom", label: "fechaVencimiento" });
                // EMI---------------------------------------------------------------------------------------------------------------------
                var numeroDocId = searchResult[0].getValue({ name: "taxidnum", join: "subsidiary", label: "numeroDocId" });
                var razonSocial = searchResult[0].getValue({ name: "legalname", join: "subsidiary", label: "razonSocial" });
                //var codubigeo = getUbigeo();
                var direccion1 = searchResult[0].getValue({ name: "address1", join: "location", label: "direccion1" });
                var direccion2 = searchResult[0].getValue({ name: "address2", join: "location", label: "direccion2" });
                var departamento = searchResult[0].getValue({ name: "city", join: "subsidiary", label: "departamento" });
                var provincia = searchResult[0].getValue({ name: "state", join: "subsidiary", label: "provincia" });
                var distrito = searchResult[0].getValue({ name: "address3", join: "subsidiary", label: "distrito" });
                var codigoPais = searchResult[0].getValue({ name: "billcountrycode", label: "codigoPais" });
                var telefono = searchResult[0].getValue({ name: "phone", join: "subsidiary", label: "telefono" });
                var correoElectronico = searchResult[0].getValue({ name: "email", join: "subsidiary", label: "correoElectronico" });
                // REC---------------------------------------------------------------------------------------------------------------------
                var numeroDocIdREC = searchResult[0].getValue({ name: "custentity_pe_document_number", join: "customer", label: "numeroDocIdREC" });
                var razonSocialREC = searchResult[0].getValue({ name: "companyname", join: "customer", label: "razonSocialREC" });
                var direccionREC1 = searchResult[0].getValue({ name: "billaddress1", label: "direccionREC1" });
                var direccionREC2 = searchResult[0].getValue({ name: "billaddress2", label: "direccionREC2" });
                var departamentoREC = searchResult[0].getValue({ name: "city", join: "customer", label: "departamentoREC" });
                var provinciaREC = searchResult[0].getValue({ name: "state", join: "customer", label: "provinciaREC" });
                var distritoREC = searchResult[0].getValue({ name: "address3", join: "customer", label: "distritoREC" });
                var correoElectronicoREC = searchResult[0].getValue({ name: "email", join: "customer", label: "correoElectronicoREC" });
                // DRF---------------------------------------------------------------------------------------------------------------------
                var codigoMotivo = searchResult[0].getValue({ name: "custrecord_pe_codigo_motivo_2", join: "CUSTBODY_PE_REASON", label: "codigoMotivo" });
                var descripcionMotivo = searchResult[0].getValue({ name: "name", join: "CUSTBODY_PE_REASON", label: "descripcionMotivo" });
                // CAB---------------------------------------------------------------------------------------------------------------------
                var tipoOperacion = searchResult[0].getValue({ name: "custrecord_pe_cod_fact", join: "CUSTBODY_PE_EI_OPERATION_TYPE", label: "tipoOperacion" });
                // COM---------------------------------------------------------------------------------------------------------------------
                var typedoc = searchResult[0].getText({ name: "custbody_pe_document_type", label: "typedoc" });
                var serie = searchResult[0].getText({ name: "custbody_pe_serie", label: "serie" });
                // REC---------------------------------------------------------------------------------------------------------------------
                var emailrec = searchResult[0].getValue({ name: "internalid", join: "customer", label: "emailrec" });
                // ADI---------------------------------------------------------------------------------------------------------------------
                // var fechaVencADI = searchResult[0].getValue({ name: "custbody_pe_document_date_ref", label: "fechaVencADI" });
                // var condPagoADI = searchResult[0].getText({ name: "custbody_pe_ei_forma_pago", label: "condPagoADI" });
                // var moduloADI = searchResult[0].getText({ name: "location", label: "moduloADI" });
                // var dirDestinoADI = searchResult[0].getValue({ name: "custbody_pe_delivery_address", join: "createdFrom", label: "dirDestinoADI" });
                // var placaVehicADI = searchResult[0].getValue({ name: "custbody_pe_car_plate", join: "createdFrom", label: "placaVehicADI" });
                // var rucTransportistaADI = searchResult[0].getValue({ name: "custbody_pe_ruc_empresa_transporte", join: "createdFrom", label: "rucTransportistaADI" });

                jsonIDE = {
                    numeracion: numeracion,
                    fechaEmision: fechaEmision,
                    //codTipoDocumento: codTipoDocumento,
                    tipoMoneda: tipoMoneda
                    //numeroOrdenCompra: numeroOrdenCompra,
                    //fechaVencimiento: fechaVencimiento
                }

                jsonEMI = {
                    tipoDocId: tipoDocId,
                    numeroDocId: numeroDocId,
                    nombreComercial: nombreComercial,
                    razonSocial: razonSocial,
                    //ubigeo: codubigeo.ubigeo,
                    direccion: direccion1 + ' ' + direccion2 + ' ' + departamento + ' ' + provincia + ' ' + distrito,
                    // departamento: departamento,
                    // provincia: provincia,
                    // distrito: distrito,
                    codigoPais: codigoPais,
                    telefono: telefono,
                    correoElectronico: correoElectronico,
                    codigoAsigSUNAT: codigoAsigSUNAT
                }

                jsonREC = {
                    tipoDocId: tipoDocIdREC,
                    numeroDocId: numeroDocIdREC,
                    razonSocial: razonSocialREC,
                    direccion: direccionREC1 + ' ' + direccionREC2,
                    // departamento: departamentoREC,
                    // provincia: provinciaREC,
                    // distrito: distritoREC,
                    correoElectronico: correoElectronicoREC
                }

                var detail = getDetailCreditMemo(documentid);

                var flag = JSON.stringify(detail);
                //generateFileTXT('errortest2', flag);

                var monto = '';
                if (tipoMoneda == 'PEN') {
                    monto = NumeroALetras(detail.importetotal, { plural: 'SOLES', singular: 'SOLES', centPlural: 'CENTIMOS', centSingular: 'CENTIMO' });
                } else {
                    monto = NumeroALetrasDolar(detail.importetotal, { plural: 'DOLARES AMERICANOS', singular: 'DOLAR AMERICANO', centPlural: 'CENTAVOS', centSingular: 'CENTAVO' });
                }
                jsonLeyenda = [
                    {
                        codigo: "1000",
                        descripcion: monto
                    }
                ]

                //Objeto comodín para inicializar el json, luego será eliminado
                jsonCAB = {
                    inicializador: 'Inicializador, debe ser borrado'
                }

                var grav = detail.gravadas;
                if (grav != 'Vacio') {
                    jsonCAB.gravadas = detail.gravadas;
                    arrayImporteTotal.push(parseFloat(detail.gravadas.totalVentas))
                    arrayCAB.push(detail.totalimpuestosgra.pop());
                }

                var ina = detail.inafectas;
                if (ina != 'Vacio') {
                    jsonCAB.inafectas = detail.inafectas;
                    arrayImporteTotal.push(parseFloat(detail.inafectas.totalVentas))
                    arrayCAB.push(detail.totalimpuestosina.pop());
                }

                var exo = detail.exoneradas;
                if (exo != 'Vacio') {
                    jsonCAB.exoneradas = detail.exoneradas;
                    arrayImporteTotal.push(parseFloat(detail.exoneradas.totalVentas))
                    arrayCAB.push(detail.totalimpuestosexo.pop());
                }

                jsonCAB.totalImpuestos = arrayCAB;
                if (typeof detail.cargodescuento != 'undefined') {
                    jsonCAB.totalDescuentos = detail.totaldescuentos;
                }

                for (var i in arrayImporteTotal) {
                    sumaImporteTotal += arrayImporteTotal[i];
                }
                var importTotal = sumaImporteTotal + parseFloat(detail.montototalimpuestos);
                //var importTotal = parseFloat(detail.gravadas.totalVentas) + parseFloat(detail.inafectas.totalVentas) + parseFloat(detail.exoneradas.totalVentas) + parseFloat(detail.montototalimpuestos);
                jsonCAB.importeTotal = importTotal.toFixed(2)
                //jsonCAB.importeTotal = detail.importetotal.toString();
                jsonCAB.tipoOperacion = tipoOperacion;
                jsonCAB.leyenda = jsonLeyenda;
                jsonCAB.montoTotalImpuestos = detail.montototalimpuestos;

                if (typeof detail.cargodescuento != 'undefined') {
                    // jsonCAB.totalDescuentos = detail.totaldescuentos;
                    jsonCAB.cargoDescuento = detail.cargodescuento;
                }
                delete jsonCAB.inicializador;

                // var fulfillment = 0;
                // if (column46 != '') fulfillment = openFulfillment(column46);

                jsonDRF = [
                    {
                        tipoDocRelacionado: tipoDocRelacionado,
                        numeroDocRelacionado: numeroDocRelacionado,
                        codigoMotivo: codigoMotivo,
                        descripcionMotivo: descripcionMotivo
                    }
                    // {
                    //     tipoDocRelacionado: "09",
                    //     numeroDocRelacionado: fulfillment.guia
                    // }
                ]

                // jsonADI = [
                //     {
                //         tituloAdicional: "@@codCliente",
                //         valorAdicional: detail.codigocliente
                //     },
                //     {
                //         tituloAdicional: "@@condPago",
                //         valorAdicional: condPagoADI
                //     },
                //     {
                //         tituloAdicional: "@@dirDestino",
                //         valorAdicional: dirDestinoADI
                //     },
                //     {
                //         tituloAdicional: "@@transportista",
                //         valorAdicional: transportistaADI
                //     },
                //     {
                //         tituloAdicional: "@@rucTransportista",
                //         valorAdicional: rucTransportistaADI
                //     },
                //     {
                //         tituloAdicional: "@@placaVehic",
                //         valorAdicional: placaVehicADI
                //     },
                //     // {
                //     //     tituloAdicional: "@@zona",
                //     //     valorAdicional: codubigeo.codubigeo
                //     // },
                //     {
                //         tituloAdicional: "@@ordCarga",
                //         valorAdicional: fulfillment.ordencarga
                //     },
                //     {
                //         tituloAdicional: "@@modulo",
                //         valorAdicional: moduloADI
                //     },
                //     // {
                //     //     tituloAdicional: "@@nroInterno",
                //     //     valorAdicional: numeroOrdenCompra
                //     // },
                //     {
                //         tituloAdicional: "@@fechaVenc",
                //         valorAdicional: fechaVencADI
                //     },
                //     {
                //         tituloAdicional: "@@ordenCompra",
                //         valorAdicional: ordenCompraADI
                //     },
                //     {
                //         tituloAdicional: "@@vendedor",
                //         valorAdicional: vendedorADI
                //     },
                //     // {
                //     //     tituloAdicional: "@@localidad",
                //     //     valorAdicional: codubigeo.ubigeolocalidad
                //     // }
                // ]



                jsonMain = {
                    IDE: jsonIDE,
                    EMI: jsonEMI,
                    REC: jsonREC,
                    DRF: jsonDRF,
                    CAB: jsonCAB,
                    DET: detail.det,
                    // ADI: jsonADI
                }

                var filename = numeroDocId + '-' + codTipoDocumento + '-' + numeracion;
                json = JSON.stringify({ "notaCredito": jsonMain });

                //log.debug({ title: 'Json', details: json });

                // var res = 'filenameosce: ' + filename + ' --  numbering:' + numeracion + ' -- serie: ' +  column34 + ' -- correlativo: ' + column37 + ' -- emailrec: ' +  column36 + ' -- emisname: ' + column09 + ' -- typedoc: ' + column33 + ' -- typedoccode: ' + codTipoDocumento;
                // logError(array[0], array[1], 'Error-createRequestCreditMemo', res);
                // return {
                //     request: json,
                //     filenameosce: filename,
                //     numbering: numeracion,
                //     serie: serie,
                //     correlativo: correlativo,
                //     emailrec: emailrec,
                //     emisname: razonSocial,
                //     typedoc: typedoc,
                //     typedoccode: codTipoDocumento
                // };
                var ticket = codTipoDocumento + '-' + numeracion
                var filejson = generateFileJSON(filename, json);
                var filejson = file.load({ id: filejson });
                setRecord(codTipoDocumento, documentid, ticket, /*urlpdf, urlxml, urlcdr,*/ filejson.id /*encodepdf, array*/)
                return 'Transacción ' + ticket + ' generada ' + ' - JSON: ' + filejson.id;
                //return json;
            } catch (error) {
                //logError(array[0], array[1], 'Error-createRequestCreditMemo', JSON.stringify(e));
                return error;
            }
        }


        function getDetailCreditMemo(documentid) {
            var json = new Array();
            var jsonGravadas = ['Vacio'];
            var jsonInafectas = ['Vacio'];
            var jsonExoneradas = ['Vacio'];
            var jsonTotalImpuestosGRA = new Array();
            var jsonTotalImpuestosINA = new Array();
            var jsonTotalImpuestosEXO = new Array();
            var jsonReturn = new Array();
            var sumtotalVentasGRA = 0.0;
            var summontoImpuestoGRA = 0.0;
            var sumtotalVentasINA = 0.0;
            var summontoImpuestoINA = 0.0;
            var sumtotalVentasEXO = 0.0;
            var summontoImpuestoEXO = 0.0;
            var anydiscount = false;
            var factorcargodescuento = 0.0;


            try {
                var openRecord = record.load({ type: record.Type.CREDIT_MEMO, id: documentid, isDynamic: true });
                var total = openRecord.getValue({ fieldId: 'total' });
                var taxtotal = openRecord.getValue({ fieldId: 'taxtotal' });
                var codcustomer = openRecord.getText({ fieldId: 'entity' });
                codcustomer = codcustomer.split(' ');
                codcustomer = codcustomer[0];
                var linecount = openRecord.getLineCount({ sublistId: 'item' });
                for (var h = 0; h < linecount; h++) {
                    var itype = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: h });
                    if (itype == 'Discount') {
                        var rate = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: h }));
                        rate = rate.toString().replace('-', '').replace('%', '');
                        factorcargodescuento = rate / 100
                        round = factorcargodescuento.toString().split('.');
                        factorcargodescuento = round[1].length > 5 ? factorcargodescuento.toFixed(5) : factorcargodescuento
                        factorcargodescuento = parseFloat(factorcargodescuento)
                        anydiscount = true;
                        break;
                    }
                }

                if (anydiscount == false) {
                    for (var i = 0; i < linecount; i++) {
                        var jsonTotalImpuestos = new Array();
                        var precioVentaUnitario = 0.0;
                        var idimpuesto = '';
                        var codigo = '';
                        var tipoAfectacion = '';
                        var round = 0.0;

                        var item_display = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'item_display', line: i });
                        item_display = item_display.split(' ');
                        item_display = item_display[0];
                        var description = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i });
                        var quantity = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                        var item = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        var unit = getUnit(item);
                        var rate = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i }));
                        var taxcode_display = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxcode_display', line: i });
                        var amount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });

                        var itemtype = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });
                        var taxrate1 = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxrate1', line: i }));
                        var tax1amt = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i }));
                        var montoimpuesto = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i }));

                        if (itemtype == 'InvtPart' || itemtype == 'Service') {
                            precioVentaUnitario = (rate + (rate * (taxrate1 / 100)));
                            round = precioVentaUnitario.toString().split('.');
                            if (typeof round[1] != 'undefined') {
                                precioVentaUnitario = round[1].length > 7 ? precioVentaUnitario.toFixed(7) : precioVentaUnitario;
                            }
                            if (taxcode_display == 'IGV_PE:S-PE') {  // GRAVADAS
                                idimpuesto = '1000'; // Igv impuesto general a las ventas
                                codigo = '1001'; // Total valor de venta - operaciones gravadas
                                tipoAfectacion = '10'; // Gravado - Operación Onerosa
                                sumtotalVentasGRA += amount;
                                summontoImpuestoGRA += montoimpuesto;
                                jsonGravadas = {
                                    codigo: codigo,
                                    totalVentas: sumtotalVentasGRA.toFixed(2)
                                }
                                jsonTotalImpuestosGRA.push({
                                    idImpuesto: idimpuesto,
                                    montoImpuesto: summontoImpuestoGRA.toFixed(2)
                                });

                            } else if (taxcode_display == 'IGV_PE:E-PE') { // EXONERADAS
                                idimpuesto = '9997'; // Exonerado
                                codigo = '1003'; // Total valor de venta - operaciones exoneradas
                                tipoAfectacion = '20'; // Exonerado - Operación Onerosa
                                sumtotalVentasEXO += amount;
                                summontoImpuestoEXO += montoimpuesto;
                                jsonExoneradas = {
                                    codigo: codigo,
                                    totalVentas: sumtotalVentasEXO.toFixed(2)
                                }
                                jsonTotalImpuestosEXO.push({
                                    idImpuesto: idimpuesto,
                                    montoImpuesto: summontoImpuestoEXO.toFixed(2)
                                });

                            } else if (taxcode_display == 'IGV_PE:Inaf-PE') { // INAFECTAS
                                idimpuesto = '9998'; //Inafecto
                                codigo = '1002'; // Total valor de venta - operaciones inafectas
                                tipoAfectacion = '30'; // Inafecto - Operación Onerosa
                                sumtotalVentasINA += amount;
                                summontoImpuestoINA += montoimpuesto;
                                jsonInafectas = {
                                    codigo: codigo,
                                    totalVentas: sumtotalVentasINA.toFixed(2)
                                }
                                jsonTotalImpuestosINA.push({
                                    idImpuesto: idimpuesto,
                                    montoImpuesto: summontoImpuestoINA.toFixed(2)
                                });
                            }

                            jsonTotalImpuestos.push({
                                idImpuesto: idimpuesto,
                                montoImpuesto: tax1amt.toString(),
                                tipoAfectacion: tipoAfectacion,
                                montoBase: amount.toFixed(2).toString(),
                                porcentaje: taxrate1.toString()
                            });

                            log.debug('MSK', 'description 4: ' + description)
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
                    }

                    jsonReturn = {
                        det: json,
                        gravadas: jsonGravadas,
                        inafectas: jsonInafectas,
                        exoneradas: jsonExoneradas,
                        totalimpuestosgra: jsonTotalImpuestosGRA,
                        totalimpuestosina: jsonTotalImpuestosINA,
                        totalimpuestosexo: jsonTotalImpuestosEXO,
                        importetotal: total,
                        montototalimpuestos: taxtotal.toString(),
                        codigocliente: codcustomer
                    }
                    return jsonReturn;
                } else {
                    for (var i = 0; i < linecount; i++) {
                        var jsonTotalImpuestos = new Array();
                        var precioVentaUnitario = 0.0;
                        var idimpuesto = '';
                        var codigo = '';
                        var tipoAfectacion = '';
                        var round = 0.0;
                        var round2 = 0.0;
                        var valorunitario = 0.0;
                        var montototalimpuestos = 0.0;
                        var precioventaunitario = 0.0

                        var item_display = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'item_display', line: i });
                        item_display = item_display.split(' ');
                        item_display = item_display[0];
                        var description = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i });
                        var quantity = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                        var item = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        var unit = getUnit(item);
                        var rate = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i }));
                        var taxcode_display = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxcode_display', line: i });
                        var amount = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });

                        var itemtype = openRecord.getSublistValue({ sublistId: 'item', fieldId: 'itemtype', line: i });
                        var taxrate1 = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'taxrate1', line: i }));
                        var tax1amt = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i }));
                        var montoimpuesto = parseFloat(openRecord.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i }));

                        if (itemtype == 'InvtPart' || itemtype == 'Service') {
                            //GLOBAL
                            valorunitario = rate - (rate * factorcargodescuento);
                            montototalimpuestos = valorunitario * (taxrate1 / 100);
                            round = valorunitario.toString().split('.');
                            if (typeof round[1] != 'undefined') {
                                valorunitario = round[1].length > 7 ? valorunitario.toFixed(7) : valorunitario;
                            }

                            precioventaunitario = parseFloat(valorunitario + montototalimpuestos);
                            round2 = precioventaunitario.toString().split('.');
                            if (typeof round2[1] != 'undefined') {
                                precioventaunitario = round2[1].length > 7 ? precioventaunitario.toFixed(7) : precioventaunitario;
                            }

                            // ====================================================================================================================
                            if (taxcode_display == 'IGV_PE:S-PE') {  // GRAVADAS
                                idimpuesto = '1000'; // Igv impuesto general a las ventas
                                codigo = '1001'; // Total valor de venta - operaciones gravadas
                                tipoAfectacion = '10'; // Gravado - Operación Onerosa
                                sumtotalVentasGRA += amount - (amount * factorcargodescuento);
                                summontoImpuestoGRA += (montototalimpuestos * quantity);
                                jsonGravadas = {
                                    codigo: codigo,
                                    totalVentas: sumtotalVentasGRA.toFixed(2)
                                }
                                jsonTotalImpuestosGRA.push({
                                    idImpuesto: idimpuesto,
                                    montoImpuesto: summontoImpuestoGRA.toFixed(2)
                                });

                            } else if (taxcode_display == 'IGV_PE:E-PE') { // EXONERADAS
                                idimpuesto = '9997'; // Exonerado
                                codigo = '1003'; // Total valor de venta - operaciones exoneradas
                                tipoAfectacion = '20'; // Exonerado - Operación Onerosa
                                sumtotalVentasEXO += amount - (amount * factorcargodescuento);
                                summontoImpuestoEXO += montoimpuesto;
                                jsonExoneradas = {
                                    codigo: codigo,
                                    totalVentas: sumtotalVentasEXO.toFixed(2)
                                }
                                jsonTotalImpuestosEXO.push({
                                    idImpuesto: idimpuesto,
                                    montoImpuesto: summontoImpuestoEXO.toFixed(2)
                                });

                            } else if (taxcode_display == 'IGV_PE:Inaf-PE') { // INAFECTAS
                                idimpuesto = '9998'; //Inafecto
                                codigo = '1002'; // Total valor de venta - operaciones inafectas
                                tipoAfectacion = '30'; // Inafecto - Operación Onerosa
                                sumtotalVentasINA += amount - (amount * factorcargodescuento);
                                summontoImpuestoINA += montoimpuesto;
                                jsonInafectas = {
                                    codigo: codigo,
                                    totalVentas: sumtotalVentasINA.toFixed(2)
                                }
                                jsonTotalImpuestosINA.push({
                                    idImpuesto: idimpuesto,
                                    montoImpuesto: summontoImpuestoINA.toFixed(2)
                                });
                            }

                            jsonTotalImpuestos.push({
                                idImpuesto: idimpuesto,
                                montoImpuesto: (montototalimpuestos * quantity).toFixed(2),
                                tipoAfectacion: tipoAfectacion,
                                montoBase: (amount - (amount * factorcargodescuento)).toFixed(2),
                                porcentaje: taxrate1.toString()
                            });

                            log.debug('MSK', 'description 5: ' + description)
                            json.push({
                                numeroItem: (i + 1).toString(),
                                codigoProducto: item_display,
                                descripcionProducto: description,
                                cantidadItems: quantity.toString(),
                                unidad: unit,
                                valorUnitario: valorunitario.toString(),
                                precioVentaUnitario: precioventaunitario.toString(),
                                totalImpuestos: jsonTotalImpuestos,
                                valorVenta: (amount - (amount * factorcargodescuento)).toFixed(2),
                                montoTotalImpuestos: (montototalimpuestos * quantity).toFixed(2)
                            });


                        }
                    }

                    jsonReturn = {
                        det: json,
                        gravadas: jsonGravadas,
                        inafectas: jsonInafectas,
                        exoneradas: jsonExoneradas,
                        totalimpuestosgra: jsonTotalImpuestosGRA,
                        totalimpuestosina: jsonTotalImpuestosINA,
                        totalimpuestosexo: jsonTotalImpuestosEXO,
                        importetotal: total,
                        montototalimpuestos: summontoImpuestoGRA.toFixed(2),
                        codigocliente: codcustomer
                    }
                    return jsonReturn;
                }
            } catch (error) {
                //logError(array[0], array[1], 'Error-getDetailCreditMemo', JSON.stringify(e));
                logStatus(documentid, error);
            }
        }
        //!============================================================================================================================================

        function logStatus(internalid, docstatus) {
            try {
                var logStatus = record.create({ type: 'customrecord_pe_ei_document_status' });
                logStatus.setValue('custrecord_pe_ei_document', internalid);
                logStatus.setValue('custrecord_pe_ei_document_status', docstatus);
                logStatus.save();
            } catch (error) {

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
                log.debug('MSK', 'error: ' + e)
            }
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


        function setRecord(recordtype, internalid, tranid, /*urlpdf, urlxml, urlcdr,*/ urljson /*encodepdf, array*/) {
            var recordload = '';
            try {
                if (recordtype == '07') {
                    recordload = record.load({ type: record.Type.CREDIT_MEMO, id: internalid });
                } else {
                    recordload = record.load({ type: record.Type.INVOICE, id: internalid, isDynamic: true })
                }
                //recordload = record.load({ type: record.Type.INVOICE, id: internalid, isDynamic: true })
                recordload.setValue('custbody_pe_fe_ticket_id', tranid);
                recordload.setValue('custbody_pe_ei_printed_xml_req', urljson);
                // recordload.setValue('custbody_pe_ei_printed_xml_res', urlxml);
                // recordload.setValue('custbody_pe_ei_printed_cdr_res', urlcdr);
                // recordload.setValue('custbody_pe_ei_printed_pdf', urlpdf);
                // recordload.setValue('custbody_pe_ei_printed_pdf_codificado', encodepdf);
                recordload.save();
                // recordload = record.create({type: 'customrecord_pe_ei_printed_fields',isDynamic: true});
                // recordload.setValue('name', tranid);
                // recordload.setValue('custrecord_pe_ei_printed_xml_req', urljson);
                // recordload.setValue('custrecord_pe_ei_printed_xml_res', urlxml);
                // recordload.setValue('custrecord_pe_ei_printed_pdf', urlpdf);
                // recordload.setValue('custrecord_pe_ei_printed_cdr_res', urlcdr);
                // recordload.save();
                return recordload;
            } catch (e) {
                //logError(array[0], array[1], 'Error-setRecord', e.message);
            }
        }

        function getCuotes(documentid) {
            var jsonCUO = new Array();
            var suma = 0;
            var objInvoice = search.create({
                type: "invoice",
                filters:
                    [
                        ["type", "anyof", "CustInvc"],
                        "AND",
                        ["internalid", "anyof", documentid],
                        "AND",
                        ["installment.installmentnumber", "isnotempty", ""]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", summary: "GROUP", label: "Internal ID" }),
                        search.createColumn({ name: "tranid", summary: "GROUP", label: "Document Number" }),
                        search.createColumn({ name: "installmentnumber", join: "installment", summary: "GROUP", sort: search.Sort.ASC, label: "Installment Number" }),
                        search.createColumn({ name: "duedate", join: "installment", summary: "GROUP", label: "Due Date" }),
                        search.createColumn({ name: "amount", join: "installment", summary: "SUM", label: "Amount" })
                    ]
            });
            var searchResultCount = objInvoice.runPaged().count;
            if (searchResultCount > 0) {
                objInvoice.run().each(function (result) {
                    var idCuota = "Cuota00" + result.getValue({ name: "installmentnumber", join: "installment", summary: "GROUP", label: "Installment Number" });
                    var fechaPago = result.getValue({ name: "duedate", join: "installment", summary: "GROUP", label: "Due Date" });
                    var montoPago = result.getValue({ name: "amount", join: "installment", summary: "SUM", label: "Amount" });
                    suma += parseFloat(montoPago)
                    fechaPago = formatDate(fechaPago);
                    logStatus(documentid, fechaPago);
                    jsonCUO.push({
                        idCuota: idCuota,
                        montoPago: montoPago,
                        fechaPago: fechaPago
                    });
                    return true;
                });
            } else {
                var objInvoiceUnid = search.create({
                    type: "invoice",
                    filters:
                        [
                            ["type", "anyof", "CustInvc"],
                            "AND",
                            ["internalid", "anyof", documentid]

                        ],
                    columns:
                        [
                            search.createColumn({ name: "total", label: "total" }),
                            search.createColumn({ name: "duedate", label: "duedate" }),
                        ]
                });
                var searchResultCountUnid = objInvoiceUnid.runPaged().count;
                if (searchResultCountUnid > 0) {
                    objInvoiceUnid.run().each(function (result) {
                        var idCuota = "Cuota001";
                        var montoPago = result.getValue({ name: "total", label: "total" });
                        var fechaPago = result.getValue({ name: "duedate", label: "duedate" });
                        suma += parseFloat(montoPago);
                        fechaPago = formatDate(fechaPago);
                        jsonCUO.push({
                            idCuota: idCuota,
                            montoPago: parseFloat(montoPago),
                            fechaPago: fechaPago
                        });

                    });

                }
            }
            return {
                jsonCUO: jsonCUO,
                suma: suma
            };
        }

        function formatDate(fechaPago) {
            var day = fechaPago.split('/')[0];
            var year = fechaPago.split('/')[2];
            var month = fechaPago.split('/')[1];
            return year + '-' + month + '-' + day;
        }

        //BLOQUE DE CONVERSIÓN MONTO EN LETRAS================================================================================================================================================================================================
        function Unidades(num) {
            switch (num) {
                case 1: return 'UN';
                case 2: return 'DOS';
                case 3: return 'TRES';
                case 4: return 'CUATRO';
                case 5: return 'CINCO';
                case 6: return 'SEIS';
                case 7: return 'SIETE';
                case 8: return 'OCHO';
                case 9: return 'NUEVE';
            }

            return '';
        }//Unidades()


        function Decenas(num) {
            var decena = Math.floor(num / 10);
            var unidad = num - (decena * 10);

            switch (decena) {
                case 1:
                    switch (unidad) {
                        case 0: return 'DIEZ';
                        case 1: return 'ONCE';
                        case 2: return 'DOCE';
                        case 3: return 'TRECE';
                        case 4: return 'CATORCE';
                        case 5: return 'QUINCE';
                        default: return 'DIECI' + Unidades(unidad);
                    }
                case 2:
                    switch (unidad) {
                        case 0: return 'VEINTE';
                        default: return 'VEINTI' + Unidades(unidad);
                    }
                case 3: return DecenasY('TREINTA', unidad);
                case 4: return DecenasY('CUARENTA', unidad);
                case 5: return DecenasY('CINCUENTA', unidad);
                case 6: return DecenasY('SESENTA', unidad);
                case 7: return DecenasY('SETENTA', unidad);
                case 8: return DecenasY('OCHENTA', unidad);
                case 9: return DecenasY('NOVENTA', unidad);
                case 0: return Unidades(unidad);
            }
        }//Unidades()


        function DecenasY(strSin, numUnidades) {
            if (numUnidades > 0) {
                return strSin + ' Y ' + Unidades(numUnidades)
            }
            return strSin;
        }//DecenasY()


        function Centenas(num) {
            var centenas = Math.floor(num / 100);
            var decenas = num - (centenas * 100);
            switch (centenas) {
                case 1:
                    if (decenas > 0) {
                        return 'CIENTO ' + Decenas(decenas);
                    }
                    return 'CIEN';
                case 2: return 'DOSCIENTOS ' + Decenas(decenas);
                case 3: return 'TRESCIENTOS ' + Decenas(decenas);
                case 4: return 'CUATROCIENTOS ' + Decenas(decenas);
                case 5: return 'QUINIENTOS ' + Decenas(decenas);
                case 6: return 'SEISCIENTOS ' + Decenas(decenas);
                case 7: return 'SETECIENTOS ' + Decenas(decenas);
                case 8: return 'OCHOCIENTOS ' + Decenas(decenas);
                case 9: return 'NOVECIENTOS ' + Decenas(decenas);
            }

            return Decenas(decenas);
        }//Centenas()


        function Seccion(num, divisor, strSingular, strPlural) {
            var cientos = Math.floor(num / divisor)
            var resto = num - (cientos * divisor)
            var letras = '';

            if (cientos > 0) {
                if (cientos > 1) {
                    letras = Centenas(cientos) + ' ' + strPlural;
                } else {
                    letras = strSingular;
                }
            }

            if (resto > 0) {
                letras += '';
            }
            return letras;
        }//Seccion()


        function Miles(num) {
            var divisor = 1000;
            var cientos = Math.floor(num / divisor)
            var resto = num - (cientos * divisor)

            var strMiles = Seccion(num, divisor, 'UN MIL', 'MIL');
            var strCentenas = Centenas(resto);

            if (strMiles == '') {
                return strCentenas;
            }
            return strMiles + ' ' + strCentenas;
        }//Miles()


        function Millones(num) {
            var divisor = 1000000;
            var cientos = Math.floor(num / divisor)
            var resto = num - (cientos * divisor)

            // var strMillones = Seccion(num, divisor, 'UN MILLON DE', 'MILLONES DE');
            var strMillones = Seccion(num, divisor, 'UN MILLON', 'MILLONES');
            var strMiles = Miles(resto);

            if (strMillones == '') {
                return strMiles;
            }
            return strMillones + ' ' + strMiles;
        }//Millones()


        function NumeroALetras(num, currency) {
            currency = currency || {};
            var data = {
                numero: num,
                enteros: Math.floor(num),
                centavos: (((Math.round(num * 100)) - (Math.floor(num) * 100))),
                letrasCentavos: '',
                letrasMonedaPlural: currency.plural || 'SOLES',//'PESOS', 'DOLARES AMERICANOS', 'Bolívares', 'etcs'
                letrasMonedaSingular: currency.singular || 'SOL', //'PESO', 'DOLAR AMERICANOS'', 'Bolivar', 'etc'
                letrasMonedaCentavoPlural: currency.centPlural || 'CENTIMOS',
                letrasMonedaCentavoSingular: currency.centSingular || 'CENTIMO'
            };

            if (data.centavos > 0) {
                data.letrasCentavos = 'CON ' + (function () {
                    if (data.centavos == 1)
                        return Millones(data.centavos) + ' ' + data.letrasMonedaCentavoSingular;
                    else
                        return Millones(data.centavos) + ' ' + data.letrasMonedaCentavoPlural;
                })();
            };

            if (data.enteros == 0)
                return 'CERO ' + data.letrasMonedaPlural + ' ' + data.letrasCentavos;
            if (data.enteros == 1)
                return Millones(data.enteros) + ' ' + data.letrasMonedaSingular + ' ' + data.letrasCentavos;
            else
                return Millones(data.enteros) + ' ' + data.letrasMonedaPlural + ' ' + data.letrasCentavos;
        }

        function NumeroALetrasDolar(num, currency) {
            currency = currency || {};
            var data = {
                numero: num,
                enteros: Math.floor(num),
                centavos: (((Math.round(num * 100)) - (Math.floor(num) * 100))),
                letrasCentavos: '',
                letrasMonedaPlural: currency.plural || 'DOLARES AMERICANOS',//'PESOS', 'SOLES', 'Bolívares', 'etcs'
                letrasMonedaSingular: currency.singular || 'DOLAR AMERICANO', //'PESO', 'SOL', 'Bolivar', 'etc'
                letrasMonedaCentavoPlural: currency.centPlural || 'CENTAVOS',
                letrasMonedaCentavoSingular: currency.centSingular || 'CENTAVO'
            };

            if (data.centavos > 0) {
                data.letrasCentavos = 'CON ' + (function () {
                    if (data.centavos == 1)
                        return Millones(data.centavos) + ' ' + data.letrasMonedaCentavoSingular;
                    else
                        return Millones(data.centavos) + ' ' + data.letrasMonedaCentavoPlural;
                })();
            };

            if (data.enteros == 0)
                return 'CERO ' + data.letrasMonedaPlural + ' ' + data.letrasCentavos;
            if (data.enteros == 1)
                return Millones(data.enteros) + ' ' + data.letrasMonedaSingular + ' ' + data.letrasCentavos;
            else
                return Millones(data.enteros) + ' ' + data.letrasMonedaPlural + ' ' + data.letrasCentavos;
        }


        function getPromocion(_id_promocion) {
            try {
                var recPromotion = search.lookupFields({
                    type: 'promotioncode',
                    id: _id_promocion,
                    columns: ["discountrate", "combinationtype", "discount", "custrecord_is_discount_global"]
                });

                var rate = recPromotion["discountrate"];
                rate = rate.toString().replace('-', '').replace('%', '');
                factorcargodescuento = (rate / 100).toFixed(2);

                return {
                    p_descuento: factorcargodescuento,
                    p_tipo: recPromotion["combinationtype"],
                    p_item: recPromotion["discount"][0].text,
                    p_dsctoglobal: recPromotion["custrecord_is_discount_global"] || false
                }

            } catch (e) {
                log.error('error en getPromocion', e);
            }
        }

        return {
            validate: validate
        };

    });
