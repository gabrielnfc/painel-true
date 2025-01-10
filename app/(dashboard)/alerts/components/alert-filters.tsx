'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal } from 'lucide-react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function AlertFilters() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isOpen, setIsOpen] = useState(false);
	const [carriers, setCarriers] = useState<string[]>([]);

	// Estado local para os filtros
	const [filters, setFilters] = useState({
		search: searchParams.get('search') || '',
		status: searchParams.get('status') || '',
		priority: searchParams.get('priority') || '',
		dateFrom: searchParams.get('dateFrom') || '',
		dateTo: searchParams.get('dateTo') || '',
		carrier: searchParams.get('carrier') || '',
	});

	// Buscar transportadoras ao montar o componente
	useEffect(() => {
		const fetchCarriers = async () => {
			try {
				const response = await fetch('/api/carriers');
				if (!response.ok) throw new Error('Falha ao carregar transportadoras');
				const data = await response.json();
				setCarriers(data);
			} catch (error) {
				console.error('Erro ao carregar transportadoras:', error);
			}
		};

		fetchCarriers();
	}, []);

	// Aplicar filtros
	const applyFilters = () => {
		const params = new URLSearchParams();
		Object.entries(filters).forEach(([key, value]) => {
			if (value) params.append(key, value);
		});
		router.push(`/alerts?${params.toString()}`);
		setIsOpen(false);
	};

	// Limpar filtros
	const clearFilters = () => {
		setFilters({
			search: '',
			status: '',
			priority: '',
			dateFrom: '',
			dateTo: '',
			carrier: '',
		});
		router.push('/alerts');
		setIsOpen(false);
	};

	return (
		<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div className="flex flex-1 items-center space-x-2">
				<div className="relative flex-1">
					<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Buscar por número do pedido, cliente..."
						className="pl-8"
						value={filters.search}
						onChange={(e) =>
							setFilters((prev) => ({ ...prev, search: e.target.value }))
						}
					/>
				</div>
				<Sheet open={isOpen} onOpenChange={setIsOpen}>
					<SheetTrigger asChild>
						<Button variant="outline" size="icon">
							<SlidersHorizontal className="h-4 w-4" />
						</Button>
					</SheetTrigger>
					<SheetContent>
						<SheetHeader>
							<SheetTitle>Filtros</SheetTitle>
							<SheetDescription>
								Refine sua busca com filtros específicos
							</SheetDescription>
						</SheetHeader>
						<div className="mt-6 space-y-6">
							<div className="space-y-2">
								<Label>Status do Tratamento</Label>
								<Select
									value={filters.status}
									onValueChange={(value) =>
										setFilters((prev) => ({ ...prev, status: value }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Selecione um status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="pending">Pendente</SelectItem>
										<SelectItem value="in_progress">Em Andamento</SelectItem>
										<SelectItem value="resolved">Resolvido</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>Nível de Prioridade</Label>
								<Select
									value={filters.priority}
									onValueChange={(value) =>
										setFilters((prev) => ({ ...prev, priority: value }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Selecione a prioridade" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="1">Baixa</SelectItem>
										<SelectItem value="2">Média-Baixa</SelectItem>
										<SelectItem value="3">Média</SelectItem>
										<SelectItem value="4">Média-Alta</SelectItem>
										<SelectItem value="5">Alta</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>Data Prevista</Label>
								<div className="flex items-center space-x-2">
									<Input
										type="date"
										value={filters.dateFrom}
										onChange={(e) =>
											setFilters((prev) => ({
												...prev,
												dateFrom: e.target.value,
											}))
										}
									/>
									<span>até</span>
									<Input
										type="date"
										value={filters.dateTo}
										onChange={(e) =>
											setFilters((prev) => ({
												...prev,
												dateTo: e.target.value,
											}))
										}
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label>Transportadora</Label>
								<Select
									value={filters.carrier}
									onValueChange={(value) =>
										setFilters((prev) => ({ ...prev, carrier: value }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Selecione a transportadora" />
									</SelectTrigger>
									<SelectContent>
										{carriers.map((carrier) => (
											<SelectItem key={carrier} value={carrier.toLowerCase()}>
												{carrier}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="flex justify-end space-x-2">
								<Button variant="outline" onClick={clearFilters}>
									Limpar
								</Button>
								<Button onClick={applyFilters}>Aplicar Filtros</Button>
							</div>
						</div>
					</SheetContent>
				</Sheet>
			</div>
		</div>
	);
}
