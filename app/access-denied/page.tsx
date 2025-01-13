import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AccessDenied() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-4">
			<div className="text-center space-y-6 max-w-lg">
				<AlertTriangle className="w-16 h-16 mx-auto text-destructive" />
				<h1 className="text-3xl font-bold">Acesso Negado</h1>
				<p className="text-muted-foreground">
					Você não tem permissão para acessar esta página. Entre em contato com
					o administrador do sistema para solicitar acesso.
				</p>
				<div className="flex justify-center gap-4">
					<Button asChild variant="default">
						<Link href="/">Voltar ao Início</Link>
					</Button>
					<Button asChild variant="outline">
						<Link href="/support">Solicitar Acesso</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}
