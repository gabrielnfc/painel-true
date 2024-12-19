import Sidebar from '@/components/sidebar';

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex h-screen bg-background dark:bg-black">
			<Sidebar />
			<main className="flex-1 overflow-y-auto lg:pl-64 bg-background dark:bg-black">
				<div className="h-full bg-background dark:bg-black">{children}</div>
			</main>
		</div>
	);
}
