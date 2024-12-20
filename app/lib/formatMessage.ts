import React from 'react';
import type { ReactNode } from 'react';

// Regex compilado para melhor performance
const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const EMOJI_TITLE_REGEX = /^📦.*#\d+/;
const EMOJI_SECTION_REGEX = /^[📅💼⚠️📝👤📍💳🚚📦🔍💬📱📧🏢🔢📋].*:/;
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
		result = React.createElement('p', {
			key: line,
			className: "text-xl font-bold mb-6"
		}, line);
	}
	// Seção com emoji
	else if (EMOJI_SECTION_REGEX.test(line)) {
		const [emoji, ...rest] = line.split(':');
		const content = rest.join(':').trim();
		
		if (!content) {
			result = React.createElement('p', {
				key: line,
				className: "text-lg font-semibold mb-4 mt-6"
			}, emoji);
		} else {
			// Verifica se é uma linha de rastreamento
			if (emoji.trim().includes('🔍')) {
				const urlMatch = content.match(URL_REGEX);
				const label = React.createElement('span', {
					key: 'label',
					className: "font-semibold text-foreground/90 min-w-[140px]"
				}, emoji.trim());

				const contentElement = urlMatch ? 
					React.createElement('a', {
						key: 'link',
						href: urlMatch[0],
						target: "_blank",
						rel: "noopener noreferrer",
						className: "text-primary hover:text-primary/80 underline ml-4"
					}, "Rastrear pedido") :
					React.createElement('span', {
						key: 'content',
						className: "ml-4 text-muted-foreground"
					}, content);

				result = React.createElement('p', {
					key: line,
					className: "mb-3 ml-4 flex items-center"
				}, label, contentElement);
			} else {
				const label = React.createElement('span', {
					key: 'label',
					className: "font-semibold text-foreground/90 min-w-[140px]"
				}, emoji.trim());

				const contentElement = React.createElement('span', {
					key: 'content',
					className: "ml-4"
				}, content);

				result = React.createElement('p', {
					key: line,
					className: "mb-3 ml-4 flex items-center"
				}, label, contentElement);
			}
		}
	}
	// Item do pedido
	else if (NUMBER_X_REGEX.test(line)) {
		const bullet = React.createElement('span', {
			key: 'bullet',
			className: "mr-2"
		}, "•");

		const contentElement = React.createElement('span', {
			key: 'content'
		}, line);

		result = React.createElement('p', {
			key: line,
			className: "mb-2 ml-8 text-sm flex items-center"
		}, bullet, contentElement);
	}
	// Campo com label
	else if (line.includes(':')) {
		const [label, ...rest] = line.split(':');
		const value = rest.join(':').trim();
		
		if (label.trim().match(LABEL_REGEX)) {
			const labelElement = React.createElement('span', {
				key: 'label',
				className: "font-semibold text-foreground/90 min-w-[140px]"
			}, label.trim());

			const contentElement = React.createElement('span', {
				key: 'content',
				className: "ml-4"
			}, value);

			result = React.createElement('p', {
				key: line,
				className: "mb-3 ml-4 flex items-center"
			}, labelElement, contentElement);
		} else {
			result = React.createElement('p', {
				key: line,
				className: "mb-3 ml-4"
			}, line);
		}
	}
	// Linha em branco
	else if (line.trim() === '') {
		result = React.createElement('div', {
			key: line,
			className: "h-4"
		});
	}
	// Outras linhas
	else {
		result = React.createElement('p', {
			key: line,
			className: "mb-3 ml-4"
		}, line);
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

	// Remove apenas os delimitadores de código markdown
	const cleanText = text.replace(/```markdown\n|```/g, '').trim();

	// Divide o texto em linhas e processa cada uma
	const lines = cleanText.split('\n');

	return lines.map((line, index) => {
		// Se for uma linha em branco, adiciona espaçamento
		if (line.trim() === '') {
			return React.createElement('div', {
				key: `space-${index}`,
				className: "h-2"
			});
		}

		// Se for uma seção com emoji, adiciona mais espaçamento antes
		if (EMOJI_SECTION_REGEX.test(line)) {
			const space = React.createElement('div', {
				key: 'space',
				className: "h-4"
			});
			
			return React.createElement(React.Fragment, {
				key: `section-${index}`
			}, space, processLine(line.trim()));
		}

		return processLine(line.trim());
	});
}; 