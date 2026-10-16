# Fase 3: previsões coerentes de Brasil / UF / marca

## Implementação e produto de previsão independente

`scripts/phase3_hierarchy.py` gera `data/scenarios/phase3_hierarchy.json` a partir de todos os cubos mensais originais. O script estima modelos independentes em cada nó de geografia/marca e avalia uma reconciliação não negativa ponderada pela covariância. Esses resultados constituem uma família de previsões separada; eles **não** substituem nem herdam implicitamente a seleção dos modelos nacionais SARIMAX/de participação em `phase23_models.json`.

A hierarquia resultante é uma análise experimental retrospectiva. O modelo coerente selecionado é o sazonal ingênuo bottom-up, com agregação das séries de base. O MinT foi implementado e avaliado, mas seu resultado no teste não altera a seleção feita na validação nem demonstra uma melhoria universal.

## Universo exato e conservação das fontes

- Todos os 129 meses das fontes: janeiro de 2016 a setembro de 2026.
- Segmentos originais exatos `Auto` e `Comercial Leve`, sem cruzamentos com bases socioeconômicas externas.
- Contagens das linhas originais de emplacamento, incluindo duplicatas. Não se trata de veículos únicos após deduplicação.
- 24.541.931 linhas de emplacamento; 236.532 linhas Mitsubishi.
- Os 27 códigos exatos de UF do Brasil são preservados. As 119 linhas cuja UF de origem é `Não informado` permanecem em um grupo contábil separado, `UNKNOWN`, sem exclusão ou redistribuição.
- A identificação de Mitsubishi usa a marca original: `marca.strip().upper() == 'MITSUBISHI'`. O complemento não Mitsubishi inclui todas as demais marcas, inclusive as não classificadas. Um trecho do nome do modelo nunca determina a marca.
- O SHA-256 do arquivo compactado de cada cubo deve coincidir com o registro do manifesto original. Cada total nacional mensal deve coincidir com `lightVehicleRows` e `monthly.json`; cada total Mitsubishi também deve coincidir com `monthly.json`.

São 56 séries de base disjuntas: 28 grupos geográficos × dois grupos de marca mutuamente exclusivos. São publicados 87 nós: Brasil e 28 grupos geográficos, cada um com contagens de mercado total, Mitsubishi e não Mitsubishi. A matriz explícita de agregação, com dimensão 87 × 56, tem posto completo nas colunas.

Para os dados observados e para cada previsão coerente, valem as identidades abaixo; os nomes das expressões foram preservados:

```
Brazil total = sum(all 27 UF totals + UNKNOWN total)
Brazil Mitsubishi = sum(all UF Mitsubishi + UNKNOWN Mitsubishi)
Brazil non-Mitsubishi = sum(all UF non-Mitsubishi + UNKNOWN non-Mitsubishi)
total = Mitsubishi + non-Mitsubishi  [at Brazil and each geographic bucket]
all counts >= 0
```

As previsões pontuais permanecem como contagens esperadas em ponto flutuante. Arredondar cada nó separadamente quebraria essas identidades e, por isso, é intencionalmente evitado.

## Modelo de base estimado independentemente

Para cada um dos 87 nós, independentemente, define-se `z[t] = log(1 + y[t]) - log(1 + y[t-12])`. Estima-se `z[t] = intercept + slope * z[t-1]` usando apenas observações anteriores à origem da previsão. O intercepto não é penalizado, e o coeficiente autorregressivo recebe uma penalização ridge fixa de 1,0. O crescimento sazonal é previsto recursivamente, e a contagem em escala log1p é reconstruída usando o mês observado doze meses antes; o horizonte máximo é de doze meses. Previsões negativas de contagem após a transformação inversa são limitadas a zero.

Esse é um AR(1) regularizado do crescimento sazonal, não um modelo SARIMAX. Cada nó tem seus próprios coeficientes. As previsões de base resultantes são efetivamente incoerentes entre os nós: nas trajetórias de teste, a maior diferença entre o total nacional e a soma das UFs é de aproximadamente 3.809,97 linhas de emplacamento. A reconciliação não é uma distribuição do total nacional por participações geográficas fixas.

Quatro candidatos são avaliados nas mesmas origens e nos mesmos horizontes:

1. `seasonal_naive_bottom_up`: repete cada série de base do mesmo mês do ano anterior e agrega com a matriz de soma.
2. `seasonal_growth_bottom_up`: usa apenas as previsões de crescimento sazonal estimadas independentemente nos nós de base e agrega com a mesma matriz.
3. `seasonal_growth_base_unreconciled`: mantém a previsão independente de cada nó. Esse comparador de diagnóstico é inelegível para seleção porque não é coerente.
4. `mint_shrink_nonnegative`: usa todas as previsões independentes dos nós e a projeção abaixo, cuja covariância é estimada apenas com dados de treinamento.

