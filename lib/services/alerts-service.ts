import { bigquery } from '../config/bigquery';
import { BigQueryOrder } from '../types/bigquery';
import { query } from '../db';
import { FINISHED_ORDER_STATUSES } from '../config/order-status';
import { cacheWrapper } from '../redis';
import { createHash } from 'crypto';

interface FilterOptions {
  status?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface QueryMetrics {
  duration: number;
  rowCount: number;
  cacheHit: boolean;
  timestamp: string;
}

export class AlertsService {
  private readonly CACHE_TTL = {
    carriers: 1800,     // 30 minutos para transportadoras
    delayedOrders: 300, // 5 minutos para pedidos atrasados
    metrics: 900        // 15 minutos para métricas
  };
  
  private readonly CACHE_KEY_PREFIX = 'alerts:';

  private generateCacheKey(prefix: string, params: Record<string, any>): string {
    const normalizedParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    const hash = createHash('md5')
      .update(JSON.stringify(normalizedParams))
      .digest('hex');
    
    return `${this.CACHE_KEY_PREFIX}${prefix}:${hash}`;
  }

  private logQueryMetrics(queryName: string, metrics: QueryMetrics): void {
    console.log('BigQuery metrics:', {
      query: queryName,
      ...metrics,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
      bytesProcessed: metrics.bytesProcessed,
      cacheRatio: metrics.cacheHit ? 1 : 0,
      queryId: metrics.queryId,
      executionTime: metrics.duration,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      queryType: 'bigquery',
      service: 'alerts'
    });
  }

  private extractCarrierInfo(transportadorJson: string | null): { name: string; shipping: string } {
    if (!transportadorJson) {
      return { name: 'Não definida', shipping: '-' };
    }

    try {
      const data = JSON.parse(transportadorJson);
      const carrierName = data.formaEnvio?.nome || data.nome || 'Não definida';
      const cleanCarrierName = carrierName.replace(/\s+(sedex|pac|express).*$/i, '').trim();
      
      return {
        name: cleanCarrierName,
        shipping: data.formaFrete?.nome || data.forma_frete || '-'
      };
    } catch (error) {
      console.error('Erro ao extrair informações da transportadora:', error, { transportadorJson });
      return { name: 'Não definida', shipping: '-' };
    }
  }

  async getAvailableCarriers(): Promise<string[]> {
    try {
      const cacheKey = this.generateCacheKey('carriers', {});
      const cachedData = await cacheWrapper.get(cacheKey);
      
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      const startTime = Date.now();
      const [result] = await bigquery.query({
        query: `
          WITH parsed_carriers AS (
            SELECT DISTINCT
              JSON_EXTRACT_SCALAR(transportador, '$.nome') as nome_transportador
            FROM \`truebrands-warehouse.truebrands_warehouse.pedidos_status\`
            WHERE transportador IS NOT NULL
            AND JSON_EXTRACT_SCALAR(transportador, '$.nome') IS NOT NULL
          )
          SELECT DISTINCT
            REGEXP_REPLACE(TRIM(nome_transportador), '\s+(sedex|pac|express).*$', '') as carrier_name
          FROM parsed_carriers
          WHERE nome_transportador != ''
          ORDER BY carrier_name
        `
      });

      const duration = Date.now() - startTime;
      
      const carriers = result
        .map((row: any) => row.carrier_name)
        .filter((name: string) => name && name !== 'Não definida');

      await cacheWrapper.set(cacheKey, JSON.stringify(carriers), this.CACHE_TTL.carriers);
      
      this.logQueryMetrics('getAvailableCarriers', {
        duration,
        rowCount: carriers.length,
        cacheHit: false,
        timestamp: new Date().toISOString()
      });

      return carriers;
    } catch (error) {
      console.error('Erro ao buscar transportadoras:', error);
      return [];
    }
  }

