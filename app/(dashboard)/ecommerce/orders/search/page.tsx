'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';

export default function SearchOrdersPage() {
	const [searchQuery, setSearchQuery] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!searchQuery.trim()) {
			toast({
				title: 'Erro',
				description: 'Digite um termo para buscar',
				variant: 'destructive',
			});
			return;
		}

		setIsLoading(true);

		// Preservar o valor original da busca
		const searchValue = searchQuery.trim();
		console.log('Valor de busca:', searchValue);

		// Construir a URL com os parâmetros de busca
		const params = new URLSearchParams({
			q: searchValue,
			page: '1',
			pageSize: '10',
			sortKey: 'data_pedido_status',
			sortOrder: 'desc',
		});

		router.push(`/ecommerce/orders/results?${params.toString()}`);
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="max-w-2xl mx-auto space-y-8">
				<div className="text-center space-y-4">
					<h1 className="text-4xl font-bold">Busca de Pedidos</h1>
					<p className="text-muted-foreground">Pesquise por pedidos usando:</p>
					<ul className="text-sm text-muted-foreground space-y-1">
						<li>• ID do pedido</li>
						<li>• Número do pedido</li>
						<li>• ID da nota fiscal</li>
						<li>• Número da ordem de compra</li>
					</ul>
				</div>

				<form onSubmit={handleSearch} className="flex gap-2 items-center">
					<Input
						type="search"
						placeholder="Digite o número do pedido, nota fiscal ou ordem de compra..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="flex-1"
					/>
					<Button type="submit" disabled={isLoading}>
						{isLoading ? (
							<Spinner className="h-4 w-4 mr-2" />
						) : (
							<Search className="h-4 w-4 mr-2" />
						)}
						Buscar
					</Button>
				</form>
			</div>
		</div>
	);
}
