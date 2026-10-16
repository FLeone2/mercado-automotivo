# Dois gráficos adicionais · Evolução → Executiva

Os dois blocos ficam na Executiva, conforme a escolha final. São recolhíveis e não substituem os gráficos existentes.

## Explorar período

- Botão “Selecionar faixa” ativa o retângulo e suas duas alças no histórico.
- Arraste com mouse/toque ou ajuste os campos mensais. Alças aceitam setas, Page Up/Down, Home/End. “Limpar faixa” restaura o intervalo inteiro.
- A faixa é inclusiva; o histórico de contexto não se reduz ao arrastá-la.
- Barras por carroceria, porte original da fonte, combustível ou marca.
- Participação calculada pela soma ponderada dos emplacamentos, nunca por média de percentuais mensais. Os filtros globais, inclusive marca, são respeitados e definem o denominador. A faixa não altera filtros, URL ou outros gráficos.
- Seleção local é recalculada sem nova consulta de cubos. Mudanças globais usam o cancelamento e a rejeição de respostas antigas do hook existente.

## Comparar anos

- Curvas janeiro–dezembro, seleção de anos e botão de destaque; os outros anos ficam atenuados.
- O período global é mantido inicialmente. A opção explícita “Comparar todo o histórico” amplia somente este gráfico e mantém os demais filtros.
- Últimos três anos disponíveis como padrão; o último ponto observado fica marcado. Lacunas e meses futuros não viram zeros.
- Acumulado comparável usa apenas os mesmos meses completos presentes em todos os anos selecionados. Recortes parciais de mês são identificados e excluídos desse acumulado.
- Tabela exata e CSV incluem o recorte e cobertura.

## Integração e preservação

Build: `python scripts/build-interactive.py`. Ele incorpora os dois módulos/CSS, a extensão opcional do worker e atualiza os hashes CSP. Execução repetida é idempotente.

O worker recebe `includeInteractive`, isolado no cache e ativado só ao abrir os blocos. Produz `result.interactive` com cobertura por mês e composições mensais nas quatro dimensões. A resposta sem a opção é idêntica à anterior.

Em relação ao ZIP cumulativo anterior de 82 arquivos: nenhuma remoção; apenas `index.html`, `_headers` e `src/evolution-market-worker.js` alterados nesta etapa. Os novos módulos, testes, build e esta nota são adicionais. Os dados originais permanecem intactos.

## Validação e limites

Testes de dados, componentes/handlers e estrutura renderizada em memória passaram: seleção inversa/cruzamento de anos, mouse/toque via pointer capture, teclado, limpeza, percentuais ponderados, filtros, zeros, lacunas, períodos parciais, seleção/foco de anos e CSV. Regressão: 54 casos Node em 28 arquivos, mais o novo teste de fonte real aprovado separadamente (55 casos em 29 arquivos antes das animações); 101 testes Python aprovados. Fonte real: setembro/2026 com 268.721 emplacamentos nacionais e 1.729 Mitsubishi; as quatro composições reconciliam exatamente. Comparação do mesmo mês: setembro/2025 com 231.370 e setembro/2026 com 268.721. Substituição/cancelamento de consultas não publica respostas obsoletas. O pacote consolidado deve repetir a regressão após integrar as animações.

Não foi executado navegador renderizado nem QA visual de pixels. Os testes de componentes não substituem a conferência visual desktop/mobile no preview após upload. Nenhuma nova dependência externa, publicação ou push foi realizada nesta etapa.
