# Atualização cumulativa · Mapas principais, Cenários, gráficos e aparências

Este pacote substitui todos os ZIPs anteriores ainda não publicados, incluindo Cenários fases 1–3 e o catálogo de gráficos/mapas/temas. Consulte PRIMARY_MAP_UPDATE.md para os novos mapas principais em Panorama e Territórios. Contém essa atualização completa e os novos formatos adicionais. Foi preparado sobre o main oficial `9bbf173818d82207f5d3e66340ac1660953d3755`; seus 349 arquivos de base foram verificados contra os hashes da árvore remota em 16/10/2026.

## Instalação manual

Extraia e envie os arquivos à raiz do mesmo repositório, preservando os caminhos e substituindo os arquivos correspondentes. Não apague os demais arquivos: é um overlay, não um projeto vazio completo. Os cubos originais e as malhas existentes não estão repetidos. Não é necessário aplicar o ZIP anterior antes deste.

Não foi realizado push, publicação nem preview público. Antes de publicar, execute as verificações abaixo. O site oficial continuará no fluxo GitHub/Cloudflare já existente.

## Onde estão as novidades

Os gráficos, filtros e menus anteriores permanecem. Os mapas principais de Panorama e Territórios foram aprimorados conforme solicitado; o catálogo adicional permanece disponível. Abra “Explorar formatos adicionais” ao fim de uma área. A consulta extra só começa depois de abrir esse painel; fechá-lo encerra seu worker. O seletor apresenta apenas formatos compatíveis com a área.

- Panorama: treemap, waffle e decomposição mercado/participação.
- Evolução: ranking mensal bump, calor mês × ano e extensão da área 100% já existente.
- Concorrência/Ranking: bump, slope, dumbbell, divergentes, share × crescimento, Pareto e cascata quando disponível.
- Segmentos/Estrutura: Marimekko, treemap, Sankey, composição mensal e waffle.
- Territórios: sete mapas adicionais, Pareto, dumbbell e divergentes.
- Explorar: os 13 formatos, com dimensões compatíveis em cada caso.
- Cenários: análises descritivas adicionais dos registros observados. Elas respeitam os filtros globais, separadamente dos modelos experimentais congelados já existentes. Não são novas previsões.

## 13 formatos de gráfico

Bump mensal; slope de participação A/B; dumbbell de volume A/B; Marimekko; treemap segmento → marca → modelo; waffle exato; área empilhada 100%; calor mês × ano; barras divergentes em unidades/%/p.p.; Sankey de composição modelo → canal → região; bolhas share × crescimento; cascata aritmética mercado/participação; Pareto de concentração com universo comum.

A = mesmos dias do ano anterior; B = atual. Comparação ausente ou incompatível permanece indisponível. Zero não é ausência. Participações sem denominador positivo não são calculadas. Os comparativos visuais limitam entidades para leitura e mantêm a base integral na tabela. A grade waffle usa célula parcial para participações pequenas. Pareto não é Lorenz nem Gini; Sankey não mede migração nem logística.

A classificação segmento usa Classe BD quando disponível e identifica a alternativa da fonte quando necessário. Não se reconstrói um cruzamento a partir de marginais. Limites de memória nos cruzamentos e séries são explícitos, sem truncamento silencioso; reduza o período ou filtre se necessário.

## Sete mapas

Coroplético; bolhas municipais proporcionais por área; hexbin de centroides; grade das 27 UFs; bivariado 3×3 mercado × participação Mitsubishi; espigões municipais 3D; estados extrudados 3D. Mapa de fluxo não faz parte do pacote.

Os contornos existentes são derivados do IBGE. As formas municipais carregam uma UF por vez, com seleção local da malha, para não carregar todas as geometrias. Centroides são derivados de polígonos, não endereços de compradores; junções ambíguas ficam na tabela como não associadas.

Nos visuais 3D, coordenadas e alturas são projetadas matematicamente em SVG. Há rotação, inclinação, zoom, escala linear/logarítmica e alternativa 2D. Não usam terreno, WebGL nem endereço individual. As alturas representam volume e as cores têm legenda independente. Hexágonos têm mesma área na projeção gráfica da UF, não são apresentados como km² reais nem comparáveis entre projeções estaduais.

Cor: participação da seleção, participação Mitsubishi ou crescimento anual quando comparável. A opção por mil habitantes usa a população oficial de 2026 como denominador fixo, com fonte e ano explícitos. Mede o volume do período selecionado por 1.000 residentes de 2026; não é anualizada nem uma estimativa da população contemporânea de períodos antigos. O denominador de UF inclui todos os municípios oficiais, independentemente dos registros ou filtros de marca/modelo. Junções municipais ambíguas ou com incompatibilidade territorial ficam indisponíveis. Os indicadores do pacote experimental/retrospectivo de Potencial regional permanecem separados. O bivariado usa tamanho de mercado × share Mitsubishi, não renda municipal inferida.

## Aparências

O seletor existente contém 19 opções: 14 solicitadas e 5 legadas preservadas. As solicitadas são Verde profundo, Azul #3487FF, Aqua Clean, Sálvia, Areia, Azul Noturno, Lavanda Suave, Grafite, Oliva, Terra, Vista/Aurora, Windows XP, Windows 95 e Vidro Azul. Preferência e aparência clara/escura/sistema usam o armazenamento existente. Segoe UI é a primeira fonte global, com fallback local do sistema; nenhuma fonte proprietária foi baixada.

Cores semânticas de Mitsubishi, marcas e sinais permanecem independentes das superfícies dos temas. Os conceitos visuais são implementações em CSS, não imagens de fundo contendo dados ilustrativos.

## Auditoria e exportação

Títulos, períodos, método, valores exatos e filtros acompanham o catálogo. CSV de gráfico contém método e recorte; tabelas conservam os valores completos antes dos agrupamentos visuais. Referência de mercado/Mitsubishi remove somente Marca, Modelo e Grupo de modelos, preservando os demais filtros. Composição dentro do recorte usa seu total próprio, explicitamente descrito.

As fases 1–3 mantêm seus avisos de resultado experimental, cobertura de intervalos e base histórica revisada. As fases 4–5 e simulações continuam desativadas. Testes de software não validam previsões comercialmente.

## Reproduzir e verificar

1. `python scripts/build-catalog.py` incorpora o catálogo, temas e worker e regenera hashes CSP.
2. `for f in tests/*.test.cjs; do node "$f" || exit; done`
3. `OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 python -m unittest discover -s tests -p 'test*.py'`
4. Após alterar Cenários ou outras fontes mantidas, execute seus builds e por último `build-catalog.py`.

Nenhuma dependência remota adicional foi introduzida. O build é idempotente e preserva a política CSP. Consulte CATALOG_QA_REPORT.md e CATALOG_OVERLAY_MANIFEST.json para resultados e inventário.

## Limite de verificação visual

A inspeção renderizada no navegador não foi executada: o Chromium do executor e o navegador cloud tinham bloqueios confirmados, que não foram contornados. Os testes cobrem cálculo, componentes, controles e contratos de layout, mas não substituem a conferência de pixels no navegador real. Após upload, confira desktop/celular, claro/escuro, todos os formatos, UF municipal, rotação/zoom, troca repetida de filtros e exportações.
