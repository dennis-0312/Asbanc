/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(["N/record", "N/file", "N/email", "N/encode", "N/search", "N/https", "N/log", "N/sftp", "N/runtime"], function (record, file, email, encode, search, https, log, sftp, runtime) {

    function beforeLoad(context) {

    }

    function beforeSubmit(context) {

    }

    function afterSubmit(context) {







        let objRecord = context.newRecord;

        log.debug('type', context.type);


        if (context.type == context.UserEventType.EDIT || context.type == context.UserEventType.XEDIT) {
            var Movedata = record.load({ type: 'customrecord_archivos_sftp', id: objRecord.id });
            var tipo = Movedata.getValue({ fieldId: 'custrecord_ns_tipo' });
            var estado = Movedata.getValue({ fieldId: 'custrecord_ns_estado' });
            var nombre = Movedata.getValue({ fieldId: 'custrecord_nombre_archivo' });

            log.debug('tipo', tipo);
            if (estado != 1) {
                var busqueda = search.create({
                    type: "customrecord_ns_sftp_config",
                    filters:
                        [
                            search.createFilter({
                                name: 'custrecord_ns_tipoconfig',
                                operator: search.Operator.IS,
                                values: tipo
                            })
                        ],
                    columns:
                        [
                            search.createColumn({ name: "custrecord_ns_rutacorrecto", label: "Param" }),
                            search.createColumn({ name: "custrecord_ns_rutadescarga", label: "origen" }),
                            search.createColumn({ name: "custrecord_ns_ruta_error", label: "Valor" })
                        ]

                });
                let searchResult = busqueda.run().getRange({ start: 0, end: 100 });

                for (let index = 0; index < parseInt(searchResult.length); index++) {
                    let rutaOrigen = searchResult[index].getValue({ name: "custrecord_ns_rutadescarga", label: "Param" });
                    let rutaDestino = estado == 2 ? searchResult[index].getValue({ name: "custrecord_ns_ruta_error", label: "Valor" }) : searchResult[0].getValue({ name: "custrecord_ns_rutacorrecto", label: "Param" });
                    rutaOrigen = rutaOrigen + '/' + nombre;
                    rutaDestino = rutaDestino + '/' + nombre;
                    //importante Saber el internal ID
                    var deployScritp = record.load({ type: 'scriptdeployment', id: 1133 });
                    var urlStr = deployScritp.getValue({ fieldId: 'externalurl' });

                    var headers1 = [];
                    headers1['Accept'] = '*/*';
                    headers1['Content-Type'] = 'application/json';

                    var sftp = record.load({ type: 'customrecord_ns_sftp_conect', id: 2, isDynamic: true });
                    var url = sftp.getValue({ fieldId: 'custrecord_ns_rs_url' });
                    var user = sftp.getValue({ fieldId: 'custrecord_ns_user' });
                    var password = sftp.getValue({ fieldId: 'custrecord_ns_password' });
                    var host_key = sftp.getValue({ fieldId: 'custrecordns_host_key' });
                    var ns = sftp.getValue({ fieldId: 'custrecord_ns_host_key' });
                    var port = sftp.getValue({ fieldId: 'custrecord_ns_port' });
                    var timeout = sftp.getValue({ fieldId: 'custrecord_ns_timeout' });
                    var directory = sftp.getValue({ fieldId: 'custrecord_ns_directory' });

                    var response = https.post({
                        url: urlStr,
                        body: JSON.stringify({
                            "username": user,
                            "passwordGuid": password,
                            "url": url,
                            "hostKey": host_key,
                            "hostKeyType": ns,
                            "port": port,
                            "directory": '/',
                            "timeout": timeout,
                            "tipo": 'MoveField',
                            "rutaOrigen": rutaOrigen,
                            "rutaDestino": rutaDestino,
                        })
                    });
                }

            }

        }
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
