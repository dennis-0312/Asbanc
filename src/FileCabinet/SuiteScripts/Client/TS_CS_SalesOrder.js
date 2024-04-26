/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
 define(['N/currentRecord'], (currentRecord) => {

    const pageInit = (scriptContext) => {
        if (scriptContext.mode === 'view') {
            var nextBillButton = document.querySelector('[data-value="nextbill"]');
            if (nextBillButton) {
                nextBillButton.style.display = 'none';
            }
        }
    };

    return {
        pageInit: pageInit
    };
});
