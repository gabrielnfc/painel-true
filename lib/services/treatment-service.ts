import { bigquery } from '../config/bigquery';
import db from '../db';
import { Treatment, CreateTreatmentDTO, UpdateTreatmentDTO, TreatmentWithOrder, TreatmentHistory } from '../types/treatment';

export class TreatmentService {
  async createTreatment(data: CreateTreatmentDTO): Promise<Treatment> {
    const result = await db.query(
      `INSERT INTO treatments 
       (order_id, order_number, observations, internal_notes, customer_contact, carrier_protocol,
        new_delivery_deadline, resolution_deadline, follow_up_date,
        delivery_status, treatment_status, priority_level, action_taken, resolution_type, complaint_reason, identified_problem)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        data.order_id,
        data.order_number,
        data.observations || '',
        data.internal_notes || '',
        data.customer_contact || '',
        data.carrier_protocol || '',
        data.new_delivery_deadline,
        data.resolution_deadline,
        data.follow_up_date || null,
        data.delivery_status,
        data.treatment_status,
        data.priority_level,
        data.action_taken || '',
        data.resolution_type || 'other',
        data.complaint_reason || 'not_applicable',
        data.identified_problem || 'carrier_hold'
      ]
    );

    // Atualiza o progresso do pedido
    await this.updateOrderProgress(
      data.order_id,
      this.getProgressStatus(data.treatment_status)
    );

    return result.rows[0];
  }

  async updateTreatment(id: number, data: UpdateTreatmentDTO, userId: string, userName: string): Promise<Treatment> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.observations !== undefined) {
      updates.push(`observations = $${paramCount}`);
      values.push(data.observations);
      paramCount++;
    }

    if (data.internal_notes !== undefined) {
      updates.push(`internal_notes = $${paramCount}`);
      values.push(data.internal_notes);
      paramCount++;
    }

    if (data.customer_contact !== undefined) {
      updates.push(`customer_contact = $${paramCount}`);
      values.push(data.customer_contact);
      paramCount++;
    }

    if (data.carrier_protocol !== undefined) {
      updates.push(`carrier_protocol = $${paramCount}`);
      values.push(data.carrier_protocol);
      paramCount++;
    }

    if (data.new_delivery_deadline !== undefined) {
      updates.push(`new_delivery_deadline = $${paramCount}`);
      values.push(data.new_delivery_deadline);
      paramCount++;
    }

    if (data.resolution_deadline !== undefined) {
      updates.push(`resolution_deadline = $${paramCount}`);
      values.push(data.resolution_deadline);
      paramCount++;
    }

    if (data.follow_up_date !== undefined) {
      updates.push(`follow_up_date = $${paramCount}`);
      values.push(data.follow_up_date);
      paramCount++;
    }

    if (data.delivery_status !== undefined) {
      updates.push(`delivery_status = $${paramCount}`);
      values.push(data.delivery_status);
      paramCount++;
    }

    if (data.treatment_status !== undefined) {
      updates.push(`treatment_status = $${paramCount}`);
      values.push(data.treatment_status);
      paramCount++;
    }

    if (data.priority_level !== undefined) {
      updates.push(`priority_level = $${paramCount}`);
      values.push(data.priority_level);
      paramCount++;
    }

    if (data.action_taken !== undefined) {
      updates.push(`action_taken = $${paramCount}`);
      values.push(data.action_taken);
      paramCount++;
    }

    if (data.resolution_type !== undefined) {
      updates.push(`resolution_type = $${paramCount}`);
      values.push(data.resolution_type);
      paramCount++;
    }

    if (data.complaint_reason !== undefined) {
      updates.push(`complaint_reason = $${paramCount}`);
      values.push(data.complaint_reason);
      paramCount++;
    }

    if (data.identified_problem !== undefined) {
      updates.push(`identified_problem = $${paramCount}`);
      values.push(data.identified_problem);
      paramCount++;
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const result = await db.query(
      `UPDATE treatments 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Treatment not found');
    }

    // Atualiza o progresso do pedido se houver mudança no status
    if (data.treatment_status) {
      const treatment = result.rows[0];
      await this.updateOrderProgress(
        treatment.order_id,
        this.getProgressStatus(data.treatment_status)
      );
    }

    // Criar registro no histórico
    await this.createTreatmentHistory(id, userId, userName, data);

    return result.rows[0];
  }

