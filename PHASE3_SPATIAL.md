# Fase 3: diagnóstico espacial dos resíduos

## Entrega e limites

`data/scenarios/phase3_spatial.json` contém um diagnóstico de Moran efetivamente calculado, com geometria oficial, matriz explícita e permutações reproduzíveis. Ele usa os resíduos dos dois ajustes Poisson municipais existentes: emplacamentos de mercado e MIT, janeiro–setembro de 2026. A amostra é a mesma dos modelos condicionais: 5.405 municípios.

O resultado é exploratório, dentro da amostra. Não é teste causal, previsão regional validada ou seleção automática entre SAR e SEM. Nenhum modelo SAR/SEM foi ajustado, e a fase 4 continua desativada.

## Fonte geográfica real

Fonte: [IBGE, Malha Municipal Digital 2025](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/15774-malhas.html).

Arquivo oficial: [BR_Municipios_2025.zip](https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2025/Brasil/BR_Municipios_2025.zip).

- Recebido em 16/10/2026; `Last-Modified` HTTP: 26/02/2026 20:02:48 GMT.
- Tamanho exato do ZIP: 237.062.431 bytes.
- SHA-256: `840bbe6f73726ef9d1460ce49fdfe01a278935c41180d3c893e25ca21db083bd`.
- SHP contém 5.573 registros; CRS do PRJ: SIRGAS 2000 geográfico, em graus, EPSG:4674.
- A divisão de 2025 inclui 5.569 municípios, Brasília, Fernando de Noronha e duas áreas estaduais operacionais. Somente códigos presentes na amostra ajustada entram no diagnóstico.
- Todos os 5.405 códigos da amostra encontram geometria: zero exclusões por ausência de malha. Os 168 códigos geográficos fora do ajuste são registrados, sem lhes imputar emplacamentos zero.

A API de malhas do IBGE retornou HTTP 502 na coleta; o arquivo estático oficial acima foi obtido com sucesso. Nenhuma geometria SVG local por UF foi usada.

O ZIP original é maior que o limite de distribuição e NÃO integra o pacote. O pacote inclui centroides compactos, hashes, o parser e as matrizes derivadas. O script aceita apenas o ZIP com o tamanho e o hash acima; uma futura mudança da fonte exige revisão deliberada do recibo.

### Construção dos centroides

O script lê os registros DBF/SHP alinhados e verifica os geocódigos e a UF. Calcula o centroide poligonal em longitude/latitude usando áreas com sinal por anel: múltiplas partes são ponderadas e buracos subtraídos. Valida o fechamento dos anéis e coordenadas compatíveis com o Brasil. O número de anéis/vértices fica no recibo compacto por código.

Esses pontos são centroides DERIVADOS, não sedes municipais oficiais, centroides geodésicos ou coordenadas da população. Podem ficar fora de polígonos irregulares ou multipartes. Essa aproximação pode importar em municípios grandes do Norte e ilhas oceânicas.

## Matriz de pesos

A escolha foi fixada antes de consultar os resultados de Moran:

1. Converte os centroides SIRGAS 2000 em vetores unitários tridimensionais.
2. Encontra os oito vizinhos mais próximos por distância cordal, cuja ordem é equivalente à distância de grande círculo na esfera.
3. Em empate, usa a ordem estável dos códigos IBGE.
4. Faz a união simétrica das ligações dirigidas: se i escolhe j OU j escolhe i, ambos recebem peso 1.
5. Mantém diagonal zero. Não padroniza cada linha, para preservar pesos binários simétricos.

Trata-se de proximidade entre centroides, não contiguidade de fronteiras, viagens, acessibilidade rodoviária ou fluxos econômicos. O raio esférico usado nas distâncias publicadas é 6.371,0088 km.

Matriz principal k=8:

- 5.405 municípios; 25.106 arestas não dirigidas; S0 = 50.212.
- Um componente conectado; zero isolados.
- Grau mínimo 8; mediana 9; máximo 14; média 9,2899.
- Distância mediana 29,13 km; percentil 95 99,83 km; máxima 523,42 km.
- Duas ligações acima de 500 km. kNN conecta ilhas/remotos por distância, em vez de descartá-los silenciosamente.

