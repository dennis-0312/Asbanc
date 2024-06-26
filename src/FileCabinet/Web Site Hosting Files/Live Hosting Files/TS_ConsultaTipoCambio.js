/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log', 'N/https'], function (log, https) {

    function _post(context) {
        let headers1 = [];
        headers1['Accept'] = '*/*';
        headers1['Content-Type'] = 'application/json';
        headers1['Authorization'] = 'Bearer 6730204e1570986c1774d2ada1fa49f26265e92451d1b1ca36e13988504b04b1';

        var respAsset = https.post({
            url: "https://apiperu.dev/api/tipo_de_cambio",
            headers: headers1,
            body: JSON.stringify(context.data)
        });
        return JSON.parse(respAsset.body);
    }

    return {
        post: _post

    }
});
