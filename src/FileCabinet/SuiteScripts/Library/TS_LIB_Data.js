/**
 * @NApiVersion 2.1
* @NModuleScope Public
 *
 * Task          Date            Author                                         Remarks
 * GAP 81        16 Jun 2023     Alexander Ruesta <aruesta@myevol.biz>          - Creación del botón GENERAR PROYECTO
 *
 */
define(['N/record', 'N/url', 'N/search', 'N/currentRecord'], (record, url, search, currentRecord) => {

    const pageInit = (context) => { }

    const generateTransaction = (internalID, recordType, transaction) => {
        const FN = 'generateTransaction';
        try {
            if(transaction == 'job'){

                let refTransaction = record.load({ 
                    type: recordType, 
                    id: internalID, 
                    isDynamic: false 
                });

                let subsidiary = refTransaction.getValue('subsidiary'),
                    tranID = refTransaction.getValue('tranid'),
                    customer = refTransaction.getValue('entity'),
                    customerName = refTransaction.getText('entity'),
                    department = refTransaction.getValue('department'),
                    classification = refTransaction.getValue('class'),
                    correlative = refTransaction.getValue('custbody_asb_correlativo');

                for (var i = 0; i < 1; i++) {
                    var itemID = refTransaction.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });

                    var itemName = refTransaction.getSublistText({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });
                }

                let objRecord = record.create({
                    type: transaction,
                    isDynamic: true
                });

                objRecord.setValue({ fieldId: 'subsidiary', value: subsidiary });
                objRecord.setValue({ fieldId: 'projectexpensetype', value: -2 });
                objRecord.setValue({ fieldId: 'custentity_asb_internal_jobid', value: tranID +  ' - ' + correlative });
                objRecord.setValue({ fieldId: 'companyname', value: (customerName + ' - ' + itemName).substring(0,83)});
                objRecord.setValue({ fieldId: 'parent', value: customer});
                objRecord.setValue({ fieldId: 'custentity_pc_dept', value: department});
                objRecord.setValue({ fieldId: 'custentity_pc_class', value: classification});
                objRecord.setValue({ fieldId: 'custentity_asb_articulo_venta', value: itemID});
                objRecord.setValue({ fieldId: 'custentity_asb_cod_articulo_venta', value: itemID});
                objRecord.setValue({ fieldId: 'custentity_asb_estado_generico', value: 1});
                objRecord.setValue({ fieldId: 'custentity_asb_estado_det_n1', value: 1});
                objRecord.setValue({ fieldId: 'custentity_asb_creado_desde', value: internalID});
                
                let transactionID = objRecord.save({
                    ignoreMandatoryFields: false
                });

                record.submitFields({
                    type: record.Type.SALES_ORDER,
                    id: internalID,
                    values: {
                        'custbody_asb_correlativo': correlative + 1
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });

                var host = url.resolveDomain({
                    hostType: url.HostType.APPLICATION
                });

                var relativePath = url.resolveRecord({
                    recordType: transaction,
                    recordId: transactionID,
                    isEditMode: false
                });

                window.open('https://'+ host + relativePath, '_blank');
          
            }
            
        } catch (e) {
            log.error({
                title: `${FN} error`,
                details: { message: `${FN} - ${e.message || `Unexpected error`}` },
            });
            throw { message: `${FN} - ${e.message || `Unexpected error`}` };
        }
    };

    const getUserRoles = (role) => {
        let EMPLOYID = new Array();

        let employeeSearch = search.create({
            type: 'employee',
            columns: ['internalid'],
            filters: ['role', 'is', role]
        });

        let resultEmployee = employeeSearch.run().getRange(0, 1000);
        
        if (resultEmployee.length != 0) {
            for (var i in resultEmployee) {
                let employeeID = resultEmployee[i].getValue({ name: 'internalid' });
                EMPLOYID.push({
                    'id': employeeID
                });
            }
            
        }

        return EMPLOYID;
    }

    const getFormatDate = (paramDate) => {
        let dayDate = paramDate.getDate(),
            monthDate = paramDate.getMonth() + 1,
            yearDate = paramDate.getFullYear();
    
        if (('' + dayDate).length == 1) {
            dayDate = '0' + dayDate;
        }

        if (('' + monthDate).length == 1) {
            monthDate = '0' + monthDate;
        }

       return dayDate +'/' + monthDate + '/' + yearDate;
    }

    return {
        pageInit: pageInit,
        generateTransaction: generateTransaction,
        getUserRoles: getUserRoles,
        getFormatDate: getFormatDate
    };

});