Há sensibilidades pré-especificadas k=4 e k=12, ambas simétricas, conectadas e sem isolados. As matrizes, graus, distâncias e hashes ficam no JSON. Não se escolhe a matriz mais favorável após olhar os p-valores.

`weights.edges` contém pares de índices de base zero em `coverage.codeOrder`, com cada aresta não dirigida uma vez. `weights.undirectedEdges` é a contagem. Reproduzir uma matriz envolve reconstruir os vínculos a partir dos centroides e comparar o hash da lista canônica de arestas.

## Resíduos e estatística

Para contagem y e média condicional ajustada mu:

- Pearson: (y − mu) / sqrt(mu).
- Desvio Poisson: sinal(y − mu) × sqrt(2 × [y log(y/mu) − y + mu]); quando y=0, o termo y log(y/mu) vale zero.

Zeros MIT são mantidos. Todos os resíduos são centralizados globalmente antes do cálculo. Médias ajustadas não positivas, dados não finitos e resíduos constantes são recusados.

A estatística é I = (n/S0) × (z'Wz)/(z'z), com S0 igual à soma dos pesos dirigidos. Não há correção de alavancagem nem reestimação dos modelos a cada permutação.

Para o gráfico, `standardizedResidual` é o resíduo centralizado dividido pelo desvio padrão populacional. `spatialLag` é Wz dividido pelo grau médio global. Assim, a inclinação de uma reta pela origem é exatamente I. Não confundir esse lag com uma média local normalizada pelo grau de cada município.

## Referência por permutações e p-valores

São 9.999 permutações, seed 20261015, gerador NumPy PCG64. Os resíduos são permutados DENTRO de cada UF, preservando a composição por estado e os valores dos resíduos. As mesmas permutações são aplicadas a ambos os desfechos, aos dois resíduos e às três matrizes. Grupos unitários, como DF, permanecem fixos.

A expectativa `expectedI` é calculada exatamente para essa permutação estratificada. Para dois índices diferentes da mesma UF g, o produto esperado é [(soma z_g)^2 − soma(z_g^2)]/[n_g(n_g−1)]. Para índices de UFs diferentes, é o produto das médias dos respectivos grupos. Isso é somado com os pesos e dividido pelo mesmo denominador de Moran.

Portanto, NÃO se usa −1/(n−1) como referência do teste estratificado. Esse valor aparece apenas em `unrestrictedExpectedI`, explicitamente identificado como expectativa sob permutação nacional irrestrita. A média simulada também fica registrada para conferência.

O p-valor bilateral conta a distância à expectativa estratificada: [1 + número de |I_perm − E_UF[I]| ≥ |I_observado − E_UF[I]|]/10.000. A resolução mínima é 0,0001; nenhum p-valor é publicado como zero. O JSON contém número de extremos, desvio padrão/média da distribuição simulada, intervalo central nulo de 95% e erro Monte Carlo aproximado. Esse intervalo descreve a referência de permutação, não um intervalo de confiança do I verdadeiro.

O ajuste Holm inclui TODA a família de 12 diagnósticos: 2 desfechos × 2 resíduos × 3 escolhas de k. O teste principal tem k=8, porém o ajuste não ignora as sensibilidades.

## Resultados da amostra atual

| Matriz | Desfecho/resíduo | I | E_UF[I] | p permutação | p Holm (12 testes) |
|---|---|---:|---:|---:|---:|
| k=8 | Mercado/Pearson | 0,17263 | 0,15067 | 0,0086 | 0,0258 |
| k=8 | Mercado/desvio | 0,17656 | 0,14794 | 0,0026 | 0,0104 |
| k=8 | MIT/Pearson | 0,08670 | 0,00201 | 0,0001 | 0,0012 |
| k=8 | MIT/desvio | 0,12490 | 0,01023 | 0,0001 | 0,0012 |
| k=4 | Mercado/Pearson | 0,14896 | 0,15577 | 0,4422 | 0,8060 |
| k=4 | Mercado/desvio | 0,14475 | 0,15283 | 0,4030 | 0,8060 |
| k=4 | MIT/Pearson | 0,09020 | 0,00206 | 0,0001 | 0,0012 |
| k=4 | MIT/desvio | 0,13094 | 0,01052 | 0,0001 | 0,0012 |
| k=12 | Mercado/Pearson | 0,17388 | 0,14642 | 0,0001 | 0,0012 |
| k=12 | Mercado/desvio | 0,18004 | 0,14383 | 0,0001 | 0,0012 |
| k=12 | MIT/Pearson | 0,07969 | 0,00185 | 0,0001 | 0,0012 |
| k=12 | MIT/desvio | 0,11765 | 0,00992 | 0,0001 | 0,0012 |

