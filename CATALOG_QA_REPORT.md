# QA · atualização cumulativa

Verificado em 16/10/2026. Sem publicação externa.

## Aprovado

- 23 arquivos de testes Node, incluindo todas as 17 suítes legadas e seis suítes novas de catálogo.
- 27 testes unitários/renderização dos gráficos: conservação, áreas, hierarquia, empates, zero, ausência, Sankey, Pareto, waffle e decomposição exata.
- 101 testes Python das fases 1–3 e base existente.
- Consulta real do worker incorporado → adaptador → todos os 13 renderizadores: setembro de 2026, automóveis + comerciais leves, 268.721 registros e 1.729 Mitsubishi. Sankey: 4.959 combinações exatas. Segmento/marca/modelo: 1.161. Pareto: 9.746 linhas em universo comum mercado/MIT. Nenhuma geometria não finita.
- Ranking com 250.000 células incluindo zeros e renderização bump: cerca de 0,44 s no teste local. Pareto de 6.000 entidades: cerca de 9 ms. Não são promessas de desempenho em todos os dispositivos.
- Denominadores populacionais derivados do catálogo oficial completo: 5.571 municípios, 27 UFs e 214.211.951 residentes em 2026. Nenhuma seleção de vendas elimina residentes do denominador de UF; rótulos, fonte, ano e três casas decimais preservados.
- Sete modos de mapa, junções municipais não ambíguas, conservação de hexbin, áreas proporcionais, altura linear/log, referências, cobertura e taxas com base zero.
- Limites de enquadramento 3D testados com todos os vértices oficiais nas rotações −180/−90/0/90/180°, inclinação 0,25/1 e alturas 0/110. Zoom deliberadamente amplia o desenho; botão de reset restabelece enquadramento completo.
- 19 aparências, sendo 14 solicitadas e cinco legadas; 24 paletas novas claro/escuro com contraste AA de texto/botões; aplicação/reset, persistência e falha de armazenamento testados. Cores semânticas mantidas.
- Build idempotente; sintaxe dos dois scripts executáveis; hashes CSP exatos. Nenhuma dependência de rede adicionada.
- 349 blobs do HEAD local conferidos por hash Git com árvore remota oficial `890f2f877567fe770b327549e1535f447cd5794d`.
- Dados originais, geografia e manifesto de emplacamentos inalterados. A extensão opcional do worker é testada contra sua resposta legada sem flag, mantendo resultados anteriores.

## Auditoria independente e correções

Foram corrigidos: 0/0 no waffle; excesso de argumentos em Math.max com séries grandes; buscas quadráticas em ranking/Pareto; área 100% vazia em seleção de um único mês; eixo de crescimento zero ausente; rótulos longos; clipping padrão dos mapas 3D.

Três testes legados de tema/layout tinham a premissa antiga “worker nunca muda”. Essa premissa foi removida somente para a extensão autorizada; a invariância dos dados permanece testada, e a saída legada do worker tem novo teste de equivalência.

## Denominadores e indisponibilidades explícitas

- Normalização por população: usa denominador fixo IBGE/SIDRA 2026 explicitamente rotulado, não população histórica contemporânea. Junções ausentes/ambíguas e incompatibilidades territoriais ficam N/D; nenhum denominador é inferido dos municípios com vendas.
- Comparação anual sem período/universo compatível: N/D, nunca zero inventado.
- Cubos sem dimensão conjunta ou limites de memória excedidos: indisponibilidade declarada, sem produtos de marginais nem truncamento de totais.
- Sem calendário de dias úteis validado; mapa de calor mede volume mensal.
- Nenhum mapa de fluxo, dado de compradores, rota logística ou nova simulação.

## Não executado

QA de pixels e interação em navegador renderizado. Chromium e navegador cloud tiveram restrições confirmadas anteriormente; não houve contorno dessas restrições. Os testes de componentes não substituem o teste visual desktop/mobile no site após upload.

Nenhum push/deploy foi feito. Sucesso dos testes de software não altera o caráter experimental/retrospectivo das previsões das fases 1–3.

## 16/10/2026 · Mapas principais cumulativos

- Mesmo componente principal em Panorama e Territórios; sem sincronização automática entre seus contextos.
- Novo teste funcional de handlers e fonte real: seleção de todas as 27 UFs, cidade abre detalhes, filtro só por botão explícito, hover/foco sem seleção, teclado e estados pendentes.
- Dados reais de setembro/2026: 268.721 emplacamentos nacionais, 1.729 Mitsubishi. Todas as 27 malhas municipais passam limites geométricos, com 5.570 polígonos. A lista de população inclui 5.571 municípios e o município sem polígono continua acessível, sem ponto inventado.
- Denominador fixo2026 integral: 214.211.951 residentes; invariante sob filtro de marca. Limite visual de 150 bolhas não trunca consultas/tabelas.
- 101 testes Python de fontes/modelos passaram. Novos testes Node incluem persistência independente por aba, preservação de URL/hash e rejeição de estado malformado.
- Tentativa única de Chromium headless com sandbox habilitado não iniciou (crashpad/process_singleton). Nenhum teste visual real ou screenshot é declarado. Layout responsivo, teclado e redução de movimento possuem contratos estáticos; conferir o preview antes de publicar.
- Main oficial reconfirmado somente leitura: `9bbf173818d82207f5d3e66340ac1660953d3755`, 16/10/2026 às 01:20 UTC. Nenhum push/deploy.

Resultado final do conjunto Node: 51 casos aprovados em 25 arquivos de teste (inclui os dois novos arquivos de mapas principais). As três asserções antigas de montagem foram atualizadas para o componente compartilhado autorizado; as demais regressões permanecem.
