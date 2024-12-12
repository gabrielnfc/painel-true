'use client';

import Image from 'next/image';

export default function HomePage() {
	return (
		<div className="flex items-center justify-center min-h-screen">
			<div className="container px-4">
				<div className="max-w-4xl mx-auto space-y-8">
					{/* Banner */}
					<div className="relative w-full h-[200px] sm:h-[250px] md:h-[300px] rounded-lg overflow-hidden">
						<Image
							src="/images/banner-true.png"
							alt="True Source Banner"
							fill
							style={{ objectFit: 'cover' }}
							priority
							className="rounded-lg"
						/>
					</div>

					{/* Mensagem de Boas-vindas */}
					<div className="text-center space-y-4">
						<h1 className="text-4xl font-bold">
							Bem-vindo ao Sistema de Pedidos True Source
						</h1>
						<p className="text-muted-foreground text-lg">
							Gerencie seus pedidos de forma simples e eficiente utilizando o
							menu lateral.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
