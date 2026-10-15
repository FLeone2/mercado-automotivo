# Ajuste do cabeçalho e do espaço abaixo da navegação

Sobreposição para a versão oficial `b920385a2b371177c8938257843d1018e7bb0cca`
(conteúdo equivalente à base local `da24531dc781e256226e31430ab58cb571e932a8`).

## Aplicação manual

Extraia o ZIP e envie os arquivos à raiz do repositório, preservando as pastas
`src` e `tests`. Substitua os arquivos existentes. Não apague outros arquivos ou
a pasta `data`: este ZIP contém somente a correção, não o projeto completo.

## Alterações

- Remove visualmente o controle “Updated” e sua data no cabeçalho do mercado.
- Elimina toda a faixa vazia das abas nativas, que ainda reservava 36 px.
- Reduz o espaço superior do conteúdo de 24 px (18 px no celular) para 8 px.
- Aproxima a segunda linha de navegação dos filtros, mantendo botões de 44 px.
- Mantém as datas das fontes, filtros, abas, cálculos, exportações e dados.

## Validação

15 arquivos de testes JavaScript e 17 testes Python passaram. Compilação,
sintaxe dos dois scripts inline e hashes CSP verificados. Dados, lógica,
navegação e worker de cálculo sem alterações. Verificada a integridade do ZIP.
Os testes de layout verificam contratos de CSS e componentes; não foi realizada
validação visual em navegador nesta sessão.
