/********************************************************************************************************************************************************
This script for Customer (Validación y asignación de datos provenientes del API RUC) 
/******************************************************************************************************************************************************** 
File Name: TS_UE_Customer_Vendor.js                                                                        
Commit: 01                                                        
Version: 1.0                                                                     
Date: 26/05/2022
ApiVersion: Script 2.1
Enviroment: SB
Governance points: N/A
========================================================================================================================================================*/
/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(["N/log", "N/https", "N/record", "N/search", "N/runtime"], (log, https, record, search, runtime) => {
  const CUSTOMER = "customer";
  const VENDOR = "vendor";
  const TOKEN = "094b9378a57a63fee2fc08792d8a77b6bbc57699";
  const urlDNIMain = "https://consulta.api-peru.com/api/dni/";
  const urlRUCMain = "https://consulta.api-peru.com/api/ruc/";
  const PE_Facturacion_Electronica = 1; // se corrigio 2->1
  const beforeLoad = (context) => {
    const objRecord = context.newRecord;
    try {
      // objRecord.setValue({ fieldId: 'custentity_psg_ei_entity_edoc_standard', value: PE_Facturacion_Electronica });
      // objRecord.setValue({ fieldId: 'custentity_psg_ei_auto_select_temp_sm', value: true });
    } catch (error) {
      log.error("Error", error);
    }
  };

  const beforeSubmit = (context) => {
    const objRecord = context.newRecord;
    const eventType = context.type;
    if (eventType === context.UserEventType.CREATE) {
      let headerObj = new Array();
      headerObj["Accept"] = "*/*";
      headerObj["Content-Type"] = "application/json";
      headerObj["Authorization"] = TOKEN;
      let addr1 = "";
      let addr2 = "";
      let city = "";
      let state = "";
      let deudasCoactivas = "";
      let representante_legal = "";
      let document_number = "";
      // let documentType = "";
      let documentType = objRecord.getValue("custentity_pe_document_type");//IMorales 20230911
      log.debug('MSK', 'Seteo Inicial de documentType = ' + documentType)
      let typeOfPerson = "";
      try {
        let getdatesauto = objRecord.getValue("custentity_pe_crear_cliente_auto");
        let isperson = objRecord.getValue("isperson");
        if (getdatesauto == true) {
          document_number = objRecord.getValue("custentity_pe_document_number");
          if (isperson == "F") {
            let response = https.get({ url: urlRUCMain + document_number, headers: headerObj });
            let body = JSON.parse(response.body);
            let success = body.success;
            if (success == true) {
              deudasCoactivas = body.data.tiene_deudas_coactivas;
              representante_legal = body.data.representante_legal;
              let companyname = body.data.nombre_o_razon_social;

              //IMorales 20231031 - Inicio
              if (companyname && companyname.length > 69) {
                companyname = companyname.substring(0, 69);
              }
              //IMorales 20231031 - Fin

              let dpd = body.data.dpd;
              try {
                dpd = dpd.split(" - ");
                addr2 = dpd[0];
                city = dpd[1];
                state = dpd[2];
              } catch (error) {
                log.error("ErrorDPD", "DPD Vacío");
              }
              addr1 = body.data.direccion;
              documentType = 4;
              typeOfPerson = 2;
              objRecord.setValue({ fieldId: "companyname", value: companyname });
              objRecord.setValue({ fieldId: "custentity_asb_deudas_coactivas", value: deudasCoactivas });
              objRecord.setValue({ fieldId: "custentity_asb_user_upd_homo", value: representante_legal });
            }
          } else {
            try {
              let response = https.get({ url: urlDNIMain + document_number, headers: headerObj });
              let body = JSON.parse(response.body);
              let success = body.success;
              if (success == true) {
                let firstname = body.data.nombres;
                let lastname = body.data.apellido_paterno + " " + body.data.apellido_materno;
                addr1 = body.data.direccion;
                addr2 = body.data.ubigeo_direccion_distrito;
                city = body.data.ubigeo_direccion_provincia;
                state = body.data.ubigeo_direccion_departamento;

                //IMorales 20231031 - Inicio
                let companyname = firstname + " " + lastname
                if (companyname && companyname.length > 69) {
                  companyname = companyname.substring(0, 69);
                }
                //IMorales 20231031 - Fin

                documentType = 2;
                typeOfPerson = 1;
                objRecord.setValue({ fieldId: "firstname", value: firstname });
                objRecord.setValue({ fieldId: "lastname", value: lastname });
                objRecord.setValue({ fieldId: "companyname", value: companyname });
              }
            } catch (error) {
              log.error("ErrorURL", error);
            }
          }
          log.debug('MSK', 'Valor que se setea al documentType=' + documentType)
          objRecord.setValue({ fieldId: "custentity_pe_document_type", value: documentType });
          objRecord.setValue({ fieldId: "custentity_pe_type_of_person", value: typeOfPerson });
          objRecord.setValue({ fieldId: "custentity_pe_flag_direccion_api_ruc", value: addr1 });
          objRecord.setValue({ fieldId: "custentity_pe_flag_distrito_api_ruc", value: addr2 });
          objRecord.setValue({ fieldId: "custentity_pe_flag_provincia_api_ruc", value: city });
          objRecord.setValue({ fieldId: "custentity_pe_flag_departamento_api_ruc", value: state });
          objRecord.setValue({ fieldId: "custentity_pe_flag_tax_number_api_ruc", value: document_number });
        } else {
          if (isperson == "T") {
            let firstname = objRecord.getValue("firstname");
            let lastname = objRecord.getValue("lastname");

            //IMorales 20231031 - Inicio
            let companyname = firstname + " " + lastname
            if (companyname && companyname.length > 69) {
              companyname = companyname.substring(0, 69);
            }
            //IMorales 20231031 - Fin

            objRecord.setValue({ fieldId: "companyname", value: companyname });
          }
        }
      } catch (error) {
        log.error("Error-beforeSubmit", error);
      }
    }

  };

  const afterSubmit = (context) => {
    const objRecord = context.newRecord;
    const eventType = context.type;
    let entity = "";
    let identifier = "";
    if (eventType === context.UserEventType.CREATE) {
      try {
        let recordId = objRecord.id;
        let subRecordAddress = "";
        if (objRecord.type == CUSTOMER) {
          subRecordAddress = record.load({ type: record.Type.CUSTOMER, id: recordId, isDynamic: true });
          entity = "Customer";
        } else {
          subRecordAddress = record.load({ type: record.Type.VENDOR, id: recordId, isDynamic: true });
          entity = "Vendor";
        }
        let getdatesauto = subRecordAddress.getValue("custentity_pe_crear_cliente_auto");
        if (getdatesauto == true) {
          let number = subRecordAddress.getValue("custentity_pe_flag_tax_number_api_ruc");
          let addr1 = subRecordAddress.getValue("custentity_pe_flag_direccion_api_ruc");
          let addr2 = subRecordAddress.getValue("custentity_pe_flag_distrito_api_ruc");
          let city = subRecordAddress.getValue("custentity_pe_flag_provincia_api_ruc");
          let state = subRecordAddress.getValue("custentity_pe_flag_departamento_api_ruc");
          subRecordAddress.setValue({ fieldId: "vatregnumber", value: number });
          subRecordAddress.setValue({ fieldId: "custentity_psg_ei_entity_edoc_standard", value: PE_Facturacion_Electronica });
          subRecordAddress.setValue({ fieldId: "custentity_psg_ei_auto_select_temp_sm", value: true });
          subRecordAddress.selectNewLine({ sublistId: "addressbook" });
          let myAddressSubRecord = subRecordAddress.getCurrentSublistSubrecord({ sublistId: "addressbook", fieldId: "addressbookaddress" });
          myAddressSubRecord.setValue({ fieldId: "addr1", value: addr1 });
          myAddressSubRecord.setValue({ fieldId: "addr2", value: addr2 });
          myAddressSubRecord.setValue({ fieldId: "city", value: city });
          try {
            myAddressSubRecord.setValue({ fieldId: "state", value: state });
          } catch (error) { }
          subRecordAddress.commitLine({ sublistId: "addressbook" });
          let result = subRecordAddress.save({ enableSourcing: true, ignoreMandatoryFields: true });
          log.debug("Result", entity + "Id: " + result);
        }
        //PREFIJO C-CUSTOMER, P-PROVEEDOR
        let nro_documento = objRecord.getValue("custentity_pe_document_number");
        let name = objRecord.getValue("companyname");
        if (objRecord.type == CUSTOMER) {
          identifier = "C-" + nro_documento + " " + name;
          record.submitFields({ type: record.Type.CUSTOMER, id: recordId, values: { entityid: identifier } });
        }

        if (objRecord.type == VENDOR) {
          identifier = "P-" + nro_documento + " " + name;
          record.submitFields({ type: record.Type.VENDOR, id: recordId, values: { entityid: identifier } });
        }
        log.debug("DEBUG", identifier);
        // else {
        //     subRecordAddress.setValue({ fieldId: 'custentity_psg_ei_entity_edoc_standard', value: PE_Facturacion_Electronica });
        //     subRecordAddress.setValue({ fieldId: 'custentity_psg_ei_auto_select_temp_sm', value: true });
        //     let result = subRecordAddress.save({ enableSourcing: true, ignoreMandatoryFields: true });
        //     log.debug('Result', result);
        // }
      } catch (error) {
        log.error("Error-afterSubmit", error);
      }
    }

    //! IMorales - Consulta API RUC y API DNI para Cliente y Proveedor
    if (eventType === context.UserEventType.CREATE || eventType === context.UserEventType.EDIT) {
      try {
        let recordId = objRecord.id;
        let miRecord_CusVen = "";
        if (objRecord.type == CUSTOMER) {
          miRecord_CusVen = record.load({ type: record.Type.CUSTOMER, id: recordId, isDynamic: true });
          entity = "Customer";
        } else {
          miRecord_CusVen = record.load({ type: record.Type.VENDOR, id: recordId, isDynamic: true });
          entity = "Vendor";
        }
        var isperson = miRecord_CusVen.getValue('isperson');

        let document_type = miRecord_CusVen.getValue("custentity_pe_document_type");
        let document_number = objRecord.getValue("custentity_pe_document_number");
        let country = objRecord.getValue("custentity_pe_entity_country");

        let body = {};
        let success = false;
        let API_CONSULTADA = "";
        log.debug("MSK", "country=" + country + ", " + " document_type=" + document_type);
        if (country == "187" && document_type == "4") {
          //!Peruano con RUC
          API_CONSULTADA = "APIRUC";
          log.debug("MSK", API_CONSULTADA + " - " + document_number);
          //!1.0 Conectarse a la API RUC
          let myRestletHeaders = new Array();
          myRestletHeaders["Accept"] = "*/*";
          myRestletHeaders["Content-Type"] = "application/json";
          let DatosRuc = {
            ruc: document_number,
          };
          let myRestletResponse = https.requestRestlet({
            body: JSON.stringify(DatosRuc),
            deploymentId: "customdeploy_ts_consultaruc",
            scriptId: "customscript_ts_consultaruc",
            headers: myRestletHeaders,
          });
          body = JSON.parse(myRestletResponse.body);
          success = body.success;
        } else if (country == "187" && document_type == "2") {
          //!Peruano con DNI
          API_CONSULTADA = "APIDNI";
          log.debug("MSK", API_CONSULTADA + " - " + document_number);
          //!1.0 Conectarse a la API DNI
          let myRestletHeaders = new Array();
          myRestletHeaders["Accept"] = "*/*";
          myRestletHeaders["Content-Type"] = "application/json";
          let DatosDni = {
            dni: document_number,
          };
          let myRestletResponse = https.requestRestlet({
            body: JSON.stringify(DatosDni),
            deploymentId: "customdeploy_ts_cosultardni",
            scriptId: "customscript_ts_cosultardni",
            headers: myRestletHeaders,
          });
          body = JSON.parse(myRestletResponse.body);
          success = body.success;
        }

        if (success == true) {
          if (isperson == "T" && document_type == "4" && miRecord_CusVen.type == record.Type.VENDOR) {
            let myRestletHeaders = new Array();
            myRestletHeaders["Accept"] = "*/*";
            myRestletHeaders["Content-Type"] = "application/json";
            let DatosDni = {
              dni: document_number.substring(2, 10)
            };
            let myRestletResponse = https.requestRestlet({
              body: JSON.stringify(DatosDni),
              deploymentId: "customdeploy_ts_cosultardni",
              scriptId: "customscript_ts_cosultardni",
              headers: myRestletHeaders,
            });
            var response = JSON.parse(myRestletResponse.body);
            if (response.success) {
              miRecord_CusVen.setValue({ fieldId: "custentity_pe_ap_materno", value: response.data.apellido_materno });
              miRecord_CusVen.setValue({ fieldId: "custentity_pe_ap_paterno", value: response.data.apellido_paterno });
            }
          }

          log.debug("MSK", "Proveedor/Cliente encontrado - after");

          let data = body.data;
          let vendor_name = "";
          let vendor_condicion = "";
          let vendor_estado = "";
          let representante_legal = "";
          let tiene_deudas_coactivas = "";

          if (API_CONSULTADA == "APIRUC") {
            vendor_name = data.nombre_o_razon_social;
            vendor_condicion = data.condicion == "HABIDO" ? "1" : "2";
            vendor_estado = data.estado == "ACTIVO" ? "1" : "2";
            representante_legal = data.representante_legal;
            tiene_deudas_coactivas = data.tiene_deudas_coactivas;
            log.debug("MSK", "vendor_name por RUC -> " + vendor_name);
          } else {
            vendor_name = data.nombre_completo;
            log.debug("MSK", "vendor_name por DNI -> " + vendor_name);
          }

          //Definiendo: custentity_asb_vendor_name, custentity_asb_cond_contri_prov, custentity_asb_est_contrib
          if (entity == "Vendor") {
            if (API_CONSULTADA == "APIRUC") {
              miRecord_CusVen.setValue({ fieldId: "custentity_asb_cond_contri_prov", value: vendor_condicion });
              miRecord_CusVen.setValue({ fieldId: "custentity_asb_est_contrib", value: vendor_estado });
            }
            miRecord_CusVen.setValue({ fieldId: "custentity_asb_vendor_name", value: vendor_name });
            miRecord_CusVen.setValue({ fieldId: "custentity_asb_rfc_curp", value: document_number }); //No viene de la API, sino que es el parámetro

            let userTemp = runtime.getCurrentUser(),
              useID = userTemp.id;
            var employeeName = search.lookupFields({
              type: search.Type.EMPLOYEE,
              id: useID,
              columns: ["firstname", "lastname"],
            });

            var userName = employeeName.firstname + " " + employeeName.lastname;

            let custentity_asb_homologacion = miRecord_CusVen.getValue({ fieldId: "custentity_asb_homologacion_prov" });

            if (custentity_asb_homologacion != "") {
              miRecord_CusVen.setValue({
                fieldId: "custentity_asb_upd_homo_fecha",
                value: new Date()
              });
              miRecord_CusVen.setValue({
                fieldId: "custentity_asb_user_upd_homo",
                value: userName,
              });
            }
          }

          miRecord_CusVen.setValue({ fieldId: "custentity_asb_rep_legal", value: representante_legal });
          miRecord_CusVen.setValue({ fieldId: "custentity_asb_deudas_coactivas", value: tiene_deudas_coactivas });

          //Definiendo: companyname y entityid
          let entityid1 = miRecord_CusVen.getValue("entityid");
          log.debug("MSK", "entityid1 -> " + entityid1);
          //83 es el máximo permitido
          //14 es el indicador y RUC
          //69 es el limite resultante
          if (vendor_name && vendor_name.length > 69) {
            vendor_name = vendor_name.substring(0, 69);
          }
          miRecord_CusVen.setValue({ fieldId: "companyname", value: vendor_name });
          var entityIndicator = entity == "Vendor" ? "P" : entity == "Customer" ? "C" : "";
          var newEntityId = entityIndicator + "-" + document_number + " " + vendor_name;
          let entityid2 = miRecord_CusVen.getValue("entityid");
          log.debug("MSK", "entityid2 -> " + entityid2);
          miRecord_CusVen.setValue({ fieldId: "entityid", value: newEntityId });
          let entityid3 = miRecord_CusVen.getValue("entityid");
          log.debug("MSK", "entityid3 -> " + entityid3);

          //Definiendo Dirección
          miRecord_CusVen.selectLine({ sublistId: "addressbook", line: 0 });
          let addressSubrecord = miRecord_CusVen.getCurrentSublistSubrecord({ sublistId: "addressbook", fieldId: "addressbookaddress" });
          let direccion = data.direccion;
          let direccion_completa = data.direccion_completa;
          let provincia = data.provincia;
          let distrito = data.distrito;
          let departamento = data.departamento;
          let ubigeo_sunat_api = data.ubigeo_sunat;
          let ubigeo_sunat_ns = 0;
          var filtro = [search.createFilter({ name: "custrecord_pe_codigo_2", operator: search.Operator.IS, values: ubigeo_sunat_api })];
          var columnas = [search.createColumn({ name: "internalid" })];
          var busqueda = search.create({ type: "customrecord_pe_ubigeo", filters: filtro, columns: columnas });
          var resultados = busqueda.run().getRange({ start: 0, end: 10 });
          if (resultados && resultados.length > 0) {
            ubigeo_sunat_ns = resultados[0].getValue({ name: "internalid" });
            addressSubrecord.setValue({ fieldId: "custrecord_pe_ubigeo", value: ubigeo_sunat_ns });
          }
          addressSubrecord.setValue({ fieldId: "addr1", value: direccion });
          //addressSubrecord.setValue({ fieldId: 'addr2', value: direccion_completa });
          addressSubrecord.setValue({ fieldId: "city", value: provincia });
          addressSubrecord.setValue({ fieldId: "custrecord_pe_distrito", value: distrito });
          addressSubrecord.setValue({ fieldId: "custrecord_pe_departamento", value: departamento });
          addressSubrecord.setValue({ fieldId: "country", value: "PE" });
          miRecord_CusVen.commitLine({ sublistId: "addressbook" });

          let recordIdAfterUpdate = miRecord_CusVen.save({ enableSourcing: true, ignoreMandatoryFields: true });
        } else {
          log.debug("MSK", "Proveedor/Cliente no encontrado");
        }
      } catch (error) {
        log.debug("Misaki", "Error : " + error);
      }
    }
  };

  return {
    //beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit,
  };
});
/*********************************************************************************************************************************************
TRACKING
/*********************************************************************************************************************************************
Commit:01
Version: 1.0
Date: 25/05/2022
Author: Dennis Fernández
Description: Creación del script en SB.
==============================================================================================================================================*/
