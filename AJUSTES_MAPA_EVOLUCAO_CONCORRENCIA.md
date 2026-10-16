# Atualização incremental: navegação e análises

Aplicar os arquivos deste ZIP na raiz do mesmo repositório, preservando os caminhos das pastas. Substituir os arquivos correspondentes; não apagar arquivos anteriores nem enviar o ZIP como arquivo único para o site. Esta atualização parte da versão que já inclui a correção da tela em branco. Não exige reenviar os dados históricos.

## Mapa e filtros municipais

- O filtro municipal utiliza o nome exato da fonte. O sufixo visual “· UF” deixa de contaminar o filtro; links antigos com esse sufixo são corrigidos quando a UF é compatível.
- O mapa de contexto nacional fica separado da atualização dos gráficos filtrados. Alternar UF mantém o mesmo pedido nacional e os controles do mapa disponíveis.
- Inspecionar uma cidade continua diferente de aplicar seu filtro. Ao aplicar, o contexto municipal passa a ser compartilhado pelos indicadores e gráficos.
- Geometrias e centroides são reaproveitados, cálculos de exibição são memoizados e respostas atrasadas de uma UF não substituem a UF atual. Mapa e carregamento mantêm a mesma altura, respeitando a preferência por movimento reduzido.
- Campo de busca e botões da tabela municipal deixam de herdar o tamanho dos controles do mapa.

## Evolução

- Gráficos ocupam a largura disponível; observações ficam em linhas abaixo deles.
- “Últimos 3 anos” passa a solicitar os três anos disponíveis mais recentes até a data final selecionada, preservando os demais filtros. O período local fica explícito na comparação e na exportação.
- O ano de 2026 termina na cobertura disponível. Meses ausentes não são convertidos em zero.

## Concorrência

- Observações ficam abaixo dos gráficos.
- A tabela de modelos inclui “Variação” e “Δ participação”, calculadas pelos mesmos campos já usados nas comparações de marcas.

## Filtros dos formatos adicionais

- Barra reutilizável nas áreas do catálogo: busca sem distinção de acentos, dimensões realmente disponíveis, Top 5/10/12/20 e destaques de múltiplas marcas nos formatos compatíveis.
- Nas barras divergentes, escolha entre unidades, variação percentual e pontos percentuais.
- Formatos com composição ou métrica fixa mantêm sua definição; nesses casos a busca atua apenas na tabela. Pareto preserva o universo completo.
- Recorte global e controles locais aparecem separados. Top N, destaques e busca não recalculam artificialmente denominadores ou posições. A exportação registra os filtros e corresponde à tabela exibida.
- Seletores, cartões e tabelas recebem estilos consistentes com o tema.

## Limites e validação

A resposta inicial ainda depende de baixar, descompactar e agregar os dados necessários. O cache não transforma uma primeira consulta longa em resposta instantânea. A atualização preserva a correção de inicialização, o tratamento de dados ausentes e os denominadores originais das análises.

A validação automatizada inclui execução do módulo real de inicialização, testes de componentes e consulta sobre os dados locais. Para Salvador/BA, janeiro a setembro de 2026, o total independente da fonte é 29.320 e coincide com o indicador filtrado, a soma da evolução diária e a soma por marcas. Os testes anuais distinguem zero e ausência e limitam 2026 aos meses disponíveis. Não houve medição de fluidez em navegador real neste ambiente; a revisão visual final deve ser feita no navegador após a atualização.
