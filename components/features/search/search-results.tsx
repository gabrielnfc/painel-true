"use client";

import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDate } from '@/lib/utils';

interface SearchResultsProps {
  results: any[] | null;
  isLoading: boolean;
  error: string | null;
}

export function SearchResults({ results, isLoading, error }: SearchResultsProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!results) {
    return null;
  }

  if (results.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">No results found</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Order Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((order) => (
            <TableRow key={order.id_pedido}>
              <TableCell>{order.id_pedido}</TableCell>
              <TableCell>{order.numero_pedido}</TableCell>
              <TableCell>{order.situacao_pedido}</TableCell>
              <TableCell>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(order.total_pedido)}
              </TableCell>
              <TableCell>
                {order.data_pedido_status ? formatDate(order.data_pedido_status) : 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}