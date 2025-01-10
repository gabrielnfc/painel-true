export function getPriorityColor(priority: number): string {
  switch (priority) {
    case 1:
      return 'bg-green-100 text-green-800';
    case 2:
      return 'bg-blue-100 text-blue-800';
    case 3:
      return 'bg-yellow-100 text-yellow-800';
    case 4:
      return 'bg-orange-100 text-orange-800';
    case 5:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getPriorityLabel(priority: number): string {
  switch (priority) {
    case 1:
      return 'Baixa';
    case 2:
      return 'Média-Baixa';
    case 3:
      return 'Média';
    case 4:
      return 'Média-Alta';
    case 5:
      return 'Alta';
    default:
      return 'Não definida';
  }
} 