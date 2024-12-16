import { OpenAI } from 'openai';
import { bigQueryService } from '@/lib/bigquery';
import { NextResponse } from 'next/server';
import { systemPrompt } from '@/lib/prompts/system-prompt';

export async function POST(req: Request) {
	try {
		// Check for API key before processing
		if (!process.env.OPENAI_API_KEY) {
			console.error('OpenAI API key is missing. Please add OPENAI_API_KEY to your environment variables.');
			return NextResponse.json(
				{ error: 'OpenAI API key is not configured. Please contact the administrator.' },
				{ status: 500 }
			);
		}

		// Initialize OpenAI client
		const openai = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		});

		const { messages } = await req.json();

		// Verifica se há um número de pedido na última mensagem
		const lastMessage = messages[messages.length - 1].content;
		
		// Primeiro tenta encontrar um número com hífen (para numero_ordem_compra)
		let orderMatch = lastMessage.match(/\b\d+(?:-\d+)?\b/);
		let isOrderNumberSearch = false;

		// Se não encontrou com hífen, procura apenas números
		if (!orderMatch) {
			orderMatch = lastMessage.match(/\b\d+\b/);
		} else {
			// Se encontrou com hífen, verifica se é realmente um número de ordem de compra
			isOrderNumberSearch = lastMessage.toLowerCase().includes('ordem') || 
				lastMessage.toLowerCase().includes('compra') ||
				lastMessage.includes('-');
		}

		let additionalContext = '';
		if (orderMatch) {
			try {
				// Se não for busca por número de ordem de compra, remove o hífen
				const searchValue = isOrderNumberSearch 
					? orderMatch[0] 
					: orderMatch[0].replace(/-/g, '');

				const results = await bigQueryService.searchOrder(searchValue);
				if (results && results.length > 0) {
					additionalContext = `\nEncontrei o seguinte pedido:\n${JSON.stringify(
						results[0],
						null,
						2
					)}`;
				} else {
					additionalContext = `\n❌ Não encontrei nenhum pedido com o número fornecido: ${searchValue}.\n` +
						'⚠️ O número foi informado corretamente? Por favor, verifique e me envie novamente.\n\n' +
						'🔍 Lembre-se que você pode buscar por:\n' +
						'- ID do pedido (apenas números)\n' +
						'- Número do pedido (apenas números)\n' +
						'- ID da nota fiscal (apenas números)\n' +
						'- Número da ordem de compra (pode conter hífen, exemplo: 1234567890-01)';
				}
			} catch (error) {
				console.error('Erro ao buscar pedido:', error);
				additionalContext = '\n❌ Ocorreu um erro ao buscar o pedido. ' +
					'⚠️ Por favor, verifique se o número foi informado corretamente e tente novamente.';
			}
		}

		const completion = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [
				{
					role: 'system',
					content: systemPrompt + additionalContext,
				},
				...messages,
			],
		});

		return NextResponse.json({
			message: completion.choices[0].message.content,
		});
	} catch (error) {
		console.error('Erro na rota de chat:', error);
		return NextResponse.json(
			{ error: 'Erro ao processar a mensagem' },
			{ status: 500 }
		);
	}
} 