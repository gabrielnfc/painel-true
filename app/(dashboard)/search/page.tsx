'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { InfoItem } from '../../../components/ui/info-item';

interface SearchResult {
	id_pedido: string;
	numero_pedido: string;
	total_pedido: number;
	situacao_pedido: string;
	data_pedido_status: string;
	cliente_json: string;
	itens_pedido: string;
}

export default function SearchResultsPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const query = searchParams.get('q');
	const [results, setResults] = useState<SearchResult[] | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchResults = async () => {
			if (!query) {
				router.push('/');
				return;
			}

			try {
				setIsLoading(true);
				setError(null);

				const response = await fetch(
					`/api/orders/search?q=${encodeURIComponent(query)}`
				);
				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error || 'Failed to fetch results');
				}

				setResults(data.results);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'An error occurred');
			} finally {
				setIsLoading(false);
			}
		};

		fetchResults();
	}, [query, router]);

	return (
		<div className="container mx-auto p-4">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">Resultados da Busca</h1>
				<Button
					variant="outline"
					onClick={() => router.push('/')}
					className="gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					Voltar para Busca
				</Button>
			</div>

			{isLoading ? (
				<Card className="p-4">
					<div className="space-y-2">
						<Skeleton className="h-4 w-1/4" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				</Card>
			) : error ? (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : !results || results.length === 0 ? (
				<Alert>
					<AlertDescription>
						Nenhum resultado encontrado para sua busca.
					</AlertDescription>
				</Alert>
			) : (
				<Card>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Número do Pedido</TableHead>
								<TableHead>Cliente</TableHead>
								<TableHead>Data</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">Total</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{results.map((order) => {
								const cliente = JSON.parse(order.cliente_json || '{}');
								return (
									<TableRow key={order.id_pedido}>
										<TableCell className="font-medium">
											<InfoItem label="ID Pedido" value={order.id_pedido} isOrderId={true} />
										</TableCell>
										<TableCell>{cliente.nome || 'N/A'}</TableCell>
										<TableCell>
											{formatDate(order.data_pedido_status)}
										</TableCell>
										<TableCell>{order.situacao_pedido}</TableCell>
										<TableCell className="text-right">
											{new Intl.NumberFormat('pt-BR', {
												style: 'currency',
												currency: 'BRL',
											}).format(order.total_pedido)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</Card>
			)}
		</div>
	);
}
