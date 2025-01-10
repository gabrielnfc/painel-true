import { cacheWrapper } from '../lib/redis';

async function testRedis() {
  try {
    console.log('Testando conexão com Redis...');

    // Teste de escrita
    await cacheWrapper.set('test-key', 'test-value', 60);
    console.log('✓ Escrita no Redis OK');

    // Teste de leitura
    const value = await cacheWrapper.get('test-key');
    if (value === 'test-value') {
      console.log('✓ Leitura do Redis OK');
    } else {
      console.error('✗ Erro na leitura do Redis');
    }

    console.log('Teste concluído com sucesso!');
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

// Executar teste
testRedis(); 