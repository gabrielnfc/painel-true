import Sidebar from '@/components/sidebar';

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex h-screen">
			<Sidebar />
			<main className="flex-1 overflow-y-auto lg:pl-64">
				<div className="container mx-auto px-4 py-8">{children}</div>
			</main>
		</div>
	);
}
