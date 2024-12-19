import { BigQuery } from '@google-cloud/bigquery';
import { BigQueryConfig, SearchOptions, OrderSearchResult } from './bigquery';

export class BigQueryService {
  private bigquery: BigQuery;
  private readonly queryTimeout = 30000; // 30 segundos de timeout

  constructor(config?: BigQueryConfig) {
    console.log('Inicializando BigQueryService');
    
    const projectId = config?.projectId || process.env.GOOGLE_CLOUD_PROJECT_ID;
    const credentials = config?.credentials || {
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      private_key: (process.env.GOOGLE_CLOUD_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };

    if (!projectId || !credentials.client_email || !credentials.private_key) {
      console.error('Erro de configuração do BigQuery:', {
        hasProjectId: !!projectId,
        hasClientEmail: !!credentials.client_email,
        hasPrivateKey: !!credentials.private_key,
      });
      throw new Error('Missing required BigQuery credentials');
    }

    try {
      this.bigquery = new BigQuery({
        projectId,
        credentials,
      });
      console.log('BigQuery inicializado com sucesso:', {
        projectId,
        hasCredentials: !!credentials,
      });
    } catch (error) {
      console.error('Erro ao inicializar BigQuery:', error);
      throw new Error('Failed to initialize BigQuery client');
    }
  }

  async searchOrder(
    searchValue: string,
    options: SearchOptions = {}
  ): Promise<OrderSearchResult[]> {
    console.log('Iniciando busca no BigQuery:', { searchValue, options });

    const {
      sortKey = 'data_pedido_status',
      sortOrder = 'desc',
      pageSize = 10,
      offset = 0,
    } = options;

    // Validar ordem de classificação
    const validatedSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Limpar o valor de busca para evitar injeção SQL
    const cleanedSearchValue = searchValue.replace(/['";]/g, '');
    console.log('Valor de busca limpo:', cleanedSearchValue);

    const query = `
      SELECT 
        pedidos.id AS id_pedido,
        pedidos.numero AS numero_pedido,
        pedidos.id_nota_fiscal,
        pedidos.numero_ordem_compra,
        pedidos.total_produtos,
        pedidos.total_pedido,
        pedidos.valor_desconto,
        pedidos.deposito,
        pedidos.frete_por_conta,
        pedidos.codigo_rastreamento,
        pedidos.nome_transportador,
        pedidos.forma_frete,
        pedidos.data_pedido,
        pedidos.data_envio,
        pedidos.data_entrega,
        pedidos.situacao AS situacao_pedido,
        pedidos.data_prevista,
        pedidos.url_rastreamento,
        pedidos.cliente AS cliente_json,
        pedidos.itens AS itens_pedido,
        pedidos_status.dataPedido AS data_pedido_status,
        pedidos_status.dataFaturamento AS data_faturamento_status,
        pedidos_status.situacaoPedido AS situacao_pedido_status,
        pedidos_status.nome AS nome_status,
        pedidos_status.telefone AS telefone_status,
        pedidos_status.email AS email_status,
        pedidos_status.tipoEnvioTransportadora AS tipo_envio_transportadora_status,
        pedidos_status.statusTransportadora AS status_transportadora_status,
        pedidos_status.dataExpedicao AS data_expedicao_status,
        pedidos_status.dataColeta AS data_coleta_status,
        pedidos_status.transportador AS transportador_json_status,
        pedidos_status.formaEnvio AS forma_envio_status,
        separacoes.situacao AS situacao_separacao,
        nfes.numero AS numero_nota,
        nfes.chaveAcesso AS chave_acesso_nota,
        nfes.valor AS valor_nota,
        etiquetas.status AS status_transportadora,
        etiquetas.lastStatusDate AS ultima_atualizacao_status,
        etiquetas.codigoRastreamento AS codigo_rastreamento_etiqueta,
        etiquetas.urlRastreamento AS url_rastreamento_etiqueta,
        pedidos.obs_interna AS obs_interna
      FROM 
        \`truebrands-warehouse.truebrands_providers.tiny_pedidos\` AS pedidos
      LEFT JOIN 
        \`truebrands-warehouse.truebrands_warehouse.pedidos_status\` AS pedidos_status
        ON pedidos.id = pedidos_status.idPedido
      LEFT JOIN 
        \`truebrands-warehouse.truebrands_providers.tiny_separacoes\` AS separacoes
        ON pedidos.id = separacoes.idOrigem
      LEFT JOIN 
        \`truebrands-warehouse.truebrands_providers.tinyV3_nfes\` AS nfes
        ON pedidos.id_nota_fiscal = nfes.id
      LEFT JOIN 
        \`truebrands-warehouse.truebrands_providers.transportadoras_etiquetas\` AS etiquetas
        ON pedidos.id = etiquetas.idPedido
      WHERE 
        pedidos.id = @search OR
        pedidos.numero = @search OR
        pedidos.id_nota_fiscal = @search OR
        pedidos.numero_ordem_compra = @search
      ORDER BY ${sortKey} ${validatedSortOrder}
      LIMIT @pageSize
      OFFSET @offset;
    `;

    const queryOptions = {
      query,
      params: {
        search: cleanedSearchValue,
        pageSize,
        offset,
      },
      timeout: this.queryTimeout,
    };

    console.log('Query do BigQuery:', query);
    console.log('Parâmetros da query:', queryOptions.params);

    try {
      // Adiciona um timeout manual usando Promise.race
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('BigQuery query timeout'));
        }, this.queryTimeout);
      });

      console.log('Executando query no BigQuery...');
      const queryPromise = this.bigquery.query(queryOptions);
      const [rows] = await Promise.race([queryPromise, timeoutPromise]) as [OrderSearchResult[]];

      console.log('Query executada com sucesso. Resultados encontrados:', rows?.length || 0);
      return rows as OrderSearchResult[];
    } catch (error) {
      console.error('Erro detalhado no BigQuery:', error);
      
      // Verifica se é um erro de autenticação
      if (error instanceof Error) {
        if (error.message.includes('Could not load the default credentials')) {
          console.error('Erro de autenticação do BigQuery:', error);
          throw new Error('BigQuery authentication failed');
        }
        if (error.message.includes('timeout')) {
          console.error('Timeout na query do BigQuery:', error);
          throw new Error('BigQuery query timeout');
        }
      }
      
      throw new Error(error instanceof Error ? error.message : 'Erro ao consultar BigQuery');
    }
  }
}

export const bigQueryService = new BigQueryService();

export async function searchOrder(searchValue: string, options: SearchOptions = {}): Promise<OrderSearchResult[]> {
  return bigQueryService.searchOrder(searchValue, options);
} 