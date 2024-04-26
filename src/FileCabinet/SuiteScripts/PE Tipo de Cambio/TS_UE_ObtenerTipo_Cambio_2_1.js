/**
* @NApiVersion 2.1
* @NScriptType UserEventScript
*/

define(["N/search", "N/runtime", "N/format"], (search, runtime, format) => {

    const PEN_CURRENCY_ID = 1;
    const USD_CURRENCY_ID = 2;

    const beforeSubmit = (context) => {
        let objRecord = context.newRecord;
        let type = context.type;

        log.error("runtime.executionContext", runtime.executionContext);
        log.error("type", type);
        try {
            if (runtime.executionContext == runtime.ContextType.CSV_IMPORT) {
                let hoy = new Date();
                let peTipoCambioJson = obtenerPETipoCambio();
                let moneda = objRecord.getValue('currency') || currentRecord.getValue("expensereportcurrency");
                let fecha = objRecord.getValue('trandate');
                log.error("datos", {fecha, moneda})
                if (fecha <= hoy) fecha = hoy;
                fecha = parseDate(fecha);
                log.error("fecha", fecha);
                if (moneda == USD_CURRENCY_ID) {
                    log.error("peTipoCambioJson[fecha]", peTipoCambioJson[fecha]);
                    objRecord.setValue('exchangerate', peTipoCambioJson[fecha]);
                    objRecord.setValue('expensereportexchangerate', peTipoCambioJson[fecha]);
                }
            }
        } catch (error) {
            log.error("An error was ocurred in [beforeSubmit]", error);
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
                var tipoCambio = result.getValue("custrecord_pe_tc_tipo_cambio");
                peTipoCambioJson[fechaEfectiva] = tipoCambio;
            })
        })
        return peTipoCambioJson;
    }

    const parseDate = (value) => {
        return format.format({
            type: format.Type.DATE,
            value: value
        })
    }

    return {
        beforeSubmit
    }
})