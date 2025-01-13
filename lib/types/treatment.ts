export type DeliveryStatus = 
  | 'pending' // Pendente
  | 'in_transit' // Em trânsito
  | 'delayed' // Atrasado
  | 'lost' // Extraviado
  | 'returned' // Devolvido
  | 'delivered' // Entregue
  | 'waiting_collection' // Aguardando Coleta
  | 'with_carrier' // Com transportadora
  | 'delivery_attempt' // Tentativa de entrega
  | 'address_not_found'; // Endereço não encontrado

export type TreatmentStatus = 
  | 'pending' // Pendente
  | 'waiting_customer' // Aguardando cliente
  | 'waiting_carrier' // Aguardando transportadora
  | 'waiting_stock' // Aguardando estoque
  | 'waiting_service' // Aguardando atendimento
  | 'waiting_logistics' // Aguardando logística
  | 'waiting_delivery' // Aguardando entrega
  | 'waiting_financial' // Aguardando financeiro
  | 'rerouting' // Redirecionando
  | 'resolved' // Resolvido
  | 'cancelled'; // Cancelado

export type ComplaintReason =
  | 'subscription_change' // Alteração de assinatura
  | 'address_change' // Alteração de endereço
  | 'order_change' // Alteração do pedido
  | 'antifraud' // Antifraude
  | 'external_damage_dent' // Avaria externa - Amassado
  | 'external_damage_seal' // Avaria externa - Lacre
  | 'external_damage_batch' // Avaria externa - Lote/Validade
  | 'external_damage_leak' // Avaria externa - Vazamento
  | 'internal_damage_aroma' // Avaria interna - Aglomerado de aromas
  | 'internal_damage_smell' // Avaria interna - Cheiro
  | 'internal_damage_foreign' // Avaria interna - Corpo estranho
  | 'internal_damage_melting' // Avaria interna - Derretimento
  | 'internal_damage_hardening' // Avaria interna - Empedramento
  | 'internal_damage_flavor' // Avaria interna - Sabor
  | 'internal_damage_texture' // Avaria interna - Textura
  | 'internal_damage_missing' // Avaria interna - Quantidade faltante
  | 'internal_damage_reaction' // Avaria interna - Reações adversas
  | 'missing_gift' // Brinde não recebido
  | 'wrong_freight_charge' // Cobrança de frete indevido
  | 'wrong_charge' // Cobrança indevida
  | 'discount_not_applied' // Desconto não aplicado
  | 'subscription_cancellation' // Desistência - Assinatura
  | 'order_cancellation' // Desistência - Não quer mais
  | 'problem_cancellation' // Desistência - Problemas com o pedido
  | 'missing_scoop' // Falta Scoop
  | 'delivery_not_recognized' // Não recohecimento da entrega
  | 'duplicate_order' // Pedido duplicado
  | 'delayed_order' // Pedido em atraso
  | 'wrong_address_delivery' // Pedido entregue no endereço incorreto
  | 'incomplete_order' // Pedido incompleto
  | 'undelivered_order' // Pedido não entregue
  | 'long_delivery_time' // Prazo longo de entrega
  | 'inquiry' // Solicitação/Dúvida
  | 'tracking_not_updated' // Status da entrega sem atualização
  | 'missing_tracking' // Sem informação de rastreio
  | 'order_not_sent' // Pedido consta como não enviado
  | 'true_points_redemption' // True Points - Problema de resgate
  | 'cashback_usage' // Utilização cashback
  | 'cashback_inquiry' // Consulta cashback
  | 'wrong_order' // Pedido trocado/incorreto
  | 'coupon_error' // Cupom com erro/não aplicado
  | 'not_applicable'; // Não se aplica

export type IdentifiedProblem =
  // Problemas com Brindes
  | 'gift_not_sent' // Brinde não enviado
  | 'gift_out_of_stock' // Brinde sem estoque
  
  // Problemas de Entrega
  | 'customer_absent' // Cliente ausente
  | 'customer_unknown' // Cliente desconhecido
  | 'wrong_address' // Endereço errado
  | 'inaccessible_region' // Região inacessível
  | 'delivery_not_recognized' // Não reconhecimento da entrega
  | 'undelivered_order' // Pedido não entregue
  | 'delivery_suspended' // Suspensão de entrega
  | 'awaiting_pickup' // Pedido aguardando retirada
  | 'unclaimed_order' // Objeto não retirado
  
  // Problemas com Pedido
  | 'duplicate_order' // Pedido duplicado
  | 'lost_order' // Pedido extraviado
  | 'incomplete_order' // Pedido incompleto
  | 'wrong_order' // Pedido incorreto
  | 'internal_hold' // Pedido parado (Interno)
  | 'carrier_hold' // Pedido parado (Transportadora)
  | 'tax_hold' // Pedido retido imposto
  | 'no_tracking' // Pedido sem rastreio
  
  // Problemas com Produto
  | 'internal_damage' // Produto avariado - Interno
  | 'external_damage' // Produto avariado - Externo
  | 'out_of_stock' // Produto sem estoque
  | 'expired_product' // Produto - Validade expirada
  | 'damaged_package' // Volume avariado
  | 'wrong_label' // Troca de etiqueta
  
  // Problemas de Sistema
  | 'integration_error' // Erro de integração
  | 'website_failure' // Falha no site
  | 'manual_billing' // Faturamento manual
  
  // Problemas Financeiros
  | 'wrong_charge' // Cobrança indevida
  | 'wrong_freight_charge' // Cobrança de frete indevido
  | 'discount_not_applied' // Desconto não aplicado
  | 'chargeback' // Chargeback
  
  // Desistências
  | 'subscription_cancellation' // Desistência - Assinatura
  | 'customer_gave_up' // Desistência - Não quer mais
  | 'order_issues' // Desistência - Problemas com o pedido
  | 'wrong_purchase' // Desistência - Comprado errado
  | 'delivery_issues' // Desistência - Problemas com entrega
  
  // Devoluções
  | 'return_damaged' // Em devolução - Avaria do volume
  | 'return_refused' // Em devolução - Recusa do cliente
  | 'return_wrong_address' // Em devolução - Endereço errado
  | 'return_unspecified'; // Em devolução - Sem especificação

