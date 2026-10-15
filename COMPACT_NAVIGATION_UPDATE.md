# Atualização compacta de navegação

Base de produção: 9851e9cc164d6a58c83ee14ba3ca746a80af6d19.
Base local de conteúdo equivalente: 5e54cc642affceefe75a887a4e21c64ef1b44142.

Este pacote é uma sobreposição: copie os arquivos sobre essa base, preservando
todos os demais arquivos, especialmente a pasta data. Não substitua o projeto
inteiro apenas pelo conteúdo deste ZIP. Nenhum conjunto de dados foi alterado.

- Cabeçalho compacto com identidade à esquerda e sete áreas principais.
- Segunda linha única antes dos filtros: Executiva / Composição / Crescimento;
  análises de Cenários; Marcas e modelos / Ranking; análises de Segmentos.
- Lista / Conectado / Pirâmide dentro do conteúdo Ranking, acima dos controles A/B.
- Grupo modelo e Universo dentro de + filtros; ordem dos seis filtros principais preservada.
- Blocos separados de filtros, indicadores e gráficos; controles de composição compactos.
- Rodapés de relatório/exportação e avisos de recorte congelado preservados.

Validação: 14 arquivos de testes JavaScript e 17 testes Python, além da compilação
e verificação de scripts inline/CSP. Dados e worker de cálculos sem diferenças
contra a base. As checagens cobrem árvores de componentes e contratos de CSS,
não pixels ou estilos computados. Navegador indisponível nesta sessão; revisão
visual real desktop/mobile e claro/escuro ainda precisa ser feita.
