/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/file','N/search','N/record','N/ui/dialog'], function(file,search,record,dialog) {
    const pageInit = (scriptContext) => {
        alert('hola mundo'); //!Importante, no borrar.
    }
    var FOLDER_PDF = 513; 
    function anularInvoice(id) {
        var json = new Array();
        var jsonMain = new Array();
        var jsonIDE = new Array();
        var jsonEMI = new Array();
        var jsonCBR = new Array();
        var jsonDBR = new Array();
        var searchLoad = search.create({
            type: "transaction",
            filters:
                [
                    ["type", "anyof", "CustInvc"],
                    "AND",
                    ["internalid", "anyof", 2864]
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
                    search.createColumn({ name: "custbody_pe_number", label: "PEnumber" })
                ]
        });
        var searchResult = searchLoad.run().getRange({ start: 0, end: 200 });
        var fechaEmision = searchResult[0].getValue({ name: "trandate" });
        var codTipoDocumento = searchResult[0].getValue(searchLoad.columns[3]);
        fechaEmision = fechaEmision.split('/');
        fechaEmision = fechaEmision[2] + '-' + fechaEmision[1] + '-' + fechaEmision[0];
        var column07 = searchResult[0].getValue(searchLoad.columns[6]);
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
        
        if(estado_envio != 7){
         
            dialog.alert({ title: 'Información', message: 'EL Documento no se puede anular'});
            return false;  
        } 
        if(status == 'voided'){
         
            dialog.alert({ title: 'Información', message: 'EL Documento ya se anulo'});
            return false;  
        }        
        // IDE---------------------------------------------------------------------------------------------------------------------
        jsonIDE = {
            numeracion: 'RA-20230605-1',
            fechaEmision: fechaEmision
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
			tipoComprobanteItem: "01",
			serieItem: PEserie,
			correlativoItem: PEnumber,
			motivoBajaItem: "Pruebas Express"
        }]
        jsonMain = {
            IDE: jsonIDE,
            EMI: jsonEMI,
            CBR: jsonCBR,
            //DRF: jsonDRF,
            DBR: jsonDBR,
            
            
        }
        var filename = column08 + '-' + 'RA-20230605-1';
        console.log(codTipoDocumento);
        if (codTipoDocumento == '01') {
            json = JSON.stringify({ "comunicacionBaja": jsonMain });
        } else if (codTipoDocumento == '03') {
            json = JSON.stringify({ "resumenComprobantes": jsonMain });
        }
        var filejson = generateFileJSON(filename, json);
        var filejson = file.load({ id: filejson });
        
    }

    function generateFileJSON(namefile, content) {
        console.log(namefile);
            var fileObj = file.create({
                name: namefile + '.json',
                fileType: file.Type.JSON,
                contents: content,
                folder: FOLDER_PDF,
                isOnline: true
            });
            var fileid = fileObj.save();
            console.log(fileid);
            return fileid;
       
            
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
        pageInit:pageInit,
        anularInvoice: anularInvoice
       
    }
});
