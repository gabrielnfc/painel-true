export interface AlertOrder {
  id_pedido: string;
  numero_pedido: string;
  data_pedido: string;
  data_prevista: string;
  cliente_json: string;
  total_pedido: string;
  statusTransportadora: string | null;
  data_pedido_formatada: string;
  data_prevista_formatada: string;
  dias_atraso: number;
  status_atraso: string;
  nivel_prioridade: number;
  status?: 'pending' | 'in_progress' | 'resolved';
  numero_nota?: string;
  codigo_rastreamento?: string;
  carrier_info: {
    name: string;
    shipping: string;
    protocol: string;
    last_update: string;
    tracking_url: string;
  };
  treatment_status?: 'pending' | 'in_progress' | 'resolved';
}

export interface AlertsResponse {
  data: AlertOrder[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
} 