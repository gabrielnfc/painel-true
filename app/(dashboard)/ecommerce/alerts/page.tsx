import { Metadata } from 'next';
import AlertsList from './components/alerts-list';
import { AlertFilters } from './components/alert-filters';
import { MetricsDashboard } from './components/metrics-dashboard';
import { metricsService } from '@/lib/services/metrics-service';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
	title: 'Alertas | Painel True',
	description: 'Alertas de pedidos atrasados',
};

async function AlertMetrics() {
	const metrics = await metricsService.getAlertMetrics();
	return <MetricsDashboard data={metrics} />;
}

export default function AlertsPage() {
	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl font-bold tracking-tight">Alertas</h1>
				<p className="text-muted-foreground">
					Gerencie pedidos atrasados e seus tratamentos.
				</p>
			</div>

			<Suspense
				fallback={
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						{[...Array(4)].map((_, i) => (
							<Skeleton key={i} className="h-32" />
						))}
					</div>
				}
			>
				<AlertMetrics />
			</Suspense>

			<div className="rounded-lg border bg-card">
				<div className="p-4 sm:p-6">
					<Suspense
						fallback={
							<div className="h-10 w-full bg-muted animate-pulse rounded-md" />
						}
					>
						<AlertFilters />
					</Suspense>
				</div>
				<Suspense
					fallback={
						<div className="p-4">
							<div className="space-y-3">
								{[...Array(5)].map((_, i) => (
									<div
										key={i}
										className="h-16 bg-muted animate-pulse rounded-md"
									/>
								))}
							</div>
						</div>
					}
				>
					<AlertsList />
				</Suspense>
			</div>
		</div>
	);
}
