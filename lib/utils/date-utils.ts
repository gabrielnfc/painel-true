import { differenceInDays, parseISO, format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function calculateDaysDelayed(estimatedDate: string | Date): number {
  const parsedDate = typeof estimatedDate === 'string' ? parseISO(estimatedDate) : estimatedDate;
  const today = new Date();
  return differenceInDays(today, parsedDate);
}

export function formatDate(date: string | Date | null, formatString: string = 'dd/MM/yyyy'): string {
  if (!date) return 'Não definida';
  
  try {
    // Se já é um objeto Date
    if (date instanceof Date) {
      return format(date, formatString, { locale: ptBR });
    }

    // Se é uma string
    if (typeof date === 'string') {
      // Se já está no formato brasileiro (DD/MM/YYYY)
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        return date;
      }

      // Se está no formato ISO
      if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
        const parsedDate = parseISO(date);
        return format(parsedDate, formatString, { locale: ptBR });
      }

      // Tenta converter outros formatos
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return format(parsedDate, formatString, { locale: ptBR });
      }
    }

    return 'Data inválida';
  } catch (error) {
    console.error('Erro ao formatar data:', error, { date });
    return 'Data inválida';
  }
}

export function formatDateTime(date: string | Date): string {
  if (!date) return 'Não definida';
  
  try {
    // Se já é um objeto Date
    if (date instanceof Date) {
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    }

    // Se é uma string
    if (typeof date === 'string') {
      // Se já está no formato brasileiro com hora
      if (/^\d{2}\/\d{2}\/\d{4}\s/.test(date)) {
        const parsedDate = parse(date, "dd/MM/yyyy 'às' HH:mm", new Date());
        return format(parsedDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      }

      // Se está no formato ISO
      if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
        const parsedDate = parseISO(date);
        return format(parsedDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      }

      // Tenta converter outros formatos
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return format(parsedDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      }
    }

    return 'Data inválida';
  } catch (error) {
    console.error('Erro ao formatar data e hora:', error, { date });
    return 'Data inválida';
  }
}

export function getRelativeDelay(daysDelayed: number): string {
  if (daysDelayed <= 0) return 'No prazo';
  if (daysDelayed === 1) return '1 dia de atraso';
  return `${daysDelayed} dias de atraso`;
} 