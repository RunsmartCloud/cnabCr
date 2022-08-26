/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * @scriptName rsc-cnab-batch-dao
 */
define([ 'N/search' ],

    /**
     * @function
     * @param search
     * @return {}
     */
    function( search )
    {
        /**
         * @function
         * @param subsidiaryId
         * @return {{search.Search}}
         */
        function getBankAccountJob(jobId, record){
            var jobLookup = search.lookupFields({
                type:'job',
                id: jobId,
                columns:[
                    'custentity_rsc_securitizado'
                ]
            })
            if(jobLookup.custentity_rsc_securitizado.length > 0){
                record.setValue({fieldId: 'custpage_entitytype', value: 'vendor'})
                return search.create
                ({
                    type:'customrecord_rsc_cnab_bankaccount',
                    filters:[
                        search.createFilter({ name: 'custrecord_rsc_cnab_ba_entity_ls', operator: search.Operator.IS, values: Number(jobLookup.custentity_rsc_securitizado[0].value) }),
                        search.createFilter({ name: 'custrecord_rsc_cnab_ba_preferential_fl', operator: search.Operator.IS, values: true })
                    ]
                })
            }else{
                record.setValue({fieldId: 'custpage_entitytype', value: 'job'})
                return search.create
                ({
                    type:'customrecord_rsc_cnab_bankaccount',
                    filters:[
                        search.createFilter({ name: 'custrecord_rsc_cnab_ba_entity_ls', operator: search.Operator.IS, values: Number(jobId) }),
                        search.createFilter({ name: 'custrecord_rsc_cnab_ba_preferential_fl', operator: search.Operator.IS, values: true })
                    ]
                })
            }
        }
        function getBankAccounts( subsidiaryId )
        {
            return search.create
            ({
                type: 'customrecord_rsc_cnab_bankaccount',
                columns: ['name'],
                filters: [
                    search.createFilter({ name: 'custrecord_rsc_cnab_ba_subsidiary_ls', operator: search.Operator.ANYOF, values: Number(subsidiaryId) }),
                    search.createFilter({ name: 'custrecord_rsc_cnab_ba_location_ls', operator: search.Operator.NONEOF, values: '@NONE@' })
                ]
            });
        }

        /**
         * @function
         * @param bankAccountId
         * @return {{bank: *, _240: *, _400: *}}
         */
        function getBankAccountFields( bankAccountId )
        {
            var fields = search.lookupFields
            ({
                type: 'customrecord_rsc_cnab_bankaccount',
                id: bankAccountId,
                columns: [ 'custrecord_rsc_cnab_ba_bank_ls', 'custrecord_rsc_cnab_ba_layout240_fl', 'custrecord_rsc_cnab_ba_layout400_fl' ]
            });
            return {
                bank: fields[ 'custrecord_rsc_cnab_ba_bank_ls' ][0].value,
                _240: fields[ 'custrecord_rsc_cnab_ba_layout240_fl' ],
                _400: fields[ 'custrecord_rsc_cnab_ba_layout400_fl' ]
            }
        }

        /**
         * @function
         * @param bankId
         * @param type
         * @param _240
         * @param _400
         * @param _240_id
         * @param _400_id
         * @return {{search.Search}}
         */
        function getLayouts( bankId, type, _240, _400, _240_id, _400_id )
        {
            var filters = [];
            // filters.push( search.createFilter({name: 'custrecord_rsc_cnab_layout_bank_ls', operator: search.Operator.ANYOF, values: bankId}) );
            filters.push( search.createFilter({name: 'custrecord_rsc_cnab_layout_operation_ls', operator: search.Operator.ANYOF, values: type}) );
            filters.push( search.createFilter({name: 'custrecord_rsc_cnab_layout_cnabtype_ls', operator: search.Operator.ANYOF, values: 2}) );

            if( _240 && _400 ) {
                filters.push( search.createFilter({name: 'custrecord_rsc_cnab_layout_type_ls', operator: search.Operator.ANYOF, values: [_240_id,_400_id]}) );
            }
            else if( _240 ) {
                filters.push( search.createFilter({name: 'custrecord_rsc_cnab_layout_type_ls', operator: search.Operator.ANYOF, values: _240_id}) );
            }
            else if( _400 ) {
                filters.push( search.createFilter({name: 'custrecord_rsc_cnab_layout_type_ls', operator: search.Operator.ANYOF, values: _400_id}) );
            }
            return search.create
            ({
                type: 'customrecord_rsc_cnab_layout',
                columns: ['name'],
                filters: filters
            });
        }

        function getJobs(subsidiaryId){
            return search.create
            ({
                type: 'job',
                columns: ['companyname'],
                filters: [
                    search.createFilter({ name: 'subsidiary', operator: search.Operator.ANYOF, values: Number(subsidiaryId) }),
                    // search.createFilter({ name: 'custrecord_rsc_cnab_ba_location_ls', operator: search.Operator.NONEOF, values: '@NONE@' })
                ]
            });
            
        }
        /**
         * @function
         * @param startDate
         * @param endDate
         * @param status
         * @param tranType
         * @param bankAccount
         * @param entity
		 * @param installmentColumns
         * @return {{search.Search}}
         */
        function getInstallments( startDate, endDate,  tranType, bankAccount, entity, installmentColumns, subsidiary )
        {
            console.log('tranType', tranType)
            var filters = [
                [
                    ["shipping","is","F"], 
                    "AND", 
                    ["taxline","is","F"], 
                    "AND", 
                    ["mainline","is","T"], 
                    "AND", 
                    // ["type","anyof", tranType], 
                    // "AND", 
                    ["formuladate: {duedate}","within",startDate,endDate], 
                    "AND", 
                    ["custbody_rsc_cnab_inst_status_ls","anyof",1],
                    "AND",
                    ["subsidiary", "IS", subsidiary]
                ]
            ];
            // filters.push( search.createFilter({name: 'duedate', operator: search.Operator.WITHIN, values: [startDate, endDate]}) );
            // filters.push( search.createFilter({name: 'type', operator: search.Operator.ANYOF, values: tranType}) );
            // filters.push( search.createFilter({name: 'mainline', operator: search.Operator.IS, values: true}) );
            // // filters.push( search.createFilter({name: 'mainline', join: 'custbody_lrc_fatura_principal', operator: search.Operator.IS, values: true}) );
            // filters.push( search.createFilter({name: 'custbody_rsc_cnab_inst_status_ls', operator: search.Operator.ANYOF, values: status}) );
            // filters.push( search.createFilter({name: 'shipping', operator: search.Operator.IS, values: false}) );
            // filters.push( search.createFilter({name: 'taxline', operator: search.Operator.IS, values: false}) );



            
            // filters.push( search.createFilter({name: 'custrecord_rsc_cnab_inst_locationba_ls', operator: search.Operator.ANYOF, values: bankAccount}) );

            if( entity ) {
                filters.push( search.createFilter({name: 'entity', operator: search.Operator.ANYOF, values: entity}) );
            }

            return search.create
            ({
                type: tranType,
                columns: Object.values(installmentColumns),
                filters: filters
            });
        }

        /**
         * @function
         * @param layoutId
         * @return {{cnabType: *, operationType: *}}
         */
        function getLayoutFields( layoutId )
        {
            var fields = search.lookupFields
            ({
                type: 'customrecord_rsc_cnab_layout',
                id: layoutId,
                columns: [ 'custrecord_rsc_cnab_layout_operation_ls', 'custrecord_rsc_cnab_layout_cnabtype_ls', 'custrecord_rsc_cnab_layout_bank_ls' ]
            });
            return {
                operationType: fields[ 'custrecord_rsc_cnab_layout_operation_ls' ][0].value,
                cnabType: fields[ 'custrecord_rsc_cnab_layout_cnabtype_ls' ][0].value,
                // bank: fields[ 'custrecord_rsc_cnab_layout_bank_ls' ][0].value
            }
        }

        /**
         * @function
         * @param paymentMethodId
         * @return {{code: *, segment: *}}
         */
        function getPaymentMethodFields( paymentMethodId )
        {
            var fields = search.lookupFields
            ({
                type: 'customrecord_rsc_cnab_paymentmethod',
                id: paymentMethodId,
                columns: [ 'custrecord_rsc_cnab_pm_code_ds', 'custrecord_rsc_cnab_pm_segment_ls' ]
            });
            return {
                custrecord_rsc_cnab_pm_code_ds: fields[ 'custrecord_rsc_cnab_pm_code_ds' ],
                segment: { id: fields[ 'custrecord_rsc_cnab_pm_segment_ls' ][0].value, text: fields[ 'custrecord_rsc_cnab_pm_segment_ls' ][0].text }
            }
        }

        /**
         * @function
         * @param layout
         * @param segments
         * @return {{search.Search}}
         */
        function getSegments( layout, segments )
        {
            return search.create
            ({
                type: 'customrecord_rsc_cnab_fieldsegment',
                columns: [
                    search.createColumn({name: 'custrecord_rsc_cnab_fs_segment_ls' }),
                    search.createColumn({name: 'custrecord_rsc_cnab_fs_field_ls' }),
                    search.createColumn({name: 'custrecord_rsc_cnab_fs_initposition_nu', sort: search.Sort.ASC }),
                    search.createColumn({name: 'custrecord_rsc_cnab_fs_finalposition_nu' }),
                    search.createColumn({name: 'custrecord_rsc_cnab_fs_size_nu' }),
                    search.createColumn({name: 'custrecord_rsc_cnab_fs_default_ds' }),
                    search.createColumn({name: 'custrecord_rsc_cnab_fs_autocomplete_ls' }),
                    search.createColumn({name: 'custrecord_rsc_cnab_segment_layout_ls', join: 'custrecord_rsc_cnab_fs_segment_ls'}),
                    search.createColumn({name: 'custrecord_rsc_cnab_segment_container_ls', join: 'custrecord_rsc_cnab_fs_segment_ls'}),
                    search.createColumn({name: 'custrecord_rsc_cnab_segment_segment_ls', join: 'custrecord_rsc_cnab_fs_segment_ls'}),
                    search.createColumn({name: 'custrecord_rsc_cnab_segment_group_ls', join: 'custrecord_rsc_cnab_fs_segment_ls'}),
                    search.createColumn({name: 'custrecord_rsc_cnab_segment_sequence_nu', join: 'custrecord_rsc_cnab_fs_segment_ls'}),
                    search.createColumn({name: 'custrecord_rsc_cnab_tf_internalid_ds', join: 'custrecord_rsc_cnab_fs_field_ls'}),
                    search.createColumn({name: 'custrecord_rsc_cnab_tf_recinternalid_ds', join: 'CUSTRECORD_RSC_CNAB_FS_FIELD_LS'}),
                    search.createColumn({name: 'custrecord_rsc_cnab_tf_mask_ds', join: 'custrecord_rsc_cnab_fs_field_ls'}),
                    search.createColumn({name: 'custrecord_rsc_cnab_tf_type_ls', join: 'custrecord_rsc_cnab_fs_field_ls'})

                ],
                filters: [
                    search.createFilter({ name: 'custrecord_rsc_cnab_segment_layout_ls', join: 'custrecord_rsc_cnab_fs_segment_ls',
                        operator: search.Operator.ANYOF, values: layout }),
                    search.createFilter({ name: 'custrecord_rsc_cnab_segment_segment_ls', join: 'custrecord_rsc_cnab_fs_segment_ls',
                        operator: search.Operator.ANYOF, values: segments })
                ]
            });
        }

        /**
         *
         * @param bankAccountId
         * @param cnpjId
         * @param cpfId
         * @return {{search.Search}}
         */
        function getBankAccountsById( bankAccountId, cnpjId, cpfId )
        {

          return search.create
            ({
                type: 'customrecord_rsc_cnab_bankaccount',
                columns: [
                    'custrecord_rsc_cnab_ba_number_ds', 'custrecord_rsc_cnab_ba_dvnumber_ds', 'custrecord_rsc_cnab_ba_dvagencynumber_ds',
                    'custrecord_rsc_cnab_ba_agencynumber_ls', 'custrecord_rsc_cnab_ba_entity_ls', 'custrecord_rsc_cnab_ba_location_ls',
                    'custrecord_rsc_cnab_ba_agreement_ds',
                    search.createColumn({name: 'name', join: 'custrecord_rsc_cnab_ba_location_ls'}),
                    search.createColumn({name: 'custrecord_rsc_cnab_location_cnpj_ds', join: 'custrecord_rsc_cnab_ba_location_ls'}),
                    search.createColumn({name: 'custrecord_rsc_cnab_bank_code_ds', join: 'custrecord_rsc_cnab_ba_bank_ls'}),
                    search.createColumn({name: cnpjId, join: 'custrecord_rsc_cnab_ba_entity_ls'}),
                    search.createColumn({name: cpfId, join: 'custrecord_rsc_cnab_ba_entity_ls'}),
                    search.createColumn({name: 'custrecord_rsc_cnab_bank_pbatchfolder_nu', join: 'custrecord_rsc_cnab_ba_bank_ls'}),
                    search.createColumn({name: 'custrecord_rsc_cnab_bank_bbatchfolder_nu', join: 'custrecord_rsc_cnab_ba_bank_ls'}),
                    search.createColumn({name: 'custrecord_rsc_cnab_bank_sequecial_nu', join: 'custrecord_rsc_cnab_ba_bank_ls'}),
                    search.createColumn({name: 'internalid', join: 'custrecord_rsc_cnab_ba_bank_ls'}),
                    search.createColumn({name: 'name', join: 'custrecord_rsc_cnab_ba_bank_ls'}),
                    search.createColumn({name: 'custrecord_rsc_cnab_portfolio_number_nu', join: 'custrecord_rsc_cnab_ba_portfolio_ls'}),
                    search.createColumn({name: 'custrecord_rsc_cnab_portfolio_code_ds', join: 'custrecord_rsc_cnab_ba_portfolio_ls'})
                ],
                filters: [
                    search.createFilter({ name: 'internalid', operator: search.Operator.ANYOF, values: Number(bankAccountId) })
                ]
            });
        }

        /**
         * @function
         * @param id
         * @return {{code: *}}
         */
        function getSegmentTypeFields( id )
        {
            var fields = search.lookupFields
            ({
                type: 'customrecord_rsc_cnab_servicetype',
                id: id,
                columns: [ 'custrecord_rsc_cnab_st_code_ds' ]
            });
            return {
                code: fields[ 'custrecord_rsc_cnab_st_code_ds' ]
            }
        }

        /**
         * @function
         * @param id
         * @return {{custrecord_rsc_cnab_po_code_ds: *, custrecord_rsc_cnab_po_state_ls: *}}
         */
        function getPaymentOptionFields( id )
        {
            var fields = search.lookupFields
            ({
                type: 'customrecord_rsc_cnab_paymentoption',
                id: id,
                columns: [ 'custrecord_rsc_cnab_po_code_ds', 'custrecord_rsc_cnab_po_state_ls' ]
            });
            return {
                custrecord_rsc_cnab_po_code_ds: fields[ 'custrecord_rsc_cnab_po_code_ds' ],
                custrecord_rsc_cnab_po_state_ls: fields[ 'custrecord_rsc_cnab_po_state_ls' ]
            }
        }

        /**
         * @function
         * @param specieId
         * @return {{custrecord_rsc_cnab_species_bank_ls: *, custrecord_rsc_cnab_species_code_ds: *}}
         */
        function getSpecieFields( specieId )
        {
            var fields = search.lookupFields
            ({
                type: 'customrecord_rsc_cnab_species',
                id: specieId,
                columns: [ 'custrecord_rsc_cnab_species_code_ds', 'custrecord_rsc_cnab_species_bank_ls' ]
            });
            return {
                custrecord_rsc_cnab_species_code_ds: fields[ 'custrecord_rsc_cnab_species_code_ds' ],
                custrecord_rsc_cnab_species_bank_ls: fields[ 'custrecord_rsc_cnab_species_bank_ls' ][0].value
            }
        }

        /**
         * @function
         * @param id
         * @return {{custrecord_rsc_cnab_bi_code_ds: *, custrecord_rsc_cnab_bi_bank_ls: *}}
         */
        function getInstructionFields( id )
        {
            var fields = search.lookupFields
            ({
                type: 'customrecord_rsc_cnab_billinginstruction',
                id: id,
                columns: [ 'custrecord_rsc_cnab_bi_code_ds', 'custrecord_rsc_cnab_bi_bank_ls' ]
            });
            return {
                custrecord_rsc_cnab_bi_code_ds: fields[ 'custrecord_rsc_cnab_bi_code_ds' ],
                custrecord_rsc_cnab_bi_bank_ls: fields[ 'custrecord_rsc_cnab_bi_bank_ls' ][0].value
            }
        }

        /**
         * @function
         * @return {Search}
         */
        function getFieldsSetup()
        {
            return search.create
            ({
                type: 'customrecord_rsc_cnab_fieldssetup',
                columns: ['custrecord_acs_cnab_fs_city_ds', 'custrecord_acs_cnab_fs_district_ds', 'custrecord_acs_cnab_fs_addresstype_ds',
                    'custrecord_acs_cnab_fs_number_ds', 'custrecord_acs_cnab_fs_complement_ds', 'custrecord_acs_cnab_fs_entitycnpj_ds',
                    'custrecord_acs_cnab_fs_entitycpf_ds', 'custrecord_acs_cnab_fs_locationcnpj_ds', 'custrecord_acs_cnab_fs_legalname_ds',
					'custrecord_acs_cnab_fs_state_ds'],
                filters: []
            });
        }

        return {
            getBankAccounts: getBankAccounts,
            getLayouts: getLayouts,
            getBankAccountFields: getBankAccountFields,
            getInstallments: getInstallments,
            getLayoutFields: getLayoutFields,
            getPaymentMethodFields: getPaymentMethodFields,
            getSegments: getSegments,
            getBankAccountsById: getBankAccountsById,
            getSegmentTypeFields: getSegmentTypeFields,
            getPaymentOptionFields: getPaymentOptionFields,
            getSpecieFields: getSpecieFields,
            getInstructionFields: getInstructionFields,
            getFieldsSetup: getFieldsSetup,
            getJobs: getJobs,
            getBankAccountJob:getBankAccountJob
        }
    }
);
