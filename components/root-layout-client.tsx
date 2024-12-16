'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { SidebarProvider } from '@/components/providers/sidebar-provider';

const inter = Inter({ subsets: ['latin'] });

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
	return (
		<html lang="pt-BR" suppressHydrationWarning>
			<head>
				<link rel="icon" href="/images/logo-true.svg" type="image/svg+xml" />
			</head>
			<body className={inter.className}>
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
						<SidebarProvider>{children}</SidebarProvider>
						<Toaster />
					</ThemeProvider>
				</ClerkProvider>
			</body>
		</html>
	);
}