  async getTreatmentByOrderId(orderId: string): Promise<Treatment | null> {
    const result = await db.query(
      'SELECT * FROM treatments WHERE order_id = $1',
      [orderId]
    );

    return result.rows[0] || null;
  }

  async calculatePriorityLevel(daysDelayed: number): Promise<number> {
    if (daysDelayed <= 3) return 1;  // Baixa
    if (daysDelayed <= 7) return 2;  // Média-Baixa
    if (daysDelayed <= 14) return 3; // Média
    if (daysDelayed <= 30) return 4; // Alta
    return 5;                        // Crítica
  }

  async getOrderDetails(orderId: string) {
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
          pedidos.obs_interna AS obs_interna,
          DATE_DIFF(
            CURRENT_DATE(),
            SAFE.PARSE_DATE('%d/%m/%Y', pedidos.data_prevista),
            DAY
          ) as dias_atraso,
          JSON_EXTRACT_SCALAR(pedidos.cliente, '$.endereco') as endereco_cliente,
          JSON_EXTRACT_SCALAR(pedidos.cliente, '$.numero') as numero_endereco_cliente,
          JSON_EXTRACT_SCALAR(pedidos.cliente, '$.complemento') as complemento_endereco_cliente,
          JSON_EXTRACT_SCALAR(pedidos.cliente, '$.bairro') as bairro_cliente,
          JSON_EXTRACT_SCALAR(pedidos.cliente, '$.cep') as cep_cliente,
          JSON_EXTRACT_SCALAR(pedidos.cliente, '$.cidade') as cidade_cliente,
          JSON_EXTRACT_SCALAR(pedidos.cliente, '$.uf') as uf_cliente
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

      return this.processOrderData(rows[0]);
    } catch (error) {
      console.error('Erro ao buscar detalhes do pedido:', error);
      return null;
    }
  }

  async getDelayedOrdersWithTreatments(): Promise<TreatmentWithOrder[]> {
    try {
      const delayedOrdersQuery = `
        WITH pedidos_base AS (
          SELECT
            pedidos.id as id_pedido,
            pedidos.numero as numero_pedido,
            pedidos.data_pedido,
            pedidos.situacao,
            COALESCE(
              JSON_EXTRACT_SCALAR(vtex.packageAttachment, "$.packages[0].shippingEstimateDate"),
              pedidos.data_prevista
            ) as data_prevista,
            pedidos.cliente as cliente_json,
            pedidos.total_pedido,
            pedidos_status.statusTransportadora
          FROM
            \`truebrands-warehouse.truebrands_providers.tiny_pedidos\` AS pedidos
          LEFT JOIN
            \`truebrands-warehouse.truebrands_providers.vtex_orders\` AS vtex
            ON pedidos.numero_ordem_compra = vtex.orderId
          LEFT JOIN
            \`truebrands-warehouse.truebrands_warehouse.pedidos_status\` AS pedidos_status
            ON pedidos.id = pedidos_status.idPedido
          WHERE
            SAFE.PARSE_DATE('%d/%m/%Y', pedidos.data_pedido) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
            AND pedidos.situacao NOT IN ('Entregue', 'Cancelado', 'Em digitação')
            AND pedidos.data_pedido IS NOT NULL
            AND pedidos.data_pedido != ''
            AND (pedidos_status.statusTransportadora IS NULL 
                 OR pedidos_status.statusTransportadora NOT IN ('Entregue', 'DELIVERED', 'Delivered', 'Objeto entregue ao destinatário'))
        )
        SELECT
          id_pedido,
          numero_pedido,
          data_pedido,
          data_prevista,
          cliente_json,
          total_pedido,
          statusTransportadora,
          FORMAT_DATE('%Y-%m-%d', SAFE.PARSE_DATE('%d/%m/%Y', data_pedido)) as data_pedido_formatada,
          FORMAT_DATE('%Y-%m-%d', SAFE.PARSE_DATE('%d/%m/%Y', data_prevista)) as data_prevista_formatada,
          DATE_DIFF(
            CURRENT_DATE(),
            SAFE.PARSE_DATE('%d/%m/%Y', data_prevista),
            DAY
          ) as dias_atraso,
          'ATRASADO' as status_atraso,
          CASE
            WHEN DATE_DIFF(
              CURRENT_DATE(),
              SAFE.PARSE_DATE('%d/%m/%Y', data_prevista),
              DAY
            ) <= 1 THEN 1
            WHEN DATE_DIFF(
              CURRENT_DATE(),
              SAFE.PARSE_DATE('%d/%m/%Y', data_prevista),
              DAY
            ) <= 3 THEN 2
            WHEN DATE_DIFF(
              CURRENT_DATE(),
              SAFE.PARSE_DATE('%d/%m/%Y', data_prevista),
              DAY
            ) <= 5 THEN 3
            WHEN DATE_DIFF(
              CURRENT_DATE(),
              SAFE.PARSE_DATE('%d/%m/%Y', data_prevista),
              DAY
            ) <= 7 THEN 4
            ELSE 5
          END as nivel_prioridade
        FROM
          pedidos_base
        WHERE
          SAFE.PARSE_DATE('%d/%m/%Y', data_prevista) < CURRENT_DATE()
        ORDER BY
          nivel_prioridade DESC,
          dias_atraso DESC
        LIMIT 100;
      `;

      const [delayedOrders] = await bigquery.query({ query: delayedOrdersQuery });

      // Extrai todos os IDs de pedidos
      const orderIds = delayedOrders.map(order => order.id_pedido);

      // Busca todos os tratamentos em uma única consulta
      const treatmentsResult = await db.query(
        `SELECT t.*, 
                EXISTS (
                    SELECT 1 
                    FROM treatment_history th 
                    WHERE th.treatment_id = t.id 
                    AND th.user_id != 'system'
                ) as has_manual_treatment
         FROM treatments t 
         WHERE t.order_id = ANY($1) 
         AND (
             t.treatment_status != 'resolved'
             OR (
                 t.observations = 'Tratamento automático iniciado'
                 AND NOT EXISTS (
                     SELECT 1 
                     FROM treatment_history th 
                     WHERE th.treatment_id = t.id 
                     AND th.user_id != 'system'
                 )
             )
         )`,
        [orderIds]
      );

      // Cria um mapa de tratamentos por order_id para acesso rápido
      const treatmentsMap = new Map(
        treatmentsResult.rows
          .filter(treatment => 
            treatment.treatment_status !== 'resolved' || 
            (treatment.observations === 'Tratamento automático iniciado' && !treatment.has_manual_treatment)
          )
          .map(treatment => [treatment.order_id, treatment])
      );

      // Mapeia os pedidos com seus tratamentos
      return delayedOrders.map(order => {
        const treatment = treatmentsMap.get(order.id_pedido) || {
          id: null,
          order_id: order.id_pedido,
          observations: null,
          new_delivery_deadline: null,
          resolution_deadline: null,
          status: "pending",
          priority_level: order.nivel_prioridade as number,
          created_at: null,
          updated_at: null
        };

        return {
          ...treatment,
          order_details: this.processOrderData(order)
        };
      });
    } catch (error) {
      console.error('Erro ao buscar pedidos atrasados:', error);
      throw error;
    }
  }

  private processOrderData(order: any) {
    // Parse do cliente_json com tratamento de erro
    let cliente = {};
    try {
      cliente = typeof order.cliente_json === 'string' ? JSON.parse(order.cliente_json) : order.cliente_json || {};
    } catch (e) {
      console.error(`Erro ao fazer parse do cliente_json para o pedido ${order.id_pedido}:`, e);
    }

    // Parse dos itens do pedido
    let itens = [];
    try {
      const rawItens = order.itens_pedido;
      if (typeof rawItens === 'string') {
        // Remove caracteres de escape extras e aspas desnecessárias
        const cleanJson = rawItens
          .replace(/\\"/g, '"')
          .replace(/^"|"$/g, '')
          .replace(/\\/g, '');
        const parsedItens = JSON.parse(cleanJson);
        // Extrai os itens da estrutura {item: {...}}
        itens = parsedItens.map((i: any) => i.item);
      } else if (Array.isArray(rawItens)) {
        itens = rawItens.map((i: any) => i.item || i);
      } else if (rawItens && typeof rawItens === 'object') {
        itens = [rawItens.item || rawItens];
      }
    } catch (e) {
      console.error(`Erro ao fazer parse dos itens do pedido ${order.id_pedido}:`, e);
      console.error('Raw itens:', order.itens_pedido);
    }

    // Garante que itens seja um array
    itens = Array.isArray(itens) ? itens : [];

    // Parse do transportador_json
    let transportador = {};
    try {
      transportador = typeof order.transportador_json_status === 'string' 
        ? JSON.parse(order.transportador_json_status) 
        : order.transportador_json_status || {};
    } catch (e) {
      console.error(`Erro ao fazer parse do transportador_json para o pedido ${order.id_pedido}:`, e);
    }

    // Funções específicas para cada tipo de data
    const formatDateHelpers = {
      // Para datas que já vêm no formato dd/mm/yyyy do Tiny
      formatTinyDate: (value: string | null | undefined) => {
        if (!value) return null;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
          return value;
        }
        return null;
      },

      // Para datas que vêm no formato yyyy-mm-dd do BigQuery
      formatBigQueryDate: (value: string | null | undefined) => {
        if (!value) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          const [year, month, day] = value.split('-');
          return `${day}/${month}/${year}`;
        }
        return null;
      },

      // Para datas que vêm com timestamp (yyyy-mm-dd HH:mm:ss)
      formatTimestampDate: (value: string | null | undefined) => {
        if (!value) return null;
        if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(value)) {
          const [datePart] = value.split(' ');
          const [year, month, day] = datePart.split('-');
          return `${day}/${month}/${year}`;
        }
        return null;
      }
    };

    // Função para formatar valores monetários
    const formatMoney = (value: number | string | null | undefined) => {
      if (!value) return '0.00';
      
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue)) return '0.00';
      
      return numValue.toFixed(2);
    };

    // Monta o endereço completo
    const endereco = [
      order.endereco_cliente,
      order.numero_endereco_cliente,
      order.complemento_endereco_cliente,
      order.bairro_cliente,
      order.cidade_cliente,
      order.uf_cliente,
      order.cep_cliente
    ].filter(Boolean).join(', ');

    return {
      id_pedido: order.id_pedido,
      numero_pedido: order.numero_pedido,
      numero_ordem_compra: order.numero_ordem_compra,

      // Datas do Tiny (já vêm no formato dd/mm/yyyy)
      data_pedido: formatDateHelpers.formatTinyDate(order.data_pedido) || formatDateHelpers.formatBigQueryDate(order.data_pedido) || order.data_pedido,
      data_prevista: formatDateHelpers.formatTinyDate(order.data_prevista) || formatDateHelpers.formatBigQueryDate(order.data_prevista) || order.data_prevista,
      data_envio: formatDateHelpers.formatTinyDate(order.data_envio) || formatDateHelpers.formatBigQueryDate(order.data_envio) || order.data_envio,
      data_entrega: formatDateHelpers.formatTinyDate(order.data_entrega) || formatDateHelpers.formatBigQueryDate(order.data_entrega) || order.data_entrega,

      // Datas do BigQuery (formato yyyy-mm-dd)
      data_expedicao: formatDateHelpers.formatBigQueryDate(order.data_expedicao_status) || formatDateHelpers.formatTinyDate(order.data_expedicao_status) || order.data_expedicao_status,
      data_faturamento: formatDateHelpers.formatBigQueryDate(order.data_faturamento_status) || formatDateHelpers.formatTinyDate(order.data_faturamento_status) || order.data_faturamento_status,

      // Datas com timestamp
      data_coleta: formatDateHelpers.formatTimestampDate(order.data_coleta_status) || formatDateHelpers.formatBigQueryDate(order.data_coleta_status) || formatDateHelpers.formatTinyDate(order.data_coleta_status) || order.data_coleta_status,
      ultima_atualizacao_status: formatDateHelpers.formatTimestampDate(order.ultima_atualizacao_status) || formatDateHelpers.formatBigQueryDate(order.ultima_atualizacao_status) || formatDateHelpers.formatTinyDate(order.ultima_atualizacao_status) || order.ultima_atualizacao_status,

      situacao_pedido: order.situacao_pedido,
      status_atual: order.status_atual,
      status_transportadora: order.status_transportadora,
      
      // Informações da transportadora
      nome_transportador: order.nome_transportador,
      codigo_rastreamento: order.codigo_rastreamento || order.codigo_rastreamento_etiqueta,
      url_rastreamento: order.url_rastreamento || order.url_rastreamento_etiqueta,
      forma_frete: order.forma_frete,
      frete_por_conta: order.frete_por_conta,
      tipo_envio: order.tipo_envio_transportadora_status,
      transportador_json: transportador,

      // Informações da nota fiscal
      numero_nota: order.numero_nota,
      chave_acesso_nota: order.chave_acesso_nota,
      valor_nota: formatMoney(order.valor_nota),

      // Informações financeiras
      total_produtos: formatMoney(order.total_produtos),
      total_pedido: formatMoney(order.total_pedido),
      valor_desconto: formatMoney(order.valor_desconto),

      dias_atraso: order.dias_atraso,
      cliente_json: cliente,
      endereco_completo: endereco,
      obs_interna: order.obs_interna,
      
      // Informações dos produtos
      itens: itens.map((item: any) => ({
        nome: item.descricao || item.nome || item.produto || '',
        quantidade: Number(item.quantidade) || 0,
        valor_unitario: formatMoney(item.valor_unitario || item.valor || 0),
        valor_total: formatMoney(
          Number(item.valor_total) || 
          (Number(item.quantidade || 0) * Number(item.valor_unitario || item.valor || 0))
        ),
        sku: item.codigo || item.sku || '',
        unidade: item.unidade || 'un',
        peso: Number(item.peso) || 0,
        desconto: formatMoney(item.desconto || 0),
        codigo_produto: item.id_produto || item.codigo_produto || item.codigo || '',
        gtin: item.gtin || item.ean || '',
        situacao: item.situacao || ''
      }))
    };
  }

  async getTreatmentsByOrderIds(orderIds: string[]): Promise<Treatment[]> {
    if (!orderIds.length) return [];
    
    const result = await db.query(
      'SELECT * FROM treatments WHERE order_id = ANY($1)',
      [orderIds]
    );

    return result.rows;
  }

  async ensureTreatmentExists(orderId: string): Promise<Treatment> {
    try {
      console.log('Verificando tratamento para pedido:', orderId);
      
      // Verifica se já existe um tratamento
      let existingTreatment = await this.getTreatmentByOrderId(orderId);
      
      if (existingTreatment) {
        console.log('Tratamento existente encontrado:', existingTreatment);
        
        // Verifica se existe histórico para o tratamento existente
        const history = await this.getTreatmentHistory(existingTreatment.id);
        
        console.log('Histórico encontrado:', {
          treatmentId: existingTreatment.id,
          historyCount: history.length
        });
        
        if (history.length === 0) {
          console.log('Criando histórico inicial para tratamento existente');
          
          // Se não existe histórico, cria um
          await this.createTreatmentHistory(
            existingTreatment.id,
            'system',
            'Sistema',
            {
              observations: 'Histórico inicial criado',
              internal_notes: 'Criado automaticamente pelo sistema',
              delivery_status: existingTreatment.delivery_status,
              treatment_status: existingTreatment.treatment_status,
              priority_level: existingTreatment.priority_level,
              new_delivery_deadline: existingTreatment.new_delivery_deadline,
              resolution_deadline: existingTreatment.resolution_deadline,
              follow_up_date: existingTreatment.follow_up_date,
              action_taken: existingTreatment.action_taken,
              resolution_type: existingTreatment.resolution_type,
              complaint_reason: existingTreatment.complaint_reason,
              identified_problem: existingTreatment.identified_problem
            }
          );
        }
        
        return existingTreatment;
      }

      console.log('Nenhum tratamento encontrado, buscando detalhes do pedido');

      // Busca detalhes do pedido para calcular prioridade
      const orderDetails = await this.getOrderDetails(orderId);
      
      if (!orderDetails) {
        console.error('Pedido não encontrado:', orderId);
        throw new Error('Pedido não encontrado');
      }

      console.log('Detalhes do pedido encontrados:', orderDetails);

      // Verifica novamente antes de criar para evitar duplicatas em chamadas concorrentes
      existingTreatment = await this.getTreatmentByOrderId(orderId);
      if (existingTreatment) {
        console.log('Tratamento encontrado na segunda verificação:', existingTreatment);
        return existingTreatment;
      }

      // Calcula prioridade baseada nos dias de atraso
      const daysDelayed = orderDetails.dias_atraso || 0;
      const priorityLevel = await this.calculatePriorityLevel(daysDelayed);

      console.log('Criando novo tratamento:', {
        orderId,
        daysDelayed,
        priorityLevel
      });

      // Cria novo tratamento
      const newTreatment = await this.createTreatment({
        order_id: orderId,
        order_number: orderDetails.numero_pedido,
        observations: 'Tratamento automático iniciado',
        internal_notes: 'Criado automaticamente pelo sistema',
        customer_contact: '',
        carrier_protocol: '',
        new_delivery_deadline: new Date(),
        resolution_deadline: new Date(),
        follow_up_date: new Date(),
        delivery_status: 'pending',
        treatment_status: 'pending',
        priority_level: priorityLevel,
        action_taken: '',
        resolution_type: 'other',
        complaint_reason: 'not_applicable',
        identified_problem: 'carrier_hold'
      });

      console.log('Novo tratamento criado:', newTreatment);
      console.log('Criando histórico inicial para novo tratamento');

      // Criar registro no histórico para o tratamento automático
      await this.createTreatmentHistory(
        newTreatment.id,
        'system',
        'Sistema',
        {
          observations: 'Tratamento automático iniciado',
          internal_notes: 'Criado automaticamente pelo sistema',
          customer_contact: '',
          carrier_protocol: '',
          new_delivery_deadline: newTreatment.new_delivery_deadline,
          resolution_deadline: newTreatment.resolution_deadline,
          follow_up_date: newTreatment.follow_up_date,
          delivery_status: newTreatment.delivery_status,
          treatment_status: newTreatment.treatment_status,
          priority_level: newTreatment.priority_level,
          action_taken: newTreatment.action_taken,
          resolution_type: newTreatment.resolution_type,
          complaint_reason: newTreatment.complaint_reason,
          identified_problem: newTreatment.identified_problem
        }
      );

      return newTreatment;
    } catch (error) {
      console.error('Erro ao garantir existência do tratamento:', error, { orderId });
      throw error;
    }
  }

  async createTreatmentHistory(
    treatmentId: number,
    userId: string,
    userName: string,
    data: UpdateTreatmentDTO
  ): Promise<TreatmentHistory> {
    try {
      console.log('Iniciando criação de histórico:', {
        treatmentId,
        userId,
        userName,
        data
      });

      // Validação dos campos obrigatórios
      if (!treatmentId) {
        throw new Error('treatmentId é obrigatório');
      }

      // Garante que todos os campos tenham valores válidos
      const values = [
        treatmentId,
        userId || 'system',
        userName || 'Sistema',
        data.observations || 'Sem observações',
        data.internal_notes || '',
        data.customer_contact || '',
        data.carrier_protocol || '',
        data.new_delivery_deadline || new Date(),
        data.resolution_deadline || new Date(),
        data.follow_up_date || null,
        data.delivery_status || 'pending',
        data.treatment_status || 'pending',
        data.priority_level || 1,
        data.action_taken || '',
        data.resolution_type || 'other',
        data.complaint_reason || 'not_applicable',
        data.identified_problem || 'carrier_hold'
      ];

      console.log('Valores preparados para inserção:', values);

      const result = await db.query(
        `INSERT INTO treatment_history 
         (treatment_id, user_id, user_name, observations, internal_notes,
          customer_contact, carrier_protocol, new_delivery_deadline,
          resolution_deadline, follow_up_date, delivery_status,
          treatment_status, priority_level, action_taken, resolution_type, 
          complaint_reason, identified_problem)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         RETURNING *`,
        values
      );

      if (!result.rows[0]) {
        console.error('Nenhum registro retornado após inserção');
        throw new Error('Falha ao criar histórico');
      }

      console.log('Histórico criado com sucesso:', result.rows[0]);

      return result.rows[0];
    } catch (error) {
      console.error('Erro ao criar histórico:', error, {
        treatmentId,
        userId,
        userName,
        data
      });
      throw error;
    }
  }

  async getTreatmentHistory(treatmentId: number): Promise<TreatmentHistory[]> {
    try {
      console.log('Buscando histórico para tratamento:', treatmentId);
      
      const result = await db.query(
        'SELECT * FROM treatment_history WHERE treatment_id = $1 ORDER BY created_at DESC',
        [treatmentId]
      );

      console.log('Resultado da busca de histórico:', {
        treatmentId,
        found: result.rows.length,
        rows: result.rows
      });

      return result.rows;
    } catch (error) {
      console.error('Erro ao buscar histórico:', error, { treatmentId });
      throw error;
    }
  }

  private async updateOrderProgress(orderId: string, status: string): Promise<void> {
    try {
      await db.query(
        `INSERT INTO order_progress (order_id, status, created_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (order_id) 
         DO UPDATE SET status = $2, updated_at = CURRENT_TIMESTAMP`,
        [orderId, status]
      );
    } catch (error) {
      console.error('Error updating order progress:', error);
      throw error;
    }
  }

  private getProgressStatus(treatmentStatus: string): string {
    switch (treatmentStatus) {
      case 'pending':
        return 'Aguardando análise';
      case 'ongoing':
        return 'Em tratamento';
      case 'waiting_customer':
        return 'Aguardando cliente';
      case 'waiting_carrier':
        return 'Aguardando transportadora';
      case 'waiting_stock':
        return 'Aguardando estoque';
      case 'rerouting':
        return 'Redirecionando entrega';
      case 'scheduling_delivery':
        return 'Agendando entrega';
      case 'resolved':
        return 'Tratamento concluído';
      case 'cancelled':
        return 'Tratamento cancelado';
      default:
        return 'Em análise';
    }
  }
}

// Export a singleton instance
export const treatmentService = new TreatmentService(); 