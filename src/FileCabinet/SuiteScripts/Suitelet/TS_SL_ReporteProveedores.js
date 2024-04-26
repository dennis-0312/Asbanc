/**
* @NApiVersion 2.1
* @NScriptType Suitelet
* @NModuleScope Public
*
* Task          Date            Author                                         Remarks
* GAP 97        13 Ago 2023     Alexander Ruesta <aruesta@myevol.biz>          - Crear reporte de proveedores.
*
*/


define(['N/ui/serverWidget','N/runtime', 'N/file', 'N/search', 'N/redirect', 'N/record', 'N/config', 'N/url', 'N/encode', '../Library/TS_LIB_ControlPresupuestal.js' ],  (serverWidget, runtime, file, search, redirect, record, config, url, encode, libCP) => {

    const onRequest = (context) => {
        let suitelet = context.request.parameters.suitelet;
        log.debug('suitelet',suitelet )
        if(suitelet == null){
            main(context)
        }else{
            report[suitelet](context)
        }
    }
    
    const main = (context) => {
        let FN = 'Reporte Comparativo de Proveedores',
            nameReport = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_sl_repproveedores_title' });
       
        try{
            if (context.request.method == 'GET') {
                let to = context.request.parameters.custpage_to,
                    from = context.request.parameters.custpage_from,
                    opening = context.request.parameters.custpage_opening, 
                    closing = context.request.parameters.custpage_closing,
                    subsidiary =  context.request.parameters.custpage_subsidiary,
                    script = context.request.parameters.script || context.request.parameters.custpage_script,
                    deploy = context.request.parameters.deploy || context.request.parameters.custpage_deploy;


                let form = serverWidget.createForm(nameReport);
                
                form.addSubmitButton("Guardar");
                
                form.addButton({
                    id : 'custpage_excel',
                    label: 'Imprimir',
                });

                let groupFilter = form.addFieldGroup({
                    id: 'custpage_filters',
                    label: 'Filters',
                });
                
                let fromField = form.addField({
                    id: 'custpage_from',
                    label: 'DESDE:',
                    type: 'date'.toUpperCase(),
                    container: 'custpage_filters'
                });
                fromField.defaultValue = from;

                let toField = form.addField({
                    id: 'custpage_to',
                    label: 'HASTA:',
                    type: 'date'.toUpperCase(),
                    container: 'custpage_filters'
                  });
               
                toField.defaultValue = to;
               
                let openingField = form.addField({
                    id: 'custpage_opening',
                    label: 'APERTURA:',
                    type: 'date'.toUpperCase(),
                    container: 'custpage_filters'
                });
                
                openingField.defaultValue = opening;

                let closingField = form.addField({
                    id: 'custpage_closing',
                    label: 'CIERRE:',
                    type: 'date'.toUpperCase(),
                    container: 'custpage_filters'
                  });
               
                closingField.defaultValue = closing;

                let subField = form.addField({
                    id: 'custpage_subsidiary',
                    label: 'Subdidiaria:',
                    type: 'select'.toUpperCase(),
                    source: 'subsidiary',
                    container: 'custpage_filters'
                  });
                subField.defaultValue = subsidiary;

                let filterField = form.addField({
                    id: 'custpage_filters',
                    label: 'Filters',
                    type: 'text'.toUpperCase(),
                    container: 'custpage_filters'
                });
                filterField.defaultValue = 'custpage_from,custpage_to,custpage_opening,custpage_closing,custpage_subsidiary';
                filterField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                let scriptField = form.addField({
                    id: 'custpage_script',
                    label: 'Script',
                    type: 'text'.toUpperCase()
                });
                scriptField.defaultValue = script;
                scriptField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                let deployField = form.addField({
                    id: 'custpage_deploy',
                    label: 'Deploy',
                    type: 'text'.toUpperCase()
                });
                deployField.defaultValue = deploy;
                deployField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                form.addTab({
                    id : 'custpage_report',
                    label : 'Report'
                });

                form.addFieldGroup({
                    id: 'custpage_report_group',
                    label: 'Report',
                    tab: 'custpage_report'
                });

                let htmlLibs = form.addField({
                    id: 'custpage_htmllibs',
                    label: 'LIBS',
                    type: 'inlinehtml'.toUpperCase(),
                    container: 'custpage_report_group'
                });

                let htmlReport = form.addField({
                    id: 'custpage_htmlreport',
                    label: 'REPORT',
                    type: 'inlinehtml'.toUpperCase(),
                    container: 'custpage_report_group'
                });

                htmlReport.updateLayoutType({
                    layoutType : serverWidget.FieldLayoutType.OUTSIDE
                })
               
                htmlReport.defaultValue = "...";
        
                var libFiles = getFiles(context);
                var htmlLibrary = filesHtml(libFiles);
                log.debug('Mirame', htmlLibrary)
                htmlLibs.defaultValue = htmlLibrary;

                context.response.writePage(form);
                    
            }
            if (context.request.method == 'POST') {
                redirect.toSuitelet({
                    scriptId: "customscript_ts_sl_repproveedores",
                    deploymentId: "customdeploy_ts_sl_repproveedores",
                    parameters: {
                        'custpage_to' : context.request.parameters.custpage_to,
                        'custpage_from' : context.request.parameters.custpage_from,
                        'custpage_opening' : context.request.parameters.custpage_opening, 
                        'custpage_closing' : context.request.parameters.custpage_closing,
                        'custpage_subsidiary' : context.request.parameters.custpage_subsidiary
                    }
                })
            }

        }catch(e){
            log.error({
                title: `${FN} error`,
                details: { message: `${FN} - ${e.message || `Unexpected error`}` },
            });
            throw { message: `${FN} - ${e.message || `Unexpected error`}` };
        }
    }

    const report = () => { }
    
    report.getRequest = function (context) {
        let FN = 'Report Get Request';
           
        let to = context.request.parameters.custpage_to,
            from = context.request.parameters.custpage_from,
            opening = context.request.parameters.custpage_opening, 
            closing = context.request.parameters.custpage_closing,
            subsidiary = context.request.parameters.custpage_subsidiary,
            jsonResult = context.request.parameters.custpage_data,
            thread = context.request.parameters.thread,
            arrResult = [],
            script = context.request.parameters.script || context.request.parameters.custpage_script,
            deploy = context.request.parameters.deploy || context.request.parameters.custpage_deploy;         
            /*fromPeriod = getAllPeriodFields(from),
            toPeriod = getAllPeriodFields(to),
            openingPeriod = getAllPeriodFields(opening),
            closingPeriod = getAllPeriodFields(closing);*/

        if(jsonResult == null){
            jsonResult = {}
        }else{
            jsonResult = JSON.parse(jsonResult)
        }
        let arrAux = [];
        let resultsNumber = 1000,
            end = resultsNumber*thread,
            start = end-resultsNumber; 
    
        let savedSearch = search.load({
            id: 'customsearch_asb_cotizacion'
        });
        log.debug('Filtros pre', subsidiary + '-> ' + from + ' -> ' + to + ' -> ' + opening + ' -> ' + closing)
        
        if(to != '' && to != null){
            savedSearch.filters.push(search.createFilter({
                name: 'trandate',
                operator: search.Operator.ONORBEFORE,
                values: to
            }))
        }
       
        if(from != '' && from != null){
            savedSearch.filters.push(search.createFilter({
                name: 'trandate',
                operator: search.Operator.ONORAFTER,
                values: from
            }))
        }
        
        if(closing != '' && closing != null){
            savedSearch.filters.push(search.createFilter({
                name: 'bidclosedate',
                operator: search.Operator.ONORBEFORE,
                values: closing
            }))
        }
        
        if(opening != '' && opening != null){
            savedSearch.filters.push(search.createFilter({
                name: 'bidopendate',
                operator: search.Operator.ONORAFTER,
                values: opening
            }))
        }
        

        if(subsidiary!='' && subsidiary!=null){
            savedSearch.filters.push(search.createFilter({
                name: 'subsidiary',
                operator: search.Operator.ANYOF,
                values: subsidiary
            }))
        }
        
        let searchResult = savedSearch.run().getRange({
            start: start,
            end: end
        });

        searchResult.forEach(function(result) {
            arrAux.push(result.getValue({name: 'internalid', summary: "GROUP"}) + '///' + result.getValue({name: 'tranid', summary: "GROUP"}));
            
        })
        
        arrAux.forEach(function (line){
            let idTran = line.split('///');
                
            let transaction = record.load({
                type: 'requestforquote', 
                id: idTran[0], 
                isDynamic: true
            })

            let numLines = transaction.getLineCount({
                sublistId: 'vendor'
            });     
            log.debug('numLines', numLines)
            for(let i= 0; i< numLines; i++){
                let rpta = transaction.getSublistValue({
                    sublistId: 'vendor',
                    fieldId: 'responsedoc',
                    line: i
                })

                if(rpta != 0){
                    let jsonAux = {
                        "internalID":  idTran[0],
                        "tranID":  idTran[1],
                        "rpt":  rpta
                    
                    }
                    arrResult.push(jsonAux);
                }
            }
        })
        
        log.debug('Json Final', arrResult)

        context.response.write(JSON.stringify(arrResult));

      
    }

    report.getRpt = function (context) {
        let FN = 'Report Get Request';
           
        let to = context.request.parameters.custpage_to,
            from = context.request.parameters.custpage_from,
            opening = context.request.parameters.custpage_opening, 
            closing = context.request.parameters.custpage_closing,
            subsidiary = context.request.parameters.subsidiary,
            jsonResult = context.request.parameters.custpage_data,
            thread = context.request.parameters.thread,
            arrResult = [],
            script = context.request.parameters.script || context.request.parameters.custpage_script,
            deploy = context.request.parameters.deploy || context.request.parameters.custpage_deploy;


        if(jsonResult == null){
            jsonResult = {}
        }else{
            jsonResult = JSON.parse(jsonResult)
        }

        let resultsNumber = 1000,
            end = resultsNumber*thread,
            start = end-resultsNumber; 
    
        let savedSearch = search.load({
            id: 'customsearch_asb_rpta_cotizacion' // ASB Respuesta Cotizacion
        });

        /*savedSearch.filters.push(search.createFilter({
            name: 'trandate',
            operator: search.Operator.ONORBEFORE,
            values: to
        }))

        savedSearch.filters.push(search.createFilter({
            name: 'trandate',
            operator: search.Operator.ONORAFTER,
            values: from
        }))*/

        if(subsidiary!='' && subsidiary!=null){
            savedSearch.filters.push(search.createFilter({
                name: 'subsidiary',
                operator: search.Operator.ANYOF,
                values: subsidiary
            }))
        }
        
        let searchResult = savedSearch.run().getRange({
            start: start,
            end: end
        });

        searchResult.forEach(function(result) {
            let jsonAuxiliar = {
                "internalID": result.getValue({name: 'internalid'}),
                "tranID": result.getValue({name: 'tranid'}),
                "vendorID": result.getValue({ name: "entityid", join: "vendor"}),
                "item": result.getValue({name: 'item'}),
                "itemName": result.getText({name: 'item'}),
                "cantidad": result.getValue({name: "fromquantity", join: "itemPricing",}),
                "precio": result.getValue({ name: "rateorlotprice", join: "itemPricing",}),
                "payment": result.getText({name: 'terms'}),
                //"comentary": result.getText({name: 'memomain'})
                    
            };
            arrResult.push(jsonAuxiliar);
            
        })
        
        log.debug('Json Final', arrResult)

        context.response.write(JSON.stringify(arrResult));

      
    }

    const getAllPeriodFields = (paramID) =>{
        let title = 'getAllPeriodFields';
        var result = {}
        try {
            result = search.lookupFields({
                type: search.Type.ACCOUNTING_PERIOD,
                id: paramID,
                columns: ['startdate', 'enddate']
            });	
    
        } catch (e) {
            log.debug('ERROR' + title, e);
        }
        log.debug('result',result)
        return result;
    }

    const getFiles = (context) => {
        let title = 'getFiles',
            libraryPath = "../Library/",
            result = new Array(),
            FILES = new Array();
        try {
            FILES.push({
                lib: 'jquery',
                name: 'TS_LIB_Treetable.js',
                type: 'js'
            })
            // files.push({
            //     lib: 'jquery',
            //     name: 'kis_reportes_lib_jquery_treetable.css',
            //     type: 'css'
            // })
            FILES.push({
                lib: 'currency format',
                name: 'TS_LIB_CurrencyFormat.js',
                type: 'js'
            })
            FILES.push({
                lib: 'alasql',
                name: 'TS_LIB_Alasql.js',
                type: 'js'
            })
            FILES.push({
                lib: 'datatables',
                name: 'TS_LIB_Reporteador.css',
                type: 'css'
            })
            FILES.push({
                lib: 'datatables',
                name: 'TS_LIB_ReporteProveedores.js',
                type: 'js'
            })
    
            FILES.forEach(function(libFile){
                let loadFile = file.load(libraryPath + libFile.name),
                    path = loadFile.url;

                result.push({
                    url: path,
                    type: libFile.type,
                    name: libFile.lib,
                })

            });
        } catch (e) {
           log.debug('Error', e)
        }
        return result;
    }

    const filesHtml = (files) => {
        let html = '';
        files.forEach(function(file){
            html += '<!-- ' + file.name + ' -->';

            if (file.type == 'js') {
                html += '<script src="' + file.url + '"></script>';
            }

            if (file.type == 'css') {
                html += '<link rel="stylesheet" title="' + file.name + '" href="' + file.url + '">';
            }
        })
        return html;
    }

    return {
        onRequest: onRequest
    };

})