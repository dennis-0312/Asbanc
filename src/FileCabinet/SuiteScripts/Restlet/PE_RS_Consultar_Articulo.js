/**
*@NApiVersion 2.1
*@NScriptType Restlet
* Task                                        Date            Author                                                      Remarks
* INTEGRACIÓN E–COMMERCE HACIA NETSUITE       13 set 2023     Giovana Guadalupe <giovana.guadalupe@myevol.biz>            CONSULTA DE REGISTRO DE ARTICULOS 
* 
*/

define(['N/log','N/record','N/search'],function(log,record,search) {

 
  function _get(context) {

      return true;

  }


  function _post(context) {
    log.debug('Entro', JSON.stringify(context))
    return "Entro";
    

  }


  return {

      get: _get,

      post: _post

  }

});