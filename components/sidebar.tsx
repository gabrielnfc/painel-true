'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Search, BarChart2, Menu, X } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import Image from 'next/image';

const navigation = [
	{ name: 'Início', href: '/', icon: Home },
	{ name: 'Buscar Pedidos', href: '/orders/search', icon: Search },
	{ name: 'Relatório Geral', href: '/report', icon: BarChart2 },
];

export default function Sidebar() {
	const [isOpen, setIsOpen] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const pathname = usePathname();

	return (
		<>
			<div className="lg:hidden fixed top-4 left-4 z-50">
				<Button
					variant="outline"
					size="icon"
					onClick={() => setIsOpen(!isOpen)}
					className="relative"
				>
					{isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
				</Button>
			</div>

			<div
				className={cn(
					'fixed inset-y-0 left-0 z-40 transform bg-background border-r transition-all duration-300 ease-in-out lg:translate-x-0',
					isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0',
					isExpanded ? 'lg:w-64' : 'lg:w-20'
				)}
				onMouseEnter={() => setIsExpanded(true)}
				onMouseLeave={() => setIsExpanded(false)}
			>
				<div className="flex h-full flex-col">
					<div className="flex h-16 items-center justify-between px-4 border-b overflow-hidden">
						<Link
							href="/"
							className="flex items-center gap-2 hover:opacity-80 transition-opacity"
						>
							<Image
								src="/images/logo-true.svg"
								alt="True Source Logo"
								width={32}
								height={32}
								className="min-w-[32px]"
							/>
							<span
								className={cn(
									'text-xl font-bold whitespace-nowrap transition-all duration-300',
									isExpanded ? 'opacity-100' : 'opacity-0 lg:w-0'
								)}
							>
								Sistema de Pedidos
							</span>
						</Link>
					</div>

					<nav className="flex-1 space-y-1 px-2 py-4">
						{navigation.map((item) => {
							const isActive = pathname === item.href;
							return (
								<Link
									key={item.name}
									href={item.href}
									className={cn(
										'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors overflow-hidden',
										isActive
											? 'bg-primary text-primary-foreground'
											: 'hover:bg-muted'
									)}
								>
									<item.icon
										className={cn(
											'min-w-[20px] h-5 w-5',
											isActive
												? 'text-primary-foreground'
												: 'text-muted-foreground'
										)}
									/>
									<span
										className={cn(
											'ml-3 whitespace-nowrap transition-all duration-300',
											isExpanded ? 'opacity-100' : 'opacity-0 lg:w-0'
										)}
									>
										{item.name}
									</span>
								</Link>
							);
						})}
					</nav>

					<div
						className={cn(
							'border-t p-4 transition-all duration-300',
							isExpanded
								? 'flex items-center justify-between'
								: 'flex flex-col items-center gap-4'
						)}
					>
						<UserButton afterSignOutUrl="/sign-in" />
						<ThemeToggle />
					</div>
				</div>
			</div>

			<main
				className={cn(
					'min-h-screen transition-all duration-300',
					isExpanded ? 'lg:pl-64' : 'lg:pl-20'
				)}
			>
				{/* Conteúdo principal */}
			</main>
		</>
	);
}
