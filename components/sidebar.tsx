'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
	Home,
	Search,
	BarChart2,
	Menu,
	X,
	MessageSquare,
	Bell,
	ClipboardList,
	ShoppingCart,
	Building2,
	DollarSign,
	TrendingUp,
	Users,
	LifeBuoy,
	ChevronDown,
	ChevronRight,
} from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import Image from 'next/image';

const navigation = [
	{ name: 'Início', href: '/', icon: Home },
	{
		name: 'E-commerce',
		icon: ShoppingCart,
		children: [
			{ name: 'Alertas', href: '/ecommerce/alerts', icon: Bell },
			{
				name: 'Tratamentos',
				href: '/ecommerce/treatments',
				icon: ClipboardList,
			},
			{
				name: 'Buscar Pedidos',
				href: '/ecommerce/orders/search',
				icon: Search,
			},
			{ name: 'Relatório Geral', href: '/ecommerce/report', icon: BarChart2 },
			{ name: 'Assistente IA', href: '/ecommerce/chat', icon: MessageSquare },
		],
	},
	{
		name: 'Atacado - Distribuição B2B',
		icon: Building2,
		children: [],
	},
	{
		name: 'Financeiro',
		icon: DollarSign,
		children: [],
	},
	{
		name: 'Marketing',
		icon: TrendingUp,
		children: [],
	},
	{
		name: 'RH',
		icon: Users,
		children: [],
	},
	{
		name: 'Suporte & Feedback',
		href: '/feedback',
		icon: LifeBuoy,
	},
];

export default function Sidebar() {
	const [isOpen, setIsOpen] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const [expandedItems, setExpandedItems] = useState<string[]>([]);
	const pathname = usePathname();

	const toggleExpand = (itemName: string) => {
		setExpandedItems((prev) =>
			prev.includes(itemName)
				? prev.filter((item) => item !== itemName)
				: [...prev, itemName]
		);
	};

	const isItemExpanded = (itemName: string) => expandedItems.includes(itemName);

	const isChildActive = (children?: { href: string }[]) => {
		if (!children) return false;
		return children.some((child) => {
			return pathname.startsWith(child.href);
		});
	};

	const isParentActive = (item: any) => {
		if (item.href && pathname === item.href) return true;
		if (item.children) {
			return item.children.some((child: any) =>
				pathname.startsWith(child.href)
			);
		}
		return false;
	};

	return (
		<>
			{/* Mobile menu button */}
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

			{/* Sidebar */}
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
					{/* Logo and title */}
					<div className="flex h-16 items-center px-4 border-b">
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
									'text-xl font-bold transition-all duration-300 ease-in-out',
									isExpanded
										? 'opacity-100 ml-2'
										: 'opacity-0 w-0 overflow-hidden'
								)}
							>
								Sistema de Pedidos
							</span>
						</Link>
					</div>

					{/* Navigation */}
					<nav className="flex-1 px-2 py-4 overflow-y-auto scrollbar-none">
						{navigation.map((item) => {
							const isActive = isParentActive(item);
							const hasChildren = item.children && item.children.length > 0;
							const isItemExp = isItemExpanded(item.name);

							return (
								<div
									key={item.name}
									className="transition-all duration-200 ease-in-out mb-1"
								>
									{hasChildren ? (
										<button
											onClick={() => toggleExpand(item.name)}
											className={cn(
												'w-full group flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out',
												isActive || isItemExp
													? 'bg-primary text-primary-foreground'
													: 'hover:bg-muted'
											)}
										>
											<div
												className={cn(
													'flex items-center min-w-[32px]',
													!isExpanded && 'justify-center w-full'
												)}
											>
												<item.icon
													className={cn(
														'h-5 w-5 transition-colors duration-200',
														isActive || isItemExp
															? 'text-primary-foreground'
															: 'text-muted-foreground'
													)}
												/>
												<span
													className={cn(
														'ml-3 transition-all duration-300 ease-in-out whitespace-nowrap',
														isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
													)}
												>
													{item.name}
												</span>
											</div>
											{isExpanded && (
												<div
													className={cn(
														'transition-transform duration-200 ease-in-out ml-2',
														isItemExp ? 'rotate-180' : 'rotate-0'
													)}
												>
													<ChevronDown
														className={cn(
															'h-4 w-4',
															isActive || isItemExp
																? 'text-primary-foreground'
																: 'text-muted-foreground'
														)}
													/>
												</div>
											)}
										</button>
									) : (
										<Link
											href={item.href || '#'}
											className={cn(
												'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out',
												isActive
													? 'bg-primary text-primary-foreground'
													: 'hover:bg-muted'
											)}
										>
											<div
												className={cn(
													'min-w-[32px]',
													!isExpanded && 'w-full flex justify-center'
												)}
											>
												<item.icon
													className={cn(
														'h-5 w-5 transition-colors duration-200',
														isActive
															? 'text-primary-foreground'
															: 'text-muted-foreground'
													)}
												/>
											</div>
											<span
												className={cn(
													'ml-3 transition-all duration-300 ease-in-out whitespace-nowrap',
													isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
												)}
											>
												{item.name}
											</span>
										</Link>
									)}

									{/* Children */}
									{hasChildren && isItemExp && (
										<div
											className={cn(
												'ml-4 mt-1 space-y-1 transition-all duration-300 ease-in-out',
												isExpanded
													? 'opacity-100 h-auto'
													: 'opacity-0 h-0 overflow-hidden'
											)}
										>
											{item.children.map((child) => {
												const isChildActive = pathname === child.href;
												return (
													<Link
														key={child.name}
														href={child.href}
														className={cn(
															'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-in-out',
															isChildActive
																? 'bg-primary text-primary-foreground'
																: 'hover:bg-muted'
														)}
													>
														<div
															className={cn(
																'min-w-[32px]',
																!isExpanded && 'w-full flex justify-center'
															)}
														>
															<child.icon
																className={cn(
																	'h-5 w-5 transition-colors duration-200',
																	isChildActive
																		? 'text-primary-foreground'
																		: 'text-muted-foreground'
																)}
															/>
														</div>
														<span
															className={cn(
																'ml-3 whitespace-nowrap',
																isExpanded ? 'opacity-100' : 'opacity-0 w-0'
															)}
														>
															{child.name}
														</span>
													</Link>
												);
											})}
										</div>
									)}
								</div>
							);
						})}
					</nav>

					{/* User and theme */}
					<div className="border-t p-4">
						<div
							className={cn(
								'flex transition-all duration-300 ease-in-out',
								isExpanded
									? 'flex-row items-center justify-between'
									: 'flex-col items-center gap-4'
							)}
						>
							<UserButton afterSignOutUrl="/" />
							<ThemeToggle />
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
