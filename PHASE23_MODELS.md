# Fases 2 e 3 — modelos econômicos, regionais e previsões

## Resultado principal

O benchmark sazonal ingênuo foi selecionado pela validação para mercado e Mitsubishi. Os candidatos autorregressivos e um SARIMAX real foram implementados e avaliados; resultados melhores no período de teste já conhecido não foram usados para trocar retroativamente o vencedor. Todos os resultados permanecem experimentais. Nenhum simulador causal ou fase 4 foi ativado.

A cobertura observada do intervalo nominal de 80% para Mitsubishi foi somente 49,4%. Essa falha é exibida, e impede tratar a previsão como confiável para decisões operacionais.

## Reprodução

```bash
python scripts/phase23_models.py --repo .
python -m unittest discover -s tests -p 'test_phase23_models.py' -v
```

Dependências: Python, NumPy, SciPy e statsmodels 0.15.0. Instalação padrão: `python -m pip install -r scripts/requirements-scenarios.txt`. Não há aleatoriedade nem consulta de rede no build. O arquivo `data/scenarios/phase23_models.json` inclui hashes SHA-256 das entradas e previsões individuais de teste para todos os candidatos. Os testes verificam vazamento temporal, disponibilidade macro, métricas, coerência, zeros e deflação.

## Universo e datas

- 129 meses consecutivos: janeiro/2016 a setembro/2026.
- Mesmo universo Auto + Comercial Leve do arquivo mensal; são linhas de emplacamento, duplicatas mantidas, e não veículos únicos.
- Crédito e juros de financiamento: até agosto/2026; demais séries BCB usadas na CCF: até setembro/2026.
- As classificações e as séries públicas são as versões correntes. Não existe reconstrução de publicações/revisões históricas.
- Dados nacionais e corte regional são pré-calculados. Filtros visuais não reestimam os modelos.

## Modelos nacionais e protocolo temporal

1. `seasonal_naive`: cada mês futuro repete o mesmo mês do ano anterior.
2. `seasonal_ar1`: AR(1) da diferença sazonal de log emplacamentos. A previsão de crescimento é somada ao log do mês correspondente do ano anterior.
3. `seasonal_arx`: mesmo núcleo AR(1), acrescido de dois termos econômicos: média das defasagens 2, 3 e 4 da mudança anual dos juros de financiamento, em pontos percentuais, e do crescimento log anual das concessões nominais de crédito. Os três pesos de cada termo são iguais. São apenas quatro parâmetros, incluindo intercepto.
4. `seasonal_sarimax`: implementação real `statsmodels.tsa.statespace.sarimax.SARIMAX`, especificação fixa (1,0,0)(0,1,1)[12], sem tendência, com os mesmos dois regressores de financiamento e crédito disponíveis na origem. Estimação por máxima verossimilhança; estacionariedade e invertibilidade impostas.

Nos candidatos seasonal_ar1 e seasonal_arx, os coeficientes são estimados em cada janela de treino com penalização ridge fixa igual a 1 nas inclinações, sem penalização no intercepto. As variáveis macro são padronizadas somente com a janela de treino. As previsões autorregressivas são retrotransformações de log, não estimativas ajustadas da média aritmética. Esses dois modelos ridge não são renomeados SARIMAX. O candidato SARIMAX adicional usa a implementação estatística citada, regressão externa e erros sazonais de média móvel. Sua especificação foi fixada sem seleção de ordem pelo teste.

- Treino mínimo: 60 meses.
- Validação: 34 origens de dezembro/2020 a setembro/2023; alvos janeiro/2021–setembro/2024.
- Teste retrospectivo: 13 origens de setembro/2024 a setembro/2025; alvos outubro/2024–setembro/2026.
- Todas as origens produzem 12 passos. Os quatro modelos de contagem usam exatamente as mesmas origens e alvos. O SARIMAX com exógenas inicia sua amostra ajustada no índice 16, devido às transformações e defasagens macro, enquanto os benchmarks podem usar a história anterior.
- `byHorizon` resume passos 1…H para H=3,6,12; `atHorizon` mede apenas o passo H. Isso evita confundir desempenho acumulado com o desempenho de um único horizonte.
- Seleção: menor MAE de validação do caminho completo de 12 meses. A classificação não é refeita pelo teste. A regra de reconciliação nacional é aplicada depois da seleção de cada nó.
- O treino de cada origem posterior pode incorporar observações já transcorridas do período de teste, como em uso operacional; nunca incorpora alvos futuros dessa origem.

As datas de teste já foram examinadas em experimentos anteriores do projeto. A separação programática entre validação e teste deste build não converte esses meses em um teste novo e independente. `validationPassed` permanece falso para todos os alvos; `retrospectiveGatePassed` é somente uma checagem descritiva das metas numéricas.

