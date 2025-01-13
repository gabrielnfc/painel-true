import { BigQuery } from '@google-cloud/bigquery';
import { BigQueryOrder } from '../types/bigquery';

// Configuração centralizada do BigQuery
export const bigQueryConfig = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  // Configurações de performance e monitoramento
  maximumBytesBilled: process.env.BIGQUERY_MAX_BYTES_BILLED ? 
    parseInt(process.env.BIGQUERY_MAX_BYTES_BILLED) : 1000000000, // 1GB default
  location: 'US',
  jobTimeoutMs: 30000, // 30 segundos
  retryOptions: {
    retryDelayMultiplier: 2,
    totalTimeout: 60000, // 1 minuto
    maxRetries: 3
  },
  query: {
    useQueryCache: true,
    useLegacySql: false
  }
};

// Instância singleton do BigQuery
export const bigquery = new BigQuery(bigQueryConfig);

export class BigQueryService {
  private bigquery: BigQuery;

  constructor() {
    this.bigquery = bigquery;
  }

  async searchOrder(orderId: string): Promise<BigQueryOrder | null> {
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
        COALESCE(
          JSON_EXTRACT_SCALAR(vtex.packageAttachment, "$.packages[0].shippingEstimateDate"),
          pedidos.data_prevista
        ) AS data_prevista,
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
      LEFT JOIN
        \`truebrands-warehouse.truebrands_providers.vtex_orders\` AS vtex
        ON pedidos.numero_ordem_compra = vtex.orderId
      WHERE
        pedidos.id = @orderId OR
        pedidos.numero = @orderId OR
        pedidos.numero_ordem_compra = @orderId OR
        pedidos.id_nota_fiscal = @orderId
      LIMIT 1;
    `;

    try {
      const [rows] = await this.bigquery.query({
        query,
        params: { orderId },
        ...bigQueryConfig.query
      });

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return rows[0] as BigQueryOrder;
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      return null;
    }
  }

  async executeQuery<T>(query: string, params?: any): Promise<T[]> {
    const [job] = await this.bigquery.createQueryJob({
      query,
      params,
      ...bigQueryConfig.query
    });

    const [rows] = await job.getQueryResults();
    return rows as T[];
  }

  async monitorQuery(query: string, options: any = {}) {
    const startTime = Date.now();
    try {
      const [job] = await this.bigquery.createQueryJob({
        query,
        ...options,
        ...bigQueryConfig.query
      });

      const [rows] = await job.getQueryResults();
      
      const metadata = await job.getMetadata();
      const statistics = metadata[0].statistics;
      
      console.log('BigQuery Query Stats:', {
        queryId: job.id,
        duration: Date.now() - startTime,
        bytesProcessed: statistics.totalBytesProcessed,
        rowsReturned: rows.length,
        cacheHit: statistics.query.cacheHit,
        timestamp: new Date().toISOString(),
      });

      return rows;
    } catch (error) {
      console.error('BigQuery Query Error:', {
        error,
        query,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }
} 