  async getDelayedOrders(
    search?: string,
    carrier?: string,
    filters: FilterOptions = {}
  ): Promise<BigQueryOrder[]> {
    try {
      const cacheKey = this.generateCacheKey('delayedOrders', {
        search,
        carrier,
        ...filters
      });
      
      const cachedData = await cacheWrapper.get(cacheKey);
      
      if (cachedData) {
        this.logQueryMetrics('getDelayedOrders', {
          duration: 0,
          rowCount: JSON.parse(cachedData).length,
          cacheHit: true,
          timestamp: new Date().toISOString()
        });
        return JSON.parse(cachedData);
      }

      const startTime = Date.now();

      // Query otimizada usando a tabela em cache
      const [delayedOrders] = await bigquery.query({
        query: `
          WITH filtered_orders AS (
            SELECT *
            FROM \`truebrands-warehouse.truebrands_warehouse.pedidos_atrasados_cache\`
            WHERE 
              dias_atraso > 0
              AND situacao_pedido NOT IN UNNEST(@finishedOrderStatuses)
              AND UPPER(situacao_pedido) != 'ENTREGUE'
              ${search ? `AND (
                numero_pedido = @search OR
                id_pedido = @search OR
                numero_ordem_compra = @search OR
                id_nota_fiscal = @search
              )` : ''}
              ${carrier ? `AND REGEXP_CONTAINS(
                LOWER(JSON_EXTRACT_SCALAR(transportador_json_status, '$.nome')),
                LOWER(@carrier)
              )` : ''}
              ${filters.dateFrom ? `AND data_prevista_normalizada >= DATE(@dateFrom)` : ''}
              ${filters.dateTo ? `AND data_prevista_normalizada <= DATE(@dateTo)` : ''}
          )
          SELECT *
          FROM filtered_orders
          WHERE 
            (status_transportadora IS NULL OR UPPER(status_transportadora) NOT IN UNNEST(@finishedCarrierStatuses))
            AND (
              transportador_json_status IS NULL
              OR (
                LOWER(JSON_EXTRACT_SCALAR(transportador_json_status, '$.nome')) NOT IN ('retirada funcionário', 'retirada de funcionário')
                AND LOWER(JSON_EXTRACT_SCALAR(transportador_json_status, '$.formaEnvio.nome')) NOT IN ('retirada de funcionario', 'retirada funcionario')
              )
            )
          ORDER BY dias_atraso DESC
          LIMIT 100
        `,
        params: {
          finishedOrderStatuses: FINISHED_ORDER_STATUSES.orderStatus,
          finishedCarrierStatuses: FINISHED_ORDER_STATUSES.carrierStatus,
          ...(search && { search: search.trim() }),
          ...(carrier && { carrier: carrier.trim() }),
          ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
          ...(filters.dateTo && { dateTo: filters.dateTo })
        }
      });

      const duration = Date.now() - startTime;

      // Buscar todas as tratativas ativas
      const treatmentsQuery = `
        WITH latest_treatments AS (
          SELECT 
            t.id as treatment_id,
            t.order_id,
            t.order_number,
            th.new_delivery_deadline,
            th.treatment_status,
            th.delivery_status,
            th.priority_level,
            th.carrier_protocol,
            th.created_at,
            th.observations,
            th.internal_notes,
            th.customer_contact,
            ROW_NUMBER() OVER (
              PARTITION BY t.order_number 
              ORDER BY th.created_at DESC
            ) as rn
          FROM treatments t
          JOIN treatment_history th ON th.treatment_id = t.id
          WHERE th.treatment_status != 'resolved'
          AND th.observations IS NOT NULL 
          AND th.observations != ''
          AND th.user_id != 'system'
        )
        SELECT *
        FROM latest_treatments
        WHERE rn = 1
      `;

      const treatments = await query(treatmentsQuery);
      
      // Criar dois mapas para busca por order_id e order_number
      const treatmentsByOrderId = new Map(treatments.rows.map(t => [t.order_id, t]));
      const treatmentsByOrderNumber = new Map(treatments.rows.map(t => [t.order_number, t]));

      // Função auxiliar para formatar data
      const formatDate = (dateStr: string | null): string => {
        if (!dateStr) return '-';
        
        try {
          // Se já está no formato brasileiro, retornar como está
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
            return dateStr;
          }
          
          // Se está no formato ISO
          if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              return date.toLocaleDateString('pt-BR');
            }
          }
          
          // Se está em outro formato, tentar converter
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('pt-BR');
          }
          
