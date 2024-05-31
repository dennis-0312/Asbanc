/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 *
 * Task          Date            Author                                         Remarks
 * GAP 56        21 Jun 2023     Jeferson Mejía <jeferson.mejia@myevol.biz>     - Abrir SALES ORDER
 *
 */
define(["N/search", "N/record", "N/log"], (search, record, log) => {
  const execute = (context) => {
    const FN = 'execute';
    try {
      searchSalesOrder().forEach(function (id) {
        log.debug('idSalesOrder', id);
        var recordSO = record.load({
          type: record.Type.SALES_ORDER,
          id: id
        });
        var lineItemCount = recordSO.getLineCount({ sublistId: 'item' });
        recordSO.setValue('custbody_estado_orden_serv', 1);
        recordSO.setValue('custbody_asb_stand_by', '');
        for (let i = 0; i < lineItemCount; i++) {
          recordSO.setSublistValue({ sublistId: 'item', fieldId: 'isclosed', value: false, line: i });
        }

        recordSO.save();

      });

    } catch (e) {
      log.error({
        title: `${FN} error`,
        details: { message: `${FN} - ${e.message || `Unexpected error`}` },
      });
      throw { message: `${FN} - ${e.message || `Unexpected error`}` };
    }
  };

  const searchSalesOrder = () => {
    const FN = 'searchSalesOrder';
    try {
      let idSalesOrder = search.create({
        type: "transaction",
        filters:
          [
            ["status", "anyof", "SalesOrd:H"],
            "AND",
            ["custbody_asb_stand_by", "on", "today"],
            "AND",
            ["custbody_estado_orden_serv", "anyof", "2"]
          ],
        columns:
          [
            search.createColumn({
              name: "internalid",
              summary: "GROUP",
              label: "Internal ID"
            })
          ]
      });

      let array_id_sales_order = [];

      // Configurar los límites de la paginación
      let pageSize = 1000;
      let pageIndex = 0;
      let resultCount = 0;

      // Realizar la búsqueda y obtener los resultados en páginas
      let searchResult = idSalesOrder.run();

      do {
        let page = searchResult.getRange({
          start: pageIndex * pageSize,
          end: (pageIndex + 1) * pageSize,
        });

        page.forEach(function (result) {
          let internalid = result.getValue(searchResult.columns[0]);
          array_id_sales_order.push(internalid);
        });

        resultCount += page.length;
        pageIndex++;
      } while (resultCount < searchResult.count);

      return array_id_sales_order;
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
