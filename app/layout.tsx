import { Metadata } from 'next';
import { RootLayoutClient } from '@/components/root-layout-client';
import './globals.css';

export const metadata: Metadata = {
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
	return <RootLayoutClient>{children}</RootLayoutClient>;
}
