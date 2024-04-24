/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/record', 'N/search', 'N/file'], function (log, record, search, file) {

    function _get(context) {
        return true;
    }

    function _post(context) {
        try {
            var datos = new Array();
            var ordenPedidoVenta;
            var codArticuloRecurrente;
            var ruc;

            if (context.action === 'ClienteVenta') {
                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    filters:
                        [
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            ["status", "anyof", "SalesOrd:F", "SalesOrd:G"],
                            "AND",
                            ["customermain.custentity_asb_cod_empresa_ftr", "is", context.codEmpresa],
                            "AND",
                            ["customermain.custentity_asb_cod_grupo", "is", context.codGrupo],
                            "AND",
                            ["itemtype", "is", "Service"],
                            "AND",
                            ["item.custitem_asb_tipo_item", "anyof", "2"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "item", label: "Item" }),
                            search.createColumn({ name: "internalid", label: "internalid" }),
                            search.createColumn({
                                name: "internalid",
                                join: "item",
                                label: "id items"
                            }),
                            search.createColumn({name: "itemid",join: "item",label: "id name"}),
                            search.createColumn({
                                name: "custentity_pe_flag_tax_number_api_ruc",
                                join: "customerMain",
                                label: "PE Flag Tax Number API RUc"
                            })
                        ]
                });

                var searchResultCount = salesorderSearchObj.runPaged().count;
                var count = 0;
            
                if (searchResultCount > 0) {
                    var srchResSftp = salesorderSearchObj.run().getRange(0, 1);
                  log.debug('srchResSftp',srchResSftp);
                    for (var i = 0; i < parseInt(srchResSftp.length); i++) {

                        ordenPedidoVenta = srchResSftp[i].getValue({ name: "internalid", label: "internalid" });
                        codArticuloRecurrente = srchResSftp[i].getValue({name: "itemid",join: "item",label: "id name"});
                        ruc = srchResSftp[i].getValue({ name: "custentity_pe_flag_tax_number_api_ruc", join: "customerMain", label: "PE Flag Tax Number API RUc" });
                    }
                  log.debug('codArticuloRecurrente',codArticuloRecurrente);
                    return {
                        codResp: '00',
                        descResp: 'Correcto',
                        ordenPedidoVenta: ordenPedidoVenta,
                        codArticuloRecurrente: codArticuloRecurrente,
                        ruc: ruc
                    };
                }else{
                    return {
                        codResp: '99',
                        descResp: 'Cliente no encontrado',
                        ordenPedidoVenta: "",
                        codArticuloRecurrente: "",
                        ruc: ""
                    };
                }


            }
            if (context.action === 'Clientecompra') {
                var vendorbillSearchObj = search.create({
                    type: "serviceitem",
                    filters:
                        [
                           
                            ["custitem_asb_cod_empresa", "is", context.codEmpresa],
                            "AND",
                            ["custitem_asb_cod_grupo", "is", context.codGrupo]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custitem_asb_tipo_item" }),
                            search.createColumn({ name: "itemid" }),
                           
                            search.createColumn({ name: "vendorname" })
                            
                        ]
                });
                var searchResultCount = vendorbillSearchObj.runPaged().count;
                var count = 0;
                if (searchResultCount > 0) {
                    var srchResSftp = vendorbillSearchObj.run().getRange(0, 2);
                    for (var i = 0; i < parseInt(srchResSftp.length); i++) {
                        if(srchResSftp[i].getValue({ name: "custitem_asb_tipo_item" })==1){
                            codArticuloRecurrente=srchResSftp[i].getValue({ name: "itemid" });
                        }
                        if(srchResSftp[i].getValue({ name: "custitem_asb_tipo_item" })==2){
                            ordenPedidoVenta=srchResSftp[i].getValue({ name: "itemid" });
                        }
                       
                        ruc = srchResSftp[i].getValue({ name: "vendorname" });
                    }
                    return {
                        codResp: '00',
                        descResp: 'Correcto',
                        codArticuloRecurrente: ordenPedidoVenta,
                        codArticuloUnico: codArticuloRecurrente,
                        ruc: ruc
                    };
                }else{
                    return {
                        codResp: '99',
                        descResp: 'Cliente no encontrado',
                        codArticuloRecurrente: "",
                        codArticuloUnico: "",
                        ruc: ""
                    };
                }                
            }

        } catch (error) {
            return {
                codResp: '99',
                descResp: error
            };
        }



    }



    return {
        get: _get,
        post: _post
    }
});
