export default function MarketingPage() {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold tracking-tight">Marketing</h1>
			</div>
			<div className="flex items-center justify-center h-[400px] bg-card rounded-lg border shadow">
				<div className="text-center space-y-2">
					<h2 className="text-2xl font-semibold tracking-tight">
						Módulo em Desenvolvimento
					</h2>
					<p className="text-muted-foreground">
						Esta seção está sendo desenvolvida e estará disponível em breve.
					</p>
				</div>
			</div>
		</div>
	);
}