### Ausência de informação macro futura

Se a primeira previsão está no índice `origin`, o último emplacamento conhecido é `origin-1`. Financiamento/crédito são permitidos somente até `origin-2`, por hipótese conservadora de uma defasagem mensal de publicação. Valores posteriores são mantidos no último nível conhecido. Crescimentos anuais são calculados dessa trajetória congelada, e não do futuro observado.

O teste de invariância altera simultaneamente todos os emplacamentos futuros e todos os valores macro ainda indisponíveis, e exige previsão idêntica. A regra de publicação é uma hipótese documentada: sem calendário histórico e sem vintages históricos, o resultado é pseudo-fora-da-amostra, não validação real-time.

### Métricas e intervalos

- MAE: média do erro absoluto.
- MASE: cada erro absoluto dividido pelo erro sazonal ingênuo médio calculado somente no treino daquela origem.
- Viés: previsão menos realizado; positivo significa superestimação.
- Intervalos: quantis empíricos 2,5/10/90/97,5% dos resíduos de validação, separados por passo e congelados antes do teste.
- São 34 resíduos de calibração por passo. Piso zero; share restrito a [0,1]. Não se impõe que o ponto esteja artificialmente dentro do intervalo.
- Erros de origens sobrepostas não são independentes. A cobertura é descritiva; não há promessa de cobertura nominal, normalidade ou inferência pelo número bruto de previsões.

## Resultados efetivos do teste

A tabela usa todos os passos 1…12, 13 origens e 156 previsões por modelo. MAE/viés das contagens estão na unidade de registros. O benchmark sazonal venceu a validação nos três nós de contagem; o novo SARIMAX não é promovido por uma melhora apenas no teste.

| Alvo | Modelo | MAE validação | MAE teste | MASE teste | Viés teste | Cobertura 80% | Cobertura 95% |
|---|---|---:|---:|---:|---:|---:|---:|
| registrations | seasonal_naive | 27744.93 | 18041.71 | 0.615 | -13503.17 | 84.6% | 92.9% |
| registrations | seasonal_ar1 | 28756.20 | 17433.64 | 0.594 | -6057.97 | 88.5% | 95.5% |
| registrations | seasonal_arx | 55529.06 | 19643.08 | 0.668 | 1665.33 | 87.2% | 96.2% |
| registrations | seasonal_sarimax | 34614.17 | 33367.45 | 1.133 | -32105.95 | 50.6% | 68.6% |
| registrations | constrained_wls | 27744.93 | 18041.71 | 0.615 | -13503.17 | 84.6% | 92.9% |
| mitsubishi | seasonal_naive | 352.35 | 529.37 | 1.578 | -174.77 | 49.4% | 95.5% |
| mitsubishi | seasonal_ar1 | 361.49 | 505.97 | 1.508 | -125.04 | 58.3% | 94.2% |
| mitsubishi | seasonal_arx | 557.07 | 499.28 | 1.488 | -79.18 | 65.4% | 94.9% |
| mitsubishi | seasonal_sarimax | 363.39 | 411.21 | 1.233 | -359.43 | 62.8% | 98.1% |
| mitsubishi | constrained_wls | 352.35 | 529.37 | 1.578 | -174.77 | 49.4% | 95.5% |
| nonMitsubishi | seasonal_naive | 27713.59 | 18184.74 | 0.622 | -13328.40 | 84.0% | 92.9% |
| nonMitsubishi | seasonal_ar1 | 28679.43 | 17501.83 | 0.598 | -5934.78 | 88.5% | 95.5% |
| nonMitsubishi | seasonal_arx | 55276.40 | 19781.18 | 0.675 | 1763.71 | 87.8% | 96.2% |
| nonMitsubishi | seasonal_sarimax | 34484.69 | 33092.59 | 1.128 | -31806.09 | 51.3% | 69.2% |
| nonMitsubishi | constrained_wls | 27713.59 | 18184.74 | 0.622 | -13328.40 | 84.0% | 92.9% |

### Comparação independente de share

Foram implementados um benchmark sazonal do share e um SARIMAX (1,0,0)(0,1,1)[12] sobre logit(share), sem macroexógenas. A logística inversa mantém cada ponto estritamente entre 0 e 1. A seleção utiliza somente o MAE de validação. As duas candidatas e suas previsões individuais permanecem disponíveis, mesmo quando não são a trajetória publicada na hierarquia.

| Modelo de share | MAE validação (pp) | MAE teste (pp) | MASE teste | Cobertura 80% | Cobertura 95% |
|---|---:|---:|---:|---:|---:|
| coherent_ratio | 0.265 | 0.279 | 1.352 | 92.3% | 100.0% |
| share_seasonal_naive | 0.265 | 0.279 | 1.352 | 92.3% | 100.0% |
| share_logit_sarimax | 0.177 | 0.166 | 0.807 | 84.0% | 96.2% |

