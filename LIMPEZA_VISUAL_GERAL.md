# Atualização visual integrada

Base: 9be671cff5631f5413b6f248b23d470015bbbe85. Este ZIP reúne o ajuste visual do mapa/Panorama e a revisão de organização das abas. Não é necessário aplicar o ZIP visual anterior separadamente. Substitua os arquivos nas mesmas pastas, sem remover outros arquivos do repositório.

## O que muda

- Mapa nacional: consulta rápida maior e centralizada abaixo do Brasil; título redundante removido. Navegação e detalhes municipais preservados.
- Panorama: evolução e marcas com proporções equilibradas; combustíveis e canais centralizados.
- Cenários: fontes, inventários, metodologia e tabelas técnicas em rodapé recolhido; gráficos e indicadores preservados. Período, unidades e alertas essenciais de experimento, cobertura e incerteza continuam junto da análise. O pacote de referência fixo continua explicitamente identificado.
- Animações: largura do painel e barras limitada ao contêiner, inclusive em telas pequenas. A faixa de liderança não deve expandir a página; cores de texto respeitam o tema.
- Revisão compartilhada: títulos, espaçamento, controles e textos de apoio mais consistentes nas abas e subabas; mapas adicionais passam a respeitar as superfícies do tema.

## Conteúdo e cálculos

Nenhum conjunto de dados foi alterado. Gráficos, filtros, cálculos, navegação e exportações permanecem disponíveis. As fontes não foram excluídas: o rodapé permite abrir o detalhamento. Avisos de indisponibilidade não são substituídos por zero.

## Conferência

Foram executados testes de componentes, interações, cálculos, inicialização e regras responsivas, além da validação dos hashes CSP. A revisão cobre o código das abas e suas subabas; não equivale a uma conferência visual de cada tela em um navegador real. A execução de navegador neste ambiente permanece restrita, portanto a aparência final em diferentes dispositivos ainda requer conferência após publicação.

## Cobertura da revisão compartilhada

- Panorama: mapa, proporções de evolução/marcas e composição de combustíveis/canais.
- Evolução: cabeçalhos, controles e área da comparação anual; séries e avisos preservados.
- Concorrência/ranking: títulos, controles de comparação e períodos, tabela e destaques preservados.
- Segmentos/estrutura/propulsão/origem: hierarquia dos títulos e espaçamento compartilhado das seções.
- Territórios: controles, painel de detalhe em telas estreitas e superfícies dos mapas adicionais.
- Explorar e formatos adicionais: controles alinhados e com quebra de linha, notas legíveis e temas consistentes.
- Cenários: todas as subabas revisadas; conteúdo técnico recolhido no rodapé, gráficos mantidos.
- Animações: largura de contêiner, gráfico de corrida em telas estreitas e contraste do texto.
- Qualidade/diagnóstico: indicadores com quebra de linha e coluna única em telas estreitas.

A cobertura acima descreve inspeção de código e testes automatizados, não uma passagem visual de navegador por todas as telas.
