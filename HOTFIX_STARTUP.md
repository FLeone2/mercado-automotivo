# Correção de inicialização · 16/10/2026

Aplicar os arquivos desta correção na raiz do repositório, preservando as pastas. Não excluir a base de dados e não repetir o megapacote anterior por cima desta correção. O arquivo index.html e o arquivo _headers devem ser atualizados juntos, no mesmo commit.

Causa reproduzida: módulos auxiliares CommonJS incorporados substituíam module.exports dentro do módulo do painel. Ao finalizar a inicialização, DashboardContent e ReportContent estavam no objeto exports original, mas o carregador lia outro objeto e recebia DashboardContent indefinido. A correção restaura a identidade dos exports no limite final do módulo autoral; não depende de corrigir apenas um módulo auxiliar. O serviço de consultas também deixa de substituir essa identidade.

Correção adicional: acessar indexedDB pode lançar SecurityError em ambientes com armazenamento restrito. A inicialização agora captura essa falha e mantém o fallback limitado em memória, sem impedir a instalação do worker.

Verificação: execução do módulo autoral completo extraído do HTML final confirma os dois componentes exportados. O teste de regressão reproduz a falha removendo a correção. Os testes de cache incluem worker real com getter de IndexedDB restrito. Hashes CSP e trabalhadores incorporados foram reconstruídos.

A validação não é um teste visual em navegador: Chromium não inicia neste ambiente por restrição de socket. Não houve publicação automática nem alteração de Cloudflare ou da base histórica. Após publicar este commit, aguardar o deploy correspondente e recarregar o site para verificar visualmente.
