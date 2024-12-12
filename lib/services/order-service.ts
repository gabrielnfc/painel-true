import { SearchParams } from '@/lib/types/order';

const BASE_URL = '/api/orders';

export class OrderService {
  static async searchOrders({ q, page = 1, pageSize = 10 }: SearchParams) {
    const params = new URLSearchParams({
      q,
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    const response = await fetch(`${BASE_URL}/search?${params}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to search orders');
    }

    return response.json();
  }
}