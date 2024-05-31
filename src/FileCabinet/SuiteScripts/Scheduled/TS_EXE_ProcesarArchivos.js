/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(["N/record", "N/https", "N/log", 'N/search'], function (record, https, log, search) {

    function execute(context) {
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

        var SftpSearchObj = search.create({
            type: "customrecord_archivos_sftp",
            filters:
                [
                    ["custrecord_ns_tipo", "anyof", 1],
                    "AND",
                    ["custrecord_ns_estado", "anyof", "1"]

                ], columns:
                [
                    search.createColumn({ name: "custrecord_ns_rs_id", label: "idfiel" }),
                    search.createColumn({ name: "internalid", label: "id" }),

                ]
        });
        var srchResSftp = SftpSearchObj.run().getRange(0, 1000);
        for (var i = 0; i < parseInt(srchResSftp.length); i++) {
          log.debug('internal',srchResSftp[i].getValue('internalid'));
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
                    "tipo": 'ProcessField',
                    "filecontet": srchResSftp[i].getValue('custrecord_ns_rs_id'),
                    "internalID": srchResSftp[i].getValue('internalid'),
                    "rutaDestino": '',
                })
    
            });
        }
        
    }

    return {
        execute: execute
    }
});
