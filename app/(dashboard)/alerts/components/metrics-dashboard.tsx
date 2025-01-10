import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	AlertCircle,
	Clock,
	Timer,
	CheckCircle,
	TrendingUp,
	TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
	title: string;
	value: string | number;
	description: string;
	icon: React.ReactNode;
	subValue?: string;
	trend?: {
		value: number;
		isPositive: boolean;
	};
	color?: 'default' | 'success' | 'warning' | 'danger';
}

function MetricCard({
	title,
	value,
	description,
	icon,
	subValue,
	trend,
	color = 'default',
}: MetricCardProps) {
	const colorStyles = {
		default: 'bg-card',
		success: 'bg-green-50 dark:bg-green-950/30',
		warning: 'bg-yellow-50 dark:bg-yellow-950/30',
		danger: 'bg-red-50 dark:bg-red-950/30',
	};

	const iconColors = {
		default: 'text-muted-foreground',
		success: 'text-green-500',
		warning: 'text-yellow-500',
		danger: 'text-red-500',
	};

	return (
		<Card className={cn('transition-all hover:shadow-md', colorStyles[color])}>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
				<div className={cn('h-4 w-4', iconColors[color])}>{icon}</div>
			</CardHeader>
			<CardContent>
				<div className="flex items-baseline space-x-2">
					<div className="text-2xl font-bold">{value}</div>
					{trend && (
						<div
							className={cn(
								'flex items-center text-xs',
								trend.isPositive ? 'text-green-500' : 'text-red-500'
							)}
						>
							{trend.isPositive ? (
								<TrendingUp className="mr-1 h-3 w-3" />
							) : (
								<TrendingDown className="mr-1 h-3 w-3" />
							)}
							{Math.abs(trend.value)}%
						</div>
					)}
				</div>
				<p className="text-xs text-muted-foreground mt-1">{description}</p>
				{subValue && (
					<div className="mt-3 flex items-center text-xs">
						<div className="flex-1">
							<div className="h-2 w-full bg-muted rounded">
								<div
									className="h-2 rounded bg-primary"
									style={{
										width: `${(parseInt(subValue) / value) * 100}%`,
									}}
								/>
							</div>
						</div>
						<span className="ml-2 text-muted-foreground whitespace-nowrap">
							{subValue}
						</span>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

export function MetricsDashboard({
	data,
}: {
	data: {
		totalAlerts: number;
		avgDelayDays: number;
		avgResolutionTime: string;
		resolvedOrders: {
			last30Days: number;
			last7Days: number;
		};
	};
}) {
	// Calcula a porcentagem de alertas resolvidos em 7 dias em relação aos 30 dias
	const resolutionTrend = data.resolvedOrders.last30Days
		? Math.round(
				(data.resolvedOrders.last7Days / data.resolvedOrders.last30Days) * 100
		  )
		: 0;

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<MetricCard
				title="Total de Alertas"
				value={data.totalAlerts}
				description="Pedidos atrasados nos últimos 30 dias"
				icon={<AlertCircle />}
				color={
					data.totalAlerts > 100
						? 'danger'
						: data.totalAlerts > 50
						? 'warning'
						: 'default'
				}
			/>
			<MetricCard
				title="Média de Atraso"
				value={`${data.avgDelayDays} dias`}
				description="Média de dias em atraso"
				icon={<Timer />}
				color={
					data.avgDelayDays > 7
						? 'danger'
						: data.avgDelayDays > 3
						? 'warning'
						: 'default'
				}
			/>
			<MetricCard
				title="Tempo Médio Resolução"
				value={data.avgResolutionTime}
				description="Média dos últimos 30 dias"
				icon={<Clock />}
				color={
					data.avgResolutionTime === 'N/A'
						? 'default'
						: parseInt(data.avgResolutionTime) > 48
						? 'warning'
						: 'success'
				}
			/>
			<MetricCard
				title="Resolvidos"
				value={data.resolvedOrders.last30Days}
				description="Tratativas finalizadas em 30 dias"
				subValue={`${data.resolvedOrders.last7Days} nos últimos 7 dias`}
				icon={<CheckCircle />}
				color="success"
				trend={{
					value: resolutionTrend,
					isPositive: resolutionTrend >= 30, // Consideramos positivo se 30% ou mais foram resolvidos nos últimos 7 dias
				}}
			/>
		</div>
	);
}
