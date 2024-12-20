import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import { TooltipWrapper } from '@/components/ui/tooltip-wrapper';

interface InfoItemProps {
	label: string;
	value: string | null;
	isDate?: boolean;
	isStatus?: boolean;
	isOrderId?: boolean;
	isVtexOrder?: boolean;
	isShipping?: boolean;
	truncate?: boolean;
	className?: string;
}

export function InfoItem({
	label,
	value,
	isDate,
	isStatus,
	isOrderId,
	isVtexOrder,
	isShipping,
	truncate,
	className,
}: InfoItemProps) {
	if (!value) return null;

	// Função para formatar a data
	const formatDate = (dateString: string) => {
		if (!dateString) return 'N/A';
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString('pt-BR', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			});
		} catch {
			return dateString;
		}
	};

	// Função para formatar o status
	const formatStatus = (status: string) => {
		return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
	};

	// Função para formatar o frete por conta
	const formatShipping = (shipping: string) => {
		const map: { [key: string]: string } = {
			R: 'Remetente (CIF)',
			D: 'Destinatário (FOB)',
		};
		return map[shipping] || shipping;
	};

	// Verifica se é um link de rastreamento
	const isTrackingLink =
		label.toLowerCase().includes('rastreamento') &&
		(value.includes('http') || value.startsWith('www.'));

	// Função para formatar URL
	const formatUrl = (url: string) => {
		if (!url.startsWith('http')) {
			return `https://${url}`;
		}
		return url;
	};

	// Renderiza o valor apropriado
	const renderValue = () => {
		// Link de rastreamento
		if (isTrackingLink) {
			return (
				<a
					href={formatUrl(value)}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-2 text-primary hover:text-primary/80 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
				>
					Rastrear Pedido
					<ExternalLink className="h-4 w-4" />
				</a>
			);
		}

		// Link do Tiny ERP
		if (isOrderId) {
			const tinyUrl = `https://erp.tiny.com.br/vendas#edit/${value}`;
			return (
				<a
					href={tinyUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="text-primary hover:text-primary/80 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
				>
					{value}
				</a>
			);
		}

		// Link da VTEX
		if (isVtexOrder && value) {
			const vtexUrl = `https://tfcucl.myvtex.com/admin/orders/${value}`;
			return (
				<div className={cn('space-y-1', className)}>
					<p className="text-sm text-muted-foreground">{label}</p>
					<p className="font-medium">
						<a
							href={vtexUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-primary hover:text-primary/80 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
						>
							{value}
						</a>
					</p>
				</div>
			);
		}

		let displayValue = value;

		if (isDate) {
			displayValue = formatDate(value);
		} else if (isStatus) {
			displayValue = formatStatus(value);
		} else if (isShipping) {
			displayValue = formatShipping(value);
		}

		if (truncate) {
			return (
				<TooltipWrapper content={displayValue}>
					<span className="truncate block max-w-[200px]">{displayValue}</span>
				</TooltipWrapper>
			);
		}

		return displayValue;
	};

	return (
		<div className={cn('space-y-1', className)}>
			<p className="text-sm text-muted-foreground">{label}</p>
			<p className="font-medium">{renderValue()}</p>
		</div>
	);
}
