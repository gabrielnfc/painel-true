export interface AlertOrder {
  id_pedido: string;
  numero_pedido: string;
  numero_nota?: string;
  numero_ordem_compra?: string;
  id_nota_fiscal?: string;
  treatment_status: 'pending' | 'in_progress' | 'resolved';
  data_pedido: string;
  data_prevista: string;
  data_prevista_normalizada?: string;
  dias_atraso: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  carrier_info: {
    name: string;
    protocol: string;
    tracking_url: string;
    shipping_type: string;
    last_update: string;
  };
  cliente: {
    nome: string;
    email: string;
    telefone: string;
    cpf_cnpj?: string;
    cpf?: string;
    cnpj?: string;
  };
  cliente_json?: string;
  valor_total: number;
  total_pedido: number;
  url_rastreamento?: string;
  ultima_atualizacao_status?: string;
  transportador_json_status?: string;
  codigo_rastreamento?: string;
  situacao_pedido?: string;
  status_transportadora?: string;
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