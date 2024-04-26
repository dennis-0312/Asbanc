/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */


define(['N/ui/serverWidget', 'N/record', 'N/render', 'N/file', 'N/search', 'N/runtime', 'N/config', 'N/file','N/format'],

  function (serverWidget, record, render, file, search, runtime, config, file, format) {

    const REC_GUIA_REMISION = 'itemfulfillment';
    const SALES_ORDER = 'salesorder';
    const VENDOR_AUTORIZATION = 'vendorreturnauthorization';
    const TRANSFER_ORDER = 'transferorder';
    const BUSQ_GUIA_REMISION = 'ItemShip';
    const ID_LIST_CONDUCTOR_SEC = 'recmachcustrecord_pe_nmro_guia_remision_con_sec';
    const ID_LIST_VEHICULO_SEC = 'recmachcustrecord_pe_nmro_guia_remision_veh_sec';
    const dateFormat = 'DD/MM/YYYY';
    const decimalPlaces = 2;  

    function onRequest(context) {

      try {

        var remainingUsage = runtime.getCurrentScript().getRemainingUsage();
        log.debug('inicio', remainingUsage);

        if (context.request.method == 'GET') {
          log.debug("INICIO", "INICIO");
          var xmlJSON = {};
          var id_template = '';
          var items = [];
          var rec_id = context.request.parameters.custpage_internalid;
          var type_doc = context.request.parameters.custpage_typerec;
          var rec = record.load({ type: type_doc, id: rec_id });
          var itemCount = rec.getLineCount({
            sublistId: 'item',
          });
          for (var i = 0; i < itemCount; i++) {
            var itemName = rec.getSublistText({
              sublistId: 'item',
              fieldId: 'item',
              line: i,
            });

            var quantity = rec.getSublistValue({
              sublistId: 'item',
              fieldId: 'quantity',
              line: i,
            });

            var units_display = rec.getSublistValue({
              sublistId: 'item',
              fieldId: 'units_display',
              line: i,
            });

            var centro = rec.getSublistText({
              sublistId: 'item',
              fieldId: 'department',
              line: i,
            });

            var rate = rec.getSublistValue({
              sublistId: 'item',
              fieldId: 'rate',
              line: i,
            });

            if (rate != null && rate != '' && rate != undefined) {
              const formatted_rate = format.format({
                value: rate,
                type: format.Type.CURRENCY,
                decimals: decimalPlaces
              });  
              rate = formatted_rate;
            }



            var amount = rec.getSublistValue({
              sublistId: 'item',
              fieldId: 'amount',
              line: i,
            });

            if (amount != null && amount != '' && amount != undefined) {
              const formattedNumber = format.format({
                value: amount,
                type: format.Type.CURRENCY,
                decimals: decimalPlaces
              });
              amount = formattedNumber;
            }

            var description = rec.getSublistValue({
              sublistId: 'item',
              fieldId: 'description',
              line: i,
            });
            description = description.replace(/&/g, '&amp;');
            var itemtype = rec.getSublistValue({
              sublistId: 'item',
              fieldId: 'itemtype',
              line: i,
            });

            // Armar el objeto JSON para cada línea de artículo

            var itemObj = {
              item: itemName,
              description: description,
              quantity: quantity,
              units: units_display,
              department: centro,
              rate: rate,
              amount: amount,
              itemtype: itemtype
            };

            items.push(itemObj); // Agregar el objeto JSON al array
          }
          xmlJSON.item = items;
          xmlJSON.subtotal = rec.getValue('subtotal');
          if (xmlJSON.subtotal != null && xmlJSON.subtotal != '' && xmlJSON.subtotal != undefined) {
            const formatted_subtotal = format.format({
              value: xmlJSON.subtotal,
              type: format.Type.CURRENCY,
              decimals: decimalPlaces
            });
            xmlJSON.subtotal = formatted_subtotal;
          }

          xmlJSON.taxtotal = rec.getValue('taxtotal');
          if (xmlJSON.taxtotal != null && xmlJSON.taxtotal != '' && xmlJSON.taxtotal != undefined) {
            const formatted_taxtotal = format.format({
              value: xmlJSON.taxtotal,
              type: format.Type.CURRENCY,
              decimals: decimalPlaces
            });
            xmlJSON.taxtotal = formatted_taxtotal;
          }

          xmlJSON.total = rec.getValue('total');
          if (xmlJSON.total != null && xmlJSON.total != '' && xmlJSON.total != undefined) {
            const formatted_total = format.format({
              value: xmlJSON.total,
              type: format.Type.CURRENCY,
              decimals: decimalPlaces
            });
            xmlJSON.total = formatted_total;
          }

          xmlJSON.tranid = rec.getText('tranid');
          xmlJSON.proveedor = rec.getText('entity').replace(/&/g, '&amp;');
          log.debug('proveedor', xmlJSON.proveedor);  
          xmlJSON.forma_pago = rec.getText('terms');
          xmlJSON.fecha_entrega = rec.getValue('custbody_asb_fec_entrega');
          log.debug('fecha_entrega', xmlJSON.fecha_entrega);

          if (xmlJSON.fecha_entrega != null && xmlJSON.fecha_entrega != '' && xmlJSON.fecha_entrega != undefined) {
            const formatted_fecha_entrega = format.format({
              value: xmlJSON.fecha_entrega,
              type: format.Type.DATE,
              format: dateFormat
            });
            xmlJSON.fecha_entrega = formatted_fecha_entrega;
          }

          xmlJSON.lugar_entrega = rec.getValue('custbody_asb_lugar_entrega');
          xmlJSON.persona_contactar = rec.getValue('custbody_asb_person_contact');
          xmlJSON.horario_atencion = rec.getValue('custbody_asb_horario_aten_prov');
          xmlJSON.penalidades = rec.getValue('custbody_asb_penalidades_prov');
          xmlJSON.garantia = rec.getValue('custbody_asb_garantia');
          xmlJSON.estado_transaccion = rec.getValue('approvalstatus');
          /**Alexander           */
          var subSearch = record.load({ type: 'subsidiary', id: rec.getValue('subsidiary'), isDynamic: true })
          
          var logoFile = file.load({
            id: subSearch.getValue('logo')
          });

          var campologoURL = logoFile.url.replace(/&/g, '&amp;');

          var configRecObj = config.load({
            type: config.Type.COMPANY_INFORMATION
          });
          log.error('subSearch.getValue',subSearch.getValue('logo'))
          xmlJSON.logo = campologoURL;
          xmlJSON.companyName = subSearch.getValue('name');
          log.debug('companyName', xmlJSON.companyName);
          xmlJSON.mainAddress = subSearch.getValue('mainaddress_text');
          xmlJSON.companyName = configRecObj.getValue('companyname');
          log.debug('companyName2', xmlJSON.companyName);
          log.debug('companyName3', subSearch.getValue('legalname'));
          xmlJSON.companyName = subSearch.getValue('legalname').toUpperCase();
          xmlJSON.employerId = subSearch.getValue('federalidnumber');
          xmlJSON.moneda = rec.getText('currency');
          var proveedor = rec.getValue('entity').replace(/&/g, '&amp;');
          xmlJSON.contact = getContact(proveedor);
          xmlJSON.date = rec.getValue('trandate');
          const formattedDate = format.format({
            value: xmlJSON.date,
            type: format.Type.DATE,
            format: dateFormat
          });
          xmlJSON.date = formattedDate;

          var moneda = rec.getValue('currency');
          xmlJSON.total_letras = convertirNumeroALetras(rec.getValue('total'), moneda);
          var vendorFields = search.lookupFields({
            type: search.Type.VENDOR,
            id: proveedor,
            columns: ['address', 'custentity_pe_document_number', 'phone', 'email', 'custentity_resp_pagos_prov', 'companyname']
          });

          xmlJSON.direccion = vendorFields.address; // Dirección
          xmlJSON.vendorCompanyName = vendorFields.companyname; // razon Social
          var address = vendorFields.address;
          const modifiedAddress = address.replace(xmlJSON.vendorCompanyName, '');
          xmlJSON.direccion = modifiedAddress.replace(/&/g, '&amp;');
          xmlJSON.ruc = vendorFields.custentity_pe_document_number; // RUC
          xmlJSON.telefono = vendorFields.phone; // Teléfono
          xmlJSON.email = vendorFields.email; // Email
          xmlJSON.responsable_pagos = vendorFields.custentity_resp_pagos_prov;
          xmlJSON.cotizacion = rec.getValue('custbody_asb_cotizacion');
          var datos_bank = getBank(proveedor);
          log.debug('ok3');
          //if (datos_bank[1] == 167) {
            xmlJSON.banco = datos_bank[2];
          //}
          xmlJSON.cuenta = datos_bank[0];
          for (var i = 1; i <= 3; i++) {
            var textoFields = search.lookupFields({
              type: 'customrecord_asb_notas_pdf_orden_compra',
              id: i,
              columns: ['custrecord_asb_nota_orden_compra_texto']
            });
            xmlJSON['texto_' + i] = textoFields.custrecord_asb_nota_orden_compra_texto;
          }
          var nextapprover = rec.getValue('nextapprover');
          var nivel_1 = rec.getValue('custbody_asb_aprobacion_nivel_1');
          xmlJSON.jefe_empleado = '';
          if (nextapprover && nivel_1 == true) {
            xmlJSON.jefe_empleado = getLogoURL(nextapprover);
          }else{
            xmlJSON.jefe_empleado = '';
          }
          log.debug('ok4');
          var aprobador_1 = rec.getValue('custbody_oc_asb_aprob_exp_1');
          var aprobador_2 = rec.getValue('custbody_oc_asb_aprob_exp_2');
          var aprobador_3 = rec.getValue('custbody_oc_asb_aprob_exp_3');
          var aprobador_4 = rec.getValue('custbody_oc_asb_aprob_exp_4');
          var aprobador_5 = rec.getValue('custbody_oc_asb_aprob_exp_5');
          var estado_1 = rec.getValue('custbody_oc_estado_1');
          var estado_2 = rec.getValue('custbody_oc_estado_2');
          var estado_3 = rec.getValue('custbody_oc_estado_3');
          var estado_4 = rec.getValue('custbody_oc_estado_4');
          var estado_5 = rec.getValue('custbody_oc_estado_5');
          var gestor_logistico = rec.getValue('custbody_asb_firma_gestor_logistico');
          var jefe_logistica = rec.getValue('custbody_asb_firma_jefe_logistica');
          var gerente_admin_fin = rec.getValue('custbody_asb_firma_gerente_admin_fin');
          var gerente_general = rec.getValue('custbody_asb_firma_gerente_general');
          xmlJSON.aprobador_experto_1 = '';
          if (aprobador_1 != '' && estado_1 == 1) {
            xmlJSON.aprobador_experto_1 = getLogoURL(aprobador_1);
          }
          xmlJSON.aprobador_experto_2 = '';
          if (aprobador_2 != '' && estado_2 == 1) {
            xmlJSON.aprobador_experto_2 = getLogoURL(aprobador_2);
          }
          xmlJSON.aprobador_experto_3 = '';
          if (aprobador_3 != '' && estado_3 == 1) {
            xmlJSON.aprobador_experto_3 = getLogoURL(aprobador_3);
          }
          xmlJSON.aprobador_experto_4 = '';
          if (aprobador_4 != '' && estado_4 == 1) {
            xmlJSON.aprobador_experto_4 = getLogoURL(aprobador_4);
          }
          xmlJSON.aprobador_experto_5 = '';
          if (aprobador_5 != '' && estado_5 == 1) {
            xmlJSON.aprobador_experto_5 = getLogoURL(aprobador_5);
          }
          xmlJSON.gestor_logistico = '';
          if (gestor_logistico != '') {
            xmlJSON.gestor_logistico = getLogoURL(gestor_logistico);
          }
          xmlJSON.jefe_logistica = '';
          if (jefe_logistica != '') {
            xmlJSON.jefe_logistica = getLogoURL(jefe_logistica);
          }
          xmlJSON.gerente_admin_fin = '';
          if (gerente_admin_fin != '') {
            xmlJSON.gerente_admin_fin = getLogoURL(gerente_admin_fin);
          }
          xmlJSON.gerente_general = '';
          if (gerente_general != '') {
            xmlJSON.gerente_general = getLogoURL(gerente_general);
          }
          log.debug('xmlJSON', xmlJSON);

          id_template = '../FTL/TS_PrintPurchaseOrder.ftl';
          // Renderiza el PDF
          var renderer = render.create();
          //Archivo del file cabinet
          var objfile = file.load({
            id: id_template
          });
          objfile = objfile.getContents();
          renderer.templateContent = objfile;
          renderer.addCustomDataSource({
            format: render.DataSource.OBJECT,
            alias: 'record',
            data: xmlJSON
          });
          var result = renderer.renderAsString();
          var myFileObj = render.xmlToPdf({
            xmlString: result
          });
          pdfContent = myFileObj.getContents();
          context.response.renderPdf(result);
          log.debug("FIN", "FIN");
        }

        var remainingUsage = runtime.getCurrentScript().getRemainingUsage();
        log.debug('fin', remainingUsage);


      } catch (e) {
        log.error("Error", "[ onRequest ] " + e);
      }

    }
    function getLogoURL(id) {
      try {
        var logoURL = "";
        log.debug('idEMPLEADO', id);
        var logoField = search.lookupFields({
          type: search.Type.EMPLOYEE,
          id: id,
          columns: ['custentity_asb_firma']
        });
        log.debug('FIRMA EMPLEADO', logoField.custentity_asb_firma);
        if (logoField.custentity_asb_firma && logoField.custentity_asb_firma.length > 0) {
          var logoFile = file.load({
            id: logoField.custentity_asb_firma[0].value
          });

          logoURL = logoFile.url.replace(/&/g, '&amp;');
        }

        return logoURL;
      } catch (e) {
        log.error('Error en getLogoURL', e);
        return '';
      }
    }
    function convertirNumeroALetras(numero, moneda) {
      var unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
      var decenas = ['', '', 'VEINTI', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
      var centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

      function convertirNumeroMenorATresCifras(n) {
        if (n < 20) {
          return unidades[n];
        } else {
          var unidad = n % 10;
          var decena = Math.floor(n / 10) % 10;
          var centena = Math.floor(n / 100);
          var letras = '';
          if (unidad === 0) {
            letras = decenas[decena];
          } else if (decena === 2) {
            letras = decenas[decena] + unidades[unidad];
          } else {
            letras = decenas[decena] + ' Y ' + unidades[unidad];
          }
          if (centena === 1 && decena === 0 && unidad === 0) {
            letras = 'CIEN';
          } else {
            letras = centenas[centena] + ' ' + letras;
          }
          return letras;
        }
      }

      function convertirNumeroMenorAMil(n) {
        var centenas = Math.floor(n / 100);
        var residuo = n % 100;
        var letras = '';
        if (centenas === 1 && residuo === 0) {
          letras = 'CIEN';
        } else if (centenas === 1) {
          letras = 'CIENTO ' + convertirNumeroMenorATresCifras(residuo);
        } else {
          letras = centenas > 0 ? convertirNumeroMenorATresCifras(centenas) + ' CIENTOS' : '';
          letras += ' ' + convertirNumeroMenorATresCifras(residuo);
        }
        return letras;
      }

      function convertirNumeroMenorAMillon(n) {
        var miles = Math.floor(n / 1000);
        var residuo = n % 1000;
        var letras = '';
        if (miles === 1 && residuo === 0) {
          letras = 'MIL';
        } else if (miles === 1) {
          letras = 'MIL ' + convertirNumeroMenorAMil(residuo);
        } else {
          letras = miles > 0 ? convertirNumeroMenorATresCifras(miles) + ' MIL' : '';
          letras += ' ' + convertirNumeroMenorAMil(residuo);
        }
        return letras;
      }

      function convertirNumeroEnLetras(numero) {
        var millones = Math.floor(numero / 1000000);
        var residuo = numero % 1000000;
        var letras = '';
        if (millones === 1 && residuo === 0) {
          letras = 'UN MILLÓN';
        } else if (millones === 1) {
          letras = 'UN MILLÓN ' + convertirNumeroMenorAMillon(residuo);
        } else {
          letras = millones > 0 ? convertirNumeroMenorATresCifras(millones) + ' MILLONES' : '';
          letras += ' ' + convertirNumeroMenorAMillon(residuo);
        }
        return letras;
      }

      var partes = String(numero).split('.');
      var parteEntera = parseInt(partes[0], 10);
      var parteDecimal = partes[1] ? parseInt(partes[1], 10) : 0;
      if (parteDecimal < 10) {
        parteDecimal = "0" + parteDecimal;
      }
      var letrasParteEntera = convertirNumeroEnLetras(parteEntera);
      var tipo_moneda = 'SOLES';
      if (moneda != 1) {
        tipo_moneda = 'DOLARES';
      }
      var resultado = letrasParteEntera;
      log.debug('lenght', letrasParteEntera.length);
      if (letrasParteEntera == '   ') {
        resultado = 'CERO'
      }

      resultado += ' CON ' + parteDecimal + '/100';

      resultado += ' ' + tipo_moneda;

      return resultado;
    }

    function getContact(entity) {
      try {
        var busqueda = search.create({
          type: "contact",
          filters: [
            ["company", "anyof", entity],
            "AND",
            ["role", "anyof", "-10"]
          ],
          columns: [
            search.createColumn({
              name: "entityid",
              sort: search.Sort.ASC,
              label: "Name"
            })
          ]
        });

        var searchResult = busqueda.run();
        var savedSearch = searchResult.getRange({ start: 0, end: 1 });

        if (savedSearch.length > 0) {
          return savedSearch[0].getValue(busqueda.columns[0]);
        }

        return "";
      } catch (e) {
        log.error('Error en getContact', e);
        return "";
      }
    }

    function getBank(entity) {
      try {
        var busqueda = search.create({
          type: "customrecord_2663_entity_bank_details",
          filters:
            [
              ["custrecord_2663_parent_vendor", "anyof", entity],
              "AND",
              ["custrecord_2663_entity_bank_type", "anyof", "1"]
            ],
          columns:
            [
              search.createColumn({ name: "custrecord_2663_entity_bban", label: "BBAN" }),
              search.createColumn({ name: "custrecord_2663_entity_file_format", label: "Formato de archivo de pago" }),
              search.createColumn({ name: "name", label: "name" })
            ]
        });

        var searchResult = busqueda.run();
        var savedSearch = searchResult.getRange({ start: 0, end: 1 });

        if (savedSearch.length > 0) {
          var bban = savedSearch[0].getValue(busqueda.columns[0]);
          var fileFormat = savedSearch[0].getValue(busqueda.columns[1]);
          var name = savedSearch[0].getValue(busqueda.columns[2]);
          return [bban, fileFormat, name];
        }

        return ["", ""]; // Devuelve un array vacío si no se encontraron resultados
      } catch (e) {
        log.error('Error en getBank', e);
        return ["", ""]; // Devuelve un array vacío en caso de error
      }
    }

    return {
      onRequest: onRequest
    };

  });
/********************************************************************************************************************************************************
TRACKING
/********************************************************************************************************************************************************
/* Commit:01
Version: 1.0
Date: 27/06/2022
Author: Jean Ñique
Description: Creación del script.
========================================================================================================================================================*/