Leitura: a evidência do mercado é sensível à matriz. Em k=4, ambos os diagnósticos do mercado não se destacam da referência estratificada; em k=8/12, sim. Os resíduos MIT se destacam sob as três escolhas avaliadas. Um I positivo, sozinho, não basta para concluir dependência: nos resíduos de mercado, E_UF[I] já é aproximadamente 0,15.

Isso não equivale a testes perfeitamente calibrados para um GLM ajustado. Médias heterogêneas, sobredispersão, alavancagem e má especificação comprometem a permutabilidade dos resíduos. Permutar por UF retém a composição estadual, mas não elimina esses problemas. As referências de permutação são exploratórias. Não autorizam interpretar associação como causalidade, atribuir um mecanismo, escolher SAR/SEM ou liberar simulações. Não significância também não prova independência.

## Reprodução e verificação

Dependências já usadas pelo projeto: NumPy 2.3.5 e SciPy 1.17.0. Não exige GeoPandas, Shapely, GDAL, download de executáveis ou dependências extras.

Rebuild normal, offline:

```sh
python scripts/phase3_spatial.py
```

O rebuild lê os centroides e recibos embutidos no JSON existente, verifica o SHA-256 canônico dos centroides e a identidade da fonte, reconstrói as três matrizes e todas as permutações. O hash do arquivo integral `phase23_models.json` vincula o resultado ao modelo atual, mesmo quando muda apenas outro bloco daquele arquivo. Não realiza chamadas de rede.

Reproduzir do ZIP oficial previamente baixado:

```sh
python scripts/phase3_spatial.py --source-zip /caminho/BR_Municipios_2025.zip --retrieved-at 2026-10-16T00:01:00Z
```

Nova coleta opt-in:

```sh
python scripts/phase3_spatial.py --refresh
```

`--refresh` baixa o ZIP para diretório temporário, verifica o hash fixado e o remove após o processamento. O corpo bruto não é incluído no overlay. Não atualizar a constante do hash só para contornar uma divergência da fonte: examinar primeiro a alteração oficial.

Se faltar um cache geográfico válido ou ocorrer erro de coleta/validação, o script grava `status: blocked`, a causa exata e nenhum I/p fabricado; as demais fases podem continuar. É preciso importar o ZIP oficial ou refazer a coleta para recuperar um cache ausente/corrompido.

Testes:

```sh
python -m unittest discover -s tests -p test_phase3_spatial.py -v
```

Cobrem parser DBF/alinhamento, recusa de bytes não verificados, centroides com buracos/múltiplas partes, recusa de SVG, simetria/diagonal/isolados/ties, resíduos zero e médias inválidas, fórmula de Moran, expectativa estratificada contra enumeração exaustiva, permutações contra implementação independente, Holm, hashes do modelo e geografia, códigos/UF, reconstrução das três matrizes e dos 12 valores de I, inclinação do scatter e limite de 25 MiB. O artefato atual ocupa aproximadamente 9,65 MB.

## Referências metodológicas

- [spdep: fórmula de Moran](https://r-spatial.github.io/spdep/reference/moran.html).
- [spdep: teste por permutações](https://r-spatial.github.io/spdep/reference/moran.mc.html).
- [PySAL/esda: Moran global e interpretação](https://pysal.org/esda/stable/user-guide/global_morans_i.html).

A estratificação por UF e sua expectativa exata são implementações explícitas deste projeto; não se afirma que reproduzam os defaults desses pacotes.
