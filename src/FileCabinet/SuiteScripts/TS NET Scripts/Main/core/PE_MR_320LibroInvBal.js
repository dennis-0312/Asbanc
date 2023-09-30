/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * Task          Date            Author                                         Remarks
 * 3.20          29 Ago 2023     Alexander Ruesta <aruesta@myevol.biz>          - Creación del reporte 3.20
 *
 */

define(['N/runtime', 'N/search', 'N/config', 'N/render', 'N/record', 'N/file', '../Library/PE_LIB_Libros.js'], (runtime, search, config, render, record, file, libPe) => {

    var objContext = runtime.getCurrentScript();

    /** PARAMETROS */
    var pGloblas = {};

    /** REPORTE */
    var formatReport = 'pdf';
    var nameReport = '';
    var transactionFile = null;

    /** DATOS DE LA SUBSIDIARIA */
    var companyName = '';
    var companyRuc = '';
    var companyLogo = '';
    var companyDV = '';

    var featureSTXT = null;
    var featMultibook = null;
    var featSubsidiary = null;

    const getInputData = () => {
        try {
            getParameters();

            return getTransactions();
        } catch (e) {
            log.error('[ Get Input Data Error ]', e);
        }


    }

    const map = (context) => {
        try {
            var key = context.key;
            var dataMap = JSON.parse(context.value);

            var resultTransactions = {
                dato1: dataMap[0],
                dato2: dataMap[1],
                dato3: dataMap[2],
                dato4: dataMap[3]
            };

            context.write({
                key: key,
                value: resultTransactions
            });

        } catch (e) {
            log.error('[ Map Error ]', e);
        }

    }

    const summarize = (context) => {
        log.debug('Entro al summarize');
        getParameters();
        getSubdiary();

        pGloblas['pRecordID'] = libPe.createLog(pGloblas.pSubsidiary, pGloblas.pPeriod, "Formato3.20")
        var transactionJSON = {};
        transactionJSON["parametros"] = pGloblas
        transactionJSON["transactions"] = [];
        context.output.iterator().each((key, value) => {
            value = JSON.parse(value);
            //transactionJSON["transactions"].push(value);
            transactionJSON["transactions"][value.dato3] = value;
            return true;

        });
        log.debug('transactionJSON', transactionJSON["transactions"]);
        var jsonAxiliar = getJsonData(transactionJSON["transactions"]);
        log.debug('jsonAxiliar', jsonAxiliar);
        //Validamos que TrnsactionJSON.accounts no este vacio para todos los ambientes
        if (!isObjEmpty(transactionJSON["transactions"])) {
            var renderer = render.create();
            renderer.templateContent = getTemplate();
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "input",
                data: {
                    data: JSON.stringify(jsonAxiliar)
                }
            });

            /**** */
            stringXML2 = renderer.renderAsString();
            var FolderId = 871;
            if (FolderId != '' && FolderId != null) {
                // Crea el archivo
                var fileAux = file.create({
                    name: 'Auxiliar320',
                    fileType: file.Type.PLAINTEXT,
                    contents: stringXML2,
                    encoding: file.Encoding.UTF8,
                    folder: FolderId
                });
                var idfile = fileAux.save(); // Termina de grabar el archivo
                log.debug({
                    title: 'URL ARCHIVO TEMP',
                    details: idfile
                });
            }

            /*** */
            stringXML = renderer.renderAsPdf();
            saveFile(stringXML);


            /**** */
            log.debug('Termino');
            return true;

        } else {
            log.debug('No data');
            libPe.noData(pGloblas.pRecordID);
        }

    }

    const getJsonData = (transactions) => {
        let userTemp = runtime.getCurrentUser(),
            useID = userTemp.id,
            jsonTransacion = {},
            jsonFinal = [],
            saldo = 0

        var employeeName = search.lookupFields({
            type: search.Type.EMPLOYEE,
            id: useID,
            columns: ['firstname', 'lastname']
        });
        var userName = employeeName.firstname + ' ' + employeeName.lastname;

        log.debug('jsonTransacion', jsonTransacion);

        for (var k in transactions) {
            let IDD = transactions[k].dato3;

            if (!jsonTransacion[IDD]) {
                let dato_4 = parseFloat(transactions[k].dato4);
                log.debug('dato_4', dato_4);

                // let debitoFormat = numberWithCommas(transactions[k].debito);
                // log.debug('debitoFormat', debitoFormat);
                jsonTransacion[IDD] = {
                    dato1: transactions[k].dato1,
                    dato2: transactions[k].dato2,
                    dato3: transactions[k].dato3,
                    dato4: dato_4,
                }
                saldo += dato_4;
                // totalCredito = totalCredito + Number(transactions[k].credito);
            }
        }

        let periodSearch = search.lookupFields({
            type: search.Type.ACCOUNTING_PERIOD,
            id: pGloblas.pPeriod,
            columns: ['periodname']
        });

        let jsonCompany = {
            "company": {
                "firtsTitle": 'FORMATO 3.20: "LIBRO DE INVENTARIOS Y BALANCES - ESTADO DE GANANCIAS Y PÉRDIDAS POR FUNCIÓN DEL 01.01 AL 31.12"',
                "secondTitle": (periodSearch.periodname).split(' ')[1],
                "thirdTitle": companyRuc.replace(/&/g, '&amp;'),
                "fourthTitle": companyName.replace(/&/g, '&amp;')
            },
            "totals": {
                dato4: Number(saldo).toFixed(2)
            },
            "movements": jsonTransacion
        };

        return jsonCompany;
    }


    const saveFile = (stringValue) => {
        var fileAuxliar = stringValue;
        var urlfile = '';
        if (featSubsidiary) {
            nameReport = 'Formato 3.20_' + companyName + '.' + formatReport;
        } else {
            nameReport = 'Formato 3.20_' + '.' + formatReport;
        }

        var folderID = 871;

        fileAuxliar.name = nameReport;
        fileAuxliar.folder = folderID;

        var fileID = fileAuxliar.save();

        let auxFile = file.load({
            id: fileID
        });
        log.debug('hiii', auxFile)
        urlfile += auxFile.url;

        log.debug('pGloblas.pRecordID', pGloblas.pRecordID)
        libPe.loadLog(pGloblas.pRecordID, nameReport, urlfile)

    }

    const getTemplate = () => {
        var aux = file.load("../FTL/PE_Template320LibroInvBal.xml");
        return aux.getContents();
    }

    const getTransactions = () => {
        var arrResult = [];
        var _cont = 0;

        // PE - Libro de Inventario y Balances - Estado de Resultados - 3.20
        var savedSearch = search.load({
            id: 'customsearchpe_detalle_3_20'
        });

        if (featSubsidiary) {
            savedSearch.filters.push(search.createFilter({
                name: 'subsidiary',
                operator: search.Operator.IS,
                values: pGloblas.pSubsidiary
            }));
        }

        var pagedData = savedSearch.runPaged({
            pageSize: 1000
        });

        var page, columns;

        pagedData.pageRanges.forEach(function (pageRange) {
            page = pagedData.fetch({
                index: pageRange.index
            });

            page.data.forEach(function (result) {
                columns = result.columns;
                arrAux = new Array();

                // 0. CODIGO
                arrAux[0] = result.getValue(columns[0]);

                // 1. MONTO
                arrAux[1] = result.getValue(columns[1]);

                // 1. MONTO
                arrAux[2] = result.getValue(columns[2]);

                // 1. MONTO
                arrAux[3] = result.getValue(columns[3]);

                arrResult.push(arrAux);
            });
        });
        log.debug('arrResult', arrResult)
        return arrResult;
    }

    const getSubdiary = () => {

        if (featSubsidiary) {
            log.debug(pGloblas.pSubsidiary, pGloblas.pSubsidiary)
            var dataSubsidiary = record.load({
                type: 'subsidiary',
                id: pGloblas.pSubsidiary
            });
            companyName = dataSubsidiary.getValue('legalname');
            companyRuc = dataSubsidiary.getValue('federalidnumber');
        } else {
            companyName = config.getFieldValue('legalname');
            companyRuc = ''
        }
    }

    const getParameters = () => {
        //pGloblas = objContext.getParameter('custscript_pe_320libinvbal_params'); // || {};
        //pGloblas = JSON.parse(pGloblas);
        pGloblas = {
            recordID: '',
            reportID: 109,
            subsidiary: 3,
            periodCon: 111
        }
        log.debug('previo', pGloblas)

        pGloblas = {
            pRecordID: pGloblas.recordID,
            pFeature: pGloblas.reportID,
            pSubsidiary: pGloblas.subsidiary,
            pPeriod: pGloblas.periodCon,
        }
        log.debug('XDDD', pGloblas);

        featSubsidiary = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
    }

    const isObjEmpty = (obj) => {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) return false;
        }

        return true;
    }

    const numberWithCommas = (x) => {
        x = x.toString();
        var pattern = /(-?\d+)(\d{3})/;
        while (pattern.test(x))
            x = x.replace(pattern, "$1,$2");
        return x;
    }

    return {
        getInputData: getInputData,
        map: map,
        // reduce: reduce,
        summarize: summarize
    };

});
