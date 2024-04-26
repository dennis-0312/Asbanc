/**
* @NApiVersion 2.1
* @NScriptType Suitelet
* @NModuleScope Public
*
* Task          Date            Author                                         Remarks
* GAP 47        28 Jun 2023     Alexander Ruesta <aruesta@myevol.biz>          - Crear vista al Estado de Resultado Gerencial.
*
*/

define(['N/ui/serverWidget','N/runtime', 'N/file', 'N/search', 'N/redirect', 'N/record', 'N/config', 'N/url', 'N/file'],  (serverWidget, runtime, file, search, redirect, record, config, url, fileModulo) => {

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
        let FN = 'Report Generator',
            nameReport = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_sl_estadoresultado_title' });
       
        try{
            if (context.request.method == 'GET') {
                let from = context.request.parameters.custpage_from,
                    to = context.request.parameters.custpage_to,
                    subsidiary = context.request.parameters.custpage_subsidiary,
                    dataPrint = context.request.parameters.custpage_data,
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
                    label: '<a class="group_spoiler"><img class="rptcollapser" width="11px" height="11px" src="/images/forms/minus.svg" ></a> Filters',
                  });
                  //groupFilter.setShowBorder = false;
                
                let fromField = form.addField({
                    id: 'custpage_from',
                    label: 'DESDE:',
                    type: 'select'.toUpperCase(),
                    source: 'accountingperiod',
                    container: 'custpage_filters'
                  });
                fromField.defaultValue = from;
                fromField.isMandatory = true;

                let toField = form.addField({
                    id: 'custpage_to',
                    label: 'HASTA:',
                    type: 'select'.toUpperCase(),
                    source: 'accountingperiod',
                    container: 'custpage_filters'
                  });
                toField.defaultValue = to;
                toField.isMandatory = true;

                let subField = form.addField({
                    id: 'custpage_subsidiary',
                    label: 'Subdidiaria:',
                    type: 'select'.toUpperCase(),
                    source: 'subsidiary',
                    container: 'custpage_filters'
                  });
                subField.defaultValue = subsidiary;
                subField.isMandatory = true;
               
                let reportField = form.addField({
                    id: 'custpage_reportype',
                    label: 'Mapeo',
                    type: 'text'.toUpperCase()
                });
                reportField.defaultValue = nameReport;
                reportField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                let filterField = form.addField({
                    id: 'custpage_filters',
                    label: 'Filters',
                    type: 'text'.toUpperCase(),
                    container: 'custpage_filters'
                });
                filterField.defaultValue = 'custpage_from,custpage_to,custpage_subsidiary';
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
                log.debug('post')
                redirect.toSuitelet({
                    scriptId: "customscript_ts_sl_estadoresultado",
                    deploymentId: "customdeploy_ts_sl_estadoresultado",
                    parameters: {
                        'custpage_subsidiary': context.request.parameters.custpage_subsidiary,
                        'custpage_from': context.request.parameters.custpage_from,
                        'custpage_to': context.request.parameters.custpage_to,
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

    report.getTransactions = function (context) {
        let FN = 'Report Get Transaction';
           
        let from = context.request.parameters.custpage_from,
            to = context.request.parameters.custpage_to,
            subsidiary = context.request.parameters.custpage_subsidiary,
            script = context.request.parameters.script || context.request.parameters.custpage_script,
            deploy = context.request.parameters.deploy || context.request.parameters.custpage_deploy,
            thread = context.request.parameters.thread,
            jsonResult = context.request.parameters.json,
            fromPeriod = getAllPeriodFields(from),
            toPeriod = getAllPeriodFields(to);

        if(jsonResult == null){
            jsonResult = {}
        }else{
            jsonResult = JSON.parse(jsonResult)
        }
        let resultsNumber = 1000,
            end = resultsNumber*thread,
            start = end-resultsNumber; 
    
        let savedSearch = search.load({
            id: 'customsearch_asb_estado_gerencial_info'
        });

        savedSearch.filters.push(search.createFilter({
            name: 'trandate',
            operator: search.Operator.ONORBEFORE,
            values: toPeriod.enddate
        }))

        savedSearch.filters.push(search.createFilter({
            name: 'trandate',
            operator: search.Operator.ONORAFTER,
            values: fromPeriod.startdate
        }))
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
                let jsonKey = result.getValue({name: 'account'}) + '_' +result.getValue({name: 'departmentnohierarchy'});
            if(!jsonResult[jsonKey]){
                jsonResult[jsonKey] = [{
                    "Account": result.getValue({name: 'account'}),
                    "AccountName": result.getText({name: 'account'}),
                    "Deparment": result.getValue({name: 'departmentnohierarchy'}),
                    "DeparmentName": result.getText({name: 'departmentnohierarchy'}),
                    "N1": result.getText({name: "custrecord_asb_dept_n1", join: "department"}),
                    "N2": result.getText({name: "custrecord_asb_dept_n2", join: "department"}),
                    "SO": result.getValue({name: 'formulatext'}),
                    "NDocument": result.getValue({name: 'tranid'}),
                    "Date": result.getValue({name: 'trandate'}),
                    "Amount": result.getValue({name: 'formulanumeric'}),
                    "EnlaceCuenta":  result.getValue({name: "custrecord_asb_account_n5", join: "account"})
                }];
            }else{
                jsonResult[jsonKey].push({
                    "Account": result.getValue({name: 'account'}),
                    "AccountName": result.getText({name: 'account'}),
                    "Deparment": result.getValue({name: 'departmentnohierarchy'}),
                    "DeparmentName": result.getText({name: 'departmentnohierarchy'}),
                    "N1": result.getText({name: "custrecord_asb_dept_n1", join: "department"}),
                    "N2": result.getText({name: "custrecord_asb_dept_n2", join: "department"}),
                    "SO": result.getValue({name: 'formulatext'}),
                    "NDocument": result.getValue({name: 'tranid'}),
                    "Date": result.getValue({name: 'trandate'}),
                    "Amount": result.getValue({name: 'formulanumeric'}),
                    "EnlaceCuenta":  result.getValue({name: "custrecord_asb_account_n5", join: "account"})
                });
            }
        })
        log.debug('Tamaño ' + FN, searchResult.length)
        log.debug('Json Final', JSON.stringify(jsonResult))
        if(searchResult.length == 0){
            context.response.write(JSON.stringify({}));
        }else{
            context.response.write(JSON.stringify(jsonResult));
        }
    }

    report.getRecordOne = function (context) {
        let FN = 'Report Get Record One';
        
        try{
            let from = context.request.parameters.custpage_from,
                to = context.request.parameters.custpage_to,
                subsidiary = context.request.parameters.custpage_subsidiary,
                script = context.request.parameters.script || context.request.parameters.custpage_script,
                deploy = context.request.parameters.deploy || context.request.parameters.custpage_deploy,
                thread = context.request.parameters.thread,
                jsonResult = context.request.parameters.json;
            if(jsonResult == null){
                jsonResult = {}
            }
            let resultsNumber = 1000,
                end = resultsNumber*thread,
                start = end-resultsNumber; 

            let savedSearch = search.load({
                id: 'customsearch_asb_distr_1_er'
            });

            let searchResult = savedSearch.run().getRange({
                start: start,
                end: end
            })
            searchResult.forEach(function(result) {
              
                let jsonKey = result.getValue({name: 'custrecord_asb_cuenta_er'}) + '_' +result.getValue({name: 'custrecord_asb_dept_origen_er'});
                let jsonAux_1 = {
                    "DeparmentDest": result.getValue({name: 'custrecord_asb_dept_destino_er'}),
                    "DeparmentDestName": result.getText({name: 'custrecord_asb_dept_destino_er'}),
                    "Percentage": result.getValue({name: 'formulanumeric'})
                }
                let jsonAux_2 = {
                    "DateInit":  result.getValue({name: 'custrecord_asb_fecha_inicio_er'}),
                    "DateFin":  result.getValue({name: 'custrecord_asb_fecha_fin_er'}),
                    "Destination": [jsonAux_1]
                }

                if(!jsonResult[jsonKey]){
                    jsonResult[jsonKey] = {
                        "Account": result.getValue({name: 'custrecord_asb_cuenta_er'}),
                        "AccountName": result.getText({name: 'custrecord_asb_cuenta_er'}),
                        "Deparment": result.getValue({name: 'custrecord_asb_dept_origen_er'}),
                        "DeparmentName": result.getText({name: 'custrecord_asb_dept_origen_er'}),
                        "Range": [jsonAux_2]
                    };
                }else{
                    let jsonAux_3 = jsonResult[jsonKey]["Range"],
                        flag = true;
                    for(let i= 0; i < jsonAux_3.length ; i++){
                         if( jsonAux_3[i]["DateInit"] == jsonAux_2["DateInit"] &&  jsonAux_3[i]["DateFin"] == jsonAux_2["DateFin"]){
                            jsonResult[jsonKey]["Range"][i]["Destination"].push(jsonAux_1);
                            flag = false;
                            break;
                        }
                    }
                    if(flag){
                        jsonResult[jsonKey]["Range"].push(jsonAux_2);
                    }
                }
            })
            
            if(searchResult.length == 0){
                context.response.write(JSON.stringify({}));
            }else{
                context.response.write(JSON.stringify(jsonResult));
            }
        }catch(e){
            log.error('[ Get Input Data Error ]', e);
        }
    }

    
    report.getRecordTwo = function (context) {
        let FN = 'Report Get Record Two';
        
        try{
            let from = context.request.parameters.custpage_from,
                to = context.request.parameters.custpage_to,
                subsidiary = context.request.parameters.custpage_subsidiary,
                script = context.request.parameters.script || context.request.parameters.custpage_script,
                deploy = context.request.parameters.deploy || context.request.parameters.custpage_deploy,
                thread = context.request.parameters.thread,
                jsonResult = context.request.parameters.json;
            if(jsonResult == null){
                jsonResult = {}
            }
            let resultsNumber = 1000,
                end = resultsNumber*thread,
                start = end-resultsNumber; 

            let savedSearch = search.load({
                id: 'customsearch_asb_distr_2_er'
            });

            let searchResult = savedSearch.run().getRange({
                start: start,
                end: end
            })
            searchResult.forEach(function(result) {
                let flag = false;
                let jsonKey = result.getValue({name: 'custrecord_asb_dept_origen_er2'});
                let jsonAux_1 = {
                    "DeparmentDest": result.getValue({name: 'custrecord_asb_dept_destino_er2'}),
                    "DeparmentDestName": result.getText({name: 'custrecord_asb_dept_destino_er2'}),
                    "Percentage": result.getValue({name: 'formulanumeric'}),
                    "N1": result.getText({name: "custrecord_asb_dept_n1", join: "custrecord_asb_dept_destino_er2"}),
                    "N2": result.getText({name: "custrecord_asb_dept_n2", join: "custrecord_asb_dept_destino_er2"}),
                    "N3": result.getText({name: "custrecord_asb_dept_n3", join: "custrecord_asb_dept_destino_er2"}),
                    "N4": result.getText({name: "custrecord_asb_dept_n4", join: "custrecord_asb_dept_destino_er2"}),
                    "N5": result.getText({name: "custrecord_asb_dept_n5", join: "custrecord_asb_dept_destino_er2"}),
                }
                let jsonAux_2 = {
                    "DateInit":  result.getValue({name: 'custrecord_asb_fecha_inicio_er2'}),
                    "DateFin":  result.getValue({name: 'custrecord_asb_fecha_fin_er2'}),
                    "Destination": [jsonAux_1]
                }

                if(!jsonResult[jsonKey]){
                    jsonResult[jsonKey] = {
                        "Deparment": result.getValue({name: 'custrecord_asb_dept_origen_er2'}),
                        "DeparmentName": result.getText({name: 'custrecord_asb_dept_origen_er2'}),
                        "Range": [jsonAux_2]
                    };
                }else{
                    let jsonAux_3 = jsonResult[jsonKey]["Range"];
                    for(let i= 0; i < jsonAux_3.length ; i++){
                         if( jsonAux_3[i]["DateInit"] == jsonAux_2["DateInit"] &&  jsonAux_3[i]["DateFin"] == jsonAux_2["DateFin"]){
                            jsonResult[jsonKey]["Range"][i]["Destination"].push(jsonAux_1);
                            flag = true;
                            break;
                        }
                    }
                    if(!flag){
                        jsonResult[jsonKey]["Range"].push(jsonAux_2);
                    }
               
                }
            })
            log.debug('resultado', JSON.stringify(jsonResult))
            if(searchResult.length == 0){
                context.response.write(JSON.stringify({}));
            }else{
                context.response.write(JSON.stringify(jsonResult));
            }
        }catch(e){
            log.error('[ Get Input Data Error ]', e);
        }
    }

    report.getAccount = function (context) {
        let FN = 'Report Get Account';
        
        try{
            let from = context.request.parameters.custpage_from,
            to = context.request.parameters.custpage_to,
            subsidiary = context.request.parameters.custpage_subsidiary,
            script = context.request.parameters.script || context.request.parameters.custpage_script,
            deploy = context.request.parameters.deploy || context.request.parameters.custpage_deploy,
            thread = context.request.parameters.thread,
            jsonResult = context.request.parameters.json, 
            fromPeriod = getAllPeriodFields(from),
            toPeriod = getAllPeriodFields(to);;

            if(jsonResult == null){
                jsonResult = {}
            }else{
                jsonResult = JSON.parse(jsonResult)
            }
            let resultsNumber = 1000,
                end = resultsNumber*thread,
                start = end-resultsNumber; 
        
            let savedSearch = search.create({
                type: "transaction",
                filters:
                [
                   ["mainline","is","F"], 
                   "AND", 
                   ["posting","is","T"], 
                   "AND", 
                   ["voided","is","F"], 
                   "AND", 
                   ["memorized","is","F"], 
                   "AND", 
                   ["department","noneof","@NONE@"],
                   "AND", 
                   ["account.custrecord_asb_account_n3","noneof","@NONE@"],
                   "AND", 
                   ["account.custrecord_asb_account_n4","noneof","@NONE@"],
                   "AND", 
                   ["account.custrecord_asb_account_n5","noneof","@NONE@"]

                ],
                columns:
                [
                   search.createColumn({
                      name: "custrecord_asb_account_n3",
                      join: "account",
                      summary: "GROUP",
                      sort: search.Sort.ASC,
                      label: "N3"
                   }),
                   search.createColumn({
                      name: "custrecord_asb_account_n4",
                      join: "account",
                      summary: "GROUP",
                      label: "N4"
                   }),
                   search.createColumn({
                      name: "custrecord_asb_account_n5",
                      join: "account",
                      summary: "GROUP",
                      label: "N5"
                   })
                ]
             });
            
            savedSearch.filters.push(search.createFilter({
                name: 'trandate',
                operator: search.Operator.ONORBEFORE,
                values: toPeriod.enddate
            }))
    
            savedSearch.filters.push(search.createFilter({
                name: 'trandate',
                operator: search.Operator.ONORAFTER,
                values: fromPeriod.startdate
            }))
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
                    let jsonKey = result.getText({name: "custrecord_asb_account_n3", join: "account", summary: "GROUP"});
                if(!jsonResult[jsonKey]){
                    jsonResult[jsonKey] = [{
                        "nivel2": result.getText({name: "custrecord_asb_account_n4", join: "account", summary: "GROUP"}),
                        "nivel3": [{
                                "id_3": result.getValue({name: "custrecord_asb_account_n5", join: "account", summary: "GROUP"}),
                                "name_3": result.getText({name: "custrecord_asb_account_n5", join: "account", summary: "GROUP"}),
                            }
                        ]
                    }];
                }else{
                    if(jsonResult[jsonKey]['nivel2'] == result.getValue({name: 'custrecord_asb_account_n4'})){
                        jsonResult[jsonKey]['nivel3'].push({
                            "id_3": result.getValue({name: "custrecord_asb_account_n5", join: "account", summary: "GROUP"}),
                            "name_3": result.getText({name: "custrecord_asb_account_n5", join: "account", summary: "GROUP"}),
                        })
                    }else{
                        jsonResult[jsonKey].push({
                            "nivel2": result.getText({name: "custrecord_asb_account_n4", join: "account", summary: "GROUP"}),
                            "nivel3": [{
                                "id_3": result.getText({name: "custrecord_asb_account_n5", join: "account", summary: "GROUP"}),
                                "name_3":result.getText({name: "custrecord_asb_account_n5", join: "account", summary: "GROUP"}),
                            }
                        ]});
                    }

                    
                }
            })
            log.debug('Tamaño ' + FN, searchResult.length)
            log.debug('Json Final', JSON.stringify(jsonResult))
            if(searchResult.length == 0){
                context.response.write(JSON.stringify({}));
            }else{
                context.response.write(JSON.stringify(jsonResult));
            }
        }catch(e){
            log.error('[Error ' + FN + ']', e);
        }
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
                name: 'TS_LIB_EstadoResultado.js',
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

    return {
        onRequest: onRequest
    };

})