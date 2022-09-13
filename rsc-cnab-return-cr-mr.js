/**
* @NApiVersion 2.1
* @NScriptType MapReduceScript
*/
define(['N/log', 'N/record', 'N/search','N/file'],
/**
* @param{log} log
* @param{record} record
* @param{search} search
*/
(log, record, search, file) => {
    /**
     * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
     * @param {Object} inputContext
     * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
     *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
     * @param {Object} inputContext.ObjectRef - Object that references the input data
     * @typedef {Object} ObjectRef
     * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
     * @property {string} ObjectRef.type - Type of the record instance that contains the input data
     * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
     * @since 2015.2
     */

    const getInputData = (inputContext) => {
        return search.create({
            type:'folder',
            filters:[
                ["internalidnumber","equalto","4171"]
            ],
            columns:[
                search.createColumn({
                    name: "internalid",
                    join: "file",
                    label: "ID interno"
                 })
            ]
        })
    }

    /**
     * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
     * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
     * context.
     * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
     *     is provided automatically based on the results of the getInputData stage.
     * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
     *     function on the current key-value pair
     * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
     *     pair
     * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
     *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
     * @param {string} mapContext.key - Key to be processed during the map stage
     * @param {string} mapContext.value - Value to be processed during the map stage
     * @since 2015.2
     */

    const map = (mapContext) => {
        var mapValues = JSON.parse( mapContext.value );
        var values = mapValues.values
        var fileid = values['internalid.file'].value
        log.debug('fileid', fileid)
        var fileObj = file.load({
            id: fileid
        })
        var name = fileObj.name;
        if( name.lastIndexOf('.') > -1 ) {
            fileObj.name = name.substring( 0, name.lastIndexOf('.') ) + '.txt';
        } else {
            fileObj.name = name + '.txt';
        }
        fileObj.save();
        fileObj = file.load({
            id: fileid
        })
        var lastPosition = 0;
        var content = fileObj.getContents();
        log.debug('content', content)
        content = ( content.lastIndexOf('\n') === (content.length)-1 ) ? content : content+'\n';

        while( content.indexOf('\n', lastPosition) !== -1 )
        {
            var breakPosition = content.indexOf( '\n', lastPosition );
            var currentLine = content.substring( lastPosition, breakPosition - 1 );
            lastPosition = breakPosition + 1;
            mapContext.write({key: fileid, value: JSON.stringify(currentLine)})
        }
    }

    /**
     * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
     * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
     * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
     *     provided automatically based on the results of the map stage.
     * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
     *     reduce function on the current group
     * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
     * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
     *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
     * @param {string} reduceContext.key - Key to be processed during the reduce stage
     * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
     *     for processing
     * @since 2015.2
     */
    const reduce = (reduceContext) => {
        log.debug('context', reduceContext)
        var contextValue = reduceContext.values
        var nossoNumero = []
        var motivo = []
        var codRetorno = []
        var acrescimo = []
        var desconto = []
        var abatimento = []
        var IOFrecolhido =[]
        var vlrPago =[]
        var vlrLiquido = []
        for(var i = 0; i<contextValue.length;i++){
            log.debug("linhas", JSON.parse(contextValue[i]))
            var line = JSON.parse(contextValue[i])
            log.debug("T = True?", line[13])
            if(line[13] == 'T'){
                nossoNumero.push(line.substring(37,56))
                motivo.push(line.substring(213,215))
            }
            if(line[13] == 'U'){
                codRetorno.push(line.substring(15,17))
                acrescimo.push(line.substring(17,31))
                desconto.push(line.substring(32, 46))
                abatimento.push(line.substring(47, 61))
                IOFrecolhido.push(line.substring(62, 76))
                vlrPago.push(line.substring(77, 91))
                vlrLiquido.push(line.substring(92, 106))
            }
        }
        log.debug('nossoNumero', nossoNumero)
        log.debug('codRetorno', codRetorno)
        // log.debug('codRetorno', codRetorno[0] ==06)
        try{
        for(var t = 0; t < nossoNumero.length; t++){
            var status;
            log.debug('status', status)
            var searchRetorno = search.create({
                type: 'customrecord_rsc_cnab_returnoccurrence',
                filters:[
                    ['custrecord_rsc_cnab_ro_code_ds', 'IS', motivo[t]]
                ]
            }).run().getRange({start:0, end:1})
            log.debug('searchRetorno', searchRetorno)
            log.debug('nossoNumero', nossoNumero[t])
            var faturaRecord = record.load({
                type:'invoice',
                id: parseInt(nossoNumero[t]) 
            })
            log.debug('nossoNumero[t]', nossoNumero[t])
            if(codRetorno[t] == '02'){
                status = 3
            }else if(codRetorno[t] == '03'){
                status = 4
            }else if(codRetorno[t] == '06'){
                status =  5
            }else{
                status =  4
                if(searchRetorno[0]){
                    faturaRecord.setValue({
                        fieldId: 'custbody_rsc_cnab_inst_occurrence_ls',
                        value: searchRetorno[0].id
                    })
                }
            }
            faturaRecord.setValue({
                fieldId: 'custbody_rsc_cnab_inst_status_ls',
                value: status
            })
           
            faturaRecord.save({ignoreMandatoryFields: true})
            
            
        }
        }catch(e){
            log.debug('e', e)
        }

        var arquivo = file.load({
            id: reduceContext.key
        })
        arquivo.folder = 4172
        arquivo.save()
        context.write({key: context.key, value: JSON.stringify({teste: 123})})
    }


    /**
     * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
     * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
     * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
     * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
     *     script
     * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
     * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
     *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
     * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
     * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
     * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
     *     script
     * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
     * @param {Object} summaryContext.inputSummary - Statistics about the input stage
     * @param {Object} summaryContext.mapSummary - Statistics about the map stage
     * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
     * @since 2015.2
     */
    const summarize = (summaryContext) => {
        // log.debug('summaryContext', summaryContext)
        // summaryContext.output.iterator().each( function( key, value )
        // {
        //     log.debug('key', key)
           
        // });
    }

    return {getInputData, map, reduce, summarize}

});
