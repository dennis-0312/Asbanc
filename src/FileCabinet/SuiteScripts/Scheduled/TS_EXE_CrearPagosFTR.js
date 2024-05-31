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
        var date = new Date();
        var dd = date.getDate();
        var mm = date.getMonth() + 1; //January is 0!
        var yyyy = date.getFullYear();
        mm = mm < 10 ? '0' + mm : mm;
        dd = dd < 10 ? '0' + dd : dd;

        var sftp = record.load({ type: 'customrecord_ns_sftp_conect', id: 2, isDynamic: true });
        var url = sftp.getValue({ fieldId: 'custrecord_ns_rs_url' });
        var user = sftp.getValue({ fieldId: 'custrecord_ns_user' });
        var password = sftp.getValue({ fieldId: 'custrecord_ns_password' });
        var host_key = sftp.getValue({ fieldId: 'custrecordns_host_key' });
        var ns = sftp.getValue({ fieldId: 'custrecord_ns_host_key' });
        var port = sftp.getValue({ fieldId: 'custrecord_ns_port' });
        var timeout = sftp.getValue({ fieldId: 'custrecord_ns_timeout' });
        var correlativo = sftp.getValue({ fieldId: 'custrecord_correlativoftr' });
        var directory = sftp.getValue({ fieldId: 'custrecord_ns_directory' });
        if (correlativo == '1000') {
            correlativo = '1'

        } else {
            correlativo = parseInt(correlativo) + 1;
        }
        sftp.setValue('custrecord_correlativoftr', correlativo);
        sftp.save();
        correlativo = padLeft(correlativo, 3, '0');
        log.debug('correlativo', correlativo);
        var namefile = 'D00800' + dd + mm + yyyy + correlativo + '.TXT';
        log.debug('namefile', namefile);
        var amountSoles = 0;
        var amountDolares = 0;
        var filecontet;
        var largototal = "00000000";
        var mySearch = search.load({ id: "1369", type: "invoice" });

        var searchResultCount = mySearch.runPaged().count;
        log.debug('searchResultCount', searchResultCount);
        var Validador;
        mySearch.run().each(function (result) {


            if (Validador != result.getText('custbody_pe_serie') + result.getValue('custbody_pe_number')) {
                if (result.getValue('currency') == 1) {
                    amountSoles = + result.getValue('debitfxamount');
                }
                if (result.getValue('currency') == 2) {
                    amountDolares = + result.getValue('debitfxamount');
                }
            }
            Validador = result.getText('custbody_pe_serie') + result.getValue('custbody_pe_number');
            return true;

        });

        if (String(amountSoles).length != 15) {
            for (var index = String(amountSoles).length; index < 15; index++) {
                amountSoles = '0' + amountSoles;
            }
        }
        if (String(amountDolares).length != 15) {
            for (var index = String(amountDolares).length; index < 15; index++) {
                amountDolares = '0' + amountDolares;
            }
        }
        if (String(largototal).length != 128) {
            for (var index = String(largototal).length; index < 128; index++) {
                largototal = ' ' + largototal;
            }

        }
        amountSoles = amountSoles.replace('.', '');
        amountDolares = amountDolares.replace('.', '');
        filecontet = namefile + 'R0000800' + dd + mm + yyyy + '000000000000' + searchResultCount + amountSoles + amountDolares + ' ' + largototal;

        mySearch.run().each(function (result) {

            if (Validador != result.getText('custbody_pe_serie') + result.getValue('custbody_pe_number')) {
                var customer = record.load({ type: 'customer', id: result.getValue('entity') });

                var serie = result.getText('custbody_pe_serie');
                var correlativo = result.getValue('custbody_pe_number');
                var name = formatearNombre(customer.getValue('altname'));
                var codigo = customer.getValue('custentity_asb_cod_rec');
                var monto = result.getValue('debitfxamount');

                var [dia, mes, ano] = result.getValue('trandate').split("/");
                var trandate = '' + padLeft(dia, 2, '0') + padLeft(mes, 2, '0') + padLeft(ano, 2, '0');
                var [dia, mes, ano] = result.getValue('saleseffectivedate').split("/");
                var saleseffectivedate = '' + padLeft(dia, 2, '0') + padLeft(mes, 2, '0') + padLeft(ano, 2, '0');

                if (String(correlativo).length < 12 - parseInt(serie.length)) {
                    for (var index = String(correlativo).length; index < 12 - parseInt(serie.length); index++) {
                        correlativo = '0' + String(correlativo);
                    }
                }
                if (String(codigo).length < 8) {
                    for (var index = String(codigo).length; index < 8; index++) {
                        codigo = '0' + String(codigo);
                    }
                }

                if (name.length < 30) {
                    for (var index = String(name).length; index < 30; index++) {
                        name = name + ' ';
                    }
                }
                var memo = result.getText('custbody_pe_serie') + correlativo;
                if (memo.length < 20) {
                    for (var index = String(memo).length; index < 20; index++) {
                        memo = memo + ' ';
                    }
                }
                if (String(monto).length != 13) {
                    for (var index = String(monto).length; index < 13; index++) {
                        monto = '0' + monto;
                    }
                }

                filecontet += '\nN' + result.getText('custbody_pe_serie') + correlativo + '  ' + name.substr(0, 30) + '00' + result.getValue('currency') + result.getText('custbody_pe_serie') + correlativo + '    ' + memo.substr(0, 20) + trandate + saleseffectivedate + monto.replace('.', '') + '000000000000' + '000000000000' + '000000000100' + '00' + yyyy + '00' + result.getValue('currency') + codigo + '                                             F';
            }
            Validador = result.getText('custbody_pe_serie') + result.getValue('custbody_pe_number');
            return true;

        });

        log.debug('filecontet', filecontet);
        var response = https.post({
            url: urlStr,
            body: JSON.stringify({
                "username": user,
                "passwordGuid": password,
                "url": url,
                "hostKey": host_key,
                "hostKeyType": ns,
                "port": port,
                "directory": '/SFTP-NETSUITE-PROD/ASBANC/800/DEUDAS',
                "timeout": timeout,
                "tipo": 'CreateField',
                "filecontet": filecontet,
                "namefile": namefile,
                "rutaDestino": '',
            })

        });

    }
    function formatearNombre(nombre) {

        nombre = nombre.replace(/[^a-zA-Z0-9. ]/g, '');

        nombre = nombre.replace(/\s+/g, ' ');

        nombre = nombre.trim();

        return nombre;
    }

    function padLeft(value, length, padChar) {
        value = value.toString(); // Asegurarse de que el valor sea una cadena de texto
        padChar = padChar || '0'; // Usar '0' como carácter de relleno predeterminado
        while (value.length < length) {
            value = padChar + value;
        }
        return value;
    }
    return {
        execute: execute
    }
});
