"use client";

import { useState } from 'react';
import { OrderSearchResult } from '@/lib/types/order';
import { OrderService } from '@/lib/services/order-service';

interface UseOrderSearchReturn {
  results: OrderSearchResult[] | null;
  isLoading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
}

export function useOrderSearch(): UseOrderSearchReturn {
  const [results, setResults] = useState<OrderSearchResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await OrderService.searchOrders({ q: query });
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  return { results, isLoading, error, search };
}