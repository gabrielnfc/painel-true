import { bigquery } from '../config/bigquery';

interface OrderItem {
  quantidade: number;
  nome: string;
  valor: number | string;
  [key: string]: any;
}

interface ProcessedOrder {
  numero_pedido?: string;
  numero_nota?: string;
  id_pedido?: string;
  numero_ordem_compra?: string;
  cliente_json?: any;
  data_pedido_status?: string;
  data_faturamento_status?: string;
  data_coleta_status?: string;
  data_prevista_entrega_status?: string;
  data_entrega_status?: string;
  data_prevista?: string;
  total_produtos?: string | number;
  total_pedido?: string | number;
  valor_desconto?: string | number;
  nome_transportador?: string;
  status_transportadora?: string;
  url_rastreamento?: string;
  obs_interna?: string;
  situacao_pedido_status?: string;
  forma_frete?: string;
  frete_por_conta?: string;
  itens_pedido?: OrderItem[];
  telefone_status?: string;
  email_status?: string;
  deposito?: string;
  [key: string]: any;
}

export class ChatService {
  async searchOrder(orderId: string): Promise<ProcessedOrder | null> {
    try {
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

      const options = {
        query,
        params: { orderId },
        location: 'US',
      };

      const [rows] = await bigquery.query(options);
      
      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.prepareOrderData(rows[0]);
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      return null;
    }
  }

  private prepareOrderData(order: any): ProcessedOrder {
    // Função para formatar valores monetários
    const formatMoney = (value: number | string | null | undefined) => {
      if (typeof value === 'number') {
        return value.toFixed(2);
      }
      return value;
    };

    // Função para processar datas
    const formatDate = (value: string | null | undefined) => {
      if (!value) return value;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('pt-BR');
        }
      } catch (e) {}
      return value;
    };

    // Processa os dados antes de retornar
    const processedData: ProcessedOrder = {
      ...order,
      cliente_json: typeof order.cliente_json === 'string' ? JSON.parse(order.cliente_json) : order.cliente_json,
      data_pedido_status: formatDate(order.data_pedido_status),
      data_faturamento_status: formatDate(order.data_faturamento_status),
      data_coleta_status: formatDate(order.data_coleta_status),
      data_prevista_entrega_status: formatDate(order.data_prevista_entrega_status || order.data_prevista),
      data_entrega_status: formatDate(order.data_entrega_status),
      data_prevista: formatDate(order.data_prevista),
      total_produtos: formatMoney(order.total_produtos),
      total_pedido: formatMoney(order.total_pedido),
      valor_desconto: formatMoney(order.valor_desconto)
    };

    // Processa os itens do pedido
    if (Array.isArray(order.itens_pedido)) {
      processedData.itens_pedido = order.itens_pedido.map((item: OrderItem) => ({
        quantidade: item.quantidade,
        nome: item.nome,
        valor: formatMoney(item.valor)
      }));
    }

    // Remove campos internos desnecessários
    const fieldsToRemove = [
      '_etag',
      '_metadata',
      '_timestamp',
      'created_at',
      'updated_at'
    ];
    
    fieldsToRemove.forEach(field => {
      delete processedData[field];
    });

    return processedData;
  }
}

// Export a singleton instance
export const chatService = new ChatService(); 