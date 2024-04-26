/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
*/

define(['N/search', 'N/record', 'N/runtime', 'N/log', 'N/file', "N/config", "N/format", "N/render", "N/encode"],
    (search, record, runtime, log, file, config, format, render, encode) => {

        const FTL_EXCEL_TEMPLATE_NAME = "./PE_FTL_Cuentas_por_Cobrar_Cuenta_12.ftl";

        let currentScript = runtime.getCurrentScript();

        const execute = (context) => {
            try {
                let environmentFeatures = getEnvironmentFeatures();
                let scriptParameters = getScriptParameters(environmentFeatures);
                log.error("scriptParameters", scriptParameters)
                let auxiliaryRecords = getAuxiliaryRecords(environmentFeatures, scriptParameters);
                log.error("auxiliaryRecords", auxiliaryRecords);
                let detractionPayments = getDetractionPayments(scriptParameters, environmentFeatures);
                //log.error("detractionPayments", detractionPayments)
                let payments = getPayments(scriptParameters, environmentFeatures);
                //log.error("payments", payments)
                let { transactionsArray, customersArray } = getTransactionData(scriptParameters, environmentFeatures, detractionPayments, payments);
                //log.error("transactionsArray", transactionsArray);
                //log.error("customersArray", customersArray);
                log.error("transactionsArray", transactionsArray.length);
                log.error("transactionsArray[0]", transactionsArray[0]);
                let customersJson = getCustomers(customersArray);
                //log.error("customersJson", customersJson);
                let jsonData = buildJsonData(transactionsArray, customersJson);
                if (transactionsArray.length) {
                    generateExcel(jsonData, scriptParameters, auxiliaryRecords, environmentFeatures);
                } else {

                }

            } catch (error) {
                log.error("An error was ocurred in [execute]", error);
            }
        }

        const getEnvironmentFeatures = () => {
            let features = {};
            features.hasSubsidiaries = runtime.isFeatureInEffect({
                feature: "SUBSIDIARIES"
            });
            return features;
        }

        const getScriptParameters = (environmentFeatures) => {
            let scriptParameters = {};

            scriptParameters.subsidiaryId = currentScript.getParameter('custscript_pe_ss_cxc_c12_subsidiary');
            scriptParameters.periodId = currentScript.getParameter('custscript_pe_ss_cxc_c12_period');
            //scriptParameters.format = currentScript.getParameter("custscript_pe_format_rpt_rxh");
            scriptParameters.date = currentScript.getParameter("custscript_pe_ss_cxc_c12_date");
            scriptParameters.folderId = currentScript.getParameter("custscript_pe_ss_cxc_c12_idfolder");
            if (!scriptParameters.logRecordId) scriptParameters.logRecordId = createLogRecord(scriptParameters, environmentFeatures.hasSubsidiaries);
            log.error("scriptParameters", scriptParameters);

            return scriptParameters;
        }

        const getAuxiliaryRecords = (environmentFeatures, scriptParameters) => {
            let auxiliaryFields = {};

            auxiliaryFields.subsidiary = getSubsidiaryRecord(environmentFeatures.hasSubsidiaries, scriptParameters.subsidiaryId);

            //auxiliaryFields.period = getPeriodRecord(scriptParameters.periodId);

            return auxiliaryFields;
        }

        const getSubsidiaryRecord = (hasSubsidiariesFeature, subsidiaryId) => {
            let subsidiaryRecord = {
                taxidnum: "",
                name: "",
                legalname: ""
            };
            try {
                if (hasSubsidiariesFeature) {
                    if (!subsidiaryId) return subsidiaryRecord;
                    let subsidiarySearch = search.lookupFields({
                        type: search.Type.SUBSIDIARY,
                        id: subsidiaryId,
                        columns: ["taxidnum", "name", "legalname"]
                    });
                    subsidiaryRecord.taxidnum = subsidiarySearch.taxidnum;
                    subsidiaryRecord.name = subsidiarySearch.name;
                    subsidiaryRecord.legalname = subsidiarySearch.legalname;
                } else {
                    let company = config.load({
                        type: config.Type.COMPANY_INFORMATION
                    });
                    subsidiaryRecord.taxidnum = company.getValue("employerid");
                    subsidiaryRecord.name = "";
                    subsidiaryRecord.legalname = "";
                }
            } catch (error) {
                log.error("An error was found in [getSubsidiaryRecord]", error);
            }
            return subsidiaryRecord;
        }

        const getPeriodRecord = (periodId) => {
            let periodRecord = {
                startDate: "",
                endDate: "",
                periodYear: "",
            };
            try {
                var periodSearch = search.lookupFields({
                    type: search.Type.ACCOUNTING_PERIOD,
                    id: periodId,
                    columns: ['startdate', 'enddate']
                });
                let startDate = format.parse({
                    value: periodSearch.startdate,
                    type: format.Type.DATE
                });
                var periodYear = startDate.getFullYear();
                var month = startDate.getMonth() + 1;
                var periodEndDate = new Date(periodYear, 11, 31);
                periodRecord.periodYear = periodYear;
                periodRecord.month = `${month < 10 ? '0' : ''}${month}`;
                periodRecord.endDate = periodSearch.enddate;
                periodRecord.startDate = periodSearch.startdate;
            } catch (error) {
                log.error("An error was found in [getPeriodRecord]", error);
            }
            return periodRecord;
        }

        const getDetractionPayments = (scriptParameters, environmentFeatures) => {
            let payments = {};
            try {
                let savedSearch = search.load({ id: "customsearch_pe_cxc_pagos_det_realizados" });

                if (environmentFeatures.hasSubsidiaries) {
                    let subsidiaryFilter = search.createFilter({
                        name: "subsidiary",
                        operator: search.Operator.ANY,
                        values: [scriptParameters.subsidiaryId]
                    });
                    savedSearch.filters.push(subsidiaryFilter);
                }

                let dateFilter = search.createFilter({
                    name: "trandate",
                    operator: search.Operator.ONORBEFORE,
                    values: [scriptParameters.date]
                });
                savedSearch.filters.push(dateFilter);

                let pagedData = savedSearch.runPaged({
                    pageSize: 1000
                });

                pagedData.pageRanges.forEach(function (pageRange) {
                    page = pagedData.fetch({
                        index: pageRange.index
                    });
                    page.data.forEach(function (result) {
                        let columns = result.columns;
                        let invoice = result.getValue(columns[0]);
                        let importeMonedaBase = Number(result.getValue(columns[1]));
                        let importeMonedaExtranjera = Number(result.getValue(columns[2]));
                        if (payments[invoice] === undefined) {
                            payments[invoice] = { importeMonedaBase, importeMonedaExtranjera };
                        } else {
                            payments[invoice].importeMonedaBase = roundTwoDecimal(payments[invoice].importeMonedaBase + importeMonedaBase);
                            payments[invoice].importeMonedaExtranjera = roundTwoDecimal(payments[invoice].importeMonedaExtranjera + importeMonedaExtranjera);
                        }
                    });
                });
                return payments;
            } catch (error) {
                log.error("An error was ocurred in []", error);
                return payments;
            }
        }

        const getPayments = (scriptParameters, environmentFeatures) => {
            let payments = {};
            try {
                let savedSearch = search.load({ id: "customsearch_pe_cxc_pagos_realizados" });

                if (environmentFeatures.hasSubsidiaries) {
                    let subsidiaryFilter = search.createFilter({
                        name: "subsidiary",
                        operator: search.Operator.ANY,
                        values: [scriptParameters.subsidiaryId]
                    });
                    savedSearch.filters.push(subsidiaryFilter);
                }

                let dateFilter = search.createFilter({
                    name: "trandate",
                    operator: search.Operator.ONORBEFORE,
                    values: [scriptParameters.date]
                });
                savedSearch.filters.push(dateFilter);

                let pagedData = savedSearch.runPaged({ pageSize: 1000 });

                pagedData.pageRanges.forEach(function (pageRange) {
                    page = pagedData.fetch({
                        index: pageRange.index
                    });
                    page.data.forEach(function (result) {
                        let columns = result.columns;
                        let invoice = result.getValue(columns[0]);
                        let importeMonedaBase = Number(result.getValue(columns[1]));
                        let importeMonedaExtranjera = Number(result.getValue(columns[2]));
                        if (payments[invoice] === undefined) {
                            payments[invoice] = { importeMonedaBase, importeMonedaExtranjera };
                        } else {
                            payments[invoice].importeMonedaBase = roundTwoDecimal(payments[invoice].importeMonedaBase + importeMonedaBase);
                            payments[invoice].importeMonedaExtranjera = roundTwoDecimal(payments[invoice].importeMonedaExtranjera + importeMonedaExtranjera);
                        }
                    });
                });
                return payments;
            } catch (error) {
                log.error("An error was ocurred in []", error);
                return payments;
            }
        }

        const getTransactionData = (scriptParameters, environmentFeatures, detractionPayments, payments) => {
            let transactionsArray = [], customersIdJson = {};
            let peTipoCambioJson = getPETipoCambio();
            log.error("peTipoCambioJson", peTipoCambioJson);
            try {
                let savedSearch = search.load({ id: "customsearch_pe_cuentas_por_cobrar_12" });
                if (environmentFeatures.hasSubsidiaries) {
                    let subsidiaryFilter = search.createFilter({
                        name: "subsidiary",
                        operator: search.Operator.ANY,
                        values: [scriptParameters.subsidiaryId]
                    });
                    savedSearch.filters.push(subsidiaryFilter);
                }

                let dateFilter = search.createFilter({
                    name: "trandate",
                    operator: search.Operator.ONORBEFORE,
                    values: [scriptParameters.date]
                });
                savedSearch.filters.push(dateFilter);

                let pagedData = savedSearch.runPaged({ pageSize: 1000 });

                pagedData.pageRanges.forEach(function (pageRange) {
                    page = pagedData.fetch({ index: pageRange.index });
                    page.data.forEach(function (result) {
                        let columns = result.columns;
                        let idInterno = result.getValue(columns[0]);
                        let periodo = result.getText(columns[1]);
                        let fecha = formatDate(result.getValue(columns[2]));
                        let fechaVencimiento = formatDate(result.getValue(columns[3]));
                        let numeroDocumento = result.getValue(columns[4]);
                        let numeroDocumentoFel = result.getValue(columns[5]);
                        let tipoDocumento = result.getText(columns[6]);
                        let customerId = result.getValue(columns[7]);
                        let nota = result.getValue(columns[8]).replace('- None -', '');
                        let gestor = result.getText(columns[9]);
                        let centroCosto = result.getText(columns[10]);
                        let moneda = result.getValue(columns[11]);
                        let importeMonedaBase = Number(result.getValue(columns[12]));
                        let importeMonedaExtranjera = Number(result.getValue(columns[13]));
                        let importePendienteMonedaBase = Number(result.getValue(columns[12]));
                        let importePendienteMonedaExtranjera = Number(result.getValue(columns[13]));


                        if (payments[idInterno] !== undefined) {
                            importePendienteMonedaBase = roundTwoDecimal(importePendienteMonedaBase - payments[idInterno].importeMonedaBase);
                            importePendienteMonedaExtranjera = roundTwoDecimal(importePendienteMonedaExtranjera - payments[idInterno].importeMonedaExtranjera);
                        }
                        if (detractionPayments[idInterno] !== undefined) {
                            importePendienteMonedaBase = roundTwoDecimal(importePendienteMonedaBase - detractionPayments[idInterno].importeMonedaBase);
                            importePendienteMonedaExtranjera = roundTwoDecimal(importePendienteMonedaExtranjera - detractionPayments[idInterno].importeMonedaExtranjera);
                        }
                        let documentoPagado = false;
                        if (moneda == "PEN") {
                            documentoPagado = importePendienteMonedaBase <= 0 ? false : true;
                            importeMonedaExtranjera = roundTwoDecimal(importeMonedaBase / (peTipoCambioJson[result.getValue(columns[2])] || 1));
                            importePendienteMonedaExtranjera = roundTwoDecimal(importePendienteMonedaBase / (peTipoCambioJson[result.getValue(columns[2])] || 1));
                        } else if (moneda == "USD") {
                            documentoPagado = importePendienteMonedaExtranjera <= 0 ? false : true;
                        }
                        if (documentoPagado) {
                            customersIdJson[customerId] = true;
                            transactionsArray.push({
                                idInterno,
                                periodo,
                                fecha,
                                fechaVencimiento,
                                numeroDocumento,
                                numeroDocumentoFel,
                                tipoDocumento,
                                customerId,
                                nota,
                                gestor,
                                centroCosto,
                                moneda,
                                importeMonedaBase,
                                importeMonedaExtranjera,
                                importePendienteMonedaBase,
                                importePendienteMonedaExtranjera
                            });
                        }
                    });
                });
                return { transactionsArray, customersArray: Object.keys(customersIdJson) };
            } catch (error) {
                log.error("An error was ocurred in [getTransactionData]", error);
            }
        }

        const getCustomers = (customersArray) => {
            let customersJson = {};
            try {
                if (!customersArray.length) return customersJson;
                let newSearch = search.create({
                    type: search.Type.CUSTOMER,
                    filters: [
                        ["internalid", "anyof", customersArray]
                    ],
                    columns: [
                        "custentity_pe_document_number",
                        "custentity_asb_cod_rec",
                        search.createColumn({
                            name: "formulatext",
                            formula: "CASE WHEN {isperson} = 'F' THEN {companyname} ELSE CONCAT(CONCAT({firstname},' '),{lastname}) END",
                        })
                    ]
                })

                let pagedData = newSearch.runPaged({
                    pageSize: 1000
                });

                pagedData.pageRanges.forEach(function (pageRange) {
                    page = pagedData.fetch({
                        index: pageRange.index
                    });
                    page.data.forEach(function (result) {
                        let columns = result.columns;
                        let idInterno = result.id;
                        let numeroDocumento = result.getValue(columns[0]);
                        let codigoRecaudador = result.getValue(columns[1]);
                        let nombre = result.getValue(columns[2]);
                        customersJson[idInterno] = {
                            numeroDocumento,
                            codigoRecaudador,
                            nombre
                        };
                    })
                });

                return customersJson;
            } catch (error) {
                log.error("An error was ocurred in [getCustomer]", error);
                return customersJson;
            }
        }

        const buildJsonData = (transactionsArray, customersJson) => {
            return {
                transactions: transactionsArray,
                customers: customersJson
            }
        }

        const getPETipoCambio = () => {
            var peTipoCambioJson = {};
            let newSearch = search.create({
                type: "customrecord_pe_tipo_cambio",
                filters: [],
                columns: [
                    "custrecord_pe_tc_fecha_efectiva",
                    "custrecord_pe_tc_tipo_cambio"
                ]
            });
            let pagedData = newSearch.runPaged({ pageSize: 1000 });
            pagedData.pageRanges.forEach(function (pageRange) {
                page = pagedData.fetch({
                    index: pageRange.index
                });
                page.data.forEach(function (result) {
                    let columns = result.columns;
                    var fechaEfectiva = result.getValue('custrecord_pe_tc_fecha_efectiva');
                    var tipoCambio = Number(result.getValue("custrecord_pe_tc_tipo_cambio"));
                    peTipoCambioJson[fechaEfectiva] = tipoCambio;
                })
            })
            return peTipoCambioJson;
        }

        const generateExcel = (dataObject, scriptParameters, auxiliaryRecords, environmentFeatures) => {
            let templateFile = file.load({ id: FTL_EXCEL_TEMPLATE_NAME });
            log.error("dataObject", dataObject);
            let data = { text: JSON.stringify(dataObject) };

            let renderer = render.create();
            renderer.templateContent = templateFile.getContents();
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'jsonString',
                data
            });
            var outputFile = renderer.renderAsString();
            var baseEncode = encode.convert({
                string: outputFile,
                inputEncoding: encode.Encoding.UTF_8,
                outputEncoding: encode.Encoding.BASE_64
            });
            let fileName = getFileName(auxiliaryRecords, scriptParameters) + ".xls";
            let fileId = file.create({
                name: fileName,
                fileType: file.Type.EXCEL,
                contents: baseEncode,
                folder: scriptParameters.folderId
            }).save();
            let reportFile = file.load({ id: fileId });
            log.error("url", `https://8417837.app.netsuite.com${reportFile.url}`);

            updateLogRecord(scriptParameters.logRecordId, reportFile.url, fileName, scriptParameters, environmentFeatures);
        }

        const getFileName = (auxiliaryRecords, scriptParameters) => {
            return `Reporte_CxC_Cuenta_12_${auxiliaryRecords.subsidiary.taxidnum}_${scriptParameters.date}`;
        }

        const createLogRecord = (scriptParameters, hasSubsidiariesFeature) => {
            try {
                let logRecord = record.create({ type: "customrecord_pe_generation_logs" });

                if (hasSubsidiariesFeature) {
                    logRecord.setValue("custrecord_pe_subsidiary_log", scriptParameters.subsidiaryId);
                }

                logRecord.setValue("custrecord_pe_anio_log", scriptParameters.date);
                logRecord.setValue("custrecord_pe_period_log", scriptParameters.periodId);
                logRecord.setValue("custrecord_pe_status_log", "Procesando...");
                logRecord.setValue("custrecord_pe_report_log", "Procesando...");
                logRecord.setValue("custrecord_pe_book_log", "Reporte de cuentas por cobrar cuenta 12");
                return logRecord.save();
            } catch (error) {
                log.error('An error was ocurred in [createLogRecord] function', error);
            }
        }

        const updateLogRecord = (logRecordId, urlFile, fileName, scriptParameters, environmentFeatures) => {
            let values = {}
            if (environmentFeatures.hasSubsidiaries) values.custrecord_pe_subsidiary_log = scriptParameters.subsidiaryId;

            values.custrecord_pe_report_log = fileName;
            values.custrecord_pe_status_log = 'Generated';
            //values.custrecord_pe_book_log = 'Reporte de cuentas por cobrar cuenta 12';
            values.custrecord_pe_file_cabinet_log = urlFile;
            return record.submitFields({
                type: "customrecord_pe_generation_logs",
                id: logRecordId,
                values
            });
        }

        const formatDate = (date) => {
            if (!date) return "";
            return format.parse({
                value: date,
                type: format.Type.DATE
            });
        }

        const roundTwoDecimal = (value) => {
            return Math.round(Number(value) * 100) / 100;
        }

        return {
            execute
        }

    }
)