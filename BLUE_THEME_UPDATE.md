# Atualização integrada: tema azul e cabeçalho compacto

Este pacote contém todos os arquivos alterados desde o layout compacto já publicado (baseline local `da24531`, equivalente ao GitHub `b920385`). Extraia os arquivos na raiz do projeto, substituindo os existentes e mantendo a pasta `data/` já instalada. Não é um pacote completo para um projeto vazio.

## Incluído

- Tema adicional **Azul #3487FF · Segoe UI**, disponível no seletor de temas existente. Os demais temas permanecem disponíveis.
- Aparências clara, escura e do sistema pelo mecanismo existente, com a preferência salva junto à apresentação.
- Segoe UI como primeira opção no tema azul. A fonte precisa estar instalada no dispositivo; caso contrário é usada a fonte do sistema. Nenhum arquivo proprietário de fonte foi incorporado ou baixado.
- Superfícies translúcidas, cantos arredondados, brilho e controles azuis. Texto de links usa variantes de azul com contraste apropriado; o destaque base é #3487FF.
- Vermelho Mitsubishi, séries dos gráficos, ganhos/perdas e alertas preservados.
- Correção de cabeçalho anteriormente não publicada: remove a indicação de atualização e elimina a faixa vazia de 36 px da navegação nativa, reduzindo o espaço antes dos filtros. Datas e referências dos dados são mantidas.

## Manutenção e verificação

Fontes do novo tema: `src/blue-theme.json` e `src/blue-theme.css`. Execute `python scripts/build-blue-theme.py` após alterá-las. O build atualiza o HTML e os hashes CSP de `_headers`.

Verificações realizadas: testes JavaScript do projeto, 17 testes Python, sintaxe dos dois scripts executáveis, hashes CSP, contraste dos tokens em claro/escuro, aplicação e remoção do tema, persistência real com armazenamento em memória, reconstrução idempotente e integridade do ZIP.

Não foi possível concluir QA visual renderizado: o Chromium disponível encerrou na inicialização por restrição do ambiente (`socket() failed: Operation not permitted`). Revise no navegador desktop/mobile antes da publicação. Nenhum envio ao GitHub ou deploy foi realizado.