          return '-';
        } catch {
          return '-';
        }
      };

      // Combinar dados e calcular status
      const result = delayedOrders.map(order => {
        // Tentar encontrar tratativa pelo id_pedido ou numero_pedido
        const treatment = treatmentsByOrderId.get(order.id_pedido?.toString()) || 
                         treatmentsByOrderNumber.get(order.numero_pedido);
        
        // Extrair informações da transportadora
        const carrierInfo = this.extractCarrierInfo(order.transportador_json_status);
        
        // Formatar datas
        const dataPedido = order.data_pedido || '-';
        const dataPrevista = order.vtex_data_prevista 
          ? formatDate(order.vtex_data_prevista)
          : (order.data_prevista || '-');
        
        // Se tem tratativa, priorizar os dados dela
        if (treatment) {
          const diasAtraso = treatment.new_delivery_deadline
            ? Math.floor((new Date().getTime() - new Date(treatment.new_delivery_deadline).getTime()) / (1000 * 60 * 60 * 24))
            : order.dias_atraso;

          return {
            ...order,
            data_pedido: dataPedido,
            data_prevista: treatment.new_delivery_deadline 
              ? formatDate(treatment.new_delivery_deadline)
              : dataPrevista,
            dias_atraso: diasAtraso,
            status_atraso: diasAtraso > 0 ? 'ATRASADO' : 'NO_PRAZO',
            treatment_status: treatment.treatment_status,
            delivery_status: treatment.delivery_status || order.status_transportadora || 'pending',
            priority_level: this.normalizePriorityLevel(treatment.priority_level, diasAtraso),
            cliente_json: order.cliente_json,
            carrier_info: {
              name: carrierInfo.name,
              protocol: treatment.carrier_protocol || order.codigo_rastreamento || '-',
              tracking_url: order.url_rastreamento || '-',
              shipping_type: carrierInfo.shipping,
              last_update: order.ultima_atualizacao_status 
                ? formatDate(order.ultima_atualizacao_status)
                : '-'
            },
            treatment_info: {
              observations: treatment.observations || '-',
              internal_notes: treatment.internal_notes || '-',
              customer_contact: treatment.customer_contact || '-'
            }
          };
        }

        // Se não tem tratativa, usar dados originais
        const priority = this.calculatePriorityLevel(order.dias_atraso);
        return {
          ...order,
          data_pedido: dataPedido,
          data_prevista: dataPrevista,
          status_atraso: 'ATRASADO',
          treatment_status: 'pending',
          delivery_status: order.status_transportadora || 'pending',
          priority_level: priority,
          cliente_json: order.cliente_json,
          carrier_info: {
            name: carrierInfo.name,
            protocol: order.codigo_rastreamento || '-',
            tracking_url: order.url_rastreamento || '-',
            shipping_type: carrierInfo.shipping,
            last_update: order.ultima_atualizacao_status 
              ? formatDate(order.ultima_atualizacao_status)
              : '-'
          },
          treatment_info: {
            observations: '-',
            internal_notes: '-',
            customer_contact: '-'
          }
        };
      });
      
      // Ordenar por prioridade e dias de atraso
      result.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = (priorityOrder[b.priority_level] || 0) - (priorityOrder[a.priority_level] || 0);
        return priorityDiff !== 0 ? priorityDiff : b.dias_atraso - a.dias_atraso;
      });
      
      // Aplicar filtros adicionais em memória
      let filteredResult = result;

      if (filters.status) {
        filteredResult = filteredResult.filter(order => 
          order.treatment_status === filters.status
        );
      }

      if (filters.priority) {
        const priorityMap = {
          '1': 'low',
          '2': 'medium',
          '3': 'medium',
          '4': 'high',
          '5': 'critical'
        };
        filteredResult = filteredResult.filter(order => 
          order.priority_level === priorityMap[filters.priority as keyof typeof priorityMap]
        );
      }

      // Salvar no cache após aplicar os filtros
      await cacheWrapper.set(cacheKey, JSON.stringify(filteredResult), this.CACHE_TTL.delayedOrders);
      
      this.logQueryMetrics('getDelayedOrders', {
        duration,
        rowCount: filteredResult.length,
        cacheHit: false,
        timestamp: new Date().toISOString()
      });

      return filteredResult;
    } catch (error) {
      console.error('Erro ao buscar pedidos atrasados:', error);
      return [];
    }
  }

  private calculatePriorityLevel(diasAtraso: number): 'low' | 'medium' | 'high' | 'critical' {
    if (diasAtraso <= 3) return 'low';
    if (diasAtraso <= 7) return 'medium';
    if (diasAtraso <= 15) return 'high';
    return 'critical';
  }

  private normalizePriorityLevel(priority: number | string | null, diasAtraso: number): 'low' | 'medium' | 'high' | 'critical' {
    if (!priority) return this.calculatePriorityLevel(diasAtraso);

    // Se for número, converter para string
    if (typeof priority === 'number') {
      if (priority <= 1) return 'low';
      if (priority <= 2) return 'medium';
      if (priority <= 3) return 'high';
      return 'critical';
    }

    // Se for string, normalizar
    const normalizedPriority = priority.toLowerCase();
    if (['low', 'medium', 'high', 'critical'].includes(normalizedPriority)) {
      return normalizedPriority as 'low' | 'medium' | 'high' | 'critical';
    }

    return this.calculatePriorityLevel(diasAtraso);
  }
}

export const alertsService = new AlertsService(); 