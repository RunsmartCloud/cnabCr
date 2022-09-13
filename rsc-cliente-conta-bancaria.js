/**
* @NScriptType ClientScript
* @NApiVersion 2.0
* @scriptName rsc-cnab-batch-cl
*/
define([ 'N/ui/dialog', 'N/runtime', 'N/currentRecord', 'N/search' ],

/**
 *
 * @param dialog
 * @param runtime
 * @param currentRecord
 * @param lib
 * @return {{saveRecord: (function(*): boolean)}}
 */
function( dialog, runtime, currentRecord, search )
{
    /**
     * @function
     * @param context
     * 
     */
    
    function fieldChanged( context ){
        var fieldId = context.fieldId
        var currRecord = context.currentRecord
        if(fieldId == "custrecord_rsc_cnab_ba_preferential_fl"){
            var sub = currRecord.getValue('custrecord_rsc_cnab_ba_subsidiary_ls')
            var preferencial = currRecord.getValue('custrecord_rsc_cnab_ba_preferential_fl')
            if(preferencial){
                var searhConta = search.create({
                    type:'customrecord_rsc_cnab_bankaccount',
                    filters:[
                        ['custrecord_rsc_cnab_ba_subsidiary_ls', 'IS', sub],
                        'AND',
                        ['custrecord_rsc_cnab_ba_preferential_fl', 'IS', 'T']
                    ]
                }).run().getRange({start: 0, end:1})
                if(searhConta[0]){
                    alert('Já existe uma conta preferencial para essa subsidiaria.')
                    currRecord.setValue({
                        fieldId:'custrecord_rsc_cnab_ba_preferential_fl',
                        value: false
                    })
                }
            }
            
        }
    }
    return {
        fieldChanged: fieldChanged
    }
})