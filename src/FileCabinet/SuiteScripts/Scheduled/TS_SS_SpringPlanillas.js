/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NAmdConfig  ../Library/JsLibraryConfig.json
 * 
 * Task          Date            Author                                         Remarks
 * GAP Int       21 Jun 2023     Jeferson Mejía <jeferson.mejia@myevol.biz>     - Crear Journals
 *
 */
define(["N/search", "N/record", "N/log", "N/file", "N/task", "xlsx", "../Library/TS_LIB_ControlPresupuestal.js"], (search, record, log, file, task, XLSX, libcp) => {

    const execute = (context) => {
        const FN = 'execute';

        searchFileCabinet().forEach(function (archivo) {
            log.debug('archivo', archivo);
            const excelFile = file.load({ id: archivo.carpeta });
            log.debug('excelFile.fileType', excelFile.fileType);
           try {
                if (excelFile && excelFile.fileType === 'EXCEL') {
                    let excelContents = excelFile.getContents();
                    let workbook = XLSX.read(excelContents, { type: "base64" });
                    let worksheet = workbook.Sheets[workbook.SheetNames[0]];
                    let dataArray = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    // Encuentra el índice de la columna "Subsidiary"
                    let currencyIndex = dataArray[0].indexOf("Currency");
                    let exchangeRateIndex = dataArray[0].indexOf("ExchangeRate");
                    let subsidiaryIndex = dataArray[0].indexOf("Subsidiary");
                    let fechaIndex = dataArray[0].indexOf("Fecha");
                    let accountIndex = dataArray[0].indexOf("Account");
                    let departmentIndex = dataArray[0].indexOf("Department");
                    let classIndex = dataArray[0].indexOf("Class");
                    let externalIdIndex = dataArray[0].indexOf("ExternalID");
                    let debitIndex = dataArray[0].indexOf("Debit");
                    let creditIndex = dataArray[0].indexOf("Credit");
                    let postingPeriodIndex = dataArray[0].indexOf("PostingPeriod");
                    let memoIndex = dataArray[0].indexOf("Memo");
                    let peOpeningJournalIndex = dataArray[0].indexOf("PEOpeningJournal");
                    let peClosingJournalIndex = dataArray[0].indexOf("PEClosingJournal");
                    let nameIndex = dataArray[0].indexOf("Name");
                    let locationIndex = dataArray[0].indexOf("Location");
                    let externalIdTotals = {};
                    let result = {};
                    let csv = '';
                    let oldcuenta = '';
                    let olddepartment = '';
                    let oldclass = '';
                    let accountValueresult = '';
                    let departmentValueReslt = '';
                    let classValueresult = '';
                    let externalIdArray = [];
                    let subsidiaryBoolean = true;
                    let currencyBoolean = true;
                    let exchangeRateBoolean = true;
                    let fechaBoolean = true;
                    let accountBoolean = true;
                    let departmentBoolean = true;
                    let classBoolean = true;
                    let controlpresupuestal = true;
                    // Recorrer cada fila (omitir la primera fila que contiene encabezados)
                    log.debug('dataArray',dataArray.length);
                    for (let i = 1; i < dataArray.length; i++) {
                        let row = dataArray[i];
                        let currencyValue = row[currencyIndex];

                        let exchangeRateValue = row[exchangeRateIndex];
                        let subsidiaryValue = row[subsidiaryIndex];
                        let fechaValue = row[fechaIndex];
                        let accountValue = row[accountIndex];
                        let departmentValue = row[departmentIndex];
                        let classValue = row[classIndex];
                        let externalId = row[externalIdIndex];
                        let debitValue = parseFloat(row[debitIndex]) || 0;
                        let creditValue = parseFloat(row[creditIndex]) || 0;
                        let postingPeriodValue = row[postingPeriodIndex];
                        let memoValue = row[memoIndex];
                      
                        let peOpeningJournalValue = row[peOpeningJournalIndex];
                        let peClosingJournalValue = row[peClosingJournalIndex];
                        let nameValue = row[nameIndex];
                        let locationValue = row[locationIndex];

                        if (!externalIdTotals[externalId]) {
                            externalIdTotals[externalId] = { debitTotal: 0, creditTotal: 0 };
                        }

                        externalIdTotals[externalId].debitTotal += debitValue;
                        externalIdTotals[externalId].creditTotal += creditValue;

                        if (!subsidiaryValue) {
                            log.debug('Error', 'Columna: Subsidiary, Fila: ' + (i + 1) + ' Archivo: ' + archivo.nombreArchivo);
                            csv = csv + 'Columna: No valida Subsidiary, Fila: ' + (i + 1) + ' Archivo: ' + archivo.nombreArchivo + '\n'
                            subsidiaryBoolean = false;
                        } else {
                            if (subsidiaryValue.includes('ASBANC')) {
                                subsidiaryValue = 3;
                            } else if (subsidiaryValue.includes('REDES')) {
                                subsidiaryValue = 4;
                            } else {
                                subsidiaryValue = 1;
                            }
                        }
                        if (!currencyValue) {
                            log.debug('Error', 'Columna: Currency, Fila: ' + (i + 1) + ' Archivo: ' + archivo.nombreArchivo);
                            csv = csv + 'Columna: No valida Currency, Fila: ' + (i + 1) + ' Archivo: ' + archivo.nombreArchivo + '\n'
                            currencyBoolean = false;
                        } else {
                            if (currencyValue.includes('Soles')) {
                                currencyValue = 1;
                            } else {
                                currencyValue = 2;
                            }
                        }
                        if (isNaN(exchangeRateValue) || exchangeRateValue <= 0) {
                            log.debug('Error', 'Columna: ExchangeRate, Fila: ' + (i + 1) + ' Archivo: ' + archivo.nombreArchivo);
                            csv = csv + 'Columna: No valida ExchangeRate, Fila: ' + (i + 1) + ' Archivo: ' + archivo.nombreArchivo + '\n'
                            exchangeRateBoolean = false;
                        }

                        if (!fechaValue) {
                            log.debug('Error', 'Columna: Fecha, Fila: ' + (i + 1) + ' Archivo: ' + archivo.nombreArchivo);
                            csv = csv + 'Columna: No valida Fecha, Fila: ' + (i + 1) + ' Archivo: ' + archivo.nombreArchivo + '\n'
                            fechaBoolean = false;
                        }

                       

                      if (!accountValue) {
                            log.debug('Error', 'Columna: Account, Fila: ' + (i + 1) + ' Archivo: ' + archivo.nombreArchivo);
                            csv = csv + 'Columna: No valida Account, Fila: ' + (i + 1) + ' Archivo: ' + archivo.nombreArchivo + '\n'
                            accountBoolean = false;
                        } else {
                           if(oldcuenta != accountValue){
                              accountValueresult = searchAccountIdByNumber(accountValue);
                              oldcuenta = accountValue;
                           }
                           
                            if (accountValueresult == null) {
                                log.debug('Error', 'Columna: Account, Fila: ' + (i + 1) + ' Archivo: ' + archivo.nombreArchivo);
                                csv = csv + 'Columna: No valida Account, Fila: ' + (i + 1) + ' Archivo: ' + archivo.nombreArchivo + '\n'
                                accountBoolean = false;
                            }
                        }
                           

                       if (!departmentValue) {
                            log.debug('Error', 'Columna: Department, Fila: ' + (i + 1) + ' Archivo: ' + archivo.nombreArchivo);
                            csv = csv + 'Columna: No valida Department, Fila: ' + (i + 1) + ' Archivo: ' + archivo.nombreArchivo + '\n'
                            departmentBoolean = false;
                        } else {
                           if(olddepartment !== departmentValue){
                               departmentValueReslt = searchDepartmentInternalIds(departmentValue);
                          
                               olddepartment = departmentValue;
                              
                           }
                           
                            if (departmentValueReslt == null) {
                                log.debug('Error', 'Columna: Department, Fila: ' + (i + 1) + ' Archivo: ' + archivo.nombreArchivo);
                                csv = csv + 'Columna: No valida Department, Fila: ' + (i + 1) + ' Archivo: ' + archivo.nombreArchivo + '\n';
                                departmentValue = 0;
                                departmentBoolean = false;
                            }
                         }
                        var anio;
                       if (!classValue) {
                            log.debug('Error', 'Columna: Class, Fila: ' + (i + 1) + ' Archivo: ' + archivo.nombreArchivo);
                            csv = csv + 'Columna: No valida Class, Fila: ' + (i + 1) + ' Archivo: ' + archivo.nombreArchivo + '\n'
                            classBoolean = false;
                        } else {
                           if(oldclass !== classValue){
                               classValueresult = searchClassInternalIds(classValue);
                              
                               oldclass = classValue;
                             
                           }
                           
                            if (classValueresult == null) {
                                log.debug('Error', 'Columna: Class, Fila: ' + (i + 1) + ' Archivo: ' + archivo.nombreArchivo);
                                csv = csv + 'Columna: No valida Class, Fila: ' + (i + 1) + ' Archivo: ' + archivo.nombreArchivo + '\n'
                                classValue = 0;
                                classBoolean = false;
                            }
                        
                         }
                        if (postingPeriodValue) {
                            postingPeriodValue = replaceMonthNames(postingPeriodValue);
                            postingPeriodValue = searchAccountingPeriod(postingPeriodValue);
                        }

                        if (locationValue) {
                            locationValue = searchLocationInternalIds(locationValue);
                        }

                        if (!result[externalId]) {
                            result[externalId] = {
                                currency: currencyValue,
                                exchangeRate: exchangeRateValue,
                                date: fechaValue,
                                idSubsidiary: subsidiaryValue,
                                postingPeriod: postingPeriodValue,
                                memo: memoValue,
                                peOpeningJournal: peOpeningJournalValue = 'T' ? true : false,
                                peClosingJournal: peClosingJournalValue = 'T' ? true : false,
                                lines: []
                            };
                            externalIdArray.push(externalId);
                        }
                        // Agregar la línea actual a la lista de líneas del External ID
                        result[externalId].lines.push({
                            idAccount: accountValueresult,
                            debit: debitValue || 0, // Convertir a número y manejar caso en blanco como 0
                            credit: creditValue || 0, // Convertir a número y manejar caso en blanco como 0
                            name: nameValue, //FALTA HACER UNA BUSQUEDA PARA ESTO NO HAY EJEMPLO DE COMO SE MUESTRA ESTE CAMPO
                            deparment: departmentValueReslt,
                            location: locationValue,
                            class: classValueresult
                        });


                    }

                    for (var id in externalIdTotals) {
                        var totalDebit = externalIdTotals[id].debitTotal;
                        var totalCredit = externalIdTotals[id].creditTotal;

                        if (totalDebit.toFixed(2) !== totalCredit.toFixed(2)) {
                            log.debug("Los montos totales de 'Debit' y 'Credit' no coinciden para el ExternalID: " + id);
                            csv = csv + "Los montos totales de 'Debit' y 'Credit' no coinciden para el ExternalID: " + id + '\n'
                            log.debug("Total Debit: " + totalDebit);
                            log.debug("Total Credit: " + totalCredit);
                        }
                    }

                    if (controlpresupuestal && subsidiaryBoolean && currencyBoolean && exchangeRateBoolean && fechaBoolean && accountBoolean && departmentBoolean && classBoolean) {

                        var journalId = createJournalRecord(result, externalIdArray)

                        record.submitFields({
                            type: 'customrecord_archivos_sftp',
                            id: archivo.internalId,
                            values: { 'custrecord_ns_estado': 3 }
                        });
                    } else {
                        var today = new Date();
                        today = today.getDate() + '' + (today.getMonth() + 1) + '' + today.getFullYear() + today.getHours() + '' + today.getMinutes() + '' + today.getSeconds();

                        var files = file.create({
                            name: today + archivo.nombreArchivo + '.csv',
                            fileType: file.Type.CSV,
                            contents: csv,
                            folder: 440 // ID de la carpeta en la que deseas guardar el archivo, reemplaza con el valor correcto.
                        });
                        var fileId = files.save();
                        record.submitFields({
                            type: 'customrecord_archivos_sftp',
                            id: archivo.internalId,
                            values: { 'custrecord_ns_estado': 2 }
                        });
                    }

                }
          } catch (e) {
                var today = new Date();
                today = today.getDate() + '' + (today.getMonth() + 1) + '' + today.getFullYear() + today.getHours() + '' + today.getMinutes() + '' + today.getSeconds();

                var files = file.create({
                    name: today + archivo.nombreArchivo + '.csv',
                    fileType: file.Type.CSV,
                    contents: e.message,
                    folder: 440 // ID de la carpeta en la que deseas guardar el archivo, reemplaza con el valor correcto.
                });
                var fileId = files.save();
                record.submitFields({
                    type: 'customrecord_archivos_sftp',
                    id: archivo.internalId,
                    values: { 'custrecord_ns_estado': 2 }
                });
                log.error({
                    title: `${FN} error`,
                    details: { message: `${FN} - ${e.message || `Unexpected error`}` },
                });
                throw { message: `${FN} - ${e.message || `Unexpected error`}` };
            }

        });


    };
    

    const createJournalRecord = (data, externalIdArray) => {
        log.debug('data', data);
        log.debug('externalId', externalIdArray);

        let journalId = [];
        for (let index = 0; index < externalIdArray.length; index++) {
            let journalRecord = record.create({
                type: record.Type.JOURNAL_ENTRY,
                isDynamic: true
            });
            log.debug('date', data[externalIdArray[index]].date);
            var trandate = data[externalIdArray[index]].date.split('/');
            journalRecord.setValue('subsidiary', data[externalIdArray[index]].idSubsidiary);
            journalRecord.setValue('currency', data[externalIdArray[index]].currency);
            journalRecord.setValue('exchangerate', data[externalIdArray[index]].exchangeRate);
            journalRecord.setValue('trandate', new Date(trandate[2] + '/' + trandate[1] + '/' + trandate[0]));
            journalRecord.setValue('memo', data[externalIdArray[index]].memo);
            journalRecord.setValue('postingperiod', data[externalIdArray[index]].postingPeriod);
            journalRecord.setValue('custbody_pe_opening_journal_2', data[externalIdArray[index]].peOpeningJournal);
            journalRecord.setValue('custbody_pe_closing_journal', data[externalIdArray[index]].peClosingJournal);

            // Agregar líneas al registro de diario 
            // FALTA AGREGAR LA COLUMNA NAME POR NO HABER  data[externalIdArray[index]] NO SE HIZO
            for (let i = 0; i < data[externalIdArray[index]].lines.length; i++) {
                let line = data[externalIdArray[index]].lines[i];

                journalRecord.selectNewLine({ sublistId: 'line' });

                journalRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'account',
                    value: line.idAccount
                });
               log.debug('line.debit', line.debit);
                journalRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'debit',
                    value: line.debit
                });
              log.debug('line.credit', line.credit);
                journalRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'credit',
                    value: line.credit
                });


                journalRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'department',
                    value: parseInt(line.deparment)
                });



                journalRecord.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'class',
                    value: parseInt(line.class)
                });


                journalRecord.commitLine({ sublistId: 'line' });
            }

            // Guardar el registro de diario
            let idCreate = journalRecord.save();

            journalId.push(idCreate);
        }
        return journalId;
    }

    const searchAccountIdByNumber = (accountNumber) => {
        let accountSearch = search.create({
            type: search.Type.ACCOUNT,
            filters: [
                search.createFilter({
                    name: "number",
                    operator: search.Operator.IS,
                    values: [accountNumber]
                })
            ],
            columns: ["internalid"]
        });

        let searchResult = accountSearch.run().getRange({ start: 0, end: 1 });

        if (searchResult && searchResult.length > 0) {
            let accountId = searchResult[0].getValue({ name: "internalid" });
            return accountId;
        }

        return null;
    }

    const searchDepartmentInternalIds = (department) => {

        let searchFilter = search.createFilter({
            name: "name",
            operator: search.Operator.CONTAINS,
            values: department
        });

        let departmentSearch = search.create({
            type: search.Type.DEPARTMENT,
            filters: [searchFilter],
            columns: ["internalid"]
        });

        let searchResult = departmentSearch.run().getRange({ start: 0, end: 1 });

        if (searchResult.length > 0) {
            return searchResult[0].getValue({ name: "internalid" });
        }

        return null;
    }

    const searchClassInternalIds = (clase) => {

        let searchFilter = search.createFilter({
            name: "name",
            operator: search.Operator.CONTAINS,
            values: clase
        });

        let claseSearch = search.create({
            type: search.Type.CLASSIFICATION,
            filters: [searchFilter],
            columns: ["internalid"]
        });

        let searchResult = claseSearch.run().getRange({ start: 0, end: 1 });

        if (searchResult.length > 0) {
            return searchResult[0].getValue({ name: "internalid" });
        }

        return null;
    }

    const searchLocationInternalIds = (location) => {

        let searchFilter = search.createFilter({
            name: "name",
            operator: search.Operator.CONTAINS,
            values: location
        });

        let locationSearch = search.create({
            type: search.Type.LOCATION,
            filters: [searchFilter],
            columns: ["internalid"]
        });

        let searchResult = locationSearch.run().getRange({ start: 0, end: 1 });

        if (searchResult.length > 0) {
            return searchResult[0].getValue({ name: "internalid" });
        }

        return null;
    }

    const replaceMonthNames = (input) => {
        let monthMap = {
            "ENERO": "Ene",
            "FEBRERO": "Feb",
            "MARZO": "Mar",
            "ABRIL": "Abr",
            "MAYO": "May",
            "JUNIO": "Jun",
            "JULIO": "Jul",
            "AGOSTO": "Ago",
            "SEPTIEMBRE": "Sep",
            "OCTUBRE": "Oct",
            "NOVIEMBRE": "Nov",
            "DICIEMBRE": "Dic"
        };

        return input.replace(/\b\w+\b/g, function (match) {
            return monthMap[match.toUpperCase()] || match;
        });
    }

    const searchAccountingPeriod = (targetMonth) => {

        let accountingPeriodSearch = search.create({
            type: search.Type.ACCOUNTING_PERIOD,
            filters: [
                search.createFilter({
                    name: "periodname",
                    operator: search.Operator.IS,
                    values: [targetMonth]
                })
            ],
            columns: ["internalid"]
        });

        let searchResult = accountingPeriodSearch.run().getRange({ start: 0, end: 1 });

        if (searchResult && searchResult.length > 0) {
            let accountingPeriodId = searchResult[0].getValue({ name: "internalid" });
            return accountingPeriodId;
        }

        return null;
    }

    const searchFileCabinet = () => {
        const FN = 'searchFileCabinet';
        try {
            let searchObj = search.create({
                type: "customrecord_archivos_sftp",
                filters:
                    [
                        ["custrecord_ns_tipo", "anyof", "6"],
                        "AND",
                        ["custrecord_ns_estado", "anyof", "1"],
                        "AND",
                        ["custrecord_nombre_archivo", "contains", ".xls"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_ns_rs_id", label: "Carpeta" }),
                        search.createColumn({ name: "custrecord_nombre_archivo", label: "Nombre" }),
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            });

            let array_id_file_cabinet = [];

            // Configurar los límites de la paginación
            let pageSize = 1000;
            let pageIndex = 0;
            let resultCount = 0;

            // Realizar la búsqueda y obtener los resultados en páginas
            let searchResult = searchObj.run();

            do {
                let page = searchResult.getRange({
                    start: pageIndex * pageSize,
                    end: (pageIndex + 1) * pageSize,
                });

                page.forEach(function (result) {
                    let carpeta = result.getValue({ name: "custrecord_ns_rs_id" });
                    let nombreArchivo = result.getValue({ name: "custrecord_nombre_archivo" });
                    let internalId = result.getValue({ name: "internalid" });
                    array_id_file_cabinet.push({ carpeta, nombreArchivo, internalId });
                });

                resultCount += page.length;
                pageIndex++;
            } while (resultCount < searchResult.count);

            return array_id_file_cabinet;
        } catch (e) {
            log.error({
                title: `${FN} error`,
                details: { message: `${FN} - ${e.message || `Unexpected error`}` },
            });
            throw { message: `${FN} - ${e.message || `Unexpected error`}` };
        }
    };


    return {
        execute: execute,
    };
});