O vencedor independente é `share_logit_sarimax`. Sua trajetória está em `independentIntervals`; as bandas e métricas são avaliadas separadamente. O share publicado junto às contagens está em `intervals` e permanece `coherent_ratio`, para preservar a identidade contábil dos três nós. Não se apresenta o share independente como se estivesse reconciliado com aquelas contagens. Valores no JSON são frações (0,01 = 1%), enquanto esta tabela mostra pontos percentuais.

### Modelo publicado por horizonte acumulado

| Alvo | Passos | MAE | MASE | Viés | Cobertura 80% | Cobertura 95% |
|---|---:|---:|---:|---:|---:|---:|
| registrations | 1–3 | 12616.77 | 0.424 | -7788.36 | 100.0% | 100.0% |
| registrations | 1–6 | 12243.85 | 0.413 | -7056.03 | 98.7% | 98.7% |
| registrations | 1–12 | 18041.71 | 0.615 | -13503.17 | 84.6% | 92.9% |
| mitsubishi | 1–3 | 505.51 | 1.505 | -393.36 | 61.5% | 100.0% |
| mitsubishi | 1–6 | 505.91 | 1.508 | -370.55 | 57.7% | 97.4% |
| mitsubishi | 1–12 | 529.37 | 1.578 | -174.77 | 49.4% | 95.5% |

### Reconciliação nacional efetivamente calculada

Três séries são ajustadas independentemente: mercado, MIT e não-MIT. Em cada origem, a reconciliação resolve mínimos quadrados ponderados não negativos, com matriz de soma S = [[1,1],[1,0],[0,1]]. As variâncias diagonais são os segundos momentos dos erros sazonais ingênuos do próprio treino; os pesos são seus inversos. O resultado satisfaz exatamente mercado = MIT + não-MIT e todos os nós são não negativos. O share final é MIT/mercado.

Esta projeção é denominada `constrained_wls`, não MinT: não estima uma matriz completa de covariâncias. A previsão independente de share é um comparador separado e não uma restrição desta projeção. Como os três vencedores atuais são sazonais ingênuos e já coerentes, a projeção preserva seus pontos nesta base. Testes sintéticos verificam que bases inconsistentes e negativas são realmente corrigidas.

- As bandas são marginais separadas, calibradas com os resíduos da trajetória reconciliada; não formam uma distribuição conjunta reconciliada.
- A experiência hierárquica BR/UF é um produto separado. Seus eventuais resultados MinT não devem ser descritos como reconciliação destas trajetórias SARIMAX nacionais.

### Convergência e instalação

Cada ajuste SARIMAX registra convergência, otimizador, iterações, parâmetros e avisos. A tentativa fixa L-BFGS permite 200 iterações. Se não convergir, há uma tentativa de recuperação Powell com a mesma especificação e os mesmos dados, até 400 iterações. Se ambas falharem, a geração termina com erro explícito; nenhuma previsão de outro modelo substitui silenciosamente o SARIMAX. As auditorias de todas as 34 origens de validação e 13 de teste estão em `fitAudit`. Nesta execução, os 188 ajustes das origens (três séries de contagem e share, 47 origens cada) convergiram com L-BFGS, sem recuperação Powell. O ajuste final do share independente também convergiu. Um teste simulado de falha confirma que não há substituição por benchmark.

Neste executor, a instalação padrão falhou porque o diretório global/de usuário era somente leitura. O pacote oficial PyPI foi instalado com `--target /tmp/phase23-python`, sem privilégios. Em outro ambiente, a instalação padrão dos requisitos é suficiente. `PHASE23_DEPS` pode indicar uma instalação alternativa; o caminho temporário é apenas um fallback local, não um requisito do projeto. Para evitar excesso de threads BLAS neste executor, pode-se prefixar os comandos com `OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1`.

## Associação econômica e pré-branqueamento

- CCF estimada somente até setembro/2024, antes do período de avaliação.
- Transformação anual: diferença em pontos percentuais nas taxas; diferença de log nos níveis.
- Remoção de tendência e efeitos mensais somente na janela de treino.
- Ajuste AR(1) à macro transformada e aplicação do mesmo filtro ao desfecho. Autocorrelação residual de lag 1 é registrada como diagnóstico.
- Defasagens 0…12; positiva indica que a macro antecede os emplacamentos.
- O limiar Bonferroni contempla as 13 defasagens × 5 séries. É uma triagem aproximada, não um teste exato: dependência residual, transformação anual e quebras podem invalidar a aproximação.

