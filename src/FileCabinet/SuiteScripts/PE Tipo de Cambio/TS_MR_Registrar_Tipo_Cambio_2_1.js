/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */

define(['N/format', 'N/runtime', 'N/search', 'N/record', 'N/https'], (format, runtime, search, record, https) => {

    const getInputData = (context) => {
        try {
            let fechas = obtenerFechas();
            log.error("fechas length", fechas.length);

            return fechas;
        } catch (error) {
            log.error("An error was ocurred in [getInputData]", error);
        }
    }

    const map = (context) => {
        try {
            let key = context.key;
            let fechaAProcesar = JSON.parse(context.value);
            log.error("map", context.key);
            log.error("value", fechaAProcesar);

            let obtenerTipoCambio = true;
            let requestError = false;
            let fechaProceso = JSON.parse(context.value);

            let i = 1;
            while (obtenerTipoCambio && !requestError && i < 5) {
                let response = postTipoCambio(fechaProceso.fecha);
                log.error("response", response);
                if (response == null) requestError = true;
                else {
                    if (response.success) {
                        obtenerTipoCambio = false;
                        if (fechaAProcesar.ultimo) {
                            let peTipocambioFechaId = obtenerPETipoCambioFechaActual();
                            if (!peTipocambioFechaId) {
                                createPETipoCambio(response.data, fechaAProcesar.fechaISO);
                            } else {
                                updatePETipoCambio(peTipocambioFechaId, response.data);
                            }
                        } else {
                            createPETipoCambio(response.data, fechaAProcesar.fechaISO);
                        }
                    } else {
                        fechaProceso = obtenerFechaAnterior(fechaProceso.fechaISO);
                        log.error("fechaProceso", fechaProceso);
                    }
                }
                i++;
            }
        } catch (error) {
            log.error("An error was ocurred in [map]", error);
        }
    }

    const obtenerFechaAnterior = (fechaISO) => {
        let objetoFecha = new Date(fechaISO);
        let fechaAnterior = new Date(objetoFecha.getFullYear(), objetoFecha.getMonth(), objetoFecha.getDate() - 1);
        return {
            fechaISO: fechaAnterior.toISOString(),
            fecha: formatDateToYYYYMMDD(fechaAnterior),
        };
    }

    const postTipoCambio = (fecha) => {
        try {
            let headers = {};
            headers["Accept"] = "*/*";
            headers["Content-Type"] = "application/json";
            let body = {
                fecha
            };
            let response = https.requestRestlet({
                scriptId: "customscript_ts_consultatipocambio",
                deploymentId: "customdeploy_ts_consultatipocambio",
                headers,
                body: JSON.stringify(body)
            });
            //log.error("response", response.body);
            return JSON.parse(response.body);
        } catch (error) {
            log.error("An error was ocurred in [postTipoCambio]", error);
            return null;
        }
    }

    const obtenerPETipoCambioFechaActual = () => {
        try {
            var searchResult = search.create({
                type: "customrecord_pe_tipo_cambio",
                filters: [
                    ["custrecord_pe_tc_fecha_efectiva", "on", "today"]
                ],
                columns: [
                    "custrecord_pe_tc_fecha_efectiva"
                ]
            }).run().getRange(0, 10);

            if (searchResult.length) return searchResult[0].id;
            return null;
        } catch (error) {
            log.error("An error was ocurred in [obtenerPETipoCambioFechaActual]", error);
        }
    }

    const obtenerPETipoCambio = () => {
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
                let fecha = formatDateToYYYYMMDD(parseDate(fechaEfectiva));
                peTipoCambioJson[fecha] = tipoCambio;
            })
        })
        return peTipoCambioJson;
    }

    const obtenerFechas = (fechaProceso) => {
        let fechasResultado = [];
        let fechasPeTipoCambio = obtenerPETipoCambio();
        var fechaActual = new Date();
        var fechaInicio = getFechaPeriodoInicial();
        while (fechaInicio < fechaActual) {
            var formatDate = formatDateToYYYYMMDD(fechaInicio)
            if (fechasPeTipoCambio[formatDate] === undefined) {
                var fecha = {
                    fechaISO: fechaInicio.toISOString(),
                    fecha: formatDate,
                    ultimo: false
                }
                fechasResultado.push(fecha);
            }
            fechaInicio.setDate(fechaInicio.getDate() + 1);
        }
        var fecha = {
            fechaISO: fechaActual.toISOString(),
            fecha: formatDateToYYYYMMDD(fechaActual),
            ultimo: true
        }
        fechasResultado.push(fecha);
        return fechasResultado;
    }

    function formatDateToYYYYMMDD(fecha) {
        var year = fecha.getFullYear();
        var month = ('0' + (fecha.getMonth() + 1)).slice(-2);
        var day = ('0' + fecha.getDate()).slice(-2);
        return year + '-' + month + '-' + day;
    }

    function formatYYYYMMDDToDate(fechaISO) {
        return new Date(fechaISO);
    }

    const getFechaPeriodoInicial = () => {
        var searchResult = search.create({
            type: "accountingperiod",
            filters: [
                ["isadjust", "is", "F"],
                "AND",
                ["isyear", "is", "F"],
                "AND",
                ["isquarter", "is", "F"]
            ],
            columns: [
                search.createColumn({ name: "startdate", label: "Start Date", sort: search.Sort.ASC })
            ]
        }).run().getRange(0, 1000);

        if (searchResult.length) return parseDate(searchResult[0].getValue("startdate"));

        return new Date();
    }

    const parseDate = (value) => {
        return format.parse({
            type: format.Type.DATE,
            value: value
        })
    }

    const createPETipoCambio = (tipoCambio, fechaRegistro) => {
        let peTipoCambio = record.create({ type: "customrecord_pe_tipo_cambio" });
        peTipoCambio.setValue("custrecord_pe_tc_tipo_cambi_ofi", "Venta");
        peTipoCambio.setValue("custrecord_pe_tc_fecha_efectiva", formatYYYYMMDDToDate(fechaRegistro));
        peTipoCambio.setValue("custrecord_pe_tc_tipo_cambio", tipoCambio.venta);
        peTipoCambio.setValue("custrecord_pe_tc_moneda_base", 1);
        peTipoCambio.setValue("custrecord_pe_tc_moneda_conversion", 2);
        peTipoCambio.save();
    }

    const updatePETipoCambio = (id, tipoCambio) => {
        let peTipoCambio = record.load({ type: "customrecord_pe_tipo_cambio", id: id });
        peTipoCambio.setValue("custrecord_pe_tc_tipo_cambio", tipoCambio.venta);
        peTipoCambio.save();
    }

    return {
        getInputData,
        map
    }
})