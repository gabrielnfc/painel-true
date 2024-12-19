import React from 'react';
import type { ReactNode } from 'react';

// Regex compilado para melhor performance
const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const EMOJI_TITLE_REGEX = /^📦.*#\d+/;
const EMOJI_SECTION_REGEX = /^[📅💼⚠️📝👤📍💳🚚📦🔍💬📱📧🏢].*:/;
const NUMBER_X_REGEX = /^\d+x/;
const LABEL_REGEX = /^[A-Za-zÀ-ÿ\s]+$/;

// Cache de processamento de linhas para melhor performance
const processedLinesCache = new Map<string, ReactNode>();

// Função para processar uma linha individual
const processLine = (line: string): ReactNode => {
	// Verifica se a linha já está no cache
	const cached = processedLinesCache.get(line);
	if (cached) return cached;

	let result: ReactNode;

	// Título principal (número do pedido)
	if (EMOJI_TITLE_REGEX.test(line)) {
		result = (
			<p key={line} className="text-lg font-semibold mb-4">
				{line}
			</p>
		);
	}
	// Seção com emoji
	else if (EMOJI_SECTION_REGEX.test(line)) {
		const [emoji, ...rest] = line.split(':');
		const content = rest.join(':').trim();
		
		if (!content) {
			result = (
				<p key={line} className="text-base font-semibold mb-3 mt-4">
					{emoji}
				</p>
			);
		} else {
			result = (
				<p key={line} className="mb-2 ml-4">
					<span className="font-semibold text-foreground/90 min-w-[140px] inline-block">
						{emoji.trim()}
					</span>
					<span className="ml-2">{content}</span>
				</p>
			);
		}
	}
	// URL de rastreamento
	else if (line.toLowerCase().includes('rastreamento')) {
		const urlMatch = line.match(URL_REGEX);
		if (urlMatch) {
			result = (
				<p key={line} className="mb-2 ml-4">
					<span className="font-semibold text-foreground/90 min-w-[140px] inline-block">
						🔍 Rastreamento
					</span>
					<a
						href={urlMatch[0]}
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-500 hover:text-blue-600 underline ml-2"
					>
						Rastrear Pedido
					</a>
				</p>
			);
		} else if (line.includes('Rastrear Pedido')) {
			result = (
				<p key={line} className="mb-2 ml-4">
					<span className="font-semibold text-foreground/90 min-w-[140px] inline-block">
						🔍 Rastreamento
					</span>
					<span className="ml-2">Aguardando código de rastreio</span>
				</p>
			);
		}
	}
	// Item do pedido
	else if (NUMBER_X_REGEX.test(line)) {
		result = (
			<p key={line} className="mb-2 ml-6 text-sm">
				• {line}
			</p>
		);
	}
	// Campo com label
	else if (line.includes(':')) {
		const [label, ...rest] = line.split(':');
		const value = rest.join(':').trim();
		
		if (label.trim().match(LABEL_REGEX)) {
			result = (
				<p key={line} className="mb-2 ml-4">
					<span className="font-semibold text-foreground/90 min-w-[140px] inline-block">
						{label.trim()}
					</span>
					<span className="ml-2">{value}</span>
				</p>
			);
		} else {
			result = <p key={line} className="mb-2 ml-4">{line}</p>;
		}
	}
	// Linha em branco
	else if (line.trim() === '') {
		result = <p key={line} className="mb-2" />;
	}
	// Outras linhas
	else {
		result = (
			<p key={line} className="mb-2 ml-4">
				{line}
			</p>
		);
	}

	// Armazena no cache
	processedLinesCache.set(line, result);
	return result;
};

// Limpa o cache quando atinge um certo tamanho
const clearCacheIfNeeded = () => {
	if (processedLinesCache.size > 1000) {
		processedLinesCache.clear();
	}
};

// Função principal otimizada
export const formatMessageWithLinks = (text: string): ReactNode[] => {
	clearCacheIfNeeded();

	const cleanText = text
		.replace(/```markdown\n|```/g, '')
		.replace(/\*\*/g, '')
		.trim();

	return cleanText.split('\n').map(processLine);
}; 