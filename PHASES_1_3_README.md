# Cenários · fases 1 a 3

Atualização incremental da base verificada do GitHub: `9bbf173818d82207f5d3e66340ac1660953d3755`. Os 349 arquivos da base local foram confrontados por hash Git com o conteúdo remoto. A atualização mantém os cubos originais, as classificações existentes e todas as outras abas.

## Escopo

- Diagnóstico: cobertura efetiva, fontes públicas e indisponibilidades, unidades, vintages e resultados dos testes.
- Economia: séries oficiais, correlações pré-branqueadas com defasagens e associações condicionais exploratórias, sem interpretação causal.
- Potencial regional: emplacamentos e Mitsubishi por mil habitantes, QL relativo a Brasil/UF, picapes e Triton/L200, composição agro e regressão condicional quando os dados permitem.
- Previsões: horizontes de 3, 6 e 12 meses, sazonal ingênuo, candidatos parcimoniosos e SARIMAX, MAE/MASE/viés e cobertura das faixas empíricas. Resultados experimentais: a janela histórica já foi examinada anteriormente e não é um novo teste independente.
- Simulações: permanece bloqueada. As fases 4 e 5 não foram ativadas.

Os filtros globais não recalculam este pacote congelado. Os controles locais indicam a série, UF, métrica e horizonte efetivamente suportados.

## Reproduzir

Python 3 com NumPy, SciPy, statsmodels e openpyxl; versões utilizadas em `scripts/requirements-scenarios.txt`. Node.js executa os testes da interface. Nenhuma biblioteca nova é carregada remotamente pelo dashboard. O orquestrador usa uma thread BLAS por padrão (ajustável por SCENARIOS_BLAS_THREADS). Para testes diretos, OPENBLAS_NUM_THREADS=1 e OMP_NUM_THREADS=1 reduzem o custo dos ajustes pequenos.

1. `python scripts/phase1_sources.py`: normaliza respostas oficiais em cache e registra falhas; consulte o script para atualização da fonte.
2. `python scripts/phase2_regional.py`: recompõe os agregados exatos dos cubos originais e junta dados municipais por código IBGE.
3. `python scripts/phase23_models.py`: refaz os modelos, SARIMAX/share independente e testes cronológicos.
4. `python scripts/phase3_hierarchy.py` e `python scripts/phase3_spatial.py`: refazem reconciliação territorial e diagnóstico espacial pelos caches verificados.
5. `python scripts/build-phases.py --integrate-only`: atualiza manifesto, hashes e incorporação da interface.
6. `python -m unittest discover -s tests -p 'test*.py' -v` e `for f in tests/*.test.cjs; do node "$f" || exit; done`.

## Interpretação e limites

- Registros da fonte não equivalem necessariamente a veículos únicos, compradores residentes ou demanda domiciliar.
- QL usa exatamente o mesmo período e universo em numerador e denominador. QL > 1 significa participação relativa acima da referência, não rentabilidade ou oportunidade comprovada.
- PIB por habitante não é renda familiar. PAM é produção agrícola/área, não PIB agro nem renda dos produtores.
- PNAD mensal representa trimestres móveis; observações sobrepostas não são meses independentes.
- Frota SENATRAN é cadastro administrativo, não frota circulante. Tabelas municipais por tipo, idade e marca/modelo são separadas.
- VD não equivale a locadoras. Origem LOCAL/IMP é classificação retrospectiva por modelo, não nacionalidade da marca. Desconhecidos permanecem explícitos.
- Vintages regionais distintos são identificados. Datas históricas de divulgação/revisões não podem ser reconstruídas: validação é retrospectiva, não um histórico real-time perfeito.
- Sem preços, entrada, prazo e CET observados, não se apresenta uma falsa medida de acessibilidade.
- Não se afirma MinT, SAR/SEM, VECM, causalidade, nem ganho preditivo sem cálculo e evidência adequados. Consulte PHASE23_MODELS.md para as especificações executadas.

## Publicação

Este ZIP é um overlay: extraia e substitua os arquivos correspondentes na raiz do repositório. Não exclua os demais arquivos. A publicação oficial permanece no fluxo já existente do GitHub/Cloudflare. Não foi criado preview público.

## Verificação visual

Testes automatizados da interface e dos dados fazem parte deste pacote. A inspeção visual no Chromium do executor ficou bloqueada por restrições de socket/processo; o navegador cloud também tinha uma restrição de acesso previamente confirmada. Não foi burlada nenhuma restrição. A aparência final deve ser conferida no site oficial depois do upload.
