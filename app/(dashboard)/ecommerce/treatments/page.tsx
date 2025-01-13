import { Metadata } from 'next';
import { SearchTreatment } from './components/search-treatment';

export const metadata: Metadata = {
	title: 'Tratamentos | Painel True',
	description: 'Busque e gerencie tratamentos de pedidos atrasados',
};

export default function TreatmentsPage() {
	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl font-bold tracking-tight">Tratamentos</h1>
				<p className="text-muted-foreground">
					Busque um pedido para visualizar ou criar um tratamento.
				</p>
			</div>

			<div className="flex flex-col items-center justify-center min-h-[400px] max-w-2xl mx-auto w-full">
				<SearchTreatment />
			</div>
		</div>
	);
}