export interface Treatment {
  id: number;
  order_id: string;
  order_number: string;
  observations: string;
  internal_notes: string; // Notas internas da equipe
  customer_contact: string; // Registro de contato com cliente
  carrier_protocol: string; // Protocolo da transportadora
  new_delivery_deadline: Date;
  resolution_deadline: Date;
  follow_up_date: Date; // Data para acompanhamento
  delivery_status: DeliveryStatus;
  treatment_status: TreatmentStatus;
  priority_level: number;
  action_taken: string; // Ação tomada para resolver
  complaint_reason: ComplaintReason; // Novo campo
  resolution_type: 
    | 'redelivery' // Reentrega/Reenvio
    | 'refund' // Reembolso/Estorno
    | 'freight_refund' // Estorno de frete
    | 'replacement' // Substituição
    | 'address_update' // Atualização de endereço
    | 'collection' // Coleta
    | 'shipping' // Envio
    | 'sale' // Venda
    | 'contact_customer' // Contatar Cliente
    | 'posting' // Postagem
    | 'confrontation' // Acareação
    | 'dispute' // Contestação
    | 'check_delivery_status' // Verificar status da entrega
    | 'cancellation' // Cancelamento
    | 'return' // Devolução
    | 'delivery_suspension' // Suspensão de entrega
    | 'gift_sending' // Envio de brinde
    | 'other'; // Outro
  created_at: Date;
  updated_at: Date;
  identified_problem: IdentifiedProblem;
}

export interface CreateTreatmentDTO {
  order_id: string;
  order_number: string;
  observations: string;
  internal_notes?: string;
  customer_contact?: string;
  carrier_protocol?: string;
  new_delivery_deadline: Date;
  resolution_deadline: Date;
  follow_up_date?: Date;
  delivery_status: DeliveryStatus;
  treatment_status: TreatmentStatus;
  priority_level: number;
  action_taken?: string;
  complaint_reason: ComplaintReason;
  resolution_type?: 
    | 'redelivery'
    | 'refund'
    | 'freight_refund'
    | 'replacement'
    | 'address_update'
    | 'collection'
    | 'shipping'
    | 'sale'
    | 'contact_customer'
    | 'posting'
    | 'confrontation'
    | 'dispute'
    | 'check_delivery_status'
    | 'cancellation'
    | 'return'
    | 'delivery_suspension'
    | 'gift_sending'
    | 'other';
  identified_problem?: IdentifiedProblem;
  userId?: string;
  userName?: string;
}

export interface UpdateTreatmentDTO {
  observations?: string;
  internal_notes?: string;
  customer_contact?: string;
  carrier_protocol?: string;
  new_delivery_deadline?: Date;
  resolution_deadline?: Date;
  follow_up_date?: Date;
  delivery_status?: DeliveryStatus;
  treatment_status?: TreatmentStatus;
  priority_level?: number;
  action_taken?: string;
  complaint_reason?: ComplaintReason;
  resolution_type?: 
    | 'redelivery'
    | 'refund'
    | 'freight_refund'
    | 'replacement'
    | 'address_update'
    | 'collection'
    | 'shipping'
    | 'sale'
    | 'contact_customer'
    | 'posting'
    | 'confrontation'
    | 'dispute'
    | 'check_delivery_status'
    | 'cancellation'
    | 'return'
    | 'delivery_suspension'
    | 'gift_sending'
    | 'other';
  identified_problem?: IdentifiedProblem;
}

export interface TreatmentWithOrder extends Treatment {
  order_details: {
    numero_pedido: string;
    data_pedido: string;
    data_prevista: string;
    situacao_pedido: string;
    cliente_json: string;
    total_pedido: string;
  };
}

export interface TreatmentHistory {
  id: number;
  treatment_id: number;
  user_id: string;
  user_name: string;
  observations?: string;
  internal_notes?: string;
  customer_contact?: string;
  carrier_protocol?: string;
  new_delivery_deadline?: Date;
  resolution_deadline?: Date;
  follow_up_date?: Date;
  delivery_status?: DeliveryStatus;
  treatment_status?: TreatmentStatus;
  priority_level?: number;
  action_taken?: string;
  complaint_reason?: ComplaintReason;
  resolution_type?: 
    | 'redelivery'
    | 'refund'
    | 'freight_refund'
    | 'replacement'
    | 'address_update'
    | 'collection'
    | 'shipping'
    | 'sale'
    | 'contact_customer'
    | 'posting'
    | 'confrontation'
    | 'dispute'
    | 'check_delivery_status'
    | 'cancellation'
    | 'return'
    | 'delivery_suspension'
    | 'gift_sending'
    | 'other';
  created_at: Date;
} 