Na base atual, apenas concessões de crédito passam essa triagem nos lags 0 (r=0,834) e 12 (r=−0,416). O lag 0 não representa antecedência. O lag 12 pode refletir a transformação anual/estrutura serial; não é tratado como efeito econômico identificado. Essas correlações não escolheram as defasagens do ARX nem autorizam simulações.

O bloco de defasagens distribuídas mostra os coeficientes do candidato fixo ARX no treino até setembro/2024. Erros padrão HC0-ridge são descritivos e não corrigem completamente dependência temporal ou seleção. Não são elasticidades causais.

### Crédito real descritivo

A série adicional `economics.realCredit` deflaciona o fluxo nominal por IPCA: crédito nominal × IPCA[agosto/2026] / IPCA[mês]. A unidade é R$ milhões a preços de agosto/2026. Não é saldo de crédito. Essa série não altera retroativamente o candidato nominal avaliado.

PNAD de renda e massa reais permanece em sua frequência de trimestre móvel na fase 1. Não foi inserida como observações mensais independentes no modelo.

## Regressão regional condicional

Foram ajustados dois modelos Poisson com ligação log: total de emplacamentos e emplacamentos MIT. Ambos usam log(população2026) como offset e efeitos fixos de UF; AC é a referência.

Controles contínuos, transformados e padronizados:
- log do PIB per capita de 2023: atividade/produção, não renda domiciliar;
- log da renda domiciliar média per capita do Censo2022: renda efetiva da fonte SIDRA10295, variável13431;
- log da densidade demográfica de 2022;
- fração urbana do Censo2022;
- log(1 + valor PAM2025 / população2026): intensidade agropecuária da produção vegetal; não renda agrícola domiciliar.

A amostra completa contém 5,405 municípios. Os 3,617 municípios com zero MIT permanecem no modelo. Há 93 nomes sem correspondência geográfica e 53 registros excluídos por controles ausentes. Outros 113 códigos da base socioeconômica não aparecem com código resolvido na tabela de emplacamentos; não foram convertidos silenciosamente em zero.

Ambos os ajustes convergiram em 7 iterações. Dispersão Pearson: mercado 102.48; MIT 4.28. A sobredispersão é importante. Erros padrão HC1 são robustos por município, mas não corrigem dependência espacial, efeitos de frotas/sedes nem controles omitidos.

### Coeficientes condicionais

Cada coeficiente contínuo corresponde a um desvio padrão do controle transformado, mantendo os demais controles e UF. Razões exp(coeficiente) não são multiplicadores causais.

| Controle | Coef. mercado | EP robusto | Coef. MIT | EP robusto | VIF |
|---|---:|---:|---:|---:|---:|
| logGdpPerCapita | 0.0164 | 0.0698 | 0.2317 | 0.0843 | 2.77 |
| logHouseholdIncomePerCapita2022 | 0.8483 | 0.1251 | 0.9705 | 0.0919 | 6.08 |
| logDensity2022 | 0.2054 | 0.1209 | -0.1922 | 0.0895 | 2.54 |
| urbanization2022 | -0.2227 | 0.1292 | 0.0629 | 0.0969 | 1.92 |
| logPamValuePerCapita | -0.0946 | 0.0510 | -0.0145 | 0.0461 | 2.13 |

O VIF da renda é 6.08: a colinearidade com outros controles exige cautela. O número de condição do desenho, incluindo dummies, é 133.72. PIB e renda foram mantidos como conceitos distintos; não se substituiu o nome de um pelo outro.

Os valores esperados e as razões observado/esperado são ajustes condicionais dentro da própria amostra. Não são demanda reprimida, capacidade de vendas, impacto de política ou validação preditiva regional. Ausência de covariáveis selecionadas no JSON não significa ausência de fatores omitidos.

## Limites e próximos critérios legítimos

Para avançar a previsões operacionais: coletar meses futuros realmente não utilizados, preservar vintages e calendário de divulgação, reavaliar estabilidade e calibração, definir métricas/limiares antes de consultar o próximo teste. Para interpretação causal: seria necessária uma estratégia de identificação separada. Nenhum desses requisitos foi substituído por uma correlação ou por melhora retrospectiva.

## Referências metodológicas

- Hyndman e Athanasopoulos, Forecasting: Principles and Practice: https://otexts.com/fpp3/toolbox.html (benchmark sazonal, MAE/MASE, validação temporal e intervalos).
- Modelos de regressão dinâmica: https://otexts.com/fpp3/dynamic-regression.html.
- Implementação SARIMAX: https://www.statsmodels.org/stable/generated/statsmodels.tsa.statespace.sarimax.SARIMAX.html.
- Fonte e recibos das séries BCB/IBGE: `external_sources.json`, `phase1_sources.json` e `socioeconomic.json`; hashes exatos em `phase23_models.json`.
