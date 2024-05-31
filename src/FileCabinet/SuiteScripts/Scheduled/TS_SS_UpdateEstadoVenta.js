/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 *
 * Task          Date            Author                                         Remarks
 * GAP 95        19 Jun 2023     Jeferson Mejía <jeferson.mejia@myevol.biz>     - Actualización del campo ESTADO DE VENTA
 *
 */
define(["N/search", "N/record", "N/log"], (search, record, log) => {
  const execute = (context) => {
    const FN = 'execute';
    try {
      searchSalesOrder().forEach(function (id) {
        log.debug('idSalesOrder', id);
        record.submitFields({
          type: record.Type.SALES_ORDER,
          id: id,
          values: {
            'custbody_asb_estado_venta': 2
          },
          options: {
            enableSourcing: false,
            ignoreMandatoryFields: true
          }
        });
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
            ["status", "anyof", "SalesOrd:G"],
            "AND",
            ["item.type", "anyof", "Service"],
            "AND",
            ["item.subtype", "anyof", "Sale"],
            "AND",
            ["item.custitem_asb_tipo_item", "anyof", "2"],
            "AND", 
            ["custbody_asb_estado_venta","anyof","1"]
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
