import { formatDate } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function getOrderStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    '8': 'Dados Incompletos',
    '0': 'Aberta',
    '3': 'Aprovada',
    '4': 'Preparando Envio',
    '1': 'Faturada',
    '7': 'Pronto Envio',
    '5': 'Enviada',
    '6': 'Entregue',
    '2': 'Cancelada',
    '9': 'Não Entregue'
  };

  return statusMap[status] || status;
}

function getStatusColor(status: string): string {
  const colorMap: { [key: string]: string } = {
    '8': 'text-yellow-600',
    '0': 'text-blue-600',
    '3': 'text-green-600',
    '4': 'text-purple-600',
    '1': 'text-blue-600',
    '7': 'text-indigo-600',
    '5': 'text-orange-600',
    '6': 'text-green-600',
    '2': 'text-red-600',
    '9': 'text-red-600'
  };

  return colorMap[status] || '';
}

function getShippingResponsibility(code: string): string {
  const shippingMap: { [key: string]: string } = {
    'R': 'Contratação do Frete por conta do Remetente (CIF)',
    'D': 'Contratação do Frete por conta do Destinatário (FOB)',
    'T': 'Contratação do Frete por conta de Terceiros',
    '3': 'Transporte Próprio por conta do Remetente',
    '4': 'Transporte Próprio por conta do Destinatário',
    'S': 'Sem Ocorrência de Transporte'
  };

  return shippingMap[code] || code;
}

interface InfoItemProps {
  label: string;
  value: string | null | undefined;
  isLink?: boolean;
  isStatus?: boolean;
  isShipping?: boolean;
  isDate?: boolean;
  isOrderId?: boolean;
  isVtexOrder?: boolean;
  className?: string;
  truncate?: boolean;
}

export function InfoItem({ 
  label, 
  value, 
  isLink = false, 
  isStatus = false,
  isShipping = false,
  isDate = false,
  isOrderId = false,
  isVtexOrder = false,
  className = '',
  truncate = false
}: InfoItemProps) {
  if (!value || value === 'N/A') return (
    <div className="flex flex-col">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-muted-foreground">N/A</dd>
    </div>
  );

  if (truncate) {
    const displayValue = value.length > 13 ? `${value.slice(0, 13)}...` : value;
    
    return (
      <div className="flex flex-col">
        <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
        <dd className="text-sm">
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger className="cursor-help">
                {displayValue}
              </TooltipTrigger>
              <TooltipContent className="p-2 max-w-[400px] break-all bg-white border shadow-lg">
                {value}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </dd>
      </div>
    );
  }

  if (isVtexOrder && value) {
    return (
      <div className="flex flex-col">
        <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
        <dd className="text-sm">
          <a 
            href={`https://tfcucl.myvtex.com/admin/orders/${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 hover:underline"
          >
            {value}
          </a>
        </dd>
      </div>
    );
  }

  if (isOrderId && value) {
    return (
      <div className="flex flex-col">
        <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
        <dd className="text-sm">
          <a 
            href={`https://erp.tiny.com.br/vendas#edit/${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 hover:underline"
          >
            {value}
          </a>
        </dd>
      </div>
    );
  }

  if (isStatus) {
    const statusText = getOrderStatus(value);
    const statusColor = getStatusColor(value);
    return (
      <div className="flex flex-col">
        <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
        <dd className={`text-sm font-medium ${statusColor}`}>
          {statusText}
        </dd>
      </div>
    );
  }

  if (isShipping) {
    const shippingText = getShippingResponsibility(value);
    return (
      <div className="flex flex-col">
        <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
        <dd className="text-sm">
          {shippingText}
        </dd>
      </div>
    );
  }

  if (isDate) {
    return (
      <div className="flex flex-col">
        <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
        <dd className="text-sm">
          {formatDate(value)}
        </dd>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className={`text-sm ${isLink ? 'text-primary hover:underline cursor-pointer' : ''} ${className}`}>
        {value}
      </dd>
    </div>
  );
}