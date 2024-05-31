/**
 * @NApiVersion 2.1
 */
define(['N/log',
    'N/search',
    'N/record',
    'N/https',
    'N/url',
],
    (log, search, record, https, url) => {

        return ({
            RucConsumo: () => {
                let myRestletHeaders = new Array();
                myRestletHeaders['Accept'] = '*/*';
                myRestletHeaders['Content-Type'] = 'application/json';
                let DatosRuc = {

                    "data": {
                        "fecha": "2023-08-05"
                    }


                }
                let myRestletResponse = https.requestRestlet({
                    body: JSON.stringify(DatosRuc ),
                    deploymentId: 'customdeploy_ts_consultatipocambio',
                    scriptId: 'customscript_ts_consultatipocambio',
                    headers: myRestletHeaders,
                });
                let response = myRestletResponse.body;

                return response;
            },

        });
    });