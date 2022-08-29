/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @scriptName rsc-cnab-batch-mr
 */
define([ 'N/record', 'N/log', 'N/runtime', './rsc-cnab-batch', 'N/error', './rsc-cnab-batch-file', 'N/file','N/search' ],
    /**
     *
     * @param record
     * @param log
     * @param runtime
     * @param lib
     * @param Nerror
     * @param file
     * @return {{getInputData: getInputData, summarize: summarize, map: map}}
     */
    function( record, log, runtime, lib, Nerror, file, nFile, search)
    {
        /**
         * @function getInputData - get the expense report list to be processed
         * @return {Object}
         */
        function getInputData()
        {
            try
            {
                const script = runtime.getCurrentScript();
                const installments = script.getParameter({ name:'custscript_rsc_cnab_batchdata_cr_ds' });
                log.debug( 'getInputData', installments );
                return JSON.parse( installments );

            } catch (e) {
                throw 'MR.getInputData: '+e;
            }
        }

        /**
         * @function
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         */
        function map( context )
        {
            var installment = JSON.parse( context.value );
            var id = context.key;

            try
            {
                var transaction = record.load({ type: installment.transactionType, id: installment.transaction, isDynamic: true });
                var accountRecord = search.lookupFields({
                    type:'customrecord_rsc_cnab_bankaccount',
                    id: transaction.getValue('custbody_rsc_cnab_inst_locationba_ls'),
                    columns:[
                        'custrecord_rsc_cnab_ba_agencynumber_ls',
                        'custrecord_rsc_cnab_ba_dvagencynumber_ds',
                        'custrecord_rsc_cnab_ba_number_ds',
                        'custrecord_rsc_cnab_ba_dvnumber_ds',
                        'custrecord_rsc_cnab_ba_portfolio_ls',
                        'custrecord_rsc_cnab_ba_bank_ls',
                        'name'
                    ]
                })
                var agenciaAccount = accountRecord.custrecord_rsc_cnab_ba_agencynumber_ls
                var digitoAgencia = accountRecord.custrecord_rsc_cnab_ba_dvagencynumber_ds
                var contaCorrente = accountRecord.custrecord_rsc_cnab_ba_number_ds
                var digitoConta = accountRecord.custrecord_rsc_cnab_ba_dvnumber_ds
                var nossoNumero = transaction.getValue('custrecord_rsc_cnab_inst_ournumber_nu')
                var codCarteira = accountRecord.custrecord_rsc_cnab_ba_portfolio_ls[0].value
                var carteira = search.lookupFields({
                    type:'customrecord_rsc_cnab_portfolio',
                    id: codCarteira,
                    columns:[
                        'custrecord_rsc_cnab_portfolio_code_ds'
                    ]
                }).custrecord_rsc_cnab_portfolio_code_ds
                var numDoc = transaction.id
                var dueDate = transaction.getValue('duedate');
                var total = transaction.getValue('amount')
                var especieLookup = search.lookupFields({
                    type:'customrecord_rsc_cnab_species',
                    id: transaction.getValue('custbody_rsc_cnab_inst_specie_ls'),
                    columns:[
                        'custrecord_rsc_cnab_species_code_ds'
                    ]
                })
                var especieTitulo = especieLookup.custrecord_rsc_cnab_species_code_ds
                var dataEmissao = transaction.getValue('trandate')
                var juros = transaction.getValue('custrecord_rsc_cnab_inst_interest_cu');
                var desconto = transaction.getValue('custrecord_rsc_cnab_inst_discount_cu')
                var identificaTitulo = transaction.getValue('tranid')
                var codBanco = accountRecord.custrecord_rsc_cnab_ba_bank_ls[0].value
                var banco = search.lookupFields({
                    type:'customrecord_rsc_cnab_bank',
                    id: codBanco,
                    columns:[
                        'custrecord_rsc_cnab_bank_code_ds'
                    ]
                }).custrecord_rsc_cnab_bank_code_ds
                var contaFavorecido = search.lookupFields({
                    type:'customrecord_rsc_cnab_bankaccount',
                    id: transaction.getValue('custbody_rsc_cnab_inst_bankaccount_ls'),
                    columns:[
                        'custrecord_rsc_cnab_ba_entity_ls'
                    ]
                })
                var entidade = contaFavorecido.custrecord_rsc_cnab_ba_entity_ls[0].value
                var searchSetup = search.create({
                    type: 'customrecord_rsc_cnab_fieldssetup',
                    columns: ['custrecord_acs_cnab_fs_city_ds', 'custrecord_acs_cnab_fs_district_ds', 'custrecord_acs_cnab_fs_addresstype_ds',
                        'custrecord_acs_cnab_fs_number_ds', 'custrecord_acs_cnab_fs_complement_ds', 'custrecord_acs_cnab_fs_entitycnpj_ds',
                        'custrecord_acs_cnab_fs_entitycpf_ds', 'custrecord_acs_cnab_fs_locationcnpj_ds', 'custrecord_acs_cnab_fs_legalname_ds',
                        'custrecord_acs_cnab_fs_state_ds'],
                }).run().getRange({start: 0, end: 1})
                var setup = {
                    state: searchSetup[0].getValue({ name: 'custrecord_acs_cnab_fs_state_ds' }),
                    city: searchSetup[0].getValue({ name: 'custrecord_acs_cnab_fs_city_ds' }),
                    district: searchSetup[0].getValue({ name: 'custrecord_acs_cnab_fs_district_ds' }),
                    addressType: searchSetup[0].getValue({ name: 'custrecord_acs_cnab_fs_addresstype_ds' }),
                    number: searchSetup[0].getValue({ name: 'custrecord_acs_cnab_fs_number_ds' }),
                    complement: searchSetup[0].getValue({ name: 'custrecord_acs_cnab_fs_complement_ds' }),
                    cnpj: searchSetup[0].getValue({ name: 'custrecord_acs_cnab_fs_entitycnpj_ds' }),
                    cpf: searchSetup[0].getValue({ name: 'custrecord_acs_cnab_fs_entitycpf_ds' }),
                    locationCnpj: searchSetup[0].getValue({ name: 'custrecord_acs_cnab_fs_locationcnpj_ds' }),
                    legalName: searchSetup[0].getValue({ name: 'custrecord_acs_cnab_fs_legalname_ds' })
                }
                var clienteRecord = record.load({type:'customer', id: entidade})
                var address = clienteRecord.getSublistSubrecord({ sublistId: 'addressbook', fieldId: 'addressbookaddress', line: 0 })
                log.debug('address', address)
                log.debug('street', address.getValue('addr1'))
                var zip = address.getValue({ fieldId: 'zip' }).replace(/\D/g, '');
                var state = address.getText({ fieldId: setup.state });
                var city = ( setup.city ) ? address.getText({ fieldId: setup.city }) : '';
                var addressType = ( setup.addressType ) ? address.getText({ fieldId: setup.addressType }) : '';
                var street = address.getValue({ fieldId: 'addr1' });
                var districtnew  = address.getValue({ fieldId: 'addr3' });
                var number = ( setup.number ) ? address.getValue({ fieldId: setup.number }) : '';
                var complement = ( setup.complement ) ? address.getValue({ fieldId: setup.complement }) : '';
                var nomePagador = accountRecord.name
                var metodoPagemento = transaction.getValue('custrecord_rsc_cnab_inst_paymentmetho_ls')
                
                var valores = {
                    agenciaMantedora: agenciaAccount,
                    digitoAgencia: digitoAgencia,
                    contaCorrente: contaCorrente,
                    digitoConta: digitoConta,
                    nossoNumero: nossoNumero,
                    codCarteira: carteira,
                    numDocumento: numDoc,
                    dataVencimento: dueDate,
                    amount: total,
                    especie: especieTitulo,
                    dataEmissao: dataEmissao,
                    juros: juros,
                    desconto: desconto,
                    titulo: identificaTitulo,
                    codBanco: banco,
                    cep: zip,
                    estado: state,
                    cidade: city,
                    endereco: street,
                    logradouro: addressType,
                    bairro: districtnew,
                    numero: number,
                    complemento: complement,
                    nomePagador: nomePagador
                }
                nFile.create({
                    name: 'installment_contas_a_receber.json',
                    fileType: nFile.Type.JSON,
                    contents: JSON.stringify(valores, null, 2),
                    encoding: nFile.Encoding.UTF8,
                    folder: -15
                })
                  	.save()
                context.write({key: metodoPagemento, values: valores })
				// lib.setInstallmentValue( transaction, installment );
                // log.debug('setInstallment', 'done');
				// var values = lib.getInstallmentValue( transaction, null, id, installment.entityType, installment.layout, installment.bankAccount );
                // log.debug('getInstallmentValue', 'done');
              	

				// lib.updateSequentialBank( values.custrecord_rsc_cnab_inst_locationba_ls.bankId );
                // log.debug('getInstallmentValue', 'done');
				// values.controller = installment.controller;
				// values.layout = installment.layout;
				// values.transaction = installment.transaction;
				// values.cnabType = installment.cnabType;
				// context.write({ key: id, value: values });

            } catch( e ) {
                var fatura = record.load({
                    type:'invoice',
                    id: installment.transaction
                })
                fatura.setValue({
                    fieldId:'custbody_rsc_cnab_inst_status_ls',
                    value: 1
                })
                fatura.save()
                log.error( 'map', 'installment id: ' + id + ' -- error: ' + e );
                throw Nerror.create({ name: installment.controller, message: e });
            }
        }

        /**
         * @function
         * @param context
         */
        function summarize( context )
        {
            var errors = [];
            var controllerId = 0;
            var installments = {};
            var segments = [];
            var layout = 0;
            var folder = 0;
            var fileId = undefined;
            /** Errors Iterator */
            context.mapSummary.errors.iterator().each( function( key, error )
            {
                var e = JSON.parse( error );
                controllerId = e.name;
                errors.push( key );
                return true;
            });
            /** Output Iterator */
            context.output.iterator().each( function( key, value )
            {
                installments[ key ] = {};
                installments[ key ] = JSON.parse( value );
                log.debug('installments', installments[ key]);
                controllerId = installments[ key ].controller;
                layout = installments[ key ].layout;
                folder = installments[ key ].custrecord_rsc_cnab_inst_locationba_ls.folder;
                lib.includeSegmentType( segments, installments[ key ].custrecord_rsc_cnab_inst_paymentmetho_ls.segment );
                return true;
            });
            /** Create File */
            if( Object.getOwnPropertyNames(installments).length > 0 )
            {
                var _segments = lib.getSegments( layout, lib.filterSegmentType( segments ) );
                var fileContent = file.buildFile( _segments, installments );
                fileId = lib.createFile( fileContent, folder );
            }
            /** Update Controller */
            var controllerRecord = record.load({
                type: 'customrecord_rsc_cnab_controller',
                id: Number(controllerId)
            })
            lib.updateController( controllerRecord, errors, fileId );
        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };
    });
