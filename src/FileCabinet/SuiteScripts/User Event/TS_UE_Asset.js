/**
* @NApiVersion 2.1
* @NScriptType UserEventScript
*
* Task          Date            Author                                         Remarks
* GAP 41        12 Ago 2023     Alexander Ruesta <aruesta@myevol.biz>          - Condigo empresarial para Activo Fijo.
*
*/

define(["N/record", "N/log", "N/search"], (record, log, search) => {

    const asignarCorrelativo = (activoFijo, idActivoFijo, contador, name) => {
        let finalizar = false;
        try {
            log.error("datos", { activoFijo, idActivoFijo, contador });
            let subsidiaria = obtenerSubsidiaria(activoFijo.idSubsidiaria);
            let abbrev = subsidiaria.prefijo;
            let cod = activoFijo.idTipoActivo == 1 ? '33' : '34';
            let anio = String(new Date().getFullYear()).substring(2, 4);
            let correlative = subsidiaria.correlativo ? Number(subsidiaria.correlativo) : 1;
            correlative += contador;
            let codigoEmpresarial = 'I' + abbrev + cod + '-' + anio + '-' + zfill(correlative, 4);
            log.error("codigoEmpresarial", codigoEmpresarial);
            actualizarActivoFijo(idActivoFijo, codigoEmpresarial);
            let actualizoSubsidiaria = actualizarSubsidiaria(activoFijo.idSubsidiaria, correlative);
            if (!actualizoSubsidiaria) actualizarActivoFijo(idActivoFijo, name);
            log.error("Finalizó", actualizoSubsidiaria);
            finalizar = true;
        } catch (error) {
            log.error("error", error);
            finalizar = false;
        }
        return finalizar;
    }

    const obtenerActivoFijo = (id) => {
        let searchResult = search.lookupFields({
            type: "customrecord_ncfar_asset",
            id,
            columns: ["custrecord_assettype.custrecord_asb_fam_claseactivo", "custrecord_assetsubsidiary"]
        });
        return {
            idSubsidiaria: searchResult.custrecord_assetsubsidiary[0].value,
            idTipoActivo: searchResult["custrecord_assettype.custrecord_asb_fam_claseactivo"][0].value,
        }
    }

    const obtenerSubsidiaria = (id) => {
        let searchResult = search.lookupFields({
            type: search.Type.SUBSIDIARY,
            id,
            columns: ["custrecord_ts_sub_correlative", "tranprefix"]
        });

        return {
            correlativo: searchResult.custrecord_ts_sub_correlative,
            prefijo: searchResult.tranprefix
        };
    }

    const actualizarSubsidiaria = (id, correlative) => {
        try {
            log.error("id", { id, correlative });
            let subsidiaryRecord = record.load({ type: 'subsidiary', id: id });
            subsidiaryRecord.setValue({ fieldId: 'custrecord_ts_sub_correlative', value: correlative + 1 });
            subsidiaryRecord.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            /*
            record.submitFields({
                type: record.Type.SUBSIDIARY,
                id,
                values: {
                    custrecord_ts_sub_correlative: correlative
                },
                enableSourcing: true,
                ignoreMandatoryFields: true
            });*/

        } catch (error) {
            log.error("Error [actualizarSubsidiaria]", error);
            return false;
        }
    }

    const actualizarActivoFijo = (id, name) => {
        log.error("actualizarActivoFijo", {id, name});
        record.submitFields({
            type: "customrecord_ncfar_asset",
            id,
            values: {
                name
            }
        });
    }

    const afterSubmit = (context) => {
        const FN = 'Codigo Empresarial';
        try {
            log.debug(context.type)
            log.error("context.newRecord", context.newRecord);
            log.error("context.newRecord", context.newRecord.getValue('name'));
            if (context.type === 'create' || context.type === 'edit') {
                let finalizar = false;
                var redondeo = redondear(context.newRecord.id);
                log.debug('pruebita', redondeo)
                for (let index = 0; index < redondeo; index++) { }

                let count = 0;
                let activoFijo = obtenerActivoFijo(context.newRecord.id);

                while (count < 10 && !finalizar) {
                    count++;
                    finalizar = asignarCorrelativo(activoFijo, context.newRecord.id, count, context.newRecord.getValue('name'));
                    log.error("count", { count, finalizar });
                }


                /*
                let recAsset = record.load({ type: context.newRecord.type, id: context.newRecord.id, isDynamic: true }),
                    subsidiary = recAsset.getValue('custrecord_assetsubsidiary'),
                    assetType = recAsset.getValue('custrecord_assettype');
                var redondeo = redondear(context.newRecord.id);
                log.debug('pruebita', redondeo)
                for (let index = 0; index < redondeo; index++) {
    
    
                }
                let subSearch = record.load({ type: 'subsidiary', id: subsidiary, isDynamic: true }),
                    correlative = subSearch.getValue('custrecord_ts_sub_correlative'),
                    abbrev = subSearch.getValue('tranprefix');
    
                let assetTypeSearch = search.lookupFields({
                    type: 'customrecord_ncfar_assettype',
                    id: assetType,
                    columns: ['custrecord_asb_fam_claseactivo']
                });
                let classAsset = assetTypeSearch.custrecord_asb_fam_claseactivo[0].value;
                if (classAsset == 1) cod = '33'
                else cod = '34'
    
                correlative = correlative ? correlative : 1;
    
                let anio = String(new Date().getFullYear());
                anio = anio.substring(2, 4)
    
                let codigoEmpresarial = 'I' + abbrev + cod + '-' + anio + '-' + zfill(correlative, 4);
                recAsset.setValue({ fieldId: 'name', value: codigoEmpresarial });
                recAsset.save();
    
                subSearch.setValue({ fieldId: 'custrecord_ts_sub_correlative', value: correlative + 1 });
                subSearch.save();*/
            }


        } catch (e) {
            log.error({
                title: `${FN} error`,
                details: { message: `${FN} - ${e.message || `Unexpected error`}` },
            });
            throw { message: `${FN} - ${e.message || `Unexpected error`}` };
        }
    };

    const redondear = (num) => {
        return (num % 100) * 50;
    }


    const zfill = (number, width) => {
        var numberOutput = Math.abs(number); /* Valor absoluto del número */
        var length = number.toString().length; /* Largo del número */
        var zero = "0"; /* String de cero */

        if (width <= length) {
            if (number < 0) {
                return ("-" + numberOutput.toString());
            } else {
                return numberOutput.toString();
            }
        } else {
            if (number < 0) {
                return ("-" + (zero.repeat(width - length)) + numberOutput.toString());
            } else {
                return ((zero.repeat(width - length)) + numberOutput.toString());
            }
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});
