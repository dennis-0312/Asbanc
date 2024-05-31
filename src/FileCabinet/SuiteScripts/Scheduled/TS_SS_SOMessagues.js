/**
*@NApiVersion 2.1
*@NScriptType ScheduledScript
*
* Task          Date            Author                                         Remarks
* GAP 94        22 Jun 2023     Alexander Ruesta <aruesta@myevol.biz>          - Envia correos 1, 2 y 3 meses antes del End Date en las SO.
*
*/


 define(['N/search','N/runtime', '../Library/TS_LIB_Email.js', "../Library/TS_LIB_Data.js", "N/format"], (search, runtime, libEmail, libData, format) => {
    const execute = (context) => {
        const FN = 'execute';
        try {
           
            let dateToday2 = new Date(),
                EMPLOYID = new Array(),
                GLOBAL = {},
                addMonth = 1,
                role = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_ss_somessagues_rol' });
                

              
                let customSearch = search.load({
                    id: 'customsearch_ts_date' // ASB Cotizacion
                });
                let result = customSearch.run().getRange({ start: 0, end: 1 });
                let dateTodayAux = result[0].getValue(customSearch.columns[0]);

                var dateToday = format.parse({
                    type: format.Type.DATE,
                    value: dateTodayAux

                });

            EMPLOYID = libData.getUserRoles(role);
            log.error('dateToday',dateToday);
            for(var i = 0; i < 3; i ++){
                let aux = (i + 1) + ' month';
                dateToday.setMonth(dateToday.getMonth() + addMonth);
                GLOBAL[aux]= getSearch(dateToday, i);
            }

            log.error('GLOBAL', GLOBAL)
            GLOBAL['1 month'].forEach(function(transaction){
                let subject = 'Contrato por vencer - Urgente ' + transaction.month + ' mes',
                    body = 'Se tiene la Orden de Servicio ' + transaction.tranid + ' próxima a vencer.';
                libEmail.sendEmail(transaction.salesrep, subject, body);
                EMPLOYID.forEach(function(employees){
                    libEmail.sendEmail(employees.id, subject, body);
                })
            });

            GLOBAL['2 month'].forEach(function(transaction){
                let subject = 'Contrato por vencer - Urgente ' + transaction.month + ' meses',
                    body = 'Se tiene la Orden de Servicio ' + transaction.tranid + ' próxima a vencer.';
                libEmail.sendEmail(transaction.salesrep, subject, body);
                EMPLOYID.forEach(function(employees){
                    libEmail.sendEmail(employees.id, subject, body);
                })
            });

            GLOBAL['3 month'].forEach(function(transaction){
                let subject = 'Contrato por vencer - Urgente ' + transaction.month + ' meses',
                    body = 'Se tiene la Orden de Servicio ' + transaction.tranid + ' próxima a vencer.';
                libEmail.sendEmail(transaction.salesrep, subject, body);
                EMPLOYID.forEach(function(employees){
                    libEmail.sendEmail(employees.id, subject, body);
                })
            });
           
        } catch (e) {
            log.error({
                title: `${FN} error`,
                details: { message: `${FN} - ${e.message || `Unexpected error`}` },
            });
            throw { message: `${FN} - ${e.message || `Unexpected error`}` };
        }
    };

    const getSearch = (paramDate, paramMonth) => {
        let returnData = new Array (),
            formatDate = libData.getFormatDate(paramDate);
        log.error('formatDate',formatDate)
        let transactionSearchObj = search.create({
            type: "transaction",
            filters:
            [
                ["type","anyof","SalesOrd"], 
                "AND", 
                ["formulatext: CASE WHEN TO_CHAR({enddate},'DD/MM/YYYY') = '" + formatDate + "' THEN 1 ELSE 0 END","is","1"]
            ],
            columns:
            [
                search.createColumn({name: "internalid",summary: "GROUP"}),
                search.createColumn({name: "tranid",summary: "GROUP"}),
                search.createColumn({name: "salesrep",join: "customerMain",summary: "GROUP"}),
                search.createColumn({name: "enddate",summary: "GROUP"})
            ]
         });
    
        let pagedData = transactionSearchObj.runPaged({
            pageSize : 1000
        });
    
        let page, columns;
    
        pagedData.pageRanges.forEach(function(pageRange) {
            page = pagedData.fetch({
                index : pageRange.index
            });
    
            page.data.forEach(function(result) {
                columns = result.columns;
    
                let column0 = result.getValue(columns[0]),
                    column1 = result.getValue(columns[1]),
                    column2 = result.getValue(columns[2]),
                    column3 = result.getValue(columns[3]);
                
                    returnData.push({
                    'idso': column0,
                    'tranid': column1,
                    'salesrep': column2,
                    'enddate': column3,
                    'month': paramMonth + 1
                });
            });

        });
        
        return returnData;
    }

    return {
        execute: execute,
    }
});