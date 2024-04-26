/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(["N/log",], function(log) {

    function onRequest(context) {
        log.debug(1);
    }

    return {
        onRequest: onRequest
    }
});
