import { bigquery } from '../config/bigquery';
import { BigQueryOrder } from '../types/bigquery';
import db from '../db';
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
      cacheRatio: metrics.cacheHit ? 1 : 0,
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

      const carriers = result
        .map((row: any) => row.carrier_name)
        .filter((name: string) => name && name !== 'Não definida');

      await cacheWrapper.set(cacheKey, JSON.stringify(carriers), this.CACHE_TTL.carriers);

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
        return JSON.parse(cachedData);
      }

      const startTime = Date.now();

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

      const treatments = await db.query(treatmentsQuery);
      
      // Criar dois mapas para busca por order_id e order_number
      const treatmentsByOrderId = new Map(treatments.rows.map(t => [t.order_id, t]));
      const treatmentsByOrderNumber = new Map(treatments.rows.map(t => [t.order_number, t]));

      // Processar e formatar os pedidos
      const processedOrders = delayedOrders.map((order: any) => {
        const diasAtraso = parseInt(order.dias_atraso) || 0;
        const priority = this.calculatePriorityLevel(diasAtraso);
        const treatment = treatmentsByOrderId.get(order.id_pedido) || treatmentsByOrderNumber.get(order.numero_pedido);
        const carrierInfo = this.extractCarrierInfo(order.transportador_json_status);

        return {
          ...order,
          priority,
          treatment_status: treatment?.treatment_status || 'pending',
          carrier_info: {
            name: carrierInfo.name,
            protocol: treatment?.carrier_protocol || order.codigo_rastreamento || '-',
            tracking_url: order.url_rastreamento || '-',
            shipping_type: carrierInfo.shipping,
            last_update: order.ultima_atualizacao_status 
              ? new Date(order.ultima_atualizacao_status).toLocaleDateString('pt-BR')
              : '-'
          }
        };
      });

      await cacheWrapper.set(cacheKey, JSON.stringify(processedOrders), this.CACHE_TTL.delayedOrders);

      this.logQueryMetrics('getDelayedOrders', {
        duration: Date.now() - startTime,
        rowCount: processedOrders.length,
        cacheHit: false,
        timestamp: new Date().toISOString()
      });

      return processedOrders;
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

  async getAlerts({ page, limit, type, status }: { page: number; limit: number; type?: string; status?: string }) {
    try {
      const delayedOrders = await this.getDelayedOrders();
      
      // Aplicar filtros
      let filteredOrders = delayedOrders;
      if (type) {
        filteredOrders = filteredOrders.filter(order => order.situacao_pedido === type);
      }
      if (status) {
        filteredOrders = filteredOrders.filter(order => order.treatment_status === status);
      }

      // Calcular paginação
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

      return {
        data: paginatedOrders,
        pagination: {
          total: filteredOrders.length,
          page,
          pageSize: limit,
          totalPages: Math.ceil(filteredOrders.length / limit)
        }
      };
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      throw error;
    }
  }
}

export const alertsService = new AlertsService();
export const getAlerts = (params: { page: number; limit: number; type?: string; status?: string }) => 
  alertsService.getAlerts(params); 