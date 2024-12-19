import { BigQuery } from '@google-cloud/bigquery';

export interface BigQueryConfig {
  projectId: string;
  keyFilename?: string;
  credentials?: {
    client_email: string;
    private_key: string;
  };
}

export interface SearchOptions {
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
  pageSize?: number;
  offset?: number;
}

export interface OrderSearchResult {
  data_pedido: string;
  data_entrega: string;
  id_pedido: string;
  numero_pedido: string;
  id_nota_fiscal: string;
  numero_ordem_compra: string;
  total_produtos: string;
  total_pedido: string;
  valor_desconto: string;
  deposito: string;
  frete_por_conta: string;
  codigo_rastreamento: string;
  nome_transportador: string;
  forma_frete: string;
  data_envio: string;
  situacao_pedido: string;
  data_prevista: string;
  url_rastreamento: string;
  cliente_json: string;
  itens_pedido: string;
  data_pedido_status: string;
  data_faturamento_status: string;
  situacao_pedido_status: string;
  nome_status: string;
  telefone_status: string;
  email_status: string;
  tipo_envio_transportadora_status: string;
  status_transportadora_status: string;
  data_expedicao_status: string;
  data_coleta_status: string;
  transportador_json_status: string;
  forma_envio_status: string;
  situacao_separacao: string | null;
  numero_nota: string;
  chave_acesso_nota: string;
  valor_nota: string;
  status_transportadora: string;
  ultima_atualizacao_status: string;
  codigo_rastreamento_etiqueta: string | null;
  url_rastreamento_etiqueta: string | null;
  obs_interna: string;
}

export class BigQueryService {
  private bigquery: BigQuery | null = null;
  private readonly queryTimeout = 30000; // 30 segundos de timeout

  constructor(config?: BigQueryConfig) {
    // Se estamos no processo de build, não inicialize o BigQuery
    if (process.env.VERCEL_ENV === 'build') {
      console.log('Pulando inicialização do BigQuery durante o build');
      return;
    }

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
    // Se estamos no processo de build, retorne um array vazio
    if (process.env.VERCEL_ENV === 'build') {
      console.log('Pulando busca no BigQuery durante o build');
      return [];
    }

    if (!this.bigquery) {
      throw new Error('BigQuery client not initialized');
    }

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
        pedidos.data_pedido AS data_pedido,
        pedidos.data_entrega AS data_entrega,
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
        pedidos.data_envio,
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

  async getOrdersReport(startDate: string, endDate: string): Promise<OrderSearchResult[]> {
    // Se estamos no processo de build, retorne um array vazio
    if (process.env.VERCEL_ENV === 'build') {
      console.log('Pulando busca no BigQuery durante o build');
      return [];
    }

    if (!this.bigquery) {
      throw new Error('BigQuery client not initialized');
    }

    console.log('Iniciando busca de relatório:', { startDate, endDate });

    const query = `
      SELECT 
        pedidos.data_pedido AS data_pedido,
        pedidos.data_entrega AS data_entrega,
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
        pedidos.nome_transportador AS transportadora,
        pedidos.forma_frete,
        pedidos.data_envio,
        pedidos.situacao AS situacao_pedido,
        pedidos.data_prevista,
        pedidos.url_rastreamento,
        pedidos.cliente AS cliente_json,
        JSON_EXTRACT_SCALAR(pedidos.cliente, '$.nome') AS nome_cliente,
        JSON_EXTRACT_SCALAR(pedidos.cliente, '$.cpf_cnpj') AS cpf,
        JSON_EXTRACT_SCALAR(pedidos.cliente, '$.fone') AS telefone,
        JSON_EXTRACT_SCALAR(pedidos.cliente, '$.email') AS email,
        JSON_EXTRACT_SCALAR(pedidos.cliente, '$.uf') AS uf,
        JSON_EXTRACT_SCALAR(pedidos.cliente, '$.cep') AS cep,
        pedidos.itens AS produtos,
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
        PARSE_DATE('%d/%m/%Y', pedidos.data_pedido) BETWEEN DATE(@startDate) AND DATE(@endDate)
      ORDER BY pedidos.data_pedido DESC;
    `;

    const queryOptions = {
      query,
      params: {
        startDate,
        endDate,
      },
      timeout: this.queryTimeout,
    };

    console.log('Query do relatório:', query);
    console.log('Parâmetros da query:', queryOptions.params);

    try {
      console.log('Executando query de relatório...');
      const [rows] = await this.bigquery.query(queryOptions);
      console.log('Query de relatório executada com sucesso. Resultados:', rows?.length || 0);
      return rows as OrderSearchResult[];
    } catch (error) {
      console.error('Erro no relatório do BigQuery:', error);
      throw new Error(error instanceof Error ? error.message : 'Erro ao consultar BigQuery');
    }
  }
}

// Export a singleton instance
export const bigQueryService = new BigQueryService();

// Função de busca exportada
export async function searchOrders(orderNumber: string) {
  return bigQueryService.searchOrder(orderNumber);
}