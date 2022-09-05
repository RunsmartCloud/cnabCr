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
                var subId = transaction.getValue('subsidiary');
                var subRecord = record.load({type:'subsidiary', id: subId})
                var subAccount = installment.bankAccount;
                var SubaccountRecord = search.lookupFields({
                    type:'customrecord_rsc_cnab_bankaccount',
                    id: subAccount,
                    columns:[
                        'custrecord_rsc_cnab_ba_agencynumber_ls',
                        'custrecord_rsc_cnab_ba_dvagencynumber_ds',
                        'custrecord_rsc_cnab_ba_number_ds',
                        'custrecord_rsc_cnab_ba_dvnumber_ds',
                        'custrecord_rsc_cnab_ba_portfolio_ls',
                        'custrecord_rsc_cnab_ba_bank_ls',
                        'name',
                        'custrecord_rsc_cnab_ba_agreement_ds'
                    ]
                })
                var SubagenciaAccount = SubaccountRecord.custrecord_rsc_cnab_ba_agencynumber_ls
                var SubdigitoAgencia = SubaccountRecord.custrecord_rsc_cnab_ba_dvagencynumber_ds
                var SubcontaCorrente = SubaccountRecord.custrecord_rsc_cnab_ba_number_ds
                var SubdigitoConta = SubaccountRecord.custrecord_rsc_cnab_ba_dvnumber_ds
                var subconvenio = SubaccountRecord.custrecord_rsc_cnab_ba_agreement_ds
                var SubcodCarteira = SubaccountRecord.custrecord_rsc_cnab_ba_portfolio_ls[0].value
                var SubcodBanco = SubaccountRecord.custrecord_rsc_cnab_ba_bank_ls[0].value
                var SubnameBank = SubaccountRecord.custrecord_rsc_cnab_ba_bank_ls[0].text
                var bancoLookup = search.lookupFields({
                    type:'customrecord_rsc_cnab_bank',
                    id: SubcodBanco,
                    columns:[
                        'custrecord_rsc_cnab_bank_code_ds',
                        'custrecord_rsc_cnab_bank_sequecial_nu'
                    ]
                })
                var Subbanco = bancoLookup.custrecord_rsc_cnab_bank_code_ds
                var Subsequencial = bancoLookup.custrecord_rsc_cnab_bank_sequecial_nu
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
                        'name',
                        'custrecord_rsc_cnab_ba_agreement_ds'
                    ]
                })
                var agenciaAccount = accountRecord.custrecord_rsc_cnab_ba_agencynumber_ls
                var digitoAgencia = accountRecord.custrecord_rsc_cnab_ba_dvagencynumber_ds
                var contaCorrente = accountRecord.custrecord_rsc_cnab_ba_number_ds
                var digitoConta = accountRecord.custrecord_rsc_cnab_ba_dvnumber_ds
                var convenio = accountRecord.custrecord_rsc_cnab_ba_agreement_ds
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
                var total = transaction.getValue('total')
                // var total = 0
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
                var nameBank = accountRecord.custrecord_rsc_cnab_ba_bank_ls[0].text
                var bancoLookup = search.lookupFields({
                    type:'customrecord_rsc_cnab_bank',
                    id: codBanco,
                    columns:[
                        'custrecord_rsc_cnab_bank_code_ds',
                        'custrecord_rsc_cnab_bank_sequecial_nu'
                    ]
                })
                var banco = bancoLookup.custrecord_rsc_cnab_bank_code_ds
                var sequencial = bancoLookup.custrecord_rsc_cnab_bank_sequecial_nu
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
                var cpnjCliente = clienteRecord.getValue('custentity_enl_cnpjcpf')
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
                var metodoPagemento = transaction.getValue('custbody_rsc_cnab_inst_paymentmetho_ls')
                
                var valores = {
                    agenciaMantedora: agenciaAccount,
                    digitoAgencia: digitoAgencia,
                    contaCorrente: contaCorrente,
                    digitoConta: digitoConta,
                    nossoNumero: nossoNumero,
                    codCarteira: carteira,
                    numDocumento: numDoc,
                    dataVencimento: dueDate,
                    cpnjCliente: cpnjCliente,
                    amount: total,
                    especie: especieTitulo,
                    dataEmissao: dataEmissao,
                    juros: juros,
                    desconto: desconto,
                    titulo: identificaTitulo,
                    codBanco: banco,
                    cep: zip,
                    estado: state,
                    nomeSub: subRecord.getValue('legalname'),
                    cidade: city,
                    endereco: street,
                    logradouro: addressType,
                    bairro: districtnew,
                    numero: number,
                    complemento: complement,
                    nomePagador: nomePagador,
                    convenio: convenio,
                    nameBank: nameBank,
                    sequencial: sequencial,
                    cnpjSub: subRecord.getValue('federalidnumber'),
                    controler: installment.controller,
                    SubagenciaAccount: SubagenciaAccount,
                    SubdigitoAgencia: SubdigitoAgencia,
                    SubcontaCorrente: SubcontaCorrente,
                    SubdigitoConta: SubdigitoConta,
                    Subconvenio: subconvenio,
                    SubcodCarteira: SubcodCarteira,
                    Subsequencial: Subsequencial,
                    SubcodBanco: Subbanco,
                    SubnameBank: SubnameBank
                }
                nFile.create({
                    name: 'installment_contas_a_receber.json',
                    fileType: nFile.Type.JSON,
                    contents: JSON.stringify(valores, null, 2),
                    encoding: nFile.Encoding.UTF8,
                    folder: -15
                })
                  	.save()
                log.debug('metodoPagemento', metodoPagemento)
                log.debug('valores', valores)
                context.write({key: metodoPagemento, value: JSON.stringify(valores) })
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
        function reduce( context ){
            log.debug('context', context)
            log.debug('context', context.values)
            log.debug('context',context.values.length)
            var values = context.values
            var qtdTitulos = values.length;
            log.debug('qtdTitulos', qtdTitulos)
            var total = 0
            for(var i = 0; i<values.length;i++){
                total += JSON.parse(values[i]).amount
            }
            log.debug('amount', total)
            var obj = {}
            for(var i = 0; i<values.length;i++){
                obj = JSON.parse(values[i])
                obj['qtdTitulos'] = qtdTitulos;
                obj['total'] = total
            }
            context.write({key: context.key, value: JSON.stringify(obj)})
        }
        function summarize( context )
        {
            var controler = 0
            log.debug('context',context);
            // var errors = [];
            // var controllerId = 0;
            // var installments = {};
            // var segments = [];
            // var layout = 0;
            // var folder = 0;
            // var fileId = undefined;
            // /** Errors Iterator */
            // context.mapSummary.errors.iterator().each( function( key, error )
            // {
            //     var e = JSON.parse( error );
            //     controllerId = e.name;
            //     errors.push( key );
            //     return true;
            // });
            // /** Output Iterator */
            var string= ""
            var loteServico = 0
            var obj
            context.output.iterator().each( function( key, value )
            {
                loteServico++
                // var values = JSON.parse( value );
                log.debug('installments', value);
                log.debug('key', key);
                log.debug('installments', value.agenciaMantedora);
                log.debug('installments', JSON.parse(value).agenciaMantedora);
                var values = JSON.parse(value)
                if(loteServico == 1){
                    string += headerLote(values)
                }
                string += headerLoteP(values, loteServico)
                string += detalheLoteP(values, loteServico )
                string += detalheLoteQ(values, loteServico)
                string += trailerP(values, loteServico)
                controler = values.controler
                obj = values
                return true;
            });
            string += trailerArq(obj)
            var date = new Date();
            var name = padding(date.getDate(),2)+''+padding((date.getMonth()+1),2)+''+padding(date.getHours(),2)
                +''+padding(date.getMinutes(),2);
            var fileId = nFile.create({
                name: name,
                fileType: nFile.Type.PLAINTEXT,
                contents: string,
                encoding: nFile.Encoding.UTF8,
                folder: 780
            }).save()

            var controllerRecord = record.load({
                type: 'customrecord_rsc_cnab_controller',
                id: controler
            })
            controllerRecord.setValue({
                fieldId:'custrecord_rsc_cnab_cont_status_ls',
                value: 2
            })
            if( fileId ) {
                // values.custrecord_rsc_cnab_cont_file_ls = fileId;
                // values = { custrecord_rsc_cnab_cont_file_ls: fileId}
                controllerRecord.setValue({
                    fieldId:'custrecord_rsc_cnab_cont_file_ls',
                    value: fileId
                })
            }
            controllerRecord.save({
                ignoreMandatoryFields: true
            })
            
            // /** Create File */
            // if( Object.getOwnPropertyNames(installments).length > 0 )
            // {
            //     var _segments = lib.getSegments( layout, lib.filterSegmentType( segments ) );
            //     var fileContent = file.buildFile( _segments, installments );
            //     fileId = lib.createFile( fileContent, folder );
            // }
            // /** Update Controller */
            // var controllerRecord = record.load({
            //     type: 'customrecord_rsc_cnab_controller',
            //     id: Number(controllerId)
            // })
            // lib.updateController( controllerRecord, errors, fileId );
        }
        function headerLoteP (values, loteServico){
            var string = ""
            string += values.SubcodBanco
            string += limiteCaracteres(loteServico, 4, "0")
            string += "1R01"
            string += "  "
            string += "042"
            string += " "
            string += "2"
            var cnpj = values.cnpjSub;
            cnpj = cnpj.replace(/[^a-z0-9]/gi, "");
            string += cnpj;
            string += limiteCaracteres (values.Subconvenio, 20, "0")
            string += limiteCaracteres(values.SubagenciaAccount, 5, "0");
            if(values.SubdigitoAgencia){
                string += values.SubdigitoAgencia;
            }else{
                string += " "
            }
            string += limiteCaracteres(values.SubcontaCorrente, 12, "0");
            if(values.SubdigitoConta){
                string += values.SubdigitoConta;
            }else{
                string += " "
            }
            string += " ";
            string += " ";
            string += limiteCaracteres(values.nomeSub, 30, " ")
            string += espacos(80, " ");
            string += espacos(8, "0");
            var dataAtual = new Date()
            var dia = dataAtual.getDate();
            var mes = dataAtual.getMonth();
            var ano = dataAtual.getFullYear();
            string += ("00" + dia).slice(-2)
            string += mesCorreto(mes)
            string += ano
            string += espacos(8, "0");
            string += espacos(33, " ");
            string += "\n"
            return string
        }

        function padding( value, size ){
            var pad = '';
            for( var i = 0; i < size; i++ ) {
                pad += '0';
            }
            value = value.toString();
            return pad.substring( 0, pad.length - value.length ) + value;
        }

        function detalheLoteQ(values, loteServico){
            var string = ""
            var cnpj = values.cpnjCliente;
            cnpj = cnpj.replace(/[^a-z0-9]/gi, "");
            string += values.codBanco;
            string += limiteCaracteres(loteServico, 4, "0");
            string += "3";
            string += limiteCaracteres(values.sequencial, 5, " ")
            string += "Q";
            string += " ";
            string += "01";
            string += "0";
            string += cnpj;
            string += limiteCaracteres(values.nomePagador, 40, " ");
            string += (values.endereco ? limiteCaracteres(values.endereco, 40, " ") : espacos(41 , " "));
            string += (values.bairro ? limiteCaracteres(values.bairro, 15, " ") : espacos(16, " "));
            string += values.cep;
            string += (values.cidade ? limiteCaracteres(values.cidade, 15, " ") : espacos(16, " "));
            string += (values.estado ? limiteCaracteres(values.estado, 2 ," ") : espacos(3, " "));
            string += " ";
            string += cnpj
            string += limiteCaracteres(values.nomePagador, 40, " ");
            string += espacos(3, "0")
            string += (values.nossoNumero ? limiteCaracteres(values.nossoNumero, 20, "0") : espacos(21, "0"))
            string += espacos(8, " ")
            string += "\n"
            return string
        }

        function trailerP(values, loteServico){
            var string = "";
            string += values.SubcodBanco;
            string += limiteCaracteres(loteServico, 4, "0")
            string += "5";
            string += espacos(9, " ");
            string += limiteCaracteres(values.qtdTitulos, 6, " ")
            string += limiteCaracteres(values.qtdTitulos, 6, " ")
            string += limiteCaracteres(String(values.total).replace(".", ""), 17, " ");
            string += espacos(194, " ");
            string += "\n"
            return string
        }
        function espacos (quantidade, completar){
            var string = ""
            for (var i = 0; i < quantidade; i++){
                string += completar
            }
            return string
        }
        function limiteCaracteres (valor, limite, completar){
            var string = "";
            var variavel = String(valor)
            var lines = limite - variavel.length
            for(var i = 0; i < lines; i++){
                string += completar
            }
            string += variavel.substring(0, limite)
            return string
        }
        function trailerArq(values){
            var string = "";
            string += values.codBanco;
            string += "9999";
            string += "9";
            string += espacos(9, " ")
            string += limiteCaracteres(values.qtdTitulos, 6, " ")
            string += limiteCaracteres(values.qtdTitulos, 6, " ")
            string += limiteCaracteres(values.qtdTitulos, 6, " ")
            string += espacos(205, " ");
            string += "\n"
            return string
        }
        function detalheLoteP (values, loteServico){
            var string = ""
            string += values.codBanco;
            string += limiteCaracteres(loteServico, 4, "0")
            string += "3";
            string += limiteCaracteres(values.sequencial, 5, "0");
            string += "P";
            string += " ";
            string += "01";
            string += limiteCaracteres(values.agenciaMantedora, 5, "0");
            string += (values.digitoAgencia ? limiteCaracteres(values.digitoAgencia, 1,"0") : " ");
            string += limiteCaracteres(values.contaCorrente, 12, "0");
            string += " ";
            string += " ";
            string += (values.nossoNumero ? limiteCaracteres(values.nossoNumero, 20, "0") : "00000000000000000000");
            string += "2";
            string += "1";
            string += "2";
            string += "1";
            string += "1";
            string += limiteCaracteres(values.numDocumento, 15, ' ')
            // var numDoc = String(values.numDocumento);
            // lines = 15 - numDoc.length;
            // string += numDoc
            // for(var i = 0; i< lines;i++){
            //     string += ' '
            // }
            var dataVencimento = new Date(values.dataVencimento);
            log.debug('dataVencimento', dataVencimento)
            var dia = dataVencimento.getDate();
            var mes = dataVencimento.getMonth();
            var ano = dataVencimento.getFullYear();
            string += ("00" + dia).slice(-2)
            string += mesCorreto(mes)
            string += ano
            var amountNominal = String(values.amount);
            string += limiteCaracteres(amountNominal, 16, " ").replace(".", "")
            string += limiteCaracteres(values.SubagenciaAccount, 5, "0");
            
            string += (values.SubdigitoAgencia ? values.SubdigitoAgencia : " ");
            string += "02";
            string += "A";
            var dataEmissao = new Date(values.dataEmissao);
            log.debug('dataEmissao', dataEmissao)
            dia = dataEmissao.getDate()
            mes = dataEmissao.getMonth();
            ano = dataEmissao.getFullYear();
            string += ("00" + dia).slice(-2)
            string += mesCorreto(mes);
            string += ano;
            string += "2";
            string += "        ";
            // string += value.juros;
            var juros = String(values.juros);
            lines = 15 - juros.length;
            log.debug('juros', juros);
            log.debug('juros', juros == undefined);
            if(juros == undefined){
                string += limiteCaracteres(juros,15," ")
            }else{
                string += limiteCaracteres("09488", 15, " ")
            }
            // for(var i = 0; i< lines;i++){
            //     string += ' '
            // }
            string += "         ";
            string += (values.desconto ? limiteCaracteres(values.desconto,15,"0") : "0000000000000000");
            string += espacos(" ", 30)
            string += limiteCaracteres(values.titulo, 25, " ");
            string += " ";
            string += "  ";
            string += "1";
            string += " 30";
            string += "09";
            string += "           ";
            string += "\n"
            return string
        }
        function mesCorreto (mes){
            var retorno = ''
            switch (mes){
                case 0:
                    retorno = '01'
                break
                case 1:
                    retorno = '02'
                break
                case 2:
                    retorno = '03'
                break
                case 3:
                    retorno = '04'
                break
                case 4: 
                    retorno = '05'
                break
                case 5:
                    retorno = '06'
                break    
                case 6:
                    retorno = '07'
                break
                case 7:
                    retorno = '08'
                break
                case 8:
                    retorno = '09'
                break
                case 9:
                    retorno = '10'
                break
                case 10:
                    retorno = '11'
                break
                case 11:
                    retorno = '12'
                break  
            }
            return retorno
        }
        function headerLote (values){
            var string = ""
            string += values.SubcodBanco;
            string += '00000';
            string += '         ';
            string += '2'
            var cnpj = values.cnpjSub;
            cnpj = cnpj.replace(/[^a-z0-9]/gi, "");
            string += cnpj;
            string += limiteCaracteres(values.Subconvenio, 20, "0")
            // var convenio = String(values.convenio);
            // var lines = 20 - convenio.length;
            // string += convenio
            // for(var i = 0; i< lines;i++){
            //     string += '0'
            // }
            string += limiteCaracteres(values.SubagenciaAccount, 5, " ");
            if(values.SubdigitoAgencia){
                string += values.SubdigitoAgencia;
            }else{
                string += " "
            }
            string += limiteCaracteres(values.SubcontaCorrente, 12, "0");
            // var conta = String(values.contaCorrente);
            // lines = 12 - conta.length;
            // string += conta
            // for(var i = 0; i< lines;i++){
            //     string += '0'
            // }
            // string += values.contaCorrente;
            // if(values.SubdigitoConta){
            //     string += values.SubdigitoConta;
            // }else{
            //     string += " "
            // }
            string += " ";
            string += " ";
            string += limiteCaracteres(values.nomeSub, 30, " ");
            string += limiteCaracteres(values.SubnameBank, 30, " ");
            string += espacos(10, " ");
            string += "1";
            var dataAtual = new Date(new Date().setHours(new Date().getHours() + 4))
            var dia = dataAtual.getDate();
            var mes = dataAtual.getMonth();
            var ano = dataAtual.getFullYear();
            string += ("00" + dia).slice(-2)
            string += mesCorreto(mes)
            string += ano
            // log.debug('Hora', dataAtual.getHours())
            // log.debug('Minuto', dataAtual.getMinutes())
            // log.debug('Segundos', dataAtual.getSeconds())
            string += ("00" + dataAtual.getHours()).slice(-2)
            string += ("00" + dataAtual.getMinutes()).slice(-2)
            string += ("00" + dataAtual.getSeconds()).slice(-2)
            string += limiteCaracteres(values.Subsequencial, 6, "0");
            string += "103";
            string += "06250"
            string += espacos(69, " ")
            string += "\n"
            return string
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    });