## Estimação efetiva da covariância e reconciliação não negativa

Para uma origem externa de previsão `o`, ajustam-se previsões de base de um passo em cada origem interna `t = 36, ..., o-1`, sempre com observações `[0,t)`. Seus erros observados são `y[t] - forecast[t|t-1]`. Apenas erros cujo mês de resultado observado seja estritamente anterior a `o` entram na covariância. Na primeira origem externa, há 24 meses de resíduos; a janela se expande a partir daí. Resultados já observados de meses anteriores do teste podem entrar no treinamento de origens posteriores, como em um exercício real de previsão com janela expansiva; resultados futuros não podem.

Seja `C` a covariância amostral desses resíduos. A matriz regularizada fixa é:

```
W = 0.5*C + 0.5*diag(diag(C))
    + diag(1e-6 * max(diag(C), 1))
```

Aplica-se uma contração fixa de 50% em direção à diagonal, com uma pequena regularização ridge relativa na diagonal. Isso **não** significa que o parâmetro de contração tenha sido estimado de forma ótima. Essa regularização é importante porque o histórico de resíduos mais curto tem menos observações que a dimensão da covariância de 87 nós. A mesma estrutura de covariância é reutilizada nos horizontes de 1 a 12 meses; não se estima uma covariância específica para cada horizonte.

Para cada horizonte, sejam `S` a matriz de agregação e `base` o vetor de previsões independentes. Resolve-se o seguinte problema:

```
minimize (S*b - base)' W^-1 (S*b - base), subject to b >= 0
```

A implementação transforma o problema com um fator de Cholesky, normaliza as colunas para estabilidade numérica e resolve mínimos quadrados. Se a solução sem restrições nos nós de base for não negativa, o resultado equivale ao MinT linear. Caso contrário, resolve mínimos quadrados não negativos para as contagens de base e depois as agrega. Nunca limita separadamente os nós agregados nacionais ou de UF. Restrições de não negatividade ativas tornam o estimador não linear; a documentação e o nome do modelo preservam essa distinção. Nas trajetórias coerentes de teste, todas as discrepâncias são de, no máximo, aproximadamente 1,2 × 10^-10 linhas, decorrentes apenas da soma em ponto flutuante.

Referências metodológicas, com os títulos originais preservados:

