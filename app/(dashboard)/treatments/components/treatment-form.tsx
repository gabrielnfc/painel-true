'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Treatment } from '@/lib/types/treatment';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	SelectGroup,
	SelectLabel,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import {
	AlertTriangle,
	Calendar,
	CheckCircle2,
	ClipboardList,
	MessageCircle,
	Phone,
} from 'lucide-react';

const treatmentFormSchema = z
	.object({
		observations: z.string().trim().min(1, 'Observações são obrigatórias'),
		internal_notes: z.string().trim().optional(),
		customer_contact: z.string().trim().optional(),
		carrier_protocol: z.string().trim().optional(),
		new_delivery_deadline: z
			.string()
			.min(1, 'Nova data de entrega é obrigatória')
			.refine((date) => {
				const selectedDate = new Date(date);
				return !isNaN(selectedDate.getTime());
			}, 'Data inválida'),
		resolution_deadline: z
			.string()
			.min(1, 'Data de resolução é obrigatória')
			.refine((date) => {
				const selectedDate = new Date(date);
				return !isNaN(selectedDate.getTime());
			}, 'Data inválida'),
		follow_up_date: z
			.string()
			.optional()
			.refine((date) => {
				if (!date) return true;
				const selectedDate = new Date(date);
				return !isNaN(selectedDate.getTime());
			}, 'Data inválida'),
		delivery_status: z.enum(
			[
				'pending',
				'in_transit',
				'delayed',
				'lost',
				'returned',
				'delivered',
				'waiting_collection',
				'waiting_pickup',
				'with_carrier',
				'delivery_attempt',
				'address_not_found',
			],
			{
				required_error: 'Status de entrega é obrigatório',
			}
		),
		treatment_status: z.enum(
			[
				'pending',
				'ongoing',
				'waiting_customer',
				'waiting_carrier',
				'waiting_stock',
				'waiting_service',
				'waiting_logistics',
				'waiting_delivery',
				'waiting_financial',
				'rerouting',
				'resolved',
				'cancelled',
			],
			{
				required_error: 'Status do tratamento é obrigatório',
			}
		),
		action_taken: z.string().trim().optional(),
		complaint_reason: z.enum(
			[
				'subscription_change',
				'address_change',
				'order_change',
				'antifraud',
				'external_damage_dent',
				'external_damage_seal',
				'external_damage_batch',
				'external_damage_leak',
				'internal_damage_aroma',
				'internal_damage_smell',
				'internal_damage_foreign',
				'internal_damage_melting',
				'internal_damage_hardening',
				'internal_damage_flavor',
				'internal_damage_texture',
				'internal_damage_missing',
				'internal_damage_reaction',
				'missing_gift',
				'wrong_freight_charge',
				'wrong_charge',
				'discount_not_applied',
				'subscription_cancellation',
				'order_cancellation',
				'problem_cancellation',
				'missing_scoop',
				'delivery_not_recognized',
				'duplicate_order',
				'delayed_order',
				'wrong_address_delivery',
				'incomplete_order',
				'undelivered_order',
				'long_delivery_time',
				'inquiry',
				'tracking_not_updated',
				'missing_tracking',
				'order_not_sent',
				'true_points_redemption',
				'cashback_usage',
				'cashback_inquiry',
				'wrong_order',
				'coupon_error',
				'not_applicable',
			],
			{
				required_error: 'Motivo da reclamação é obrigatório',
			}
		),
		resolution_type: z
			.enum([
				'redelivery',
				'refund',
				'freight_refund',
				'replacement',
				'address_update',
				'collection',
				'shipping',
				'sale',
				'contact_customer',
				'posting',
				'confrontation',
				'dispute',
				'check_delivery_status',
				'cancellation',
				'return',
				'delivery_suspension',
				'gift_sending',
				'other',
			])
			.optional(),
		identified_problem: z
			.enum([
				'gift_not_sent',
				'gift_out_of_stock',
				'customer_absent',
				'customer_unknown',
				'wrong_address',
				'inaccessible_region',
				'delivery_not_recognized',
				'undelivered_order',
				'delivery_suspended',
				'awaiting_pickup',
				'unclaimed_order',
				'duplicate_order',
				'lost_order',
				'incomplete_order',
				'wrong_order',
				'internal_hold',
				'carrier_hold',
				'tax_hold',
				'no_tracking',
				'internal_damage',
				'external_damage',
				'out_of_stock',
				'expired_product',
				'damaged_package',
				'wrong_label',
				'integration_error',
				'website_failure',
				'manual_billing',
				'wrong_charge',
				'wrong_freight_charge',
				'discount_not_applied',
				'chargeback',
				'subscription_cancellation',
				'customer_gave_up',
				'order_issues',
				'wrong_purchase',
				'delivery_issues',
				'return_damaged',
				'return_refused',
				'return_wrong_address',
				'return_unspecified',
			] as const)
			.optional(),
	})
	.refine(
		(data) => {
			if (!data.resolution_deadline || !data.new_delivery_deadline) return true;
			const resolutionDate = new Date(data.resolution_deadline);
			const deliveryDate = new Date(data.new_delivery_deadline);
			return resolutionDate >= deliveryDate;
		},
		{
			message:
				'A data de resolução não pode ser anterior à nova data de entrega',
			path: ['resolution_deadline'],
		}
	);

