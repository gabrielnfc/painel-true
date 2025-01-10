import { bigquery } from '../config/bigquery';
import { BigQueryOrder } from '../types/bigquery';

export class SearchService {
  async searchOrders(search: string, pageSize: number = 10, offset: number = 0): Promise<BigQueryOrder[]> {
    if (!search) {
      throw new Error('Termo de busca é obrigatório');
    }

    if (pageSize < 1 || pageSize > 100) {
      pageSize = 10;
    }

    if (offset < 0) {
      offset = 0;
    }

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
        CAST(pedidos.id AS STRING) = @search OR
        pedidos.numero = @search OR
        CAST(pedidos.id_nota_fiscal AS STRING) = @search OR
        pedidos.numero_ordem_compra = @search
      ORDER BY data_pedido_status DESC
      LIMIT @pageSize
      OFFSET @offset;
    `;

    const queryOptions = {
      query,
      params: {
        search: search.trim(),
        pageSize,
        offset,
      },
    };

    try {
      const [rows] = await bigquery.query(queryOptions);
      
      if (!Array.isArray(rows)) {
        throw new Error('Formato de resposta inválido do BigQuery');
      }

      return rows as BigQueryOrder[];
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      if (error instanceof Error) {
        throw new Error(`Erro ao consultar pedidos: ${error.message}`);
      }
      throw new Error('Erro ao consultar pedidos');
    }
  }
}

// Export a singleton instance
export const searchService = new SearchService(); 