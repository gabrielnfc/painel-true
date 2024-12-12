export interface OrderSearchResult {
  id_pedido: string;
  numero_pedido: string;
  total_pedido: number;
  situacao_pedido: string;
  data_pedido_status: string;
  cliente_json: string;
  itens_pedido: string;
  [key: string]: any;
}

export interface OrderSearchResponse {
  results: OrderSearchResult[];
}

export interface SearchParams {
  q: string;
  page?: number;
  pageSize?: number;
}