import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/providers/theme-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
	title: 'Sistema de Pedidos True Source',
	description: 'Sistema de gerenciamento de pedidos',
	icons: {
		icon: [
			{
				url: '/images/logo-true.svg',
				type: 'image/svg+xml',
			},
		],
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="pt-BR" suppressHydrationWarning>
			<head>
				<link rel="icon" href="/images/logo-true.svg" type="image/svg+xml" />
			</head>
			<ClerkProvider
				localization={{
					signIn: {
						start: {
							title: 'Entrar',
							subtitle: 'para continuar no Sistema de Pedidos',
							actionText: 'Não tem uma conta?',
						},
						emailCode: {
							title: 'Verificar email',
							subtitle: 'para continuar no Sistema de Pedidos',
							formTitle: 'Código de verificação',
							formSubtitle:
								'Digite o código de verificação enviado para seu email',
						},
					},
				}}
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<body className={inter.className}>
						{children}
						<Toaster />
					</body>
				</ThemeProvider>
			</ClerkProvider>
		</html>
	);
}