type TreatmentFormValues = z.infer<typeof treatmentFormSchema>;

interface TreatmentFormProps {
	orderId: string;
	initialData?: Treatment | null;
}

export function TreatmentForm({ orderId, initialData }: TreatmentFormProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

	const formatInitialDate = (
		date: Date | string | null | undefined
	): string => {
		if (!date) return '';
		try {
			if (typeof date === 'string') {
				const parsedDate = parseISO(date);
				if (isNaN(parsedDate.getTime())) {
					console.error('Invalid date string:', date);
					return '';
				}
				return format(parsedDate, 'yyyy-MM-dd');
			}
			if (date instanceof Date) {
				if (isNaN(date.getTime())) {
					console.error('Invalid Date object:', date);
					return '';
				}
				return format(date, 'yyyy-MM-dd');
			}
			console.error('Unsupported date format:', date);
			return '';
		} catch (error) {
			console.error('Error formatting date:', error, {
				input: date,
				type: typeof date,
			});
			return '';
		}
	};

	const form = useForm<TreatmentFormValues>({
		resolver: zodResolver(treatmentFormSchema),
		defaultValues: {
			observations: initialData?.observations || '',
			internal_notes: initialData?.internal_notes || '',
			customer_contact: initialData?.customer_contact || '',
			carrier_protocol: initialData?.carrier_protocol || '',
			new_delivery_deadline: formatInitialDate(
				initialData?.new_delivery_deadline
			),
			resolution_deadline: formatInitialDate(initialData?.resolution_deadline),
			follow_up_date: formatInitialDate(initialData?.follow_up_date),
			delivery_status: initialData?.delivery_status || 'pending',
			treatment_status: initialData?.treatment_status || 'pending',
			action_taken: initialData?.action_taken || '',
			resolution_type: initialData?.resolution_type || undefined,
			complaint_reason: initialData?.complaint_reason || 'not_applicable',
			identified_problem: initialData?.identified_problem || undefined,
		},
	});

	useEffect(() => {
		const subscription = form.watch(() => {
			setHasUnsavedChanges(true);
		});
		return () => subscription.unsubscribe();
	}, [form]);

	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (hasUnsavedChanges) {
				e.preventDefault();
				e.returnValue = '';
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [hasUnsavedChanges]);

	const formatDate = (dateStr: string) => {
		if (!dateStr) return null;
		try {
			const [year, month, day] = dateStr.split('-').map(Number);
			const date = new Date(year, month - 1, day, 12, 0, 0);

			if (isNaN(date.getTime())) {
				console.error('Invalid date created:', { year, month, day });
				return null;
			}

			return date.toISOString();
		} catch (error) {
			console.error('Error formatting date:', error, { dateStr });
			return null;
		}
	};

	const onSubmit = async (data: TreatmentFormValues) => {
		try {
			setLoading(true);

			// Se não houver alterações, apenas retorne sem fazer nada
			if (!hasUnsavedChanges) {
				router.back();
				return;
			}

			const formattedData = {
				...data,
				order_id: orderId,
				new_delivery_deadline: formatDate(data.new_delivery_deadline),
				resolution_deadline: formatDate(data.resolution_deadline),
				follow_up_date: data.follow_up_date
					? formatDate(data.follow_up_date)
					: null,
			};

			const response = await fetch(
				`/api/treatments${initialData ? `?id=${initialData.id}` : ''}`,
				{
					method: initialData ? 'PUT' : 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(formattedData),
				}
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || 'Erro ao salvar tratamento');
			}

			setHasUnsavedChanges(false);
			toast.success(
				initialData
					? 'Tratamento atualizado com sucesso!'
					: 'Tratamento criado com sucesso!'
			);

			// Apenas atualize e volte se houve alterações
			router.refresh();
			router.back();
		} catch (error) {
			console.error('Error saving treatment:', error);
			toast.error(
				error instanceof Error ? error.message : 'Erro ao salvar tratamento'
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{initialData ? 'Atualizar Tratamento' : 'Novo Tratamento'}
				</CardTitle>
				<CardDescription>
					{initialData
						? 'Atualize as informações do tratamento'
						: 'Crie um novo tratamento para este pedido'}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						{/* Status Section */}
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<AlertTriangle className="h-5 w-5" />
								<h3 className="font-medium">Status</h3>
							</div>
							<Separator />
							<div className="grid gap-4 sm:grid-cols-2">
								<FormField
									control={form.control}
									name="delivery_status"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Status de Entrega</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Selecione o status de entrega" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Status de Entrega
														</SelectLabel>
														<SelectItem value="pending">Pendente</SelectItem>
														<SelectItem value="in_transit">
															Em trânsito
														</SelectItem>
														<SelectItem value="delayed">Atrasado</SelectItem>
														<SelectItem value="lost">Extraviado</SelectItem>
														<SelectItem value="returned">Devolvido</SelectItem>
														<SelectItem value="delivered">Entregue</SelectItem>
														<SelectItem value="waiting_collection">
															Aguardando Coleta
														</SelectItem>
														<SelectItem value="waiting_pickup">
															Aguardando retirada
														</SelectItem>
														<SelectItem value="with_carrier">
															Com transportadora
														</SelectItem>
														<SelectItem value="delivery_attempt">
															Tentativa de entrega
														</SelectItem>
														<SelectItem value="address_not_found">
															Endereço não encontrado
														</SelectItem>
													</SelectGroup>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="treatment_status"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Status do Tratamento</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Selecione o status do tratamento" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Status do Tratamento
														</SelectLabel>
														<SelectItem value="pending">Pendente</SelectItem>
														<SelectItem value="waiting_service">
															Aguardando atendimento
														</SelectItem>
														<SelectItem value="waiting_customer">
															Aguardando cliente
														</SelectItem>
														<SelectItem value="waiting_carrier">
															Aguardando transportadora
														</SelectItem>
														<SelectItem value="waiting_stock">
															Aguardando estoque
														</SelectItem>
														<SelectItem value="waiting_logistics">
															Aguardando logística
														</SelectItem>
														<SelectItem value="waiting_delivery">
															Aguardando entrega
														</SelectItem>
														<SelectItem value="waiting_financial">
															Aguardando financeiro
														</SelectItem>
														<SelectItem value="rerouting">
															Redirecionando
														</SelectItem>
														<SelectItem value="resolved">Resolvido</SelectItem>
														<SelectItem value="cancelled">Cancelado</SelectItem>
													</SelectGroup>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="complaint_reason"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Motivo da Reclamação</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Selecione o motivo da reclamação" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Alterações
														</SelectLabel>
														<SelectItem value="subscription_change">
															Alteração de assinatura
														</SelectItem>
														<SelectItem value="address_change">
															Alteração de endereço
														</SelectItem>
														<SelectItem value="order_change">
															Alteração do pedido
														</SelectItem>
													</SelectGroup>

													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Avarias Externas
														</SelectLabel>
														<SelectItem value="external_damage_dent">
															Amassado
														</SelectItem>
														<SelectItem value="external_damage_seal">
															Lacre
														</SelectItem>
														<SelectItem value="external_damage_batch">
															Lote/Validade
														</SelectItem>
														<SelectItem value="external_damage_leak">
															Vazamento
														</SelectItem>
													</SelectGroup>

													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Avarias Internas
														</SelectLabel>
														<SelectItem value="internal_damage_aroma">
															Aglomerado de aromas
														</SelectItem>
														<SelectItem value="internal_damage_smell">
															Cheiro
														</SelectItem>
														<SelectItem value="internal_damage_foreign">
															Corpo estranho
														</SelectItem>
														<SelectItem value="internal_damage_melting">
															Derretimento
														</SelectItem>
														<SelectItem value="internal_damage_hardening">
															Empedramento
														</SelectItem>
														<SelectItem value="internal_damage_flavor">
															Sabor
														</SelectItem>
														<SelectItem value="internal_damage_texture">
															Textura
														</SelectItem>
														<SelectItem value="internal_damage_missing">
															Quantidade faltante
														</SelectItem>
														<SelectItem value="internal_damage_reaction">
															Reações adversas
														</SelectItem>
													</SelectGroup>

													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Problemas com Brindes
														</SelectLabel>
														<SelectItem value="missing_gift">
															Brinde não recebido
														</SelectItem>
														<SelectItem value="missing_scoop">
															Falta Scoop
														</SelectItem>
													</SelectGroup>

													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Problemas Financeiros
														</SelectLabel>
														<SelectItem value="wrong_freight_charge">
															Cobrança de frete indevido
														</SelectItem>
														<SelectItem value="wrong_charge">
															Cobrança indevida
														</SelectItem>
														<SelectItem value="discount_not_applied">
															Desconto não aplicado
														</SelectItem>
														<SelectItem value="true_points_redemption">
															True Points - Problema de resgate
														</SelectItem>
														<SelectItem value="cashback_usage">
															Utilização cashback
														</SelectItem>
														<SelectItem value="cashback_inquiry">
															Consulta cashback
														</SelectItem>
														<SelectItem value="coupon_error">
															Cupom com erro/não aplicado
														</SelectItem>
													</SelectGroup>

													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Desistências
														</SelectLabel>
														<SelectItem value="subscription_cancellation">
															Desistência - Assinatura
														</SelectItem>
														<SelectItem value="order_cancellation">
															Desistência - Não quer mais
														</SelectItem>
														<SelectItem value="problem_cancellation">
															Desistência - Problemas com o pedido
														</SelectItem>
													</SelectGroup>

													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Problemas com Pedido
														</SelectLabel>
														<SelectItem value="delivery_not_recognized">
															Não reconhecimento da entrega
														</SelectItem>
														<SelectItem value="duplicate_order">
															Pedido duplicado
														</SelectItem>
														<SelectItem value="delayed_order">
															Pedido em atraso
														</SelectItem>
														<SelectItem value="wrong_address_delivery">
															Pedido entregue no endereço incorreto
														</SelectItem>
														<SelectItem value="incomplete_order">
															Pedido incompleto
														</SelectItem>
														<SelectItem value="undelivered_order">
															Pedido não entregue
														</SelectItem>
														<SelectItem value="order_not_sent">
															Pedido consta como não enviado
														</SelectItem>
														<SelectItem value="wrong_order">
															Pedido trocado/incorreto
														</SelectItem>
													</SelectGroup>

													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Outros
														</SelectLabel>
														<SelectItem value="antifraud">
															Antifraude
														</SelectItem>
														<SelectItem value="long_delivery_time">
															Prazo longo de entrega
														</SelectItem>
														<SelectItem value="inquiry">
															Solicitação/Dúvida
														</SelectItem>
														<SelectItem value="tracking_not_updated">
															Status da entrega sem atualização
														</SelectItem>
														<SelectItem value="missing_tracking">
															Sem informação de rastreio
														</SelectItem>
														<SelectItem value="not_applicable">
															Não se aplica
														</SelectItem>
													</SelectGroup>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="identified_problem"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Problema Identificado</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Selecione o problema identificado" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Problemas com Brindes
														</SelectLabel>
														<SelectItem value="gift_not_sent">
															Brinde não enviado
														</SelectItem>
														<SelectItem value="gift_out_of_stock">
															Brinde sem estoque
														</SelectItem>
													</SelectGroup>

													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Problemas de Entrega
														</SelectLabel>
														<SelectItem value="customer_absent">
															Cliente ausente
														</SelectItem>
														<SelectItem value="customer_unknown">
															Cliente desconhecido
														</SelectItem>
														<SelectItem value="wrong_address">
															Endereço errado
														</SelectItem>
														<SelectItem value="inaccessible_region">
															Região inacessível
														</SelectItem>
														<SelectItem value="delivery_not_recognized">
															Não reconhecimento da entrega
														</SelectItem>
														<SelectItem value="undelivered_order">
															Pedido não entregue
														</SelectItem>
														<SelectItem value="delivery_suspended">
															Suspensão de entrega
														</SelectItem>
														<SelectItem value="awaiting_pickup">
															Pedido aguardando retirada
														</SelectItem>
														<SelectItem value="unclaimed_order">
															Objeto não retirado
														</SelectItem>
													</SelectGroup>

													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Problemas com Pedido
														</SelectLabel>
														<SelectItem value="duplicate_order">
															Pedido duplicado
														</SelectItem>
														<SelectItem value="lost_order">
															Pedido extraviado
														</SelectItem>
														<SelectItem value="incomplete_order">
															Pedido incompleto
														</SelectItem>
														<SelectItem value="wrong_order">
															Pedido incorreto
														</SelectItem>
														<SelectItem value="internal_hold">
															Pedido parado (Interno)
														</SelectItem>
														<SelectItem value="carrier_hold">
															Pedido parado (Transportadora)
														</SelectItem>
														<SelectItem value="tax_hold">
															Pedido retido imposto
														</SelectItem>
														<SelectItem value="no_tracking">
															Pedido sem rastreio
														</SelectItem>
													</SelectGroup>

													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Problemas com Produto
														</SelectLabel>
														<SelectItem value="internal_damage">
															Produto avariado - Interno
														</SelectItem>
														<SelectItem value="external_damage">
															Produto avariado - Externo
														</SelectItem>
														<SelectItem value="out_of_stock">
															Produto sem estoque
														</SelectItem>
														<SelectItem value="expired_product">
															Produto - Validade expirada
														</SelectItem>
														<SelectItem value="damaged_package">
															Volume avariado
														</SelectItem>
														<SelectItem value="wrong_label">
															Troca de etiqueta
														</SelectItem>
													</SelectGroup>

													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Problemas de Sistema
														</SelectLabel>
														<SelectItem value="integration_error">
															Erro de integração
														</SelectItem>
														<SelectItem value="website_failure">
															Falha no site
														</SelectItem>
														<SelectItem value="manual_billing">
															Faturamento manual
														</SelectItem>
													</SelectGroup>

													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Problemas Financeiros
														</SelectLabel>
														<SelectItem value="wrong_charge">
															Cobrança indevida
														</SelectItem>
														<SelectItem value="wrong_freight_charge">
															Cobrança de frete indevido
														</SelectItem>
														<SelectItem value="discount_not_applied">
															Desconto não aplicado
														</SelectItem>
														<SelectItem value="chargeback">
															Chargeback
														</SelectItem>
													</SelectGroup>

													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Desistências
														</SelectLabel>
														<SelectItem value="subscription_cancellation">
															Desistência - Assinatura
														</SelectItem>
														<SelectItem value="customer_gave_up">
															Desistência - Não quer mais
														</SelectItem>
														<SelectItem value="order_issues">
															Desistência - Problemas com o pedido
														</SelectItem>
														<SelectItem value="wrong_purchase">
															Desistência - Comprado errado
														</SelectItem>
														<SelectItem value="delivery_issues">
															Desistência - Problemas com entrega
														</SelectItem>
													</SelectGroup>

													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Devoluções
														</SelectLabel>
														<SelectItem value="return_damaged">
															Em devolução - Avaria do volume
														</SelectItem>
														<SelectItem value="return_refused">
															Em devolução - Recusa do cliente
														</SelectItem>
														<SelectItem value="return_wrong_address">
															Em devolução - Endereço errado
														</SelectItem>
														<SelectItem value="return_unspecified">
															Em devolução - Sem especificação
														</SelectItem>
													</SelectGroup>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						{/* Resolution Section */}
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<CheckCircle2 className="h-5 w-5" />
								<h3 className="font-medium">Resolução</h3>
							</div>
							<Separator />
							<div className="grid gap-4">
								<FormField
									control={form.control}
									name="resolution_type"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Tipo de Resolução</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Selecione o tipo de resolução" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Reenvios e Substituições
														</SelectLabel>
														<SelectItem value="redelivery">
															Reentrega/Reenvio
														</SelectItem>
														<SelectItem value="replacement">
															Substituição
														</SelectItem>
														<SelectItem value="shipping">Envio</SelectItem>
														<SelectItem value="posting">Postagem</SelectItem>
													</SelectGroup>

													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Reembolsos
														</SelectLabel>
														<SelectItem value="refund">
															Reembolso/Estorno
														</SelectItem>
														<SelectItem value="freight_refund">
															Estorno de frete
														</SelectItem>
													</SelectGroup>

													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Endereço
														</SelectLabel>
														<SelectItem value="address_update">
															Atualização de endereço
														</SelectItem>
														<SelectItem value="collection">Coleta</SelectItem>
													</SelectGroup>

													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Vendas
														</SelectLabel>
														<SelectItem value="sale">Venda</SelectItem>
														<SelectItem value="gift_sending">
															Envio de brinde
														</SelectItem>
													</SelectGroup>

													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Contato e Verificação
														</SelectLabel>
														<SelectItem value="contact_customer">
															Contatar Cliente
														</SelectItem>
														<SelectItem value="check_delivery_status">
															Verificar status da entrega
														</SelectItem>
														<SelectItem value="confrontation">
															Acareação
														</SelectItem>
														<SelectItem value="dispute">Contestação</SelectItem>
													</SelectGroup>

													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Cancelamentos e Devoluções
														</SelectLabel>
														<SelectItem value="cancellation">
															Cancelamento
														</SelectItem>
														<SelectItem value="return">Devolução</SelectItem>
														<SelectItem value="delivery_suspension">
															Suspensão de entrega
														</SelectItem>
													</SelectGroup>

													<SelectGroup>
														<SelectLabel className="font-semibold px-2 py-1.5 text-sm">
															Outros
														</SelectLabel>
														<SelectItem value="other">Outro</SelectItem>
													</SelectGroup>
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="action_taken"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Ação Tomada</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Descreva a ação tomada para resolver..."
													className="min-h-[60px]"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						{/* Contact Section */}
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<Phone className="h-5 w-5" />
								<h3 className="font-medium">Contato</h3>
							</div>
							<Separator />
							<div className="grid gap-4">
								<FormField
									control={form.control}
									name="customer_contact"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Contato com Cliente</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Registre o contato com o cliente..."
													className="min-h-[60px]"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="carrier_protocol"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Protocolo da Transportadora</FormLabel>
											<FormControl>
												<Input placeholder="Digite o protocolo..." {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						{/* Notes Section */}
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<MessageCircle className="h-5 w-5" />
								<h3 className="font-medium">Anotações</h3>
							</div>
							<Separator />
							<div className="grid gap-4">
								<FormField
									control={form.control}
									name="observations"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Observações</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Digite as observações sobre o tratamento..."
													className="min-h-[100px]"
													{...field}
												/>
											</FormControl>
											<FormDescription>
												Descreva as observações importantes sobre o caso.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="internal_notes"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Notas Internas</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Notas internas da equipe..."
													className="min-h-[60px]"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						{/* Dates Section */}
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<Calendar className="h-5 w-5" />
								<h3 className="font-medium">Datas</h3>
							</div>
							<Separator />
							<div className="grid gap-4 sm:grid-cols-3">
								<FormField
									control={form.control}
									name="new_delivery_deadline"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Nova Data de Entrega</FormLabel>
											<FormControl>
												<Input type="date" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="resolution_deadline"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Data de Resolução</FormLabel>
											<FormControl>
												<Input type="date" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="follow_up_date"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Data de Acompanhamento</FormLabel>
											<FormControl>
												<Input type="date" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>

						<CardFooter className="px-0 pb-0">
							<div className="flex gap-4">
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										// Se não houver alterações, apenas volte sem atualizar
										if (!hasUnsavedChanges) {
											router.back();
											return;
										}

										const confirmLeave = window.confirm(
											'Existem alterações não salvas. Deseja realmente sair?'
										);
										if (confirmLeave) {
											router.back();
										}
									}}
								>
									Cancelar
								</Button>
								<Button type="submit" disabled={loading}>
									{loading ? 'Salvando...' : 'Salvar'}
								</Button>
							</div>
						</CardFooter>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
