/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/runtime', "N/url", "N/search", 'N/ui/dialog', 'N/record'], function (runtime, url, search, dialog, record) {
  const pageInit = (context) => {
    // Realiza las acciones que deseas en el contexto de vista
  }
  const printPurchaseOrder = (id, type) => {
    var host = url.resolveDomain({
      hostType: url.HostType.APPLICATION,
      accountId: runtime.accountId
    });
    var url_stlt = url.resolveScript({
      scriptId: 'customscript_ts_sl_printpurchaseorder',
      deploymentId: 'customdeploy_ts_sl_printpurchaseorder',
      returnExternalUrl: false
    });
    url_stlt = 'https://' + host + url_stlt + '&custpage_internalid=' + id + '&custpage_typerec=' + type;
    window.open(url_stlt, '_blank');

  }

  return {
    pageInit: pageInit,
    printPurchaseOrder: printPurchaseOrder,
  };
});
