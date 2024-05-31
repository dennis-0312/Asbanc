/**
* @NApiVersion 2.1
* @NModuleScope Public
* 
* Task          Date            Author                                         Remarks
* GAP 12        13 Jun 2023     Alexander Ruesta <aruesta@myevol.biz>          - Creación de la libreria
*
*/

define(['N/search', 'N/record'], (search, record) => {

    const getBudgetItem = (paramDepartment, paramClass, paramSub, paramAnio) => {
        try {
            log.error("LIBRERIA budget", paramDepartment + ' -> ' + paramClass + '-> ' + paramSub + '-> ' + paramAnio)
            let searchPartida = search.create({
                type: "customrecord_ts_budget_item",
                filters:
                    [
                        ["custrecord_ts_cp_department", "anyof", paramDepartment],
                        "AND",
                        ["custrecord_ts_cp_class", "anyof", paramClass],
                        "AND",
                        ["custrecord_ts_cp_subsidiary", "anyof", paramSub],
                        "AND",
                        ["custrecord_ts_cp_detail_category.custrecord_ts_cp_detail_version", "anyof", "4"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid" }),
                        search.createColumn({
                            name: "custrecord_ts_cp_detail_anio",
                            join: "CUSTRECORD_TS_CP_DETAIL_CATEGORY"
                        })
                    ]
            });

            let resultCount = searchPartida.runPaged().count;
            log.error('resultCount', resultCount)
            if (resultCount != 0) {
                var resultSearch = searchPartida.run().getRange({ start: 0, end: 1000 });
                for (var a = 0; resultSearch && a < resultSearch.length; a++) {
                    var searchResult = resultSearch[a];
                    var columns = searchResult.columns;
                    let year = searchResult.getText(columns[1]);
                    log.debug('mirame', year)
                    if (year == paramAnio) {
                        log.debug('entro')
                        return searchResult.getValue(columns[0]);
                    }
                }
            } else {
                return 0;
            }

            return 0;
        } catch (e) {
            log.error('getBudgetItem', e);
        }
    }

    const applyIncrease = (paramFecha, paramAmount, paramPartidaIncrease) => {
        let success = 0;

        const increase = search.create({
            type: 'customrecord_ts_monthly_budget',
            filters:
                [
                    ["custrecord_ts_cp_detail_status", "anyof", "1"],
                    "AND",
                    ["custrecord_ts_cp_detail_category", "anyof", paramPartidaIncrease],
                    "AND",
                    ["custrecord_ts_cp_detail_version", "anyof", "4"],
                    "AND",
                    ["custrecord_ts_cp_detail_anio", "anyof", paramFecha],
                ],
            columns:
                [
                    'internalid'
                ]
        });
        let resultCount = increase.runPaged().count;
        if (resultCount != 0) {
            let result = increase.run().getRange({ start: 0, end: 1 });
            let internalid = result[0].getValue(increase.columns[0]);
            let recordLoad = record.load({ type: 'customrecord_ts_monthly_budget', id: internalid, isDynamic: true });
            let presupuestado = parseFloat(recordLoad.getValue({ fieldId: 'custrecord_ts_cp_detail_12' }));
            let suma = presupuestado + paramAmount;
            if (suma >= 0) {
                recordLoad.setValue({ fieldId: 'custrecord_ts_cp_detail_12', value: suma });
                recordLoad.setValue({ fieldId: 'custrecord_ts_cp_detail_total', value: suma });
                recordLoad.save();
                success = 1;
            }
        }
        return success;
    }
    const getPresupuestado = (paramPartida) => {
        let presupuestado = 0;
        let presupuestadoSearch = search.create({
            type: 'customrecord_ts_monthly_budget',
            filters:
                [
                    ["custrecord_ts_cp_detail_status", "anyof", "1"],
                    "AND",
                    ["custrecord_ts_cp_detail_category", "anyof", paramPartida],
                    "AND",
                    ["custrecord_ts_cp_detail_version", "anyof", "4"]
                ],
            columns:
                [
                    'internalid', 'custrecord_ts_cp_detail_total'
                ]
        });
        let resultCount = presupuestadoSearch.runPaged().count;
        if (resultCount != 0) {
            let result = presupuestadoSearch.run().getRange({ start: 0, end: 1 });
            let internalid = result[0].getValue(presupuestadoSearch.columns[0]);
            presupuestado = result[0].getValue(presupuestadoSearch.columns[1]);
        }
        return presupuestado;
    }
    const getAmountStatus = (paramPartida, paramSearch) => {
        let reservado = 0;
        let reservadoSearch = search.load({ id: paramSearch }),
            filters = reservadoSearch.filters;
        let filterPartida = search.createFilter({ name: 'custcol_ts_budget_item', operator: search.Operator.ANYOF, values: paramPartida });
        filters.push(filterPartida);


        let searchResultCount = reservadoSearch.runPaged().count;
        if (searchResultCount != 0) {
            let result = reservadoSearch.run().getRange({ start: 0, end: 1 });
            reservado = parseFloat(result[0].getValue(reservadoSearch.columns[4]));
        }
        return reservado ? reservado.toFixed(2) : 0;
    }
    const getAmountStatusMonth = (paramPartida, paramSearch, paramName) => {
        let arrResult = [],
            total = 0;
        let reservadoSearch = search.load({ id: paramSearch }),
            filters = reservadoSearch.filters;
        columns = reservadoSearch.columns;
        let filterPartida = search.createFilter({ name: 'custcol_ts_budget_item', operator: search.Operator.ANYOF, values: paramPartida });
        filters.push(filterPartida);

        let columDate = search.createColumn({ name: "formulatext", summary: "GROUP", formula: "TO_CHAR({trandate},'MM')", sort: search.Sort.ASC })
        columns.push(columDate);

        let searchResultCount = reservadoSearch.runPaged().count;
        if (searchResultCount != 0) {
            let pageData = reservadoSearch.runPaged({
                pageSize: 1000
            });

            var page, columns;

            pageData.pageRanges.forEach(function (pageRange) {
                page = pageData.fetch({
                    index: pageRange.index
                })
                page.data.forEach(function (result) {
                    columns = result.columns;
                    arrResult.push({
                        "month": parseFloat(result.getValue(columns[5])),
                        "amount": parseFloat(result.getValue(columns[4]))
                    })
                    total = total + parseFloat(parseFloat(result.getValue(columns[4])));


                })
            });
        }

        function findMonth(paramLine, paramMonth) {
            return paramLine.month == paramMonth;
        }

        let jsonResult = {
            "version": paramName,
            "ene": arrResult.find(line => findMonth(line, 1)) ? (arrResult.find(line => findMonth(line, 1))).amount : 0,
            "feb": arrResult.find(line => findMonth(line, 2)) ? (arrResult.find(line => findMonth(line, 2))).amount : 0,
            "mar": arrResult.find(line => findMonth(line, 3)) ? (arrResult.find(line => findMonth(line, 3))).amount : 0,
            "abr": arrResult.find(line => findMonth(line, 4)) ? (arrResult.find(line => findMonth(line, 4))).amount : 0,
            "may": arrResult.find(line => findMonth(line, 5)) ? (arrResult.find(line => findMonth(line, 5))).amount : 0,
            "jun": arrResult.find(line => findMonth(line, 6)) ? (arrResult.find(line => findMonth(line, 6))).amount : 0,
            "jul": arrResult.find(line => findMonth(line, 7)) ? (arrResult.find(line => findMonth(line, 7))).amount : 0,
            "ago": arrResult.find(line => findMonth(line, 8)) ? (arrResult.find(line => findMonth(line, 8))).amount : 0,
            "sep": arrResult.find(line => findMonth(line, 9)) ? (arrResult.find(line => findMonth(line, 9))).amount : 0,
            "oct": arrResult.find(line => findMonth(line, 10)) ? (arrResult.find(line => findMonth(line, 10))).amount : 0,
            "nov": arrResult.find(line => findMonth(line, 11)) ? (arrResult.find(line => findMonth(line, 11))).amount : 0,
            "dic": arrResult.find(line => findMonth(line, 12)) ? (arrResult.find(line => findMonth(line, 12))).amount : 0,
            "total": total
        };


        return jsonResult;
    }
    const passesControlPresupuestal = (paramJson) => {
        log.error("LIBRERIA", JSON.stringify(paramJson))
        let solicitud = [],
            arrPartida = [],
            JsonExample = paramJson;

        for (let i = 0; i < JsonExample.lines.length; i++) {
            let line = JsonExample.lines[i];

            var partida = getBudgetItem(line.department, line.clase, JsonExample.subsidiary, JsonExample.anio);

            if (partida == 0) {
                return {
                    value: false,
                    message: 'No cuenta con una Categoria de Presupuesto valida en la linea ' + line.numLine
                };
            } else {
                arrPartida.push([partida, line.numLine])
            }

            var budgetSearch = search.lookupFields({
                type: 'customrecord_ts_budget_item',
                id: partida,
                columns: ['custrecord_ts_cp_validate']
            });

            if (budgetSearch.custrecord_ts_cp_validate) {
                if (!solicitud[partida]) {
                    solicitud[partida] = [];
                }

                solicitud[partida][line.numLine] = parseFloat(line.amount);
                if (JsonExample.currency != '1') solicitud[partida][line.numLine] = (solicitud[partida][line.numLine] * JsonExample.rate).toFixed(2);


                let presupuestado = getPresupuestado(partida);
                log.debug('presupuestado: ' + presupuestado);
                let reservado = getAmountStatus(partida, 'customsearch_ts_cp_control_reserved');
                log.debug('reservado: ' + reservado);
                let comprometido = getAmountStatus(partida, 'customsearch_ts_cp_control_committed');
                log.debug('comprometido: ' + comprometido);
                let ejecutado = getAmountStatus(partida, 'customsearch_ts_cp_control_executed');
                log.debug('ejecutado: ' + ejecutado);
                let disponible = parseFloat(presupuestado) - (parseFloat(reservado) + parseFloat(comprometido) + parseFloat(ejecutado));


                log.debug('solicitud[partida]: ', solicitud[partida]);
                log.debug('disponible: ' + disponible);
                let total = solicitud[partida].reduce((a, b) => Number(a) + Number(b), 0);
                log.debug('solicitud: ' + solicitud);
                log.debug('Total', total)
                if (disponible < total) {
                    return {
                        value: false,
                        message: 'No tiene presupuesto asignado en la linea ' + line.numLine
                    };
                }
            }

        }
        return {
            partida: arrPartida,
            value: true,
            message: 'Paso Control Presupuestal'
        };
    }

    return ({
        getBudgetItem: getBudgetItem,
        applyIncrease: applyIncrease,
        getPresupuestado: getPresupuestado,
        getAmountStatus: getAmountStatus,
        getAmountStatusMonth: getAmountStatusMonth,
        passesControlPresupuestal: passesControlPresupuestal
    })

})