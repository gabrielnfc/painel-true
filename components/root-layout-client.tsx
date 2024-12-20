'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { SidebarProvider } from '@/components/providers/sidebar-provider';
import Head from 'next/head';

const inter = Inter({ subsets: ['latin'] });

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
	return (
		<html lang="pt-BR" suppressHydrationWarning className="min-h-screen">
			<Head>
				<title>True Source - Sistema de Pedidos</title>
				<meta
					name="description"
					content="Sistema de consulta de pedidos da True Source"
				/>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<body className={`${inter.className} min-h-screen bg-background`}>
				<ClerkProvider
					appearance={{
						elements: {
							formButtonPrimary: 'bg-primary hover:bg-primary/90',
							footerActionLink: 'text-primary hover:text-primary/90',
						},
					}}
				>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
						storageKey="truesource-theme"
					>
						<div className="min-h-screen bg-background">
							<SidebarProvider>{children}</SidebarProvider>
							<Toaster />
						</div>
					</ThemeProvider>
				</ClerkProvider>
			</body>
		</html>
	);
}
