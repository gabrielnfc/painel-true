export function formatCurrency(value: string | number): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue);
}

function formatDocument(doc: string | null | undefined): string {
  if (!doc) return 'Documento não disponível';
  
  // Remove caracteres não numéricos
  const numbers = doc.replace(/\D/g, '');
  
  // Verifica se é CPF (11 dígitos) ou CNPJ (14 dígitos)
  if (numbers.length === 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (numbers.length === 14) {
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  return doc; // Retorna o documento original se não conseguir formatar
}

export function formatCustomerData(customerJson: string | null | undefined) {
  if (!customerJson) {
    console.log('Dados do cliente não fornecidos');
    return {
      name: 'Nome não disponível',
      document: 'Documento não disponível',
    };
  }

  try {
    let customer;
    
    // Tenta fazer o parse do JSON
    try {
      customer = typeof customerJson === 'string' ? JSON.parse(customerJson) : customerJson;
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON do cliente:', {
        error: parseError,
        customerJson: typeof customerJson === 'string' ? customerJson.substring(0, 100) + '...' : 'não é string'
      });
      return {
        name: 'Nome não disponível',
        document: 'Documento não disponível',
      };
    }
    
    // Log para debug
    console.log('Dados do cliente parseados:', {
      nome: customer.nome || 'não fornecido',
      documento: customer.cpf_cnpj || customer.cnpj || customer.cpf || 'não fornecido',
      estrutura: JSON.stringify(customer, null, 2)
    });
    
    // Tenta obter o documento em diferentes formatos
    const document = formatDocument(
      customer.cpf_cnpj || 
      customer.cnpj || 
      customer.cpf || 
      customer.documento || 
      customer.document
    );
    
    return {
      name: customer.nome || customer.name || 'Nome não disponível',
      document,
    };
  } catch (error) {
    console.error('Erro ao formatar dados do cliente:', {
      error,
      customerJson: typeof customerJson === 'string' ? customerJson.substring(0, 100) + '...' : 'não é string'
    });
    return {
      name: 'Nome não disponível',
      document: 'Documento não disponível',
    };
  }
} 