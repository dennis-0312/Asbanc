/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log'], function(log) {

    function _get(context) {
        log.debug({
            title: 'Debug Entry',
            details: 'Hola Mundo - Mi Log'
        });
        return 'Hola Mundo - Misaki';
    }

    function _post(context) {
        
    }

    function _put(context) {
        
    }

    function _delete(context) {
        
    }

    return {
        get: _get,
        post: _post,
        put: _put,
        delete: _delete
    }
});
