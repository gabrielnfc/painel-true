'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

export function SearchTreatment() {
	const router = useRouter();
	const [orderNumber, setOrderNumber] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!orderNumber.trim()) {
			toast.error('Digite um número de pedido');
			return;
		}

		setLoading(true);

		try {
			// Verifica se o pedido existe
			const response = await fetch('/api/treatments/search', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ orderNumber: orderNumber.trim() }),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Erro ao buscar pedido');
			}

			// Redireciona para a página de detalhes do tratamento
			router.push(`/ecommerce/treatments/${orderNumber.trim()}`);
		} catch (error) {
			console.error('Error searching order:', error);
			toast.error(
				error instanceof Error ? error.message : 'Erro ao buscar pedido'
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="w-full max-w-lg space-y-4">
			<div className="flex flex-col items-center gap-2 text-center">
				<Search className="h-12 w-12 text-muted-foreground" />
				<h2 className="text-2xl font-semibold tracking-tight">Buscar Pedido</h2>
				<p className="text-sm text-muted-foreground">
					Digite o número do pedido para visualizar ou criar um tratamento
				</p>
			</div>

			<form onSubmit={handleSearch} className="flex gap-2">
				<Input
					type="text"
					placeholder="Digite o número do pedido..."
					value={orderNumber}
					onChange={(e) => setOrderNumber(e.target.value)}
					className="flex-1"
				/>
				<Button type="submit" disabled={loading}>
					{loading ? 'Buscando...' : 'Buscar'}
				</Button>
			</form>
		</div>
	);
}