- [Wickramasuriya, Athanasopoulos and Hyndman (2019), Optimal Forecast Reconciliation Through Trace Minimization](https://www.tandfonline.com/doi/full/10.1080/01621459.2018.1448825)
- [Forecasting: Principles and Practice, forecast reconciliation](https://otexts.robjhyndman.com/fpp3/reconciliation.html)
- [Optimal non-negative forecast reconciliation, Monash working paper](https://www.monash.edu/business/ebs/research/publications/ebs/wp15-2019.pdf)

Os resultados de otimalidade do artigo dependem de hipóteses. Esta implementação, com histórico curto, avaliação retrospectiva e contração fixa, não demonstra que essas hipóteses sejam válidas para as contagens de emplacamentos.

## Avaliação e seleção

O protocolo temporal coincide exatamente com o arquivo nacional das fases 2 e 3:

- Treinamento inicial: 60 observações mensais.
- Validação: 34 origens, com último mês observado entre dezembro de 2020 e setembro de 2023; todos os doze passos de previsão, com meses-alvo de janeiro de 2021 a setembro de 2024.
- Teste: 13 origens, com último mês observado entre setembro de 2024 e setembro de 2025; todos os doze passos de previsão, com meses-alvo de outubro de 2024 a setembro de 2026.
- Trajetória futura: outubro de 2026 a setembro de 2027, ajustada com o histórico até setembro de 2026.
- Não são usados dados macroeconômicos futuros, participações geográficas futuras realizadas, seleção de modelo durante o teste ou regressores exógenos.

Cada modelo é avaliado para o Brasil e para o conjunto de nós de UF, por mercado total, Mitsubishi e não Mitsubishi; também são avaliados cada nó individual e o conjunto de todos os nós. São fornecidos MAE, RMSE, MASE e viés com sinal para a trajetória completa, os passos 1–3, 1–6 e 1–12 (`byHorizon`) e, separadamente, os passos exatos 3, 6 e 12 (`atHorizon`). Viés positivo significa previsão acima do observado. O denominador do MASE é a média da diferença absoluta de doze meses de cada nó, recalculada exclusivamente na amostra de treinamento daquela origem. Casos com escala zero são excluídos apenas do MASE e permanecem no MAE, RMSE e viés; suas contagens efetivas são explícitas.

A seleção minimiza o MASE de validação de todos os nós entre os três candidatos coerentes, com peso igual para cada observação incluída de nó/origem/passo. O período histórico de teste, já examinado anteriormente, serve para relatar resultados, nunca para alterar essa seleção.

Os valores da tabela preservam a precisão original. Nesta tabela, o ponto é o separador decimal e a vírgula separa milhares.

| Candidato | MASE de todos os nós na validação | MASE de todos os nós no teste | MAE do total Brasil no teste | MAE dos totais de UF no teste |
|---|---:|---:|---:|---:|
| Sazonal ingênuo bottom-up **(selecionado)** | 1.036018 | 0.932379 | 18,041.71 | 1,107.52 |
| Crescimento sazonal bottom-up | 1.140695 | 0.889757 | 17,380.75 | 1,023.01 |
| Crescimento sazonal independente sem reconciliação | 1.137600 | 0.889794 | 17,433.63 | 1,022.90 |
| MinT-shrink não negativo | 1.141385 | 0.890288 | 17,505.35 | 1,023.00 |

O MinT melhora o MASE de todos os nós no teste em relação ao sazonal ingênuo, mas o piora ligeiramente em relação ao modelo de base independente. Os dois candidatos coerentes mais complexos perdem para o sazonal ingênuo na validação. Esses fatos são mantidos sem alterar a seleção nem afirmar que um método mais complexo necessariamente vence.

Não são fornecidos intervalos de previsão hierárquicos nem estimativas de cobertura. Os intervalos existentes dos candidatos nacionais separados não devem ser apresentados como intervalos dessas trajetórias coerentes. Meses-alvo sobrepostos geram erros dependentes, e `nPredictions` não representa um tamanho amostral independente. A versão atual das fontes e a inspeção anterior das datas históricas de teste mantêm todos os resultados como experimentais; `validationPassed` permanece falso.

## Contrato do artefato

O JSON inclui:

- `nodes`, `bottomKeys`, `summingMatrix`, `geography`, `brandRule`, `unitDefinition`.
- `sourceAudit.receipts`: caminhos das fontes mensais originais, SHA-256 verificado, contagens nacionais e Mitsubishi, contagens de UF não informada e indicadores de conservação.
- `history`: 129 vetores mensais de nós identificados por chave.
- `models`, `selectedModel`, `selection`, `comparison`, `protocol`, `limitations`.
- `validation[model]` e `test[model]`: métricas `allNodes`, `national[component]`, `ufAggregate[component]` e `perNode[nodeKey]`.
- `candidateTestPredictions[model]`: todas as 13 × 12 linhas de teste de cada candidato, com origem, mês-alvo, horizonte exato e vetores de nós observados e previstos, identificados por chave.
- `selectedTestPredictions`, `futureForecasts`, `futureBaseForecasts`, `candidateFutureForecasts`.
- `reconciliationAudit`: verificações numéricas de coerência para histórico, validação, teste e futuro; janelas de ajuste da covariância, contagens de resíduos, verificações de autovalores, magnitudes dos ajustes e contagens de restrições ativas.
- `methodSources`: referências metodológicas verificadas.

O arquivo estático tem aproximadamente 4,13 MiB, abaixo do limite de 25 MiB. As interfaces que o utilizam devem mostrar o nome do modelo selecionado, o caráter retrospectivo, a inclusão da UF não informada e a ausência de intervalos hierárquicos. O comparador sem reconciliação serve como evidência explicativa, não como previsão coerente publicável.

## Reprodução e testes

```sh
OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 python scripts/phase3_hierarchy.py --repo .
OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 python -m unittest discover -s tests -p 'test_phase3_hierarchy.py' -v
```

Os testes leem independentemente todos os cubos originais e comparam cada série geográfica de base com o artefato, além de verificar a conservação nacional e os resumos criptográficos. Eles cobrem o posto e a separação das séries na matriz de agregação, a invariância a alterações nos dados futuros, a covariância positiva definida estimada apenas no treinamento, a preservação de entradas coerentes, a projeção não negativa da função objetivo, os modelos de base efetivamente independentes e incoerentes, as trajetórias cronológicas completas, as métricas recalculáveis, as previsões sazonais ingênuas exatas, a seleção feita apenas na validação e o limite de tamanho do arquivo estático.

Fora do escopo: fase 4; cenários econômicos futuros; hierarquias de previsão por município, segmento, modelo de veículo, canal de venda ou locadora; reconciliação hierárquica probabilística; alegações de validação para produção.
