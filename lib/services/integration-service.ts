import { BigQueryService } from '../config/bigquery';
import { TreatmentService } from './treatment-service';
import { calculateDaysDelayed } from '../utils/date-utils';
import { Treatment, TreatmentWithOrder, CreateTreatmentDTO } from '../types/treatment';

export class IntegrationService {
  private bigQueryService: BigQueryService;
  private treatmentService: TreatmentService;

  constructor() {
    this.bigQueryService = new BigQueryService();
    this.treatmentService = new TreatmentService();
  }

  async getDelayedOrdersWithTreatments(): Promise<TreatmentWithOrder[]> {
    try {
      // Buscar pedidos atrasados do BigQuery
      const delayedOrders = await this.treatmentService.getDelayedOrdersWithTreatments();

      // Calcular prioridade para pedidos sem tratamento
      const ordersWithPriority = await Promise.all(
        delayedOrders.map(async (order) => {
          if (!order.priority_level) {
            const daysDelayed = calculateDaysDelayed(order.order_details.data_prevista);
            const priority = await this.treatmentService.calculatePriorityLevel(daysDelayed);
            return {
              ...order,
              priority_level: priority
            };
          }
          return order;
        })
      );

      return ordersWithPriority;
    } catch (error) {
      console.error('Error fetching delayed orders with treatments:', error);
      throw error;
    }
  }

  async syncOrderTreatment(orderId: string): Promise<Treatment | null> {
    try {
      // Verificar se já existe tratamento
      const existingTreatment = await this.treatmentService.getTreatmentByOrderId(orderId);
      
      if (!existingTreatment) {
        // Buscar detalhes do pedido no BigQuery
        const orderDetails = await this.bigQueryService.searchOrder(orderId);
        
        if (orderDetails) {
          const daysDelayed = calculateDaysDelayed(orderDetails.data_prevista);
          const priority = await this.treatmentService.calculatePriorityLevel(daysDelayed);

          // Criar novo tratamento com prioridade calculada
          const newTreatment = await this.treatmentService.createTreatment({
            order_id: orderId,
            order_number: orderDetails.numero_pedido,
            observations: 'Tratamento automático iniciado',
            internal_notes: 'Criado automaticamente pelo sistema',
            customer_contact: '',
            carrier_protocol: '',
            new_delivery_deadline: new Date(orderDetails.data_prevista),
            resolution_deadline: new Date(),
            follow_up_date: new Date(),
            delivery_status: 'delayed',
            treatment_status: 'pending',
            priority_level: priority,
            action_taken: '',
            resolution_type: 'other',
            complaint_reason: 'delayed_order',
            identified_problem: 'carrier_hold'
          });

          return newTreatment;
        }
      }

      return existingTreatment;
    } catch (error) {
      console.error('Error syncing order treatment:', error);
      throw error;
    }
  }

  async updateOrderTreatmentPriority(orderId: string): Promise<Treatment | null> {
    try {
      const treatment = await this.treatmentService.getTreatmentByOrderId(orderId);
      
      if (treatment) {
        const orderDetails = await this.bigQueryService.searchOrder(orderId);
        
        if (orderDetails) {
          const daysDelayed = calculateDaysDelayed(orderDetails.data_prevista);
          const newPriority = await this.treatmentService.calculatePriorityLevel(daysDelayed);

          if (newPriority !== treatment.priority_level) {
            const updatedTreatment = await this.treatmentService.updateTreatment(
              treatment.id,
              { priority_level: newPriority },
              'system',
              'Sistema'
            );
            return updatedTreatment;
          }
        }
      }

      return treatment;
    } catch (error) {
      console.error('Error updating order treatment priority:', error);
      throw error;
    }
  }
} 