import { Badge } from '@/components/ui/badge';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import {
	Clock,
	Package,
	Truck,
	AlertTriangle,
	CheckCircle2,
	XCircle,
	HelpCircle,
	MapPin,
	Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
	status: string;
	type: 'delivery' | 'treatment';
	className?: string;
}

const deliveryStatusConfig: Record<
	string,
	{ label: string; icon: any; variant: string }
> = {
	pending: { label: 'Pendente', icon: Clock, variant: 'default' },
	in_transit: { label: 'Em Trânsito', icon: Truck, variant: 'info' },
	delayed: { label: 'Atrasado', icon: AlertTriangle, variant: 'warning' },
	lost: { label: 'Extraviado', icon: XCircle, variant: 'destructive' },
	returned: { label: 'Devolvido', icon: Package, variant: 'secondary' },
	delivered: { label: 'Entregue', icon: CheckCircle2, variant: 'success' },
	waiting_collection: {
		label: 'Aguardando Coleta',
		icon: Clock,
		variant: 'default',
	},
	with_carrier: { label: 'Com Transportadora', icon: Truck, variant: 'info' },
	delivery_attempt: {
		label: 'Tentativa de Entrega',
		icon: Truck,
		variant: 'warning',
	},
	address_not_found: {
		label: 'Endereço não Encontrado',
		icon: MapPin,
		variant: 'destructive',
	},
};

const treatmentStatusConfig: Record<
	string,
	{ label: string; icon: any; variant: string }
> = {
	pending: { label: 'Pendente', icon: Clock, variant: 'default' },
	ongoing: { label: 'Em Andamento', icon: Loader2, variant: 'info' },
	waiting_customer: {
		label: 'Aguardando Cliente',
		icon: Clock,
		variant: 'warning',
	},
	waiting_carrier: {
		label: 'Aguardando Transportadora',
		icon: Truck,
		variant: 'warning',
	},
	waiting_stock: {
		label: 'Aguardando Estoque',
		icon: Package,
		variant: 'warning',
	},
	rerouting: { label: 'Redirecionando', icon: MapPin, variant: 'info' },
	scheduling_delivery: {
		label: 'Agendando Entrega',
		icon: Clock,
		variant: 'info',
	},
	resolved: { label: 'Resolvido', icon: CheckCircle2, variant: 'success' },
	cancelled: { label: 'Cancelado', icon: XCircle, variant: 'destructive' },
};

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
	const config =
		type === 'delivery' ? deliveryStatusConfig : treatmentStatusConfig;
	const statusConfig = config[status] || {
		label: status,
		icon: HelpCircle,
		variant: 'default',
	};
	const Icon = statusConfig.icon;

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger>
					<Badge
						variant={statusConfig.variant as any}
						className={cn('gap-1 px-2 py-1 font-medium', className)}
					>
						<Icon className="h-3.5 w-3.5" />
						<span>{statusConfig.label}</span>
					</Badge>
				</TooltipTrigger>
				<TooltipContent>
					<p>{`Status ${
						type === 'delivery' ? 'de Entrega' : 'do Tratamento'
					}: ${statusConfig.label}`}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
