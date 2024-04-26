/**
* @NApiVersion 2.1
* @NScriptType Suitelet
* @NModuleScope Public
*
* Task          Date            Author                                         Remarks
* GAP 12        28 Jun 2023     Alexander Ruesta <aruesta@myevol.biz>          - Crear reporte de cotrol presupuestal.
*
*/


define(['N/ui/serverWidget','N/runtime', 'N/file', 'N/search', 'N/redirect', 'N/record', 'N/config', 'N/url', 'N/encode', '../Library/TS_LIB_ControlPresupuestal.js' ],  (serverWidget, runtime, file, search, redirect, record, config, url, encode, libCP) => {

    const onRequest = (context) => {
        let suitelet = context.request.parameters.suitelet;
        log.debug('suitelet onRequest Method', suitelet);
        if(suitelet == null){
            main(context)
        }else{
            report[suitelet](context)
        }
    }
    
    const main = (context) => {
        let FN = 'Reporte de Control Presupuestal',
            nameReport = runtime.getCurrentScript().getParameter({ name: 'custscript_ts_sl_cp_report_title' });
       
        try{
            if (context.request.method == 'GET') {
                let anio = context.request.parameters.custpage_anio,
                    subsidiary = context.request.parameters.custpage_subsidiary,
                    classification = context.request.parameters.custpage_class, 
                    department = context.request.parameters.custpage_department,
                    script = context.request.parameters.script || context.request.parameters.custpage_script,
                    deploy = context.request.parameters.deploy || context.request.parameters.custpage_deploy;


                let form = serverWidget.createForm(nameReport);
                
                form.addSubmitButton("Guardar");
                
                form.addButton({
                    id : 'custpage_excel',
                    label: 'Exportar',
                });

                let groupFilter = form.addFieldGroup({
                    id: 'custpage_filters',
                    label: 'Filters',
                });
                
                let anioField = form.addField({
                    id: 'custpage_anio',
                    label: 'AÑO:',
                    type: 'select'.toUpperCase(),
                    source: 'customrecord_ts_cp_anio',
                    container: 'custpage_filters'
                });
                anioField.defaultValue = anio;
                anioField.isMandatory = true;

                let subField = form.addField({
                    id: 'custpage_subsidiary',
                    label: 'Subdidiaria:',
                    type: 'MULTISELECT',
                    source: 'subsidiary',
                    container: 'custpage_filters'
                });
                subField.updateDisplaySize({
                    height : 3,
                    width : 300
                });
                subField.defaultValue = subsidiary;
                subField.isMandatory = true;

                let departmentField = form.addField({
                    id: 'custpage_department',
                    label: 'Departamento',
                    type: 'MULTISELECT',
                    source: 'department',
                    container: 'custpage_filters'
                });
                departmentField.updateDisplaySize({
                    height : 3,
                    width : 300
                });
                departmentField.defaultValue = department;

                let classField = form.addField({
                    id: 'custpage_class',
                    label: 'Clase',
                    type: 'MULTISELECT',
                    source: 'classification',
                    container: 'custpage_filters'
                });
                classField.updateDisplaySize({
                    height : 3,
                    width : 300
                });
                classField.defaultValue = classification;

                let filterField = form.addField({
                    id: 'custpage_filters',
                    label: 'Filters',
                    type: 'text'.toUpperCase(),
                    container: 'custpage_filters'
                });
                filterField.defaultValue = 'custpage_anio,custpage_subsidiary,custpage_class,custpage_department';
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
                    
            }else if (context.request.method == 'POST') {
                redirect.toSuitelet({
                    scriptId: "customscript_ts_sl_cp_report",
                    deploymentId: "customdeploy_ts_sl_cp_report",
                    parameters: {
                        'custpage_subsidiary': context.request.parameters.custpage_subsidiary,
                        'custpage_anio': context.request.parameters.custpage_anio,
                        'custpage_class': context.request.parameters.custpage_class,
                        'custpage_department': context.request.parameters.custpage_department
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
    
    report.getTransactions = function (context){
        let FN = 'Generate Excel'
        try{
            let anio = context.request.parameters.custpage_anio,
                subsidiary = context.request.parameters.custpage_subsidiary,
                classification = context.request.parameters.custpage_class, 
                department = context.request.parameters.custpage_department,
                jsonResult = context.request.parameters.json,
                thread = context.request.parameters.thread,
                arrSub = subsidiary.split('\u0005'),
                arrPartidas = [],
                jsonMovimientos = {};

            if(jsonResult == null){
                    jsonResult = {}
            }else{
                    jsonResult = JSON.parse(jsonResult)
            }
            let resultsNumber = 10,
                end = resultsNumber*thread,
                start = end-resultsNumber; 

            var customSearch = search.create({
                type: "customrecord_ts_monthly_budget",
                filters:
                [
                   /*["custrecord_ts_cp_detail_category.custrecord_ts_cp_department","anyof",arrDepartment], 
                   "AND", 
                   ["custrecord_ts_cp_detail_category.custrecord_ts_cp_class","anyof",arrClass], 
                   "AND", */
                   ["custrecord_ts_cp_detail_category.custrecord_ts_cp_subsidiary","anyof",arrSub], 
                   "AND", 
                   ["custrecord_ts_cp_detail_anio","anyof",anio], 
                   "AND", 
                   ["custrecord_ts_cp_detail_version","anyof","3","4"]
                ],
                columns:
                [
                    search.createColumn({name: "custrecord_ts_cp_detail_category", label: "Partida Presupuestal"}),
                    search.createColumn({name: "custrecord_ts_cp_subsidiary", join: "CUSTRECORD_TS_CP_DETAIL_CATEGORY", label: "Subsidiaria"}),
                    search.createColumn({name: "custrecord_ts_cp_class", join: "CUSTRECORD_TS_CP_DETAIL_CATEGORY", label: "Clasificación", sort: search.Sort.ASC,}),
                    search.createColumn({name: "custrecord_ts_cp_department", join: "CUSTRECORD_TS_CP_DETAIL_CATEGORY", label: "Departamento"}),
                    search.createColumn({name: "custrecord_ts_cp_detail_01", label: "Enero"}),
                    search.createColumn({name: "custrecord_ts_cp_detail_02", label: "Febrero"}),
                    search.createColumn({name: "custrecord_ts_cp_detail_03", label: "Marzo"}),
                    search.createColumn({name: "custrecord_ts_cp_detail_04", label: "Abril"}),
                    search.createColumn({name: "custrecord_ts_cp_detail_05", label: "Mayo"}),
                    search.createColumn({name: "custrecord_ts_cp_detail_06", label: "Junio"}),
                    search.createColumn({name: "custrecord_ts_cp_detail_07", label: "Julio"}),
                    search.createColumn({name: "custrecord_ts_cp_detail_08", label: "Agosto"}),
                    search.createColumn({name: "custrecord_ts_cp_detail_09", label: "Setiembre"}),
                    search.createColumn({name: "custrecord_ts_cp_detail_10", label: "Octubre"}),
                    search.createColumn({name: "custrecord_ts_cp_detail_11", label: "Noviembre"}),
                    search.createColumn({name: "custrecord_ts_cp_detail_12", label: "Diciembre"}),
                    search.createColumn({name: "custrecord_ts_cp_detail_total", label: "Total"}),
                    search.createColumn({name: "custrecord_ts_cp_detail_version", label: "Versión"})
                ]
             });


            if(classification != '' && classification != null){
                let arrClassOrder= [],
                    arrClass = classification.split('\u0005');
                arrClass.forEach(function(line){
                    var classSearch = search.lookupFields({
                        type: 'classification',
                        id: line,
                        columns: ['name']
                    });
    
                    arrClassOrder = arrClassOrder.concat(getSearchOrder(classSearch.name, 'classification'));
                })
               log.debug('mirame Clase', arrClassOrder)
                customSearch.filters.push(search.createFilter({
                    name: 'custrecord_ts_cp_class',
                    join: 'custrecord_ts_cp_detail_category',
                    //sort: search.Sort.ASC,
                    operator: search.Operator.ANYOF,
                    values: arrClassOrder
                }))
            }

            if(department != '' && department != null){
                let arrDepOrder = [],
                    arrDepartment = department.split('\u0005');
                arrDepartment.forEach(function(line){
                    var depSearch = search.lookupFields({
                        type: 'department',
                        id: line,
                        columns: ['name']
                    });
    
                    arrDepOrder = arrDepOrder.concat(getSearchOrder(depSearch.name, 'department'));
                })
                
                log.debug('mirame Dep', arrDepOrder)
                customSearch.filters.push(search.createFilter({
                    name: 'custrecord_ts_cp_department',
                    join: 'custrecord_ts_cp_detail_category',
                    operator: search.Operator.ANYOF,
                    values: arrDepOrder
                }))
            }
            
             let searchResult = customSearch.run().getRange({
                start: start,
                end: end
            });
            searchResult.forEach(function(result) {
                let jsonKey = result.getText({name: "custrecord_ts_cp_class", join: "CUSTRECORD_TS_CP_DETAIL_CATEGORY", sort: search.Sort.ASC,}) + '///' + result.getValue({name: 'custrecord_ts_cp_detail_category'});
                if(!jsonResult[jsonKey]){
                    log.debug('mirame', jsonKey)
                    arrPartidas.push(jsonKey);
                    jsonResult[jsonKey] = [{
                        "version": result.getText({name: "custrecord_ts_cp_detail_version"}),
                        "subsidiary": result.getText({name: "custrecord_ts_cp_subsidiary", join: "CUSTRECORD_TS_CP_DETAIL_CATEGORY"}),
                        "class": result.getText({name: "custrecord_ts_cp_class", join: "CUSTRECORD_TS_CP_DETAIL_CATEGORY", sort: search.Sort.ASC,}),
                        "department": result.getText({name: "custrecord_ts_cp_department", join: "CUSTRECORD_TS_CP_DETAIL_CATEGORY"}),
                        "ene": result.getValue({name: "custrecord_ts_cp_detail_01"}),
                        "feb": result.getValue({name: "custrecord_ts_cp_detail_02"}),
                        "mar": result.getValue({name: "custrecord_ts_cp_detail_03"}),
                        "abr": result.getValue({name: "custrecord_ts_cp_detail_04"}),
                        "may": result.getValue({name: "custrecord_ts_cp_detail_05"}),
                        "jun": result.getValue({name: "custrecord_ts_cp_detail_06"}),
                        "jul": result.getValue({name: "custrecord_ts_cp_detail_07"}),
                        "ago": result.getValue({name: "custrecord_ts_cp_detail_08"}),
                        "sep": result.getValue({name: "custrecord_ts_cp_detail_09"}),
                        "oct": result.getValue({name: "custrecord_ts_cp_detail_10"}),
                        "nov": result.getValue({name: "custrecord_ts_cp_detail_11"}),
                        "dic": result.getValue({name: "custrecord_ts_cp_detail_12"}),
                        "total": result.getValue({name: "custrecord_ts_cp_detail_total"}),
                    }];
                }else{
                    jsonResult[jsonKey].push({
                        "version": result.getText({name: "custrecord_ts_cp_detail_version"}),
                        "subsidiary": result.getText({name: "custrecord_ts_cp_subsidiary", join: "CUSTRECORD_TS_CP_DETAIL_CATEGORY"}),
                        "class": result.getText({name: "custrecord_ts_cp_class", join: "CUSTRECORD_TS_CP_DETAIL_CATEGORY", sort: search.Sort.ASC,}),
                        "department": result.getText({name: "custrecord_ts_cp_department", join: "CUSTRECORD_TS_CP_DETAIL_CATEGORY"}),
                        "ene": result.getValue({name: "custrecord_ts_cp_detail_01"}),
                        "feb": result.getValue({name: "custrecord_ts_cp_detail_02"}),
                        "mar": result.getValue({name: "custrecord_ts_cp_detail_03"}),
                        "abr": result.getValue({name: "custrecord_ts_cp_detail_04"}),
                        "may": result.getValue({name: "custrecord_ts_cp_detail_05"}),
                        "jun": result.getValue({name: "custrecord_ts_cp_detail_06"}),
                        "jul": result.getValue({name: "custrecord_ts_cp_detail_07"}),
                        "ago": result.getValue({name: "custrecord_ts_cp_detail_08"}),
                        "sep": result.getValue({name: "custrecord_ts_cp_detail_09"}),
                        "oct": result.getValue({name: "custrecord_ts_cp_detail_10"}),
                        "nov": result.getValue({name: "custrecord_ts_cp_detail_11"}),
                        "dic": result.getValue({name: "custrecord_ts_cp_detail_12"}),
                        "total": result.getValue({name: "custrecord_ts_cp_detail_total"}),
                    })
                }    
            })
           
            function findP4 (line){
                return line.version == 'P4';
            }

            if(arrPartidas.length != 0){
                jsonMovimientos = getMovimiento_2(arrPartidas);
            }
          
            /*for (const key in jsonResult) {
               for (const key_1 in jsonMovimientos) {
                    if (key == key_1) {
                        jsonResult[key] = jsonResult[key].concat(jsonMovimientos[key_1]);
                    }
               }
            }*/

            for(var key in jsonResult){
                let flag = false;
                jsonResult[key].forEach(function(line){
                    if(line.version == 'P4'){
                        flag = true;
                    }
                })
                if(jsonResult[key].length < 3 && flag){
                    var remainingUsage = runtime.getCurrentScript().getRemainingUsage();
                    log.error("memoria", 'remaining usage::' + remainingUsage);
                  
                    let internalID = key.split('///')[1];
                
                    let reservado = libCP.getAmountStatusMonth(internalID,'customsearch_ts_cp_control_reserved', 'Reservado');
                    let comprometido = libCP.getAmountStatusMonth(internalID,'customsearch_ts_cp_control_committed', 'Comprometido');
                    let ejecutado = libCP.getAmountStatusMonth(internalID,'customsearch_ts_cp_control_executed', 'Ejecutado');
                    let presupuestado = jsonResult[key].find(line => findP4(line)) ? (jsonResult[key].find(line => findP4(line))).total : 0;
                   
                    let disponible = parseFloat(presupuestado) - (parseFloat(reservado.total) + parseFloat(comprometido.total) + parseFloat(ejecutado.total)) //+ (parseFloat(aumento.total) + parseFloat(disminucion.total) + parseFloat(transferencia.total));
                    let avance = (1 - Math.abs(parseFloat(disponible)/parseFloat(presupuestado)))*100;
                    jsonResult[key].push(reservado, comprometido, ejecutado);
                    if(jsonMovimientos[internalID]){
                        jsonResult[key] = jsonResult[key].concat(jsonMovimientos[internalID]);
                    }
                    
                    jsonResult[key].push({version: 'P5', nameLine: 'Saldo Disponible', total: disponible}, {version: 'P6', nameLine: 'Avance', total: avance ? avance : 0})
           
                }
            }

            log.debug('Resultado', JSON.stringify(jsonResult))

            if(searchResult.length == 0){
                context.response.write(JSON.stringify({}));
            }else{
                context.response.write(JSON.stringify(jsonResult));
            }
        }catch(e){
            log.error({
                title: `${FN} error`,
                details: { message: `${FN} - ${e.message || `Unexpected error`}` },
            });
            throw { message: `${FN} - ${e.message || `Unexpected error`}` };
        
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
                name: 'TS_LIB_ReportePresupuestal.js',
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

    const getSearchOrder = (paramName, paramType) => {
        let arrResul = [];
        var customSearch = search.create({
            type: paramType,
            filters:
            [
               ["name","contains",paramName]
            ],
            columns:
            [
               search.createColumn({name: "internalid", label: "Internal ID"}),
               search.createColumn({
                  name: "name",
                  label: "Name"
               })
            ]
         });

         let searchResult = customSearch.run().getRange({
            start: 0,
            end: 1000
        });

        searchResult.forEach(function(result) {
            arrResul.push(result.getValue({name: 'internalid'}))
        })
        log.debug('arrResul',arrResul);
        return arrResul;
        
    }


    const getMovimiento_2 = (paramPartida) => {
        let total = 0, 
            jsonResult = {};
           
        var customSearch = search.create({
            type: "customrecord_ts_addition_transfer",
            filters:
            [
                ["custrecord_ts_cp_detail_request","anyof",["1","2","3"]],
                "AND",
               ["custrecord_ts_cp_detail_transfer_status","anyof","2"]
            ],
            columns:
            [
               search.createColumn({
                  name: "custrecord_ts_cp_detail_request",
                  summary: "GROUP",
                  label: "Solicitud"
               }),
               search.createColumn({
                   name: "custrecord_ts_cp_to_increase",
                   summary: "GROUP",
                   label: "Partida a Incrementar"
               }),
               search.createColumn({
                  name: "custrecord_ts_cp_detail_amount",
                  summary: "SUM",
                  label: "Monto"
               })
            ]
         });


        let newFilter = search.createFilter({
            name: 'custrecord_ts_cp_to_increase',
            operator: search.Operator.ANYOF,
            values: paramPartida
        })
        customSearch.filters.push(newFilter)

        let searchResult = customSearch.run().getRange({
            start: 0,
            end: 1000
        });

        searchResult.forEach(function(result) {
            let jsonKey = result.getValue({name: 'custrecord_ts_cp_to_increase', summary: "GROUP"});
            let total = result.getValue({name: 'custrecord_ts_cp_detail_amount', summary: "SUM"});
           
            if(!jsonResult[jsonKey]){
                jsonResult[jsonKey] = [{
                    "version": result.getText({name: "custrecord_ts_cp_detail_request",summary: "GROUP"}),
                    "ene": 0,
                    "feb": 0,
                    "mar": 0,
                    "abr": 0,
                    "may": 0,
                    "jun": 0,
                    "jul": 0,
                    "ago": 0,
                    "sep": 0,
                    "oct": 0,
                    "nov": 0,
                    "dic": total ? Number(total).toFixed(2) : 0,
                    "total": total ? Number(total).toFixed(2) : 0
                }]
                
            }else{
                jsonResult[jsonKey].push({
                    "version": result.getText({name: "custrecord_ts_cp_detail_request",summary: "GROUP"}),
                    "ene": 0,
                    "feb": 0,
                    "mar": 0,
                    "abr": 0,
                    "may": 0,
                    "jun": 0,
                    "jul": 0,
                    "ago": 0,
                    "sep": 0,
                    "oct": 0,
                    "nov": 0,
                    "dic": total ? Number(total).toFixed(2) : 0,
                    "total": total ? Number(total).toFixed(2) : 0
                })
            }
           
        })

        // Transferencias Negativas
        let jsonNeg = {};
        var customSearch_1 = search.create({
            type: "customrecord_ts_addition_transfer",
            filters:
            [
                ["custrecord_ts_cp_detail_request","anyof","2"], 
                "AND", 
                ["custrecord_ts_cp_detail_transfer_status","anyof","2"],
                "AND",
                ["custrecord_ts_cp_to_decrease", "anyof", paramPartida]
            ],
            columns:
            [
               search.createColumn({
                    name: "custrecord_ts_cp_to_decrease",
                    summary: "GROUP",
                    label: "Partida a Disminuir"
                }),
               search.createColumn({
                  name: "custrecord_ts_cp_detail_amount",
                  summary: "SUM",
                  label: "Monto"
               })
            ]
         });

        let searchResult_1 = customSearch_1.run().getRange({
            start: 0,
            end: 1000
        });

        searchResult_1.forEach(function(result) {
            /*let auxJson = result.getValue({name: 'custrecord_ts_cp_to_decrease',summary: "GROUP"});
            jsonNeg[auxJson] = {
                "monto":  Number(result.getValue({name: 'custrecord_ts_cp_detail_amount',summary: "SUM"}))
            }*/
            let jsonKey = result.getValue({name: 'custrecord_ts_cp_to_decrease', summary: "GROUP"});
            let total = Number(result.getValue({name: 'custrecord_ts_cp_detail_amount', summary: "SUM"}));
            if(!jsonResult[jsonKey]){
                jsonResult[jsonKey] = [{
                    "version": "Transferencia",
                    "ene": 0,
                    "feb": 0,
                    "mar": 0,
                    "abr": 0,
                    "may": 0,
                    "jun": 0,
                    "jul": 0,
                    "ago": 0,
                    "sep": 0,
                    "oct": 0,
                    "nov": 0,
                    "dic": total ? - total : 0,
                    "total": total ? - total : 0
                }]
                
            }else{
                let flag = false;
                jsonResult[jsonKey].forEach(function(line){
                    if(line.version == "Transferencia"){
                        line.total = line.total - total;
                        flag = true;
                    }
                })
                if(!flag){
                    jsonResult[jsonKey].push({
                        "version": "Transferencia",
                        "ene": 0,
                        "feb": 0,
                        "mar": 0,
                        "abr": 0,
                        "may": 0,
                        "jun": 0,
                        "jul": 0,
                        "ago": 0,
                        "sep": 0,
                        "oct": 0,
                        "nov": 0,
                        "dic": total ? - total: 0,
                        "total": total ?  - total : 0
                    })
                }
            }
        })

        // Transferencias Masivas Positivas
        let jsonMasivPos  = {};
        var customSearch_2 = search.create({
            type: "customrecord_ts_cp_item_decrease",
            filters:
            [
                ["custrecord_ts_cp_item_status","anyof","2"],
                "AND",
                ["custrecord_ts_cp_item_transfers.custrecord_ts_cp_to_increase","anyof", paramPartida]
   
            ],
            columns:
            [
                search.createColumn({name: "custrecord_ts_cp_to_increase",join: "custrecord_ts_cp_item_transfers", summary: "GROUP", label: "Partida"}),
                search.createColumn({name: "custrecord_ts_cp_item_amount",summary: "SUM", label: "Monto"})
            ]
         });

        let searchResult_2 = customSearch_2.run().getRange({
            start: 0,
            end: 1000
        });

        searchResult_2.forEach(function(result) {
            let jsonKey = result.getValue({name: 'custrecord_ts_cp_to_increase', join: "custrecord_ts_cp_item_transfers",summary: "GROUP"}),
                total = Number(result.getValue({name: 'custrecord_ts_cp_item_amount',summary: "SUM"}));
            jsonMasivPos[jsonKey] = {
                "monto":  Number(result.getValue({name: 'custrecord_ts_cp_item_amount',summary: "SUM"}))
            }

            if(!jsonResult[jsonKey]){
                jsonResult[jsonKey] = [{
                    "version": "Transferencia",
                    "ene": 0,
                    "feb": 0,
                    "mar": 0,
                    "abr": 0,
                    "may": 0,
                    "jun": 0,
                    "jul": 0,
                    "ago": 0,
                    "sep": 0,
                    "oct": 0,
                    "nov": 0,
                    "dic": total ? total : 0,
                    "total": total ? total : 0
                }]
                
            }else{
                let flag = false;
                jsonResult[jsonKey].forEach(function(line){
                    if(line.version == "Transferencia"){
                        line.total = line.total + total;
                        flag = true;
                    }
                })
                if(!flag){
                    jsonResult[jsonKey].push({
                        "version": "Transferencia",
                        "ene": 0,
                        "feb": 0,
                        "mar": 0,
                        "abr": 0,
                        "may": 0,
                        "jun": 0,
                        "jul": 0,
                        "ago": 0,
                        "sep": 0,
                        "oct": 0,
                        "nov": 0,
                        "dic": total ? total: 0,
                        "total": total ?  total : 0
                    })
                }
            }

        })

        log.debug('Positivo', jsonMasivPos)

        // Transferencias Masivas Negativas
        let jsonMasivNeg = {};
        var customSearch_3 = search.create({
            type: "customrecord_ts_cp_item_decrease",
            filters:
            [
                ["custrecord_ts_cp_item_status","anyof","2"],
                "AND",
                ["custrecord_ts_cp_item_decrease","anyof",paramPartida]
            ],
            columns:
            [
                search.createColumn({name: "custrecord_ts_cp_item_decrease", summary: "GROUP", label: "Partida"}),
                search.createColumn({name: "custrecord_ts_cp_item_amount",summary: "SUM", label: "Monto"})
            ]
         });

         let searchResult_3 = customSearch_3.run().getRange({
            start: 0,
            end: 1000
        });

        searchResult_3.forEach(function(result) {
            let jsonKey = result.getValue({name: 'custrecord_ts_cp_item_decrease',summary: "GROUP"}),
                total =  Number(result.getValue({name: 'custrecord_ts_cp_item_amount',summary: "SUM"}));
            jsonMasivNeg[jsonKey] = {
                "monto":  Number(result.getValue({name: 'custrecord_ts_cp_item_amount',summary: "SUM"}))
            }

            if(!jsonResult[jsonKey]){
                jsonResult[jsonKey] = [{
                    "version": "Transferencia",
                    "ene": 0,
                    "feb": 0,
                    "mar": 0,
                    "abr": 0,
                    "may": 0,
                    "jun": 0,
                    "jul": 0,
                    "ago": 0,
                    "sep": 0,
                    "oct": 0,
                    "nov": 0,
                    "dic": total ? - total : 0,
                    "total": total ? - total : 0
                }]
                
            }else{
                let flag = false;
                jsonResult[jsonKey].forEach(function(line){
                    if(line.version == "Transferencia"){
                        line.total = line.total - total;
                        flag = true;
                    }
                })
                if(!flag){
                    jsonResult[jsonKey].push({
                        "version": "Transferencia",
                        "ene": 0,
                        "feb": 0,
                        "mar": 0,
                        "abr": 0,
                        "may": 0,
                        "jun": 0,
                        "jul": 0,
                        "ago": 0,
                        "sep": 0,
                        "oct": 0,
                        "nov": 0,
                        "dic": total ? - total: 0,
                        "total": total ?  - total : 0
                    })
                }
            }
        })

        log.debug('Negativo', jsonMasivNeg);



        log.debug('mirameeee', JSON.stringify(jsonResult))

         return jsonResult;
    }

    const getMovimiento = (paramSearch, paramPartida) => {
        
        let total = 0;
        var customSearch = search.create({
            type: "customrecord_ts_addition_transfer",
            filters:
            [
               ["custrecord_ts_cp_detail_request","anyof",paramSearch], 
               "AND", 
               ["custrecord_ts_cp_detail_transfer_status","anyof","2"]
            ],
            columns:
            [
               search.createColumn({name: "custrecord_ts_cp_detail_amount",summary: "SUM", label: "Monto"})
            ]
         });

        if(paramSearch == 1){// Adicion
            var nameVersion = 'Aumento'
        }else if(paramSearch == 2){//Transferencia
            var nameVersion = 'Transferencia'
        }else{// Disminucion
            var nameVersion = 'Disminución'
        }

        let newFilter = search.createFilter({
            name: 'custrecord_ts_cp_to_increase',
            operator: search.Operator.IS,
            values: paramPartida
        })
    
        customSearch.filters.push(newFilter)

         let searchResultCount = customSearch.runPaged().count;
         if (searchResultCount != 0) {
             let result = customSearch.run().getRange({ start: 0, end: 1 });
             total = parseFloat(result[0].getValue(customSearch.columns[0]));
         }
      
         let jsonResult = {
            "version": nameVersion,
            "ene": 0,
            "feb": 0,
            "mar": 0,
            "abr": 0,
            "may": 0,
            "jun": 0,
            "jul": 0,
            "ago": 0,
            "sep": 0,
            "oct": 0,
            "nov": 0,
            "dic": total ? total.toFixed(2) : 0,
            "total": total ? total.toFixed(2) : 0
        };
         

        if(paramSearch == 2){
            jsonResult = getAllTransferencias(jsonResult, paramPartida);
        }

         return jsonResult;
    }

    const getAllTransferencias =  (paramJson, paramPartida) =>{
        var total = 0,
            total_dec = 0,
            total_masiv_dec = 0,
            total_masiv_inc = 0;
        // Transferencias negativas
        var customSearch_1 = search.create({
            type: "customrecord_ts_addition_transfer",
            filters:
            [
                ["custrecord_ts_cp_detail_request","anyof","2"], 
                "AND", 
                ["custrecord_ts_cp_detail_transfer_status","anyof","2"]
            ],
            columns:
            [
                search.createColumn({name: "custrecord_ts_cp_detail_amount",summary: "SUM", label: "Monto"})
            ]
         });

        var newFilter = search.createFilter({
            name: 'custrecord_ts_cp_to_decrease',
            operator: search.Operator.IS,
            values: paramPartida
        })
    
        customSearch_1.filters.push(newFilter)

        var searchResultCount = customSearch_1.runPaged().count;
        if (searchResultCount != 0) {
            var result = customSearch_1.run().getRange({ start: 0, end: 1 });
          
            total_dec = parseFloat(result[0].getValue(customSearch_1.columns[0]));
            total_dec = total_dec ? total_dec.toFixed(2) : 0;
        }
      
        // Transferencias Masivas Positivas
        var customSearch = search.create({
            type: "customrecord_ts_cp_item_decrease",
            filters:
            [
                ["custrecord_ts_cp_item_status","anyof","2"],
                "AND",
                ["custrecord_ts_cp_item_transfers.custrecord_ts_cp_to_increase","anyof",paramPartida]
   
            ],
            columns:
            [
                search.createColumn({name: "custrecord_ts_cp_item_amount",summary: "SUM", label: "Monto"})
            ]
         });

        var searchResultCount = customSearch.runPaged().count;
        if (searchResultCount != 0) {
            let result = customSearch.run().getRange({ start: 0, end: 1 });
            total_masiv_inc = parseFloat(result[0].getValue(customSearch.columns[0]));
            total_masiv_inc = total_masiv_inc ? total_masiv_inc.toFixed(2) : 0;
        }

        
        // Transferencias Masivas Negativa
        var customSearch = search.create({
            type: "customrecord_ts_cp_item_decrease",
            filters:
            [
                ["custrecord_ts_cp_item_status","anyof","2"],
                "AND",
                ["custrecord_ts_cp_item_decrease","anyof",paramPartida]
            ],
            columns:
            [
                search.createColumn({name: "custrecord_ts_cp_item_amount",summary: "SUM", label: "Monto"})
            ]
         });

        var searchResultCount = customSearch.runPaged().count;
        if (searchResultCount != 0) {
            let result = customSearch.run().getRange({ start: 0, end: 1 });
            total_masiv_dec = parseFloat(result[0].getValue(customSearch.columns[0]));
            total_masiv_dec = total_masiv_dec ? total_masiv_dec.toFixed(2) : 0;
        }

        let jsonResult = paramJson;
        jsonResult.total = jsonResult.total + parseFloat(total_masiv_inc) - parseFloat(total_masiv_dec) - parseFloat(total_dec);
        jsonResult.dic = jsonResult.dic + parseFloat(total_masiv_inc) - parseFloat(total_masiv_dec) - parseFloat(total_dec);

        return jsonResult;
        
    }

    
    return {
        onRequest: onRequest
    };

})