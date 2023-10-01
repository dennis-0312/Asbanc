/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */

// this creates a Suitelet form that lets you write and send an email
define(['N/ui/serverWidget', 'N/email', 'N/runtime', 'N/search', 'N/redirect', 'N/task', 'N/log'],
    function (ui, email, runtime, search, redirect, task, log) {
        function onRequest(context) {
            // log.debug({ title: 'context', details: 'Ejecutando' });
            try {
                var fileCabinetId = 363;
                if (context.request.method === 'GET') {
                    try {
                        var pageId = parseInt(context.request.parameters.custscript_pe_paginacion_form);
                        if (pageId = '') {
                            pageId = 0;
                        }

                        var featureSubsidiary = runtime.isFeatureInEffect({
                            feature: "SUBSIDIARIES"
                        });

                        var form = ui.createForm({
                            title: 'Generador Libros Electrónicos - SUNAT '
                        });
                        //
                        form.clientScriptModulePath = "./PE_Client_PLE_Sunat.js";
                        var field_reporte = form.addField({
                            id: 'field_reporte',
                            type: ui.FieldType.SELECT,
                            source: 'customrecord_pe_electronic_books_2',
                            label: 'Reporte'
                        });
                        field_reporte.layoutType = ui.FieldLayoutType.NORMAL;
                        field_reporte.breakType = ui.FieldBreakType.STARTCOL;
                        field_reporte.isMandatory = true;

                        // var field_subsidiary = form.addField({
                        //     id: 'field_subsidiary',
                        //     type: ui.FieldType.SELECT,
                        //     source: 'subsidiary',
                        //     label: 'Subsidiaria'
                        // });
                        // field_subsidiary.layoutType = ui.FieldLayoutType.NORMAL;
                        // field_subsidiary.isMandatory = true;

                        if (featureSubsidiary || featureSubsidiary == 'T') {
                            var field_subsidiary = form.addField({
                                id: 'field_subsidiary',
                                type: ui.FieldType.SELECT,
                                label: 'Subsidiaria'
                            });

                            var myFilter = search.createFilter({
                                name: 'country',
                                operator: search.Operator.IS,
                                values: 'PE'
                            });
                            var mySearchSubs = search.create({
                                type: search.Type.SUBSIDIARY,
                                columns: ['internalId', 'name'],
                                filters: myFilter
                            });

                            mySearchSubs.run().each(function (result) {
                                var subId = result.getValue({
                                    name: 'internalId'
                                });
                                var subName = result.getValue({
                                    name: 'name'
                                });
                                field_subsidiary.addSelectOption({
                                    value: subId,
                                    text: subName
                                });
                                return true;
                            });
                        }

                        var field_acc_period = form.addField({
                            id: 'field_acc_period',
                            type: ui.FieldType.SELECT,
                            source: 'accountingperiod',
                            label: 'Periodo Contable'
                        });
                        field_acc_period.layoutType = ui.FieldLayoutType.NORMAL;
                        field_acc_period.isMandatory = true;
                        //Inicio*
                        var field_ano = form.addField({
                            id: 'field_ano',
                            type: ui.FieldType.SELECT,
                            label: 'Año Contable'
                        });

                        var accountingperiodSearchObj = search.create({
                            type: "accountingperiod",
                            filters: [
                                ["isyear", "is", "T"]
                            ],
                            columns: [
                                search.createColumn({
                                    name: "periodname",
                                    sort: search.Sort.ASC,
                                    label: "Nombre"
                                }),
                                search.createColumn({
                                    name: "internalid",
                                    label: "ID"
                                })
                            ]
                        });
                        accountingperiodSearchObj.run().each(function (result) {
                            var anoId = result.getValue({
                                name: 'internalId'
                            });
                            var anoName = result.getValue({ name: 'periodname' });
                            anoName = anoName.split(' ');
                            anoName = anoName[1];
                            field_ano.addSelectOption({
                                value: anoName,
                                text: anoName
                            });
                            return true;
                        });

                        //Fin*
                        form.addSubmitButton({
                            label: 'Generar reporte'
                        });

                        /**/
                        var field_format = form.addField({
                            id: 'field_format',
                            type: ui.FieldType.SELECT,
                            label: 'Formato de descarga'
                        });
                        field_format.addSelectOption({
                            value: 'TXT',
                            text: 'Formato Texto'
                        });
                        field_format.addSelectOption({
                            value: 'CSV',
                            text: 'Formato CSV'
                        });

                        field_format.addSelectOption({
                            value: 'PDF',
                            text: 'Formato PDF'
                        });
                        /**/

                        //IMorales 20230829 - Inicio
                        var field_account = form.addField({
                            id: 'field_account',
                            type: ui.FieldType.SELECT,
                            label: 'Cuenta Asociada'
                        });

                        log.debug('MSK', 'traza 1');
                        var accountSearchObj = search.create({
                            type: "account",
                            filters: [
                                ["internalId", "anyof", "341", "342", "343", "344", "345", "346", "347", "349"]
                            ],
                            columns: ['internalId', 'externalId']
                        });

                        log.debug('MSK', 'traza 2');
                        accountSearchObj.run().each(function (result) {
                            var idddd = result.getValue({
                                name: 'internalId'
                            });
                            var nombreeee = result.getText({
                                name: 'externalId'
                            });
                            field_account.addSelectOption({
                                value: idddd,
                                text: nombreeee.split('-')[1]
                            });
                            return true;
                        });
                        log.debug('MSK', 'traza 4');


                        //IMorales 20230829 - Fin

                        var field_boletas_rrhh = form.addField({
                            id: 'field_boletas_rrhh',
                            type: ui.FieldType.CHECKBOX,
                            label: 'Incluir Boletas de Venta y Recibos por Honorarios'
                        });

                        var field_incluir_ventas = form.addField({
                            id: 'field_incluir_ventas',
                            type: ui.FieldType.CHECKBOX,
                            label: 'TTG considerado en Base Imponible'
                        });

                        field_incluir_ventas.defaultValue = "T";

                        var sublist_reports = form.addSublist({
                            id: 'customsearch_pe_generation_logs_sublist',
                            type: ui.SublistType.STATICLIST,
                            label: 'Log de generacion'
                        });
                        sublist_reports.addRefreshButton();
                        var internalId = sublist_reports.addField({
                            id: 'id',
                            label: 'ID',
                            type: ui.FieldType.TEXT
                        });
                        var user = sublist_reports.addField({
                            id: 'user',
                            label: ' Creado por',
                            type: ui.FieldType.TEXT
                        });
                        var datecreate = sublist_reports.addField({
                            id: 'datecreate',
                            label: 'Fecha de creacion',
                            type: ui.FieldType.TEXT
                        });
                        var subsidiary = sublist_reports.addField({
                            id: 'subsidiary',
                            label: 'Subsidiaria',
                            type: ui.FieldType.TEXT
                        });
                        var period = sublist_reports.addField({
                            id: 'period',
                            label: 'Periodo',
                            type: ui.FieldType.TEXT
                        });
                        var bookReport = sublist_reports.addField({
                            id: 'bookreport',
                            label: 'Libro Contable',
                            type: ui.FieldType.TEXT
                        });
                        var reportname = sublist_reports.addField({
                            id: 'reportname',
                            label: 'Reporte',
                            type: ui.FieldType.TEXT
                        });
                        var link = sublist_reports.addField({
                            id: 'link',
                            label: 'Descargar',
                            type: ui.FieldType.TEXT
                        });

                        var mySearch = search.load({
                            id: 'customsearch_pe_generation_logs_sublist'
                        });

                        var resultSetPE = mySearch.run(); //.getRange({start: pageId*10,end: pageId*10+10});
                        var j = 0;
                        resultSetPE.each(function (result) {
                            var txtId = result.getValue(resultSetPE.columns[0]) || '--';
                            var txtUsuario = result.getText(resultSetPE.columns[1]) || '--';
                            var txtDate = result.getValue(resultSetPE.columns[2]) || '--';
                            var txtSubsidi = result.getText(resultSetPE.columns[3]) || '--';
                            //txtSubsidi = txtSubsidi == ''?' ':txtSubsidi;
                            //log.debug({ title: 'txtSubsidi', details: txtSubsidi });
                            var txtPeriod = result.getText(resultSetPE.columns[4]) || '--';
                            //txtPeriod = txtPeriod == ''?' ':txtPeriod;
                            var txtReport = result.getValue(resultSetPE.columns[5]) || '--';
                            var txtStatus = result.getValue(resultSetPE.columns[6]) || '--';
                            var txtFileLog = result.getValue(resultSetPE.columns[7]) || '--';
                            var txtBookLog = result.getValue(resultSetPE.columns[8]) || '--';
                            sublist_reports.setSublistValue({
                                id: 'id',
                                line: j,
                                value: txtId
                            });
                            sublist_reports.setSublistValue({
                                id: 'user',
                                line: j,
                                value: txtUsuario
                            });
                            sublist_reports.setSublistValue({
                                id: 'datecreate',
                                line: j,
                                value: txtDate
                            });
                            if (featureSubsidiary || featureSubsidiary == 'T') {
                                sublist_reports.setSublistValue({
                                    id: 'subsidiary',
                                    line: j,
                                    value: txtSubsidi
                                });
                            }
                            sublist_reports.setSublistValue({
                                id: 'period',
                                line: j,
                                value: txtPeriod
                            });
                            sublist_reports.setSublistValue({
                                id: 'bookreport',
                                line: j,
                                value: txtBookLog
                            });
                            sublist_reports.setSublistValue({
                                id: 'reportname',
                                line: j,
                                value: txtReport
                            });
                            if (txtStatus != 'Generated') {
                                sublist_reports.setSublistValue({
                                    id: 'link',
                                    line: j,
                                    value: txtStatus //txtLink
                                });
                            } else {
                                sublist_reports.setSublistValue({
                                    id: 'link',
                                    line: j,
                                    value: "<a target='_blank' download href='" + txtFileLog + "'>Descargar</a>" //txtLink
                                });
                            }
                            j++;
                            return true;
                        });
                        context.response.writePage(form);

                    } catch (e) {
                        log.error({ title: 'Error', details: e });
                    }

                } else {
                    var request = context.request.parameters;
                    var selectSubs = context.request.parameters.field_subsidiary;
                    var selectRepo = context.request.parameters.field_reporte;
                    var selectPeri = context.request.parameters.field_acc_period;
                    var selectForm = context.request.parameters.field_format;
                    var selectano = context.request.parameters.field_ano;
                    var selectCheck = context.request.parameters.field_boletas_rrhh;
                    var selectCheckVentas = context.request.parameters.field_incluir_ventas;
                    //log.debug({ title: 'request', details: selectano });

                    var selectCuentaAsociada = context.request.parameters.field_account;

                    var paramsJson = {};

                    paramsJson['recordID'] = 0;
                    paramsJson['reportID'] = selectRepo;
                    paramsJson['subsidiary'] = selectSubs;
                    paramsJson['periodCon'] = selectPeri;
                    paramsJson['anioCon'] = selectano;
                    paramsJson['format'] = selectForm;

                    if (selectRepo == 1) {
                        var scriptTask = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: 'customscript_pe_schedule_ple_14',
                            deploymentId: 'customdeploy_pe_schedule_ple_14',
                            params: {
                                custscript_pe_subsidiary_ple_14: selectSubs,
                                custscript_pe_period_ple_14: selectPeri,
                                custscript_pe_page_ple_14: 0,
                                custscript_pe_page2_ple_14: 0,
                                custscript_pe_archivos_gen_ple_14: '',
                                custscript_pe_formato_ple_14: selectForm,
                                custscript_pe_incluir_ple_14: selectCheckVentas
                            }
                        });
                        var scriptTaskId = scriptTask.submit();
                    }
                    if (selectRepo == 3) {
                        /*var scriptTask = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: 'customscript_pe_schedule_ple_5_1_diario',
                            deploymentId: 'customdeploy_pe_schedule_ple_5_1_diario',
                            params: {
                                custscript_pe_subsidiary_ple_5_1: selectSubs,
                                custscript_pe_period_ple_5_1: selectPeri,
                                custscript_pe_format_ple_5_1: selectForm,
                                custscript_pe_ini_ple_5_1: 0
                            }
                        });
                        var scriptTaskId = scriptTask.submit();*/

                        var scriptTask = task.create({
                            taskType: task.TaskType.MAP_REDUCE,
                            scriptId: 'customscript_libro_diario_map_reduce',
                            deploymentId: 'customdeploy_libro_diario_map_reduce',
                            params: {
                                custscript_subsi_diario_mprd: selectSubs,
                                custscript_period_diario_mprd: selectPeri,
                                custscript_format_diario_mprd: selectForm,
                                custscript_ini_diario_mprd: 0
                            }
                        });
                        var scriptTaskId = scriptTask.submit();

                        var scriptTask2 = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: 'customscript_pe_schedule_ple_5_3_cuentas',
                            deploymentId: 'customdeploy_pe_schedule_ple_5_3_cuentas',
                            params: {
                                custscript_pe_subsidiary_ple_5_3: selectSubs,
                                custscript_pe_period_ple_5_3: selectPeri,
                                custscript_pe_format_ple_5_3: selectForm
                                //custscript_pe_archivos_gen_ple_8_1: ''
                            }
                        });
                        var scriptTaskId2 = scriptTask2.submit();

                    }
                    if (selectRepo == 4) {
                        //Anual: Libro de Inventarios y Balances - Detalle del Saldo de la Cuenta 12 - 3.3
                        try {
                            if (selectForm == 'PDF') {
                                var parametrosJson = {};

                                parametrosJson['recordID'] = 10;
                                parametrosJson['reportID'] = selectRepo;
                                parametrosJson['subsidiary'] = selectSubs;
                                parametrosJson['periodCon'] = selectPeri;
                                parametrosJson['anioCon'] = selectano;
                                //Mensual: Formato 3.3 - LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 12 - CLIENTES
                                try {
                                    var scriptTask = task.create({
                                        taskType: task.TaskType.MAP_REDUCE,
                                        scriptId: 'customscript_pe_mr_formato_3_3',
                                        deploymentId: 'customdeploy_pe_mr_formato_3_3',
                                        params: {
                                            custscript_pe_formato_3_3_params: parametrosJson
                                        }
                                    });
                                    scriptTask.submit();

                                } catch (e) {
                                    log.error({ title: 'Error - Formato 3.3', details: e });
                                }
                            }
                            else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_sc_ple_3_3_libro_in_y_ba',
                                    deploymentId: 'customdeploy_pe_sc_ple_3_3_libro_in_y_ba',
                                    params: {
                                        custscript_pe_subsidiary_ple_iyb_3_3: selectSubs,
                                        custscript_pe_period_ple_iyb_3_3: selectPeri,
                                        custscript_pe_format_ple_iyb_3_3: selectForm,
                                        custscript_pe_filecabinetid_ple_iyb_3_3: fileCabinetId,
                                        custscript_pe_anio_ple_iyb_3_3: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 5) {
                        //Anual: Anual: Inv. Balance - Detalle 14 - 3.4
                        try {
                            if (selectForm == 'PDF') {
                                //Mensual: Formato 3.4 - LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 14

                                var parametrosJson = {};

                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_formato_3_4",
                                    deploymentId: "customdeploy_pe_mr_formato_3_4",
                                    params: {
                                        custscript_pe_formato_3_4_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();

                            } else {

                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_sc_ple_3_4_libro_in_y_ba',
                                    deploymentId: 'customdeploy_pe_sc_ple_3_4_libro_in_y_ba',
                                    params: {
                                        custscript_pe_subsidiary_ple_iyb_3_4: selectSubs,
                                        custscript_pe_period_ple_iyb_3_4: 113,
                                        custscript_pe_format_ple_iyb_3_4: 'TXT',
                                        custscript_pe_filecabinetid_ple_iyb_3_4: fileCabinetId,
                                        custscript_pe_anio_ple_iyb_3_4: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 6) {
                        //Anual: Inv. Balance - Detalle 16 - 3.5
                        try {
                            if (selectForm == 'PDF') {
                                //Mensual: Formato 3.5 - LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 16

                                var parametrosJson = {};

                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_formato_3_5",
                                    deploymentId: "customdeploy_pe_mr_formato_3_5",
                                    params: {
                                        custscript_pe_formato_3_5_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_sc_ple_3_5_libro_in_y_ba',
                                    deploymentId: 'customdeploy_pe_sc_ple_3_5_libro_in_y_ba',
                                    params: {
                                        custscript_pe_subsidiary_ple_iyb_3_5: selectSubs,
                                        custscript_pe_period_ple_iyb_3_5: selectPeri,
                                        custscript_pe_format_ple_iyb_3_5: selectForm,
                                        custscript_pe_filecabinetid_ple_iyb_3_5: fileCabinetId,
                                        custscript_pe_anio_ple_iyb_3_5: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 7) {
                        //Anual: Inv. Balance - Detalle 19 - 3.6
                        try {
                            if (selectForm == 'PDF') {
                                //Mensual: Formato 3.6 - LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 19

                                var parametrosJson = {};

                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_formato_3_6",
                                    deploymentId: "customdeploy_pe_mr_formato_3_6",
                                    params: {
                                        custscript_pe_formato_3_6_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_sc_ple_3_6_libro_in_y_ba',
                                    deploymentId: 'customdeploy_pe_sc_ple_3_6_libro_in_y_ba',
                                    params: {
                                        custscript_pe_subsidiary_ple_iyb_3_6: selectSubs,
                                        custscript_pe_period_ple_iyb_3_6: selectPeri,
                                        custscript_pe_format_ple_iyb_3_6: selectForm,
                                        custscript_pe_filecabinetid_ple_iyb_3_6: fileCabinetId,
                                        custscript_pe_anio_ple_iyb_3_6: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 8) {
                        //Anual: Inv. Balance - Detalle 20 - 3.7
                        try {

                            if (selectForm == 'PDF') {
                                //Mensual: Formato 3.6 - LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 19

                                var parametrosJson = {};

                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_formato_3_7",
                                    deploymentId: "customdeploy_pe_mr_formato_3_7",
                                    params: {
                                        custscript_pe_formato_3_7_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_sc_ple_3_7_libro_in_y_ba',
                                    deploymentId: 'customdeploy_pe_sc_ple_3_7_libro_in_y_ba',
                                    params: {
                                        custscript_pe_subsidiary_ple_iyb_3_7: selectSubs,
                                        custscript_pe_period_ple_iyb_3_7: selectPeri,
                                        custscript_pe_format_ple_iyb_3_7: selectForm,
                                        custscript_pe_filecabinetid_ple_iyb_3_7: fileCabinetId,
                                        custscript_pe_anio_ple_iyb_3_7: selectano
                                    }
                                });
                                scriptTask.submit();
                            }

                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 9) {
                        var scriptTask = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: 'customscript_pe_schedule_plame_4ta',
                            deploymentId: 'customdeploy_pe_schedule_plame_4ta',
                            params: {
                                custscript_pe_subsidiary_plame_4ta: selectSubs,
                                custscript_pe_period_plame_4ta: selectPeri,
                                custscript_pe_formato_plame_4ta: selectForm
                            }
                        });
                        var scriptTaskId = scriptTask.submit();

                    }
                    if (selectRepo == 10) {
                        //Anual: Inv. Balance - Detalle 34 - 3.9
                        try {
                            log.debug('MSK-10', 'selectRepo = ' + selectRepo)
                            log.debug('MSK-10', 'selectForm = ' + selectForm)
                            if (selectForm == 'PDF') {
                                var parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;

                                log.debug('MSK-10', 'antes de llamar al mr')
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_3_9_detintang",
                                    deploymentId: "customdeploy_pe_mr_3_9_detintang",
                                    params: {
                                        custscript_pe_3_9_detintang_params: parametrosJson,
                                    },
                                });
                                log.debug('MSK-10', 'despues de llamar al mr')
                                scriptTask.submit();
                                log.debug('MSK-10', 'despues del submit')
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: "customscript_pe_sc_ple_3_9_lib_in_y_ba",
                                    deploymentId: "customdeploy_pe_sc_ple_3_9_lib_in_y_ba",
                                    params: {
                                        custscript_pe_subsidiary_ple_iyb_3_9: selectSubs,
                                        custscript_pe_period_ple_iyb_3_9: selectPeri,
                                        custscript_pe_format_ple_iyb_3_9: selectForm,
                                        custscript_pe_filecabinetid_ple_iyb_3_9: fileCabinetId,
                                        custscript_pe_anio_ple_iyb_3_9: selectano,
                                    },
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: "Error", details: "Error Libro: " + selectRepo + " - " + e });
                        }
                    }
                    if (selectRepo == 11) {
                        /*var scriptTask = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: 'customscript_pe_schedule_ple_10_efectivo',
                            deploymentId: 'customdeploy_pe_schedule_ple_10_efectivo',
                            params: {
                                custscript_pe_ple_10_subsidiary: selectSubs,
                                custscript_pe_ple_10_year_acc: selectano,
                                custscript_pe_ple_10_format: selectForm
                            }
                        });*/
                        var scriptTask = task.create({
                            taskType: task.TaskType.MAP_REDUCE,
                            scriptId: 'customscript_pe_mprd_ple_10_efectivo',
                            deploymentId: 'customdeploy_pe_mprd_ple_10_efectivo',
                            params: {
                                custscript_pe_ple_10_subsidiary_mprd: selectSubs,
                                custscript_pe_ple_10_year_acc_mprd: selectano,
                                custscript_pe_ple_10_format_mprd: selectForm
                            }
                        });
                        var scriptTaskId = scriptTask.submit();

                    }
                    if (selectRepo == 12) {
                        var scriptTask = task.create({
                            taskType: task.TaskType.MAP_REDUCE,
                            scriptId: 'customscript_pe_mprd_ple_12_cxc_comer',
                            deploymentId: 'customdeploy_pe_mprd_ple_12_cxc_comer',
                            params: {
                                custscript_pe_ple_12_subsidiary_mprd: selectSubs,
                                custscript_pe_ple_12_year_acc_mprd: selectano,
                                custscript_pe_ple_12_format_mprd: selectForm
                            }
                        });
                        var scriptTaskId = scriptTask.submit();

                    }
                    if (selectRepo == 13) {
                        //Anual: Inv. Balance - Detalle 42 - 3.12
                        try {
                            //Anual: Formato 3.12 -LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 42 - PROVEEDORES
                            if (selectForm == "PDF") {
                                var parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_3_12_detproveedores",
                                    deploymentId: "customdeploy_pe_mr_3_12_detproveedores",
                                    params: {
                                        custscript_pe_3_12_detproveedores_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: "customscript_pe_sc_ple_3_12_lib_in_y_ba",
                                    deploymentId: "customdeploy_pe_sc_ple_3_12_lib_in_y_ba",
                                    params: {
                                        custscript_pe_subsidiary_ple_iyb_3_12: selectSubs,
                                        custscript_pe_period_ple_iyb_3_12: 116, // 116 Nov
                                        custscript_pe_format_ple_iyb_3_12: selectForm,
                                        custscript_pe_filecabinetid_ple_iyb_3_12: fileCabinetId,
                                        custscript_pe_anio_ple_iyb_3_12: selectano,
                                    },
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 14) {
                        //Anual: Inv. Balance - Detalle 46 - 3.13
                        try {
                            if (selectForm == "PDF") {
                                //Anual: Formato 3.13 - LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 46
                                var parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_3_13_detcxpdivers",
                                    deploymentId: "customdeploy_pe_mr_3_13_detcxpdivers",
                                    params: {
                                        custscript_pe_3_13_detcxpdivers_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_sc_ple_3_13_lib_in_y_ba',
                                    deploymentId: 'customdeploy_pe_sc_ple_3_13_lib_in_y_ba',
                                    params: {
                                        custscript_pe_subsidiary_ple_iyb_3_13: selectSubs,
                                        custscript_pe_period_ple_iyb_3_13: selectPeri,
                                        custscript_pe_format_ple_iyb_3_13: selectForm,
                                        custscript_pe_filecabinetid_ple_iyb_3_13: fileCabinetId,
                                        custscript_pe_anio_ple_iyb_3_13: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }

                    if (selectRepo == 16) {
                        // Anual: Inv. Balance - Estado de Situacion Financiera - 3.1
                        try {
                            if (selectForm == 'PDF') {
                                var parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_3_1libro",
                                    deploymentId: "customdeploy1",
                                    params: {
                                        custscript_pe_formato_3_2_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_sc_ple_3_1_lib_in_y_ba',
                                    deploymentId: 'customdeploy_pe_sc_ple_3_1_lib_in_y_ba',
                                    params: {
                                        custscript_pe_subsidiary_ple_iyb_3_1: selectSubs,
                                        custscript_pe_period_ple_iyb_3_1: selectPeri,
                                        custscript_pe_format_ple_iyb_3_1: selectForm,
                                        custscript_pe_filecabinetid_ple_iyb_3_1: fileCabinetId,
                                        custscript_pe_anio_ple_iyb_3_1: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 19) {
                        //  Mensual: Libro Mayor 5.1
                        try {
                            if (selectForm == 'PDF') {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_51librodiario',
                                    deploymentId: 'customdeploy_pe_51librodiario',
                                    params: {
                                        custscript_pe_51librodiario_params: paramsJson
                                    }
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_schedule_ple_5_1_diario',
                                    deploymentId: 'customdeploy_pe_schedule_ple_5_1_diario',
                                    params: {
                                        custscript_pe_subsidiary_ple_5_1: selectSubs,
                                        custscript_pe_period_ple_5_1: selectPeri,
                                        custscript_pe_format_ple_5_1: selectForm,
                                        //custscript_pe_ini_ple_5_1: 0,
                                        custscript_pe_filecabinetid_ple_5_1: fileCabinetId
                                    }
                                });
                                log.debug('para1', selectSubs + 'para2' + selectPeri + 'para3' + selectForm + 'para4' + fileCabinetId);
                                scriptTask.submit();
                            }


                        } catch (e) {
                            log.error({ title: 'Error', details: e });
                        }
                    }
                    if (selectRepo == 20) {
                        //Mensual: Libro Mayor 6.1
                        try {
                            if (selectForm == 'PDF') {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_61libromayor',
                                    deploymentId: 'customdeploy_pe_61libromayor',
                                    params: {
                                        custscript_pe_61libromayor_params: paramsJson
                                    }
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_schedule_ple_6_1_mayor',
                                    deploymentId: 'customdeploy_pe_schedule_ple_6_1_mayor',
                                    params: {
                                        custscript_pe_subsidiary_ple_6_1: selectSubs,
                                        custscript_pe_period_ple_6_1: selectPeri,
                                        custscript_pe_format_ple_6_1: selectForm,
                                        custscript_pe_ini_ple_6_1: 0,
                                        custscript_pe_filecabinetid_ple_6_1: fileCabinetId
                                    }
                                });
                                scriptTask.submit();
                            }


                        } catch (e) {
                            log.error({ title: 'ErrorLibroMayor6.1', details: e });
                        }
                    }
                    // if (selectRepo == 22) {
                    //     var scriptTask = task.create({
                    //         taskType: task.TaskType.SCHEDULED_SCRIPT,
                    //         scriptId: 'customscript_pe_schedule_ple_8_1',
                    //         deploymentId: 'customdeploy_pe_schedule_ple_8_1',
                    //         params: {
                    //             'custscript_pe_subsidiary_ple_8_1': selectSubs,
                    //             'custscript_pe_period_ple_8_1': selectPeri,
                    //             'custscript_pe_page_ple_8_1': 0,
                    //             'custscript_pe_archivos_gen_ple_8_1': '',
                    //             'custscript_pe_formato_8_1': selectForm,
                    //             'custscript_pe_incluir_8_1': selectCheck
                    //         }
                    //     });
                    //     var scriptTaskId = scriptTask.submit();
                    //     var scriptTask2 = task.create({
                    //         taskType: task.TaskType.SCHEDULED_SCRIPT,
                    //         scriptId: 'customscript_pe_schedule_ple_8_2',
                    //         deploymentId: 'customdeploy_pe_schedule_ple_8_2',
                    //         params: {
                    //             custscript_pe_subsidiary_ple_8_2: selectSubs,
                    //             custscript_pe_period_ple_8_2: selectPeri,
                    //             custscript_pe_page_ple_8_2: 0,
                    //             custscript_pe_archivos_gen_ple_8_2: '',
                    //             custscript_pe_formato_8_2: selectForm,
                    //             custscript_pe_incluir_8_2: selectCheck
                    //         }
                    //     });
                    //     var scriptTaskId2 = scriptTask2.submit();
                    // }

                    if (selectRepo == 22) {
                        try {
                            var scriptTask = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 'customscript_pe_schedule_ple_8_1',
                                deploymentId: 'customdeploy_pe_schedule_ple_8_1',
                                params: {
                                    'custscript_pe_subsidiary_ple_8_1': selectSubs,
                                    'custscript_pe_period_ple_8_1': selectPeri,
                                    'custscript_pe_page_ple_8_1': 0,
                                    'custscript_pe_archivos_gen_ple_8_1': '',
                                    'custscript_pe_formato_8_1': selectForm,
                                    'custscript_pe_incluir_8_1': selectCheck
                                }
                            });
                            var scriptTaskId = scriptTask.submit();
                            var scriptTask2 = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 'customscript_pe_schedule_ple_8_2',
                                deploymentId: 'customdeploy_pe_schedule_ple_8_2',
                                params: {
                                    custscript_pe_subsidiary_ple_8_2: selectSubs,
                                    custscript_pe_period_ple_8_2: selectPeri,
                                    custscript_pe_formato_8_2: selectForm,
                                    custscript_pe_filecabinetid_ple_8_2: fileCabinetId
                                }
                            });
                            var scriptTaskId2 = scriptTask2.submit();
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 23) {
                        try {
                            var scriptTask = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 'customscript_pe_sc_ple_14_1_regventas',
                                deploymentId: 'customdeploy_pe_sc_ple_14_1_regventas',
                                params: {
                                    custscript_pe_subsidiary_ple_regv_14_1: selectSubs,
                                    custscript_pe_period_ple_regv_14_1: selectPeri,
                                    custscript_pe_format_ple_regv_14_1: selectForm,
                                    custscript_pe_filecabinet_ple_regv_14_1: fileCabinetId
                                }
                            });
                            scriptTask.submit();
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 25) {
                        var scriptTask = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: 'customscript_pe_schedule_ple_9_1',
                            deploymentId: 'customdeploy_pe_schedule_ple_9_1',
                            params: {
                                custscript_pe_subsidiary_ple_9_1: selectSubs,
                                custscript_pe_period_ple_9_1: selectPeri,
                                custscript_pe_format_ple_9_1: selectForm
                            }
                        });
                        var scriptTaskId = scriptTask.submit();

                    }
                    if (selectRepo == 26) {
                        var scriptTask = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: 'customscript_pe_schedule_ple_9_2',
                            deploymentId: 'customdeploy_pe_schedule_ple_9_2',
                            params: {
                                custscript_pe_subsidiary_ple_9_2: selectSubs,
                                custscript_pe_period_ple_9_2: selectPeri,
                                custscript_pe_format_ple_9_2: selectForm
                            }
                        });
                        var scriptTaskId = scriptTask.submit();

                    }
                    if (selectRepo == 101) {
                        try {
                            if (selectForm == 'PDF') {
                                //Mensual: Formato 1.2 - LIBRO CAJA Y BANCOS - DETALLE DE LOS MOVIMIENTOS DE LA CUENTA CORRIENTE
                                var parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["cuentaId"] = selectCuentaAsociada;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_formato_1_2",
                                    deploymentId: "customdeploy_pe_mr_formato_1_2",
                                    params: {
                                        custscript_pe_formato_1_2_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_sc_ple_1_2_caja_y_banco',
                                    deploymentId: 'customdeploy_pe_sc_ple_1_2_caja_y_banco',
                                    params: {
                                        custscript_pe_subsidiary_ple_cyb_1_2: selectSubs,
                                        custscript_pe_period_ple_cyb_1_2: selectPeri,
                                        custscript_pe_format_ple_cyb_1_2: selectForm,
                                        custscript_pe_filecabinetid_ple_cyb_1_2: fileCabinetId,
                                        custscript_pe_ini_ple_cyb_1_2: 0
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 102) {
                        try {
                            if (selectForm == 'PDF') {
                                //Mensual: Formato 1.1 - LIBRO CAJA Y BANCOS - DETALLE DE LOS MOVIMIENTOS DEL EFECTIVO
                                var parametrosJson = {};

                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_formato_1_1",
                                    deploymentId: "customdeploy_pe_mr_formato_1_1",
                                    params: {
                                        custscript_pe_formato_1_1_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();

                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_sc_ple_1_1_caja_y_banco',
                                    deploymentId: 'customdeploy_pe_sc_ple_1_1_caja_y_banco',
                                    params: {
                                        custscript_pe_subsidiary_ple_cyb_1_1: selectSubs,
                                        custscript_pe_period_ple_cyb_1_1: selectPeri,
                                        custscript_pe_format_ple_cyb_1_1: selectForm,
                                        custscript_pe_filecabinetid_ple_cyb_1_1: fileCabinetId,
                                        custscript_pe_ini_ple_cyb_1_1: 0
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 103) {
                        try {
                            if (selectForm == "PDF") {
                                //Mensual - FORMATO 5.3: "Mensual: Libro Diario 5.3 - Detalle Plan de Contable Utilizado": Results
                                var parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_5_3_libro_diario",
                                    deploymentId: "customdeploy_pe_mr_5_3_libro_diario",
                                    params: {
                                        custscript_pe_5_3_librod_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_sc_ple_5_3_libro_diario',
                                    deploymentId: 'customdeploy_pe_sc_ple_5_3_libro_diario',
                                    params: {
                                        custscript_pe_subsidiary_ple_ld_5_3: selectSubs,
                                        custscript_pe_format_ple_ld_5_3: selectForm,
                                        custscript_pe_filecabinetid_ple_ld_5_3: fileCabinetId,
                                        custscript_pe_period_ple_ld_5_3: selectPeri
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 104) {
                        //Anual: Libro de Inventario y Balances - Detalle del Saldo de la Cuenta 10 - 3.2
                        try {
                            var scriptTask = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 'customscript_pe_sc_ple_3_2_libro_in_y_ba',
                                deploymentId: 'customdeploy_pe_sc_ple_3_2_libro_in_y_ba',
                                params: {
                                    custscript_pe_subsidiary_ple_iyb_3_2: selectSubs,
                                    custscript_pe_period_ple_iyb_3_2: selectPeri,
                                    custscript_pe_format_ple_iyb_3_2: selectForm,
                                    custscript_pe_filecabinetid_ple_iyb_3_2: fileCabinetId,
                                    custscript_pe_anio_ple_iyb_3_2: selectano
                                }
                            });
                            scriptTask.submit();
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 106) {
                        //Anual: Libro de Inventario y Balances - Detalle del Saldo de la Cuenta 49 - 3.15
                        try {
                            if (selectForm == "PDF") {
                                //Anual - FORMATO 3.15: "LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 49": Results
                                var parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;

                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_3_15_detgandif",
                                    deploymentId: "customdeploy_pe_mr_3_15_detgandif",
                                    params: {
                                        custscript_pe_3_15_detgandif_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_sc_ple_3_15_lib_in_y_ba',
                                    deploymentId: 'customdeploy_pe_sc_ple_3_15_lib_in_y_ba',
                                    params: {
                                        custscript_pe_subsidiary_ple_iyb_3_15: selectSubs,
                                        custscript_pe_period_ple_iyb_3_15: selectPeri,
                                        custscript_pe_format_ple_iyb_3_15: selectForm,
                                        custscript_pe_filecabinetid_ple_iyb_3_15: fileCabinetId,
                                        custscript_pe_anio_ple_iyb_3_15: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 107) {
                        // Anual: Inv. Balance - Detalle 47 - 3.14
                        try {
                            if (selectForm == 'PDF') {
                                let parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_mr_3_14_inventariosbalde',
                                    deploymentId: 'customdeploy_pe_mr_3_14_inventariosbalde',
                                    params: {
                                        custscript_pe_3_14_inventariosbaldet_par: parametrosJson
                                    }
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_sc_ple_3_14_lib_in_y_ba',
                                    deploymentId: 'customdeploy_pe_sc_ple_3_14_lib_in_y_ba',
                                    params: {
                                        custscript_pe_subsidiary_ple_iyb_3_14: selectSubs,
                                        custscript_pe_period_ple_iyb_3_14: selectPeri,
                                        custscript_pe_format_ple_iyb_3_14: selectForm,
                                        custscript_pe_filecabinetid_ple_iyb_3_14: fileCabinetId,
                                        custscript_pe_anio_ple_iyb_3_14: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 109) {
                        //Anual: Libro de Inventario y Balances - Estado de resultados - 3.20
                        try {
                            if (selectForm == 'PDF') {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_320libinvbal',
                                    deploymentId: 'customdeploy_pe_320libinvbal',
                                    params: {
                                        custscript_pe_320libinvbal_params: paramsJson
                                    }
                                });
                                scriptTask.submit();

                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_sc_ple_3_20_lib_in_y_ba',
                                    deploymentId: 'customdeploy_pe_sc_ple_3_20_lib_in_y_ba',
                                    params: {
                                        custscript_pe_subsidiary_ple_iyb_3_20: selectSubs,
                                        custscript_pe_period_ple_iyb_3_20: selectPeri,
                                        custscript_pe_format_ple_iyb_3_20: selectForm,
                                        custscript_pe_filecabinetid_ple_iyb_3_20: fileCabinetId,
                                        custscript_pe_anio_ple_iyb_3_20: selectano
                                    }
                                });
                                scriptTask.submit();
                            }

                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 110) {
                        //Anual: Libro de Inventario y Balances - Estado de resultados integrales - 3.24
                        try {
                            if (selectForm == 'PDF') {
                                let parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_mr_formato_3_24',
                                    deploymentId: 'customdeploy_pe_mr_formato_3_24',
                                    params: {
                                        custscript_pe_formato_3_24_params: parametrosJson
                                    }
                                });
                                scriptTask.submit();
                                //log.debug('PDF/MR', 'LIBRO 3.24')
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_sc_ple_3_24_lib_in_y_ba',
                                    deploymentId: 'customdeploy_pe_sc_ple_3_24_lib_in_y_ba',
                                    params: {
                                        custscript_pe_subsidiary_ple_iyb_3_24: selectSubs,
                                        custscript_pe_period_ple_iyb_3_24: selectPeri,
                                        custscript_pe_format_ple_iyb_3_24: selectForm,
                                        custscript_pe_filecabinetid_ple_iyb_3_24: fileCabinetId,
                                        custscript_pe_anio_ple_iyb_3_24: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 111) {
                        //Anual: Libro de Inventario y Balances - Estado de flujos de efectivo - 3.25
                        try {
                            if (selectForm == 'PDF') {
                                let parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_mr_formato_3_25',
                                    deploymentId: 'customdeploy_pe_mr_formato_3_25',
                                    params: {
                                        custscript_pe_formato_3_25_params: parametrosJson
                                    }
                                });
                                scriptTask.submit();
                                //log.debug('PDF/MR', 'LIBRO 3.25')
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_sc_ple_3_25_lib_in_y_ba',
                                    deploymentId: 'customdeploy_pe_sc_ple_3_25_lib_in_y_ba',
                                    params: {
                                        custscript_pe_subsidiary_ple_iyb_3_25: selectSubs,
                                        custscript_pe_period_ple_iyb_3_25: selectPeri,
                                        custscript_pe_format_ple_iyb_3_25: selectForm,
                                        custscript_pe_filecabinetid_ple_iyb_3_25: fileCabinetId,
                                        custscript_pe_anio_ple_iyb_3_25: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 112) {
                        //  Mensual: Libro de Registro del inventario permanente valorizado -detalle del inventario valorizado - 13.1
                        try {
                            if (selectForm == "PDF") {
                                var parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_13_1_inv_val",
                                    deploymentId: "customdeploy_pe_mr_13_1_inv_val",
                                    params: {
                                        custscript_pe_13_1_invval_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_sc_ple_13_1_lib_in_y_ba',
                                    deploymentId: 'customdeploy_pe_sc_ple_13_1_lib_in_y_ba',
                                    params: {
                                        custscript_pe_subsidiary_ple_iyb_13_1: selectSubs,
                                        custscript_pe_period_ple_iyb_13_1: selectPeri,
                                        custscript_pe_format_ple_iyb_13_1: selectForm,
                                        custscript_pe_filecabinetid_ple_iyb_13_1: fileCabinetId
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 113) {
                        //	Anual: Libro de Inventario y Balances - Balance de Comprobación- 3.17

                        try {
                            if (selectForm == 'PDF') {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_317libinvbal',
                                    deploymentId: 'customdeploy_pe_317libinvbal',
                                    params: {
                                        custscript_pe_317_libinvbal_params: paramsJson
                                    }
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_sc_ple_3_17_lib_in_y_ba',
                                    deploymentId: 'customdeploy_pe_sc_ple_3_17_lib_in_y_ba',
                                    params: {
                                        custscript_pe_subsidiary_ple_iyb_3_17: selectSubs,
                                        custscript_pe_period_ple_iyb_3_17: selectPeri,
                                        custscript_pe_format_ple_iyb_3_17: selectForm,
                                        custscript_pe_filecabinetid_ple_iyb_3_17: fileCabinetId,
                                        custscript_pe_anio_ple_iyb_3_17: selectano
                                    }
                                });
                                scriptTask.submit();
                            }

                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    if (selectRepo == 114) {
                        //  Anual: LAnual: Libro de Registro del inventario permanente - detalle del inventario permanente - 12.1
                        try {
                            if (selectForm == "PDF") {
                                var parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: "customscript_pe_mr_12_1_inv_perm",
                                    deploymentId: "customdeploy_pe_mr_12_1_inv_perm",
                                    params: {
                                        custscript_pe_12_1_invper_params: parametrosJson,
                                    },
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_sc_ple_12_1_lib_in_perm',
                                    deploymentId: 'customdeploy_pe_sc_ple_12_1_lib_in_perm',
                                    params: {
                                        custscript_pe_subsidiary_ple_iyb_12_1: selectSubs,
                                        custscript_pe_period_ple_iyb_12_1: selectPeri,
                                        custscript_pe_format_ple_iyb_12_1: selectForm,
                                        custscript_pe_filecabinetid_ple_iyb_12_1: fileCabinetId
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }

                    //IMorales 20230712 - Inicio
                    if (selectRepo == 119) {
                        //Mensual: Recibos por Honorarios
                        try {
                            var scriptTask = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 'customscript_pe_schedule_rxh',
                                deploymentId: 'customdeploy_pe_schedule_rxh',
                                params: {
                                    custscript_pe_subsidiary_rpt_rxh: selectSubs,
                                    custscript_pe_period_rpt_rxh: selectPeri,
                                    custscript_pe_format_rpt_rxh: selectForm,
                                    custscript_pe_ini_rpt_rxh: 0,
                                    custscript_pe_filecabinetid_rpt_rxh: fileCabinetId
                                }
                            });
                            scriptTask.submit();

                        } catch (e) {
                            log.error({ title: 'ErrorReporteRxH', details: e });
                        }
                    }
                    //IMorales 20230712 - Fin

                    //IMorales 20230717 - Inicio
                    if (selectRepo == 120) {
                        //Mensual: Libro de Inventario y Balances - Detalle del Saldo de la Cuenta 34 - 3.9
                        try {
                            var scriptTask = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 'customscript_pe_schedule_invbal3_9',
                                deploymentId: 'customdeploy_pe_schedule_invbal3_9',
                                params: {
                                    custscript_pe_subsidiary_invbal3_9: selectSubs,
                                    custscript_pe_period_invbal3_9: selectPeri,
                                    custscript_pe_format_invbal3_9: selectForm,
                                    custscript_pe_ini_invbal3_9: 0,
                                    custscript_pe_filecabinetid_in: fileCabinetId
                                }
                            });
                            scriptTask.submit();

                        } catch (e) {
                            log.error({ title: 'ErrorInvBal3_9', details: e });
                        }
                    }
                    if (selectRepo == 121) {
                        //  Anual: Registro de Activos Fijos - Detalle de los activos fijos revaluados y no revaluados 7.1
                        try {
                            if (selectForm == 'PDF') {
                                let parametrosJson = {};

                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_mr_71activofijo',
                                    deploymentId: 'customdeploy_pe_mr_71activofijo',
                                    params: {
                                        custscript_pe_mr_71activofijo_params: parametrosJson
                                    }
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_schedule_activofijo_7_1',
                                    deploymentId: 'customdeploy_pe_schedule_activofijo_7_1',
                                    params: {
                                        custscript_pe_subsidiary_af7_1: selectSubs,
                                        custscript_pe_period_af7_1: selectPeri,
                                        custscript_pe_format__af7_1: selectForm,
                                        custscript_pe_filecabinetid_af7_1: fileCabinetId,
                                        custscript_pe_anio_af7_1: selectano
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }
                    //IMorales 20230717 - Fin

                    //IMorales 20230821 - Inicio
                    if (selectRepo == 122) {
                        //Mensual: Reporte de Comprobantes de Retencion
                        try {
                            var scriptTask = task.create({
                                taskType: task.TaskType.SCHEDULED_SCRIPT,
                                scriptId: 'customscript_pe_scheduled_retenciones',
                                deploymentId: 'customdeploy_pe_scheduled_retenciones',
                                params: {
                                    custscript_pe_subsidiary_retenciones: selectSubs,
                                    custscript_pe_period_retenciones: selectPeri,
                                    custscript_pe_format_retenciones: selectForm,
                                    custscript_pe_ini_retenciones: 0,
                                    custscript_pe_filecabinetid_retenciones: fileCabinetId
                                }
                            });
                            scriptTask.submit();

                        } catch (e) {
                            log.error({ title: 'ErrorRetenciones', details: e });
                        }
                    }

                    //!IMorales 20230828 - Opciones (123, 124, 125, 126, 127, 128)
                    /*if (selectRepo == 123) {

                        var parametrosJson = {};

                        parametrosJson['recordID'] = 10;
                        parametrosJson['reportID'] = selectRepo;
                        parametrosJson['subsidiary'] = selectSubs;
                        parametrosJson['periodCon'] = selectPeri;

                        //Mensual: Formato 1.1 - LIBRO CAJA Y BANCOS - DETALLE DE LOS MOVIMIENTOS DEL EFECTIVO
                        try {
                            var scriptTask = task.create({
                                taskType: task.TaskType.MAP_REDUCE,
                                scriptId: 'customscript_pe_mr_formato_1_1',
                                deploymentId: 'customdeploy_pe_mr_formato_1_1',
                                params: {
                                    custscript_pe_formato_1_1_params: parametrosJson
                                }
                            });
                            scriptTask.submit();

                        } catch (e) {
                            log.error({ title: 'Error - Formato 1.1', details: e });
                        }
                    }*/
                    /*if (selectRepo == 124) {
                        //Mensual: Formato 1.2 - LIBRO CAJA Y BANCOS - DETALLE DE LOS MOVIMIENTOS DE LA CUENTA CORRIENTE

                        var parametrosJson = {};
                        parametrosJson['recordID'] = 10;
                        parametrosJson['reportID'] = selectRepo;
                        parametrosJson['subsidiary'] = selectSubs;
                        parametrosJson['periodCon'] = selectPeri;
                        parametrosJson['cuentaId'] = selectCuentaAsociada;
                        try {

                            var scriptTask = task.create({
                                taskType: task.TaskType.MAP_REDUCE,
                                scriptId: 'customscript_pe_mr_formato_1_2',
                                deploymentId: 'customdeploy_pe_mr_formato_1_2',
                                params: {
                                    custscript_pe_formato_1_2_params: parametrosJson
                                }
                            });
                            scriptTask.submit();

                        } catch (e) {
                            log.error({ title: 'Error - Formato 1.2', details: e });
                        }
                    }*/
                    if (selectRepo == 125) {
                        //Mensual: Formato 3.2 - LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 10 - CAJA Y BANCOS
                        try {
                            if (selectForm == 'PDF') {
                                let parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_mr_3_2_inventariosbal',
                                    deploymentId: 'customdeploy_pe_mr_3_2_inventariosbal',
                                    params: {
                                        custscript_pe_3_2_inventariosbal_params: parametrosJson
                                    }
                                });
                                scriptTask.submit();
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_scheduled_formato_3_2',
                                    deploymentId: 'customdeploy_pe_scheduled_formato_3_2',
                                    params: {
                                        custscript_pe_subsidiary_formato_3_2: selectSubs,
                                        custscript_pe_period_formato_3_2: selectPeri,
                                        custscript_pe_format_formato_3_2: selectForm,
                                        custscript_pe_ini_formato_3_2: 0,
                                        custscript_pe_filecabinetid_formato_3_2: fileCabinetId
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error - Formato 3.2', details: e });
                        }
                    }
                    /*if (selectRepo == 126) {
                        
                        var parametrosJson = {};

                        parametrosJson['recordID'] = 10;
                        parametrosJson['reportID'] = selectRepo;
                        parametrosJson['subsidiary'] = selectSubs;
                        parametrosJson['periodCon'] = selectPeri;
                        parametrosJson['anioCon'] = selectano;
                        
                        //Mensual: Formato 3.4 - LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 14
                        try {
                            var scriptTask = task.create({
                                taskType: task.TaskType.MAP_REDUCE,
                                scriptId: 'customscript_pe_mr_formato_3_4',
                                deploymentId: 'customdeploy_pe_mr_formato_3_4',
                                params: {
                                    custscript_pe_formato_3_4_params: parametrosJson
                                }
                            });
                            scriptTask.submit();

                        } catch (e) {
                            log.error({ title: 'Error - Formato 3.4', details: e });
                        }
                    }*/
                    /*if (selectRepo == 127) {
                        
                        var parametrosJson = {};

                        parametrosJson['recordID'] = 10;
                        parametrosJson['reportID'] = selectRepo;
                        parametrosJson['subsidiary'] = selectSubs;
                        parametrosJson['periodCon'] = selectPeri;
                        parametrosJson['anioCon'] = selectano;

                        //Mensual: Formato 3.5 - LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 16
                        try {
                            var scriptTask = task.create({
                                taskType: task.TaskType.MAP_REDUCE,
                                scriptId: 'customscript_pe_mr_formato_3_5',
                                deploymentId: 'customdeploy_pe_mr_formato_3_5',
                                params: {
                                    custscript_pe_formato_3_5_params: parametrosJson
                                }
                            });
                            scriptTask.submit();

                        } catch (e) {
                            log.error({ title: 'Error - Formato 3.5', details: e });
                        }
                    }*/
                    /*if (selectRepo == 128) {
                        
                        var parametrosJson = {};

                        parametrosJson['recordID'] = 10;
                        parametrosJson['reportID'] = selectRepo;
                        parametrosJson['subsidiary'] = selectSubs;
                        parametrosJson['periodCon'] = selectPeri;
                        parametrosJson['anioCon'] = selectano;
                        //Mensual: Formato 3.6 - LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 19
                        try {
                            var scriptTask = task.create({
                                taskType: task.TaskType.MAP_REDUCE,
                                scriptId: 'customscript_pe_mr_formato_3_6',
                                deploymentId: 'customdeploy_pe_mr_formato_3_6',
                                params: {
                                    custscript_pe_formato_3_6_params: parametrosJson
                                }
                            });
                            scriptTask.submit();

                        } catch (e) {
                            log.error({ title: 'Error - Formato 3.6', details: e });
                        }
                    }*/
                    //!GGuadalupe 20230828 - Opciones (129, 130, 131, 132, 133)
                    /*if (selectRepo == 129) {
                      //Anual: Formato 3.9 - LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 34 - INTANGIBLES
                      let parametrosJson = {};

                      parametrosJson["recordID"] = 10;
                      parametrosJson["reportID"] = selectRepo;
                      parametrosJson["subsidiary"] = selectSubs;
                      parametrosJson["periodCon"] = selectPeri;
                      parametrosJson["anioCon"] = selectano;

                      try {
                        var scriptTask = task.create({
                          taskType: task.TaskType.MAP_REDUCE,
                          scriptId: "customscript_pe_mr_3_9_detintang",
                          deploymentId: "customdeploy_pe_mr_3_9_detintang",
                          params: {
                            custscript_pe_3_9_detintang_params: parametrosJson,
                          },
                        });
                        scriptTask.submit();
                      } catch (e) {
                        log.error({ title: "Error - Formato 3.9", details: e });
                      }
                    }*/
                    if (selectRepo == 130) {
                        // Formato 3.10 - LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 40
                        let parametrosJson = {};
                        parametrosJson["recordID"] = 10;
                        parametrosJson["reportID"] = selectRepo;
                        parametrosJson["subsidiary"] = selectSubs;
                        parametrosJson["periodCon"] = selectPeri;
                        parametrosJson["anioCon"] = selectano;
                        try {
                            var scriptTask = task.create({
                                taskType: task.TaskType.MAP_REDUCE,
                                scriptId: "customscript_pe_mr_3_10_dettributos",
                                deploymentId: "customdeploy_pe_mr_3_10_dettributos",
                                params: {
                                    custscript_pe_3_10_dettributos_params: parametrosJson,
                                },
                            });
                            scriptTask.submit();
                        } catch (e) {
                            log.error({ title: "Error - Formato 3.10", details: e });
                        }
                    }
                    if (selectRepo == 131) {
                        //Mensual: Formato 3.11 - LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 41
                        let parametrosJson = {};
                        parametrosJson["recordID"] = 10;
                        parametrosJson["reportID"] = selectRepo;
                        parametrosJson["subsidiary"] = selectSubs;
                        parametrosJson["periodCon"] = selectPeri;
                        parametrosJson["anioCon"] = selectano;
                        try {
                            var scriptTask = task.create({
                                taskType: task.TaskType.MAP_REDUCE,
                                scriptId: "customscript_pe_mr_3_11_detremxpagar",
                                deploymentId: "customdeploy_pe_mr_3_11_detremxpagar",
                                params: {
                                    custscript_pe_3_11_detremxpagar_params: parametrosJson,
                                },
                            });
                            scriptTask.submit();
                        } catch (e) {
                            log.error({ title: "Error - Formato 3.11", details: e });
                        }
                    }
                    /*if (selectRepo == 132) {
                      //Anual: Formato 3.12 -LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 42 - PROVEEDORES
                      let parametrosJson = {};

                      parametrosJson["recordID"] = 10;
                      parametrosJson["reportID"] = selectRepo;
                      parametrosJson["subsidiary"] = selectSubs;
                      parametrosJson["periodCon"] = selectPeri;
                      parametrosJson["anioCon"] = selectano;

                      try {
                        var scriptTask = task.create({
                          taskType: task.TaskType.MAP_REDUCE,
                          scriptId: "customscript_pe_mr_3_12_detproveedores",
                          deploymentId: "customdeploy_pe_mr_3_12_detproveedores",
                          params: {
                            custscript_pe_3_12_detproveedores_params: parametrosJson,
                          },
                        });
                        scriptTask.submit();
                      } catch (e) {
                        log.error({ title: "Error - Formato 3.12", details: e });
                      }
                    } */
                    /*if (selectRepo == 133) {
                      //Anual: Formato 3.13 - LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 46
                      let parametrosJson = {};

                      parametrosJson["recordID"] = 10;
                      parametrosJson["reportID"] = selectRepo;
                      parametrosJson["subsidiary"] = selectSubs;
                      parametrosJson["periodCon"] = selectPeri;
                      parametrosJson["anioCon"] = selectano;

                      try {
                        var scriptTask = task.create({
                          taskType: task.TaskType.MAP_REDUCE,
                          scriptId: "customscript_pe_mr_3_13_detcxpdivers",
                          deploymentId: "customdeploy_pe_mr_3_13_detcxpdivers",
                          params: {
                            custscript_pe_3_13_detcxpdivers_params: parametrosJson,
                          },
                        });
                        scriptTask.submit();
                      } catch (e) {
                        log.error({ title: "Error - Formato 3.13", details: e });
                      }
                    }*/

                    /*if (selectRepo == 134) {
                      //Anual - FORMATO 3.15: "LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 49": Results
                      let parametrosJson = {};

                      parametrosJson["recordID"] = 10;
                      parametrosJson["reportID"] = selectRepo;
                      parametrosJson["subsidiary"] = selectSubs;
                      parametrosJson["periodCon"] = selectPeri;
                      parametrosJson["anioCon"] = selectano;

                      try {
                        var scriptTask = task.create({
                          taskType: task.TaskType.MAP_REDUCE,
                          scriptId: "customscript_pe_mr_3_15_detgandif",
                          deploymentId: "customdeploy_pe_mr_3_15_detgandif",
                          params: {
                            custscript_pe_3_15_detgandif_params: parametrosJson,
                          },
                        });
                        scriptTask.submit();
                      } catch (e) {
                        log.error({ title: "Error - Formato 3.15", details: e });
                      }
                    }*/
                    if (selectRepo == 136) {
                        //	Anual: Libro de Inventario y Balances - Balance de Comprobación- 3.19
                        try {
                            if (selectForm == 'PDF') {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_319libinvbal',
                                    deploymentId: 'customdeploy_pe_319libinvbal',
                                    params: {
                                        custscript_pe_319libinvbal_params: paramsJson
                                    }
                                });
                                scriptTask.submit();
                            }

                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }

                    if (selectRepo == 138) {
                        //FORMATO 4.1: LIBRO DE RETENCIONES INCISOS E) Y F) DEL ART. 34 DE LA LEY DEL IMPUESTO A LA RENTA PDF
                        try {
                            if (selectForm == 'PDF') {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_41libroretenciones',
                                    deploymentId: 'customdeploy_pe_41libroretenciones',
                                    params: {
                                        custscript_pe_41libroretenciones_params: paramsJson
                                    }
                                });
                                scriptTask.submit();

                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_pe_schedule_ple_4_1',
                                    deploymentId: 'customdeploy_pe_schedule_ple_4_1',
                                    params: {
                                        custscriptpe_subsidiary_ple_4_1: selectSubs,
                                        custscript_pe_period_ple_4_1: selectPeri,
                                        custscript_pe_formato_4_1: selectForm,
                                        custscript_pe_filecabinetid_ple_4_1: fileCabinetId
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error - Formato 3.2', details: e });
                        }
                    }

                    if (selectRepo == 140) {
                        //  FORMATO 6.1: Libro Mayor 6.1
                        try {
                            if (selectForm == 'PDF') {
                                let parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_mr_6_1_libmay',
                                    deploymentId: 'customdeploy_pe_mr_6_1_libmay',
                                    params: {
                                        custscript_pe_6_1_libmay_params: parametrosJson
                                    }
                                });
                                scriptTask.submit();
                            } else {
                                log.debug('Libro Electrónico', '6.1')
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro 6.1: ' + selectRepo + ' - ' + e });
                        }
                    }

                    if (selectRepo == 141) {
                        try {
                            var scriptTask = task.create({
                                taskType: task.TaskType.MAP_REDUCE,
                                scriptId: 'customscript_pe_318libinvbal',
                                deploymentId: 'customdeploy_pe_318libinvbal',
                                params: {
                                    custscript_pe_318libinvbal_params: paramsJson
                                }
                            });
                            scriptTask.submit();

                        } catch (e) {
                            log.error({ title: 'Error - Formato 3.13', details: e });
                        }
                    }

                    if (selectRepo == 142) {
                        //  FORMATO 3.11 : "LIBRO DE INVENTARIOS Y BALANCES - DETALLE DEL SALDO DE LA CUENTA 41"
                        try {
                            if (selectForm == 'PDF') {
                                log.debug('Libro Impreso', '3.11')
                            } else {
                                var scriptTask = task.create({
                                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                                    scriptId: 'customscript_ple_3_11_inventariobalance',
                                    deploymentId: 'customdeploy_ple_3_11_inventariobalance',
                                    params: {
                                        custscript_pe_3_11_inventarios_params: paramsJson
                                    }
                                });
                                scriptTask.submit();
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }

                    if (selectRepo == 143) {
                        //  FORMATO 3.1 : "LIBRO DE INVENTARIOS Y BALANCES - BALANCE GENERAL"
                        try {
                            if (selectForm == 'PDF') {
                                let parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_mr_3_1_inventarios',
                                    deploymentId: 'customdeploy_pe_mr_3_1_inventarios',
                                    params: {
                                        custscript_pe_3_1_inventarios_params: parametrosJson
                                    }
                                });
                                scriptTask.submit();
                            } else {
                                log.debug('Libro Electrónico', '3.1')
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }

                    if (selectRepo == 144) {
                        //  FORMATO 3.9 : "Libro de Inventario y Balances - Detalle del Saldo de la Cuenta 34 - 3.9"
                        try {
                            if (selectForm == 'PDF') {
                                let parametrosJson = {};
                                parametrosJson["recordID"] = 10;
                                parametrosJson["reportID"] = selectRepo;
                                parametrosJson["subsidiary"] = selectSubs;
                                parametrosJson["periodCon"] = selectPeri;
                                parametrosJson["anioCon"] = selectano;
                                var scriptTask = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_pe_mr_3_9_saldo',
                                    deploymentId: 'customdeploy_pe_mr_3_9_saldo',
                                    params: {
                                        custscript_pe_3_9_saldo_params: parametrosJson
                                    }
                                });
                                scriptTask.submit();
                            } else {
                                log.debug('Libro Electrónico', '3.9')
                            }
                        } catch (e) {
                            log.error({ title: 'Error', details: 'Error Libro: ' + selectRepo + ' - ' + e });
                        }
                    }

                    redirect.toSuitelet({
                        scriptId: 'customscript_pe_suitelet_ple_sunat',
                        deploymentId: 'customdeploy_pe_suitelet_ple_sunat',
                        parameters: {}
                    });
                }
            } catch (e) {
                log.error({ title: 'Error', details: e });
            }
        }
        return {
            onRequest: onRequest
        };
    });