/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define(['N/log','N/record','N/search'], function(log,record,search) {

   
    
    function _post(context) {
        try {
            var newlead = record.create({type: 'customer', isDynamic: true});
            newlead.setValue({fieldId: 'isperson',value:context.Tipo});
            if(context.Tipo=='T'){
                newlead.setValue({fieldId: 'firstname',value:context.firstname});
                newlead.setValue({fieldId: 'lastname',value:context.lastname});
            }else{
                newlead.setValue({fieldId: 'companyname',value:context.firstname});

            }
            newlead.setValue({fieldId: 'currency',value:context.Moneda});
            newlead.setValue({fieldId: 'entitystatus',value:context.EstadoCliente});
            newlead.setValue({fieldId: 'subsidiary',value:context.Subsidiaria});
            /*newlead.setValue({fieldId: 'email',value:context.Correo});
            newlead.setValue({fieldId: 'phone',value:context.Telefono});
            newlead.setValue({fieldId: 'mobilephone',value:context.Movil});
            newlead.setValue({fieldId: 'mobilephone',value:context.Movil});*/
            var billId = newlead.save({ enableSourcing: true,
                ignoreMandatoryFields: true});
          
            return  {
                codResp:'00',
                descResp :'Procesado correctamente',
                customer : billId
            };
       } catch (error) {
            log.error('Error-POST', error);
            return  {
                codResp:'99',
                descResp : error.message
            };
          
        } 
    }

    

    return {
       
        post: _post
       
    }
});
