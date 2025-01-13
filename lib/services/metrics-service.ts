import db from '../db';
import { bigquery } from '../config/bigquery';
import { cacheWrapper } from '../redis';
import { alertsService } from './alerts-service';
import { BigQueryOrder } from '../types/bigquery';

const DEFAULT_METRICS = {
  totalAlerts: 0,
  avgDelayDays: 0,
  avgResolutionTime: 'N/A',
  resolvedOrders: {
    last30Days: 0,
    last7Days: 0
  }
};

export class MetricsService {
  private readonly CACHE_TTL = 300; // 5 minutos para métricas

  async getAlertMetrics() {
    try {
      // Tentar obter do cache
      const cacheKey = 'metrics:alerts:dashboard';
      const cachedData = await cacheWrapper.get(cacheKey);
      
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      // Buscar total real de alertas e média de atraso
      const [rows] = await bigquery.query({
        query: `
          SELECT 
            COUNT(*) as total_alerts,
            AVG(dias_atraso) as avg_delay_days
          FROM \`truebrands-warehouse.truebrands_warehouse.pedidos_atrasados_cache\`
          WHERE 
            dias_atraso > 0
            AND situacao_pedido NOT IN ('Entregue', 'Cancelado', 'Em digitação')
            AND UPPER(situacao_pedido) != 'ENTREGUE'
            AND (status_transportadora IS NULL OR UPPER(status_transportadora) NOT IN ('ENTREGUE', 'DELIVERED', 'OBJETO ENTREGUE AO DESTINATÁRIO'))
            AND (
              transportador_json_status IS NULL
              OR (
                LOWER(JSON_EXTRACT_SCALAR(transportador_json_status, '$.nome')) NOT IN ('retirada funcionário', 'retirada de funcionário')
                AND LOWER(JSON_EXTRACT_SCALAR(transportador_json_status, '$.formaEnvio.nome')) NOT IN ('retirada de funcionario', 'retirada funcionario')
              )
            )
        `
      });

      // Buscar métricas de tratativas em uma única query
      const treatmentMetrics = await this.getTreatmentMetrics().catch(() => ({
        avgResolutionTime: 'N/A',
        resolvedLast30Days: 0,
        resolvedLast7Days: 0
      }));

      const metrics = {
        totalAlerts: Number(rows[0]?.total_alerts || 0),
        avgDelayDays: Number((rows[0]?.avg_delay_days || 0).toFixed(1)),
        avgResolutionTime: treatmentMetrics.avgResolutionTime,
        resolvedOrders: {
          last30Days: treatmentMetrics.resolvedLast30Days,
          last7Days: treatmentMetrics.resolvedLast7Days
        }
      };

      // Salvar no cache
      await cacheWrapper.set(cacheKey, JSON.stringify(metrics), this.CACHE_TTL);

      return metrics;
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      return DEFAULT_METRICS;
    }
  }

  private async getTreatmentMetrics() {
    const result = await db.query(
      `
        WITH resolution_metrics AS (
          SELECT
            t.order_id,
            th.treatment_status,
            th.created_at,
            FIRST_VALUE(th.created_at) OVER (
              PARTITION BY t.order_id 
              ORDER BY th.created_at
            ) as first_treatment,
            FIRST_VALUE(th.created_at) OVER (
              PARTITION BY t.order_id 
              ORDER BY th.created_at DESC
            ) as last_treatment,
            ROW_NUMBER() OVER (
              PARTITION BY t.order_id 
              ORDER BY th.created_at DESC
            ) as rn
          FROM treatments t
          JOIN treatment_history th ON th.treatment_id = t.id
          WHERE th.created_at >= CURRENT_DATE - INTERVAL '30 days'
        ),
        resolution_times AS (
          SELECT
            order_id,
            EXTRACT(EPOCH FROM (last_treatment - first_treatment))/3600 as hours_to_resolve
          FROM resolution_metrics
          WHERE rn = 1 
          AND treatment_status = 'resolved'
        ),
        resolved_counts AS (
          SELECT
            COUNT(DISTINCT CASE 
              WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' 
              AND treatment_status = 'resolved' 
              THEN order_id 
            END) as resolved_30d,
            COUNT(DISTINCT CASE 
              WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' 
              AND treatment_status = 'resolved' 
              THEN order_id 
            END) as resolved_7d
          FROM resolution_metrics
          WHERE rn = 1
        )
        SELECT
          COALESCE(ROUND(AVG(rt.hours_to_resolve)::numeric, 1), 0) as avg_resolution_hours,
          rc.resolved_30d,
          rc.resolved_7d
        FROM resolved_counts rc
        LEFT JOIN resolution_times rt ON true
        GROUP BY rc.resolved_30d, rc.resolved_7d
      `
    );

    const metrics = result.rows[0] || { avg_resolution_hours: 0, resolved_30d: 0, resolved_7d: 0 };
    return {
      avgResolutionTime: metrics.avg_resolution_hours > 0 ? `${metrics.avg_resolution_hours}h` : 'N/A',
      resolvedLast30Days: metrics.resolved_30d || 0,
      resolvedLast7Days: metrics.resolved_7d || 0
    };
  }
}

export const metricsService = new MetricsService(); 