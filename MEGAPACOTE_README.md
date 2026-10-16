# Megapacote cumulativo · Mercado Automotivo

Este pacote substitui os ZIPs anteriores ainda não publicados. É uma sobreposição cumulativa, sem exclusões: copiar todos os arquivos para a raiz do repositório, preservando as pastas. Não apagar os dados já existentes. A preparação deste pacote não publica nem altera o site.

## Otimização de período · etapa 1

Esta versão incorpora reutilização de agregados mensais, serviços de cálculo mantidos durante a sessão, cache persistente limitado e gráficos anteriores identificados durante atualizações. Consulte `PERFORMANCE_STAGE1.md` para funcionamento, validação e limites. Não exige servidor novo e não promete primeira consulta instantânea.

## Novidades anteriores preservadas

- Nova oitava aba **Animações**, com quatro espaços: Corridas, Bolhas em movimento, Transformação do mercado e Brasil no tempo.
- Corridas mensais e acumuladas de janeiro ao mês, por marca/modelo/grupo de modelos; ranking de UFs pelo volume Mitsubishi. Top N ajustável, identificação Mitsubishi pela marca real da fonte e opção de mantê-la visível fora do Top N.
- **Picapes médias exclusivamente**: o universo de picapes exige `bd_segmento = PICK-UP MID`. Compactas, grandes e não classificadas não entram. SUVs têm recorte por carroceria e porte.
- Bolhas de participação × crescimento contra o mesmo mês do ano anterior, área proporcional ao volume e rastro opcional de seis meses. Eixos e áreas são fixados para a janela inteira, sem reescalonamento a cada quadro.
- Composição animada de propulsão, carroceria, porte, origem histórica de marcas, origem LOCAL/IMP e canal de venda. MHEV, parcerias locais e não informado são preservados como categorias distintas.
- Mapas animados de participação Mitsubishi por UF, eletrificação por tecnologia e concentração municipal em uma UF escolhida. Malhas/centróides oficiais, escala fixa e tabela de valores exatos.
- Linha do tempo da liderança, com líder, segundo colocado, empate e diferença mensal. Reprodução é opcional; controles de pausa, passo, velocidade, mês e intervalo. Movimento reduzido permite navegação manual. CSV inclui mês, parâmetros e universo.
- Em **Evolução → Executiva**, dois blocos adicionais: seleção interativa de faixa no histórico para recalcular a composição e curvas comparativas dos anos. O restante de Evolução foi preservado.
- Explicações longas organizadas em rodapés recolhíveis por análise; títulos, unidades, legendas e avisos essenciais permanecem junto dos gráficos. Ajustes responsivos preservam controles, tabelas e navegação.

## Conteúdo anterior mantido

Todas as entregas anteriores não publicadas continuam incluídas: fases 1–3 de análises retrospectivas/experimentais e suas fontes, catálogo adicional de 13 formatos de gráficos e 7 formatos de mapas, 14 temas solicitados e 5 legados, Segoe UI, mapas principais Brasil → UF → municípios com detalhes e aplicação explícita do filtro, canais e navegação compacta, filtros e rotas antigas.

Não inclui ativação da fase 4 de simulação econômica nem uma nova funcionalidade de metas. Mapa de fluxos não foi incluído por ausência da fonte necessária.

## Critérios dos dados

A medida é a soma de `count` dos cubos, não a quantidade de linhas compactadas. Na série completa, há 24.541.931 emplacamentos de leves; o total de todos os segmentos é 24.556.119. A diferença de 14.188 vem exclusivamente de caminhões/ônibus presentes em agosto de 2024. Comparações mantêm o mesmo universo e sinalizam alterações de escopo. Duplicidades retidas pela fonte continuam retidas; não há promessa de veículos únicos. As animações usam meses civis completos de uma janela local, substituindo somente o período global. Todos os demais filtros são mantidos. Retirar Marca/Modelo/Grupo exige marcar explicitamente a opção de comparação ampla.

Cobertura ausente, parcial ou indisponível não vira zero. O acumulado anual exige cobertura desde janeiro e reinicia a cada ano. Crescimento anual exige o mês anterior comparável, com base positiva; não há infinito quando a base é zero. Participações usam o universo filtrado inteiro antes do Top N. O canal não informado no começo da série permanece visível como desconhecido.

Origem histórica de marca não é país de fabricação. LOCAL/IMP é a classificação BD do veículo, mantida separadamente. Os pontos municipais representam centróides, não endereços. Não se adicionaram indicadores por 1.000 habitantes às animações; a referência populacional fixa de 2026 dos mapas anteriores permanece explicitamente identificada.

## Instalação e reconstrução

1. Conferir a base indicada em `MEGAPACOTE_MANIFEST.json` e o histórico remoto antes de aplicar. Se a base mudou, reconciliar primeiro.
2. Extrair e copiar os caminhos deste ZIP na raiz, sem criar uma pasta intermediária. Não excluir arquivos existentes.
3. Publicar pelo fluxo autorizado do projeto e conferir o site após o deploy.
4. Para reconstruir os blocos desta rodada: `python scripts/build-megapackage.py`. Esse comando atualiza os hashes CSP exatos de `_headers` e não publica nada.
5. Testes: `node --test tests/*.test.cjs` e `python -m unittest discover -s tests -p 'test_*.py'`.

Verificações exatas, contagens, hashes e limitações estão em `MEGAPACOTE_QA.md` e no manifesto. A validação visual em navegador real deve ser distinguida dos testes automatizados; não é presumida a partir deles.
