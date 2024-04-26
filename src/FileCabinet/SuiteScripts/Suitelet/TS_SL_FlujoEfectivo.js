/**
* @NApiVersion 2.1
* @NScriptType Suitelet
* @NModuleScope Public
*
* Task          Date            Author                                         Remarks
* GAP 27        28 Jun 2023     Alexander Ruesta <aruesta@myevol.biz>          - Crear vista al reporte de Flujo Efectivo.
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
        let FN = 'Flujo de Caja de Efectivo',
            nameReport = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_sl_flujoefectivo_title' });
       
        try{
            if (context.request.method == 'GET') {
                let from = context.request.parameters.custpage_from,
                    anio = context.request.parameters.custpage_anio,
                    subsidiary = context.request.parameters.custpage_subsidiary,
                    periodType = context.request.parameters.custpage_period_type,
                    script = context.request.parameters.script || context.request.parameters.custpage_script,
                    deploy = context.request.parameters.deploy || context.request.parameters.custpage_deploy, 
                    arrayAnios = [];

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
                 
                
                let periodTypeField = form.addField({
                    id: 'custpage_period_type',
                    label: 'TIPO DE PERIODO:',
                    type: 'select'.toUpperCase(),
                    container: 'custpage_filters'
                });
                periodTypeField.addSelectOption({ value: '1', text: 'Mensual'}),
                periodTypeField.addSelectOption({ value: '2', text: 'Anual'}),
                periodTypeField.defaultValue = periodType;
                periodTypeField.isMandatory = true;
                
                let fromField = form.addField({
                    id: 'custpage_from',
                    label: 'PERIODO CONTABLE:',
                    type: 'select'.toUpperCase(),
                    source: 'accountingperiod',
                    container: 'custpage_filters'
                });
                fromField.defaultValue = from;
                fromField.isMandatory = true;

                let anioField = form.addField({
                    id: 'custpage_anio',
                    label: 'AÑO:',
                    type: 'select'.toUpperCase(),
                    container: 'custpage_filters'
                });

                var search_period = search.create({
                    type: 'accountingperiod',
                    filters: [
                        ['isadjust', 'is', 'F'], 'AND',
                        ['isquarter', 'is', 'F'], 'AND',
                        ['isinactive', 'is', 'F'], "AND",
                        ['isyear', 'is', 'T']
                    ],
                    columns: [
                        search.createColumn({
                            name: "internalid",
                            summary: "GROUP",
                            sort: search.Sort.ASC,
                            label: "Internal ID"
                        }),
                        search.createColumn({
                            name: "periodname",
                            summary: "GROUP",
                            label: "Name"
                        })
                    ]
                });
                var results = search_period.run().getRange(0, 1000);
                var columns = search_period.columns;
                
                anioField.addSelectOption({
                    value: ' ',
                    text: ' '
                });
                
                if (results && results.length) {
                    for (var i = 0; i < results.length; i++) {
                        var id = results[i].getValue(columns[0]);
                        var name = results[i].getValue(columns[1]);
                        arrayAnios.push(results[i].getValue(columns[0]));
                        anioField.addSelectOption({
                            value: id,
                            text: name
                        });
                      
                    }
                }
                anioField.defaultValue = anio;

                log.debug('arrayAnios', arrayAnios);
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
                    id: 'custpage_before_anio',
                    label: 'Año Anterior',
                    type: 'text'.toUpperCase()
                });
                let aux = arrayAnios.indexOf(anio);
                if(aux <= 0){
                    reportField.defaultValue = 0;
                }else{
                    reportField.defaultValue = arrayAnios[aux - 1];
                }
                
                reportField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                let filterField = form.addField({
                    id: 'custpage_filters',
                    label: 'Filters',
                    type: 'text'.toUpperCase(),
                    container: 'custpage_filters'
                });
                filterField.defaultValue = 'custpage_period_type,custpage_anio,custpage_from,custpage_subsidiary,custpage_before_anio';
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
                form.clientScriptModulePath = '../Client/TS_CS_FlujoEfectivo.js';
                    
            }
            if (context.request.method == 'POST') {
                log.debug('post')
                redirect.toSuitelet({
                    scriptId: "customscript_ts_sl_flujoefectivo",
                    deploymentId: "customdeploy_ts_sl_flujoefectivo",
                    parameters: {
                        'custpage_subsidiary': context.request.parameters.custpage_subsidiary,
                        'custpage_period_type': context.request.parameters.custpage_period_type, 
                        'custpage_anio': context.request.parameters.custpage_anio,
                        'custpage_from': context.request.parameters.custpage_from,
                        'custpage_anios': context.request.parameters.custpage_anios,
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

    report.getRecord = function (context) {
        let FN = 'Report Get Record';
        
        try{
            let from = context.request.parameters.custpage_from,
                subsidiary = context.request.parameters.custpage_subsidiary,
                script = context.request.parameters.script || context.request.parameters.custpage_script,
                deploy = context.request.parameters.deploy || context.request.parameters.custpage_deploy,
                thread = context.request.parameters.thread,
                jsonResult = context.request.parameters.json,
                arrResult = [];
           
            let resultsNumber = 1000,
                end = resultsNumber*thread,
                start = end-resultsNumber; 

            let savedSearch = search.load({
                id: 'customsearch_ts_cash_flow'
            });

            let searchResult = savedSearch.run().getRange({
                start: start,
                end: end
            })
            searchResult.forEach(function(result) {
                let jsonAux = {
                    "Actividad":  result.getText({name: 'custrecord_asb_activity'}),
                    "ActividadID":  result.getValue({name: 'custrecord_asb_activity'}),
                    "SubActividad":  result.getText({name: 'custrecord_asb_sub_activity'}),
                    "SubActividadID":  result.getValue({name: 'custrecord_asb_sub_activity'})
                }
                arrResult.push(jsonAux);
            })
            log.debug('resultado',arrResult)
            
            context.response.write(JSON.stringify(arrResult));
            
        }catch(e){
            log.error('[ Get Input Data Error ]', e);
        }
    }

    report.getAmounts = function (context) {
        let FN = 'Report Get Record';
        
        try{
            let from = context.request.parameters.custpage_from,
                anio = context.request.parameters.custpage_anio,
                beforeAnio = context.request.parameters.custpage_before_anio,
                subsidiary = context.request.parameters.custpage_subsidiary,
                periodType = context.request.parameters.custpage_period_type,
                thread = context.request.parameters.thread,
                script = context.request.parameters.script || context.request.parameters.custpage_script,
                deploy = context.request.parameters.deploy || context.request.parameters.custpage_deploy,
                arrResult = [],
                arrBefore = [];;
            log.debug('parametors', from + ' -> ' + anio + ' -> ' + periodType )
            let resultsNumber = 1000,
                end = resultsNumber*thread,
                start = end-resultsNumber; 

            let savedSearch = search.load({
                id: 'customsearch_asb_cash_flow'
            });

            if(subsidiary != '' && subsidiary != null){
                savedSearch.filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: subsidiary
                }))
            }

            if(periodType == 1 ){
                savedSearch.filters.push(search.createFilter({
                    name: 'postingperiod',
                    operator: search.Operator.IS,
                    values: from
                }))
            }else{
                let formula = 'CASE WHEN ',
                    periodArray = getPeriodsIDs(anio);
                for (let i = 0; i < periodArray.length; i++) {
                    formula += "{postingperiod.id} = '" + periodArray[i] + "'";
                    if (i != periodArray.length - 1) {
                        formula += ' OR ';
                    }
                }
                formula += ' THEN 1 ELSE 0 END';

                savedSearch.filters.push(search.createFilter({
                    name: 'formulatext',
                    operator: search.Operator.IS,
                    values: '1',
                    formula: formula
                }))

                if(beforeAnio  != 0){
                    /**Búsqueda del año anterior */
                    let savedSearchBefore = search.load({
                        id: 'customsearch_asb_cash_flow'
                    });
        
                    if(subsidiary != '' && subsidiary != null){
                        savedSearchBefore.filters.push(search.createFilter({
                            name: 'subsidiary',
                            operator: search.Operator.ANYOF,
                            values: subsidiary
                        }))
                    }

                    let formulaBefore = 'CASE WHEN ',
                        periodArrayBefore = getPeriodsIDs(beforeAnio);
                    for (let i = 0; i < periodArrayBefore.length; i++) {
                        formulaBefore += "{postingperiod.id} = '" + periodArrayBefore[i] + "'";
                        if (i != periodArrayBefore.length - 1) {
                            formulaBefore += ' OR ';
                        }
                    }
                    formulaBefore += ' THEN 1 ELSE 0 END';

                    savedSearchBefore.filters.push(search.createFilter({
                        name: 'formulatext',
                        operator: search.Operator.IS,
                        values: '1',
                        formula: formulaBefore
                    }))
                
                    let searchResultB = savedSearchBefore.run().getRange({
                        start: start,
                        end: end
                    })
                    searchResultB.forEach(function(result) {
                        let jsonAux = {
                            "ActividadID":  result.getValue({name: "custrecord_asb_tipo_actividad", join: "account", summary: "GROUP"}),
                            "SubActividadID":  result.getValue({name: "custrecord_asb_tipo_subactividad", join: "account", summary: "GROUP"}),
                            "Amount":  result.getValue({name: "amount", summary: "SUM"})
                        
                        }
                        arrBefore.push(jsonAux);
                    })
                }
                
            }
            log.debug('arrBefore',arrBefore)
            let searchResult = savedSearch.run().getRange({
                start: start,
                end: end
            })
            searchResult.forEach(function(result) {
                let jsonAux = {
                    "Actividad":  result.getText({name: "custrecord_asb_tipo_actividad", join: "account", summary: "GROUP"}),
                    "ActividadID":  result.getValue({name: "custrecord_asb_tipo_actividad", join: "account", summary: "GROUP"}),
                    "SubActividad":  result.getText({name: "custrecord_asb_tipo_subactividad", join: "account", summary: "GROUP"}),
                    "SubActividadID":  result.getValue({name: "custrecord_asb_tipo_subactividad", join: "account", summary: "GROUP"}),
                    "AmountBefore": '',
                    "Amount":  result.getValue({name: "amount", summary: "SUM"})
                    
                }

                if(periodType == 2 && arrBefore.length !=0){
                    let objBefore = arrBefore.find((amount) => {
                        return amount.SubActividadID == result.getValue({name: "custrecord_asb_tipo_subactividad", join: "account", summary: "GROUP"});
                    })

                    if(objBefore != null){
                        log.debug('objBefore',objBefore)
                        jsonAux.AmountBefore = objBefore.Amount;
                    }
                    
                }
                arrResult.push(jsonAux);
            })
            log.debug('resultado de montos',arrResult)
            
            context.response.write(JSON.stringify(arrResult));
            
        }catch(e){
            log.error('[ Get Input Data Error ]', e);
        }
    }


    report.getPeriods = function (context) {
        let FN = 'Report Get Record';
        
        try{
            let from = context.request.parameters.custpage_from,
                anio = context.request.parameters.custpage_anio,
                beforeAnio = context.request.parameters.custpage_before_anio,
                subsidiary = context.request.parameters.custpage_subsidiary,
                periodType = context.request.parameters.custpage_period_type,
                thread = context.request.parameters.thread,
                script = context.request.parameters.script || context.request.parameters.custpage_script,
                deploy = context.request.parameters.deploy || context.request.parameters.custpage_deploy,
                arrResult = [];
           

            if(thread == 1){
                if(periodType == 1 ){
                    var result = search.lookupFields({
                        type: search.Type.ACCOUNTING_PERIOD,
                        id: from,
                        columns: ['periodname']
                    });	
                }else{
                    if(beforeAnio != 0){
                        var resultbefore = search.lookupFields({
                            type: search.Type.ACCOUNTING_PERIOD,
                            id: beforeAnio,
                            columns: ['periodname']
                        });	
                        let jsonAux = {
                            "PeriodName": resultbefore.periodname,
                        }
                        arrResult.push(jsonAux);
                    }
                    
                    var result = search.lookupFields({
                        type: search.Type.ACCOUNTING_PERIOD,
                        id: anio,
                        columns: ['periodname']
                    });	
                }
                let jsonAux = {
                    "PeriodName": result.periodname,
                }
                arrResult.push(jsonAux);
            }
            
            
            log.debug('resultado de montos',arrResult)
            
            context.response.write(JSON.stringify(arrResult));
            
        }catch(e){
            log.error('[ Get Input Data Error ]', e);
        }
    }

    const getPeriodsIDs = (paramYear) => {
        let result = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: paramYear,
            columns: ['startdate', 'enddate']
        });	

        let savedSearch = search.create({
            type    : "accountingperiod",
            filters :
            [
                ['isyear', 'is', 'F'],
                'AND',
                ['isquarter', 'is', 'F'],
                'AND',
                ['startdate', 'onorafter', result.startdate],
                'AND',
                ['startdate', 'onorbefore', result.enddate]
                
            ],
            columns : [
                search.createColumn({
                    name : 'internalid',
                    sort : search.Sort.ASC
                }),
                search.createColumn({
                    name : 'startdate'
                })
            ]
        });
        

        let pagedData = savedSearch.runPaged({
            pageSize : 1000
        });

        let page, auxArray, columns, periodsArray = [];
        pagedData.pageRanges.forEach(function(pageRange) {
            page = pagedData.fetch({
                index : pageRange.index
            });

            page.data.forEach(function(result) {
                columns = result.columns;
                periodsArray.push(result.getValue(columns[0]));
            });
        });

        return periodsArray
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
                name: 'TS_LIB_FlujoEfectivo.js',
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