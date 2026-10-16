# Verificação do megapacote

## Resultado automatizado

- Node: **92 testes aprovados**, 38 arquivos de teste, nenhuma falha, cancelamento ou teste ignorado.
- Python: **101 testes aprovados**, nenhuma falha. Permanece somente o aviso conhecido do openpyxl sobre cabeçalho/rodapé de uma planilha de fonte; ele não altera a apuração.
- Os dois scripts executáveis inline foram analisados com o parser JavaScript. O worker independente também foi analisado.
- Os hashes CSP de `_headers` correspondem exatamente aos scripts publicados.
- `python scripts/build-megapackage.py` executado duas vezes produziu os mesmos hashes de `index.html` e `_headers`.
- Testes preservam as rotas antigas, verificam a oitava área de navegação, os dois novos blocos exclusivamente na Executiva e os mapas principais anteriores.
- As verificações de fonte publicada continuam estritas: agora comparam o resultado exato da transformação determinística que envia explicações ao rodapé. Não foram simplesmente removidas.

## Dados reais, não demonstração

A auditoria independente leu todos os **129 cubos mensais de origem** e reconciliou as quantidades com o manifesto, sem divergências:

| Universo | Emplacamentos |
|---|---:|
| Todos os segmentos da fonte | 24.556.119 |
| Somente leves | 24.541.931 |
| Caminhões/ônibus adicionais em agosto de 2024 | 14.188 |
| Mitsubishi, todos os segmentos | 236.532 |
| Somente PICK-UP MID | 1.353.581 |
| Mitsubishi dentro de PICK-UP MID | 127.961 |
| Outras categorias PICK-UP excluídas desse recorte | 2.533.044 |

As 15.511.317 linhas compactadas dos cubos não foram usadas como medida: o cálculo soma `count`. As dez dimensões de agrupamento, origens, UFs, municípios de SP, pertencimento de marca, tecnologias, canais e interseções de filtros foram conferidos por somas independentes.

O canal desconhecido soma 4.159.147 registros, correspondentes aos 24 meses de 2016–2017; não foi convertido em varejo ou VD. No universo de todos os segmentos, a mudança de escopo em agosto de 2024 impede a comparação anual desse mês e o acumulado comparável que o contém. No universo de leves, são 129 quadros completos e 117 comparações anuais disponíveis. O acumulado de leves até setembro de 2026 é 2.156.654.

Conferência pontual de setembro de 2026: 268.721 leves, 1.729 Mitsubishi; picapes médias 12.719, incluindo 1.111 Mitsubishi. As 20.840 picapes pequenas do mês ficam fora do ranking de médias. A junção municipal mantém nomes sem correspondência na tabela, sem inventar códigos ou pontos.

## Casos de comportamento e robustez

- Somatória ponderada, denominador antes do Top N, empates, marca exata e modelos de múltiplas marcas.
- Interseção exata de PICK-UP MID com os demais filtros, sem relaxar os filtros globais.
- Acumulado reiniciado em janeiro; mês ausente, parcial ou com fonte indisponível permanece indisponível. Sinalizadores explícitos de incompletude prevalecem sobre metadados de datas contraditórios.
- YoY com base positiva e mês comparável, sem crescimento infinito; escalas fixas e testes com mais de 200 mil pontos.
- Reprodução não automática, passo manual, pausa, reinício, mudança de filtros, movimento reduzido e limpeza de timers/workers.
- Cancelamento de consultas antigas, invalidação de cache e impedimento de resultado atrasado sobrepor a consulta atual.
- Todas as quatro visualizações solicitam projeção de dados específica. Mudanças de dimensão, porte e visualização não vazam filtros locais indevidos.
- CSV com mês, universo, filtros, Top N, parâmetros, posições e margem de liderança; mapas incluem tecnologia selecionada e valores quantitativos.
- Geometria oficial, área proporcional ao volume, escala de mapa fixa, teclado, tabela exata, pesquisa e recuperação de carregamento municipal.
- Contraste por variáveis de texto/superfície dos temas, inclusive nos rótulos de composição e botões selecionados. Paletas e semântica Mitsubishi anteriores são mantidas.

## Memória e histórico completo

O teste de estresse identificou e corrigiu um problema antes da entrega: a resposta mantinha dimensões não usadas e a checagem de cache serializava a resposta inteira. Agora cada visualização agrega e retém somente seus campos, a checagem de tamanho para cedo sem serialização e os quadros mensais compartilham referências. O acumulado projetado não conserva uma segunda série mensal inutilizada. Os testes verificam a igualdade numérica das projeções contra a API completa em 14 combinações de visualização, nos modos mensal e acumulado.

A repetição independente com as opções realmente enviadas pela interface passou nos 129 meses para modelos (mensal/YoY e acumulado), composição tecnológica, origem, UFs e municípios de SP. A serialização de auditoria do ranking acumulado de modelos caiu de 359,63 MB para 62,66 MB; a de bolhas de modelos, de 279,50 MB para 156,83 MB. Esses números incluem aliases repetidos no JSON: a aplicação transmite referências compartilhadas e não realiza essa serialização. O teste do cache rejeitou os resultados grandes em 30–46 ms, sem criar o texto completo. Mapas de UF e composições pequenas cabem no orçamento de cache; modelos e municípios completos são rejeitados pelo limite quando necessário.

Os picos medidos em Node nas verificações projetadas ficaram aproximadamente entre 419 e 800 MB, incluindo as estruturas independentes de conferência e a serialização feita só pela auditoria. Não são medições do navegador nem promessa de consumo fixo. A suíte verifica diretamente a interrupção antecipada da medição de cache com os serializadores desativados.

Para reproduzir a auditoria dos dados, usar `node scripts/audit-animation-history.cjs`; `--report caminho.json` grava o detalhamento. Esse script portátil foi executado novamente nos 129 meses e terminou sem divergências.

O cache continua limitado. Carregamento de 129 meses, especialmente modelos e municípios, ainda exige processamento e memória; há progresso, cancelamento e uma janela inicial de 24 meses. A base inteira continua selecionável.

## Preservação e entrega

O manifesto final registra o commit-base, a verificação remota, os 82 caminhos do pacote anterior mantidos e o SHA-256 de cada arquivo. Nenhum cubo histórico, malha oficial existente ou manifesto principal de emplacamentos foi alterado. A integridade do ZIP e todos os hashes internos são verificados no empacotamento; cada arquivo fica abaixo de 25 MiB.

## Limite explícito

**Não houve validação visual em navegador real nesta execução.** O ambiente disponível bloqueou a inicialização normal do Chromium; não se contornaram as proteções. Testes de dados, componentes, ciclo de vida, CSS e estrutura responsiva não equivalem a comparação de pixels ou comprovação de todos os tamanhos de tela. Também não comprovam publicação: o pacote só está no ar depois que o fluxo autorizado de deploy terminar e o site for conferido.


## Otimização de período · etapa 1 (16/10/2026)

- Reconstrução cumulativa concluída com fontes dos workers sincronizadas, análise sintática dos scripts e hashes CSP recalculados.
- Suíte Node: 117 testes aprovados; Python: 101 testes aprovados. O teste adicional `performance-ui-build.test.py` verifica idempotência e sintaxe do HTML reconstruído.
- Testes dedicados cobrem reutilização de meses, extensão de período, limites de datas, filtros e projeções, resultados equivalentes ao cálculo sem cache, cache persistente simulado, falhas de armazenamento, limite de tamanho, expiração, invalidação, cancelamentos, filas compartilhadas, proteção de gráficos anteriores e exportação.
- A persistência foi testada por uma implementação assíncrona de IndexedDB simulada, não por navegador real. A validação visual e de rede permanece não executada neste ambiente.
- Medição local em Node de animação de marcas com comparação anual, agosto/2026: ver teste `animations-month-cache-real.test.cjs`. Repetição aquecida não leu novos cubos; ampliar até setembro leu somente setembro/2026 e setembro/2025. A saída completa foi igual à execução sem cache.
- Para tamanho dos dados, detalhes de arquitetura e limites, consultar `PERFORMANCE_STAGE1.md`.

- Teste adicional com os cubos reais de agosto/setembro de 2026 e comparação anual: mercado e catálogo+Mitsubishi com cache de resultado exato e cubos decodificados desativados. Repetir o período não carrega cubos; ampliar carrega apenas setembro/2025 e setembro/2026. Total ampliado de 531.775 registros, com igualdade completa contra execução sem cache. Teste do helper de produção valida Map/Set e structuredClone; no Node foi usado fallback em memória, sem alegar IndexedDB real.
