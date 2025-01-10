export interface BigQueryOrder {
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
  numero_ordem_compra?: string;
  data_expedicao?: string;
  situacao_pedido?: string;
  status_atual?: string;
  nome_transportador?: string;
  codigo_rastreamento?: string;
  numero_nota?: string;
  chave_acesso_nota?: string;
  obs_interna?: string;
  vtex_data_prevista?: string;
  transportador_json_status?: string;
  carrier_info?: {
    name: string;
    protocol: string;
    tracking_url: string;
    shipping_type: string;
    last_update: string;
  };
  treatment_info?: {
    observations: string;
    internal_notes: string;
    customer_contact: string;
  };
}

export interface BigQueryResponse<T> {
  data: T[];
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
} 