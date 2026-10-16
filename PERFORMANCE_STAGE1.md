# Otimização de consultas · etapa 1

Esta entrega é cumulativa e não publica o site. Preserva os caminhos do megapacote anterior e os dados históricos revisados.

## O que mudou

- A consulta usa serviços de cálculo que permanecem ativos durante a sessão. Pedidos iguais compartilham trabalho; pedidos de painéis distintos são enfileirados sem cancelar uns aos outros. Sair de uma visualização cancela apenas seu interesse no resultado.
- Os cálculos reutilizam contribuições mensais exatas. Alterar ou ampliar o período combina meses já calculados e consulta o que falta. Datas parciais, filtros, projeções, versão da fonte e comparações fazem parte da identidade do cálculo.
- Agregados compactos possuem cache limitado em memória e IndexedDB versionado. O armazenamento persistente é opcional: bloqueio, indisponibilidade, quota ou falha não impedem a consulta normal. Expiração e limites de tamanho/quantidade evitam armazenar todo o histórico sem limite. A manutenção do disco examina metadados, não relê todos os agregados.
- O gráfico concluído permanece visível durante a atualização compatível. Um aviso distingue o período/filtros anteriores dos solicitados. Interações, detalhes e exportações do gráfico anterior ficam desativados até o resultado novo. Mudança de visualização incompatível ou erro não apresenta o gráfico anterior como resultado atual.
- Animações reutilizam quadros mensais projetados antes do acumulado e da comparação anual. O player para durante a atualização. Dados que a visualização não usa continuam excluídos das projeções.

## Fidelidade dos dados

O cache retém contribuições aditivas, não substitui a regra dos denominadores. Preserva a soma ponderada de count, interseções de filtros, meses/dias selecionados, acumulado desde janeiro, comparação anual e cobertura. Top N continua apenas visual. Dados ausentes não viram zero. Os cubos históricos não foram alterados.

## Limites honestos

Não há servidor novo, conta nova ou infraestrutura adicional. A primeira consulta ainda precisa obter, descomprimir e processar dados não disponíveis em cache. Filtros inéditos ou consultas maiores que os orçamentos podem recalcular. O navegador pode eliminar o IndexedDB ou negar armazenamento. As cotas do cache não são limites da memória total do navegador; resultados, gráficos, cópias de mensagens e parsing usam memória adicional.

A base inteira não é carregada antecipadamente na RAM. Os 129 cubos normais representam aproximadamente 114 MB comprimidos e 968 MB de JSON; a variante de origem, 117 MB e 999 MB. Isso não equivale ao tamanho do pacote de atualização nem ao consumo do navegador.

Não prometemos instantaneidade para o primeiro carregamento ou para qualquer combinação de filtros. As medições locais em Node verificam processamento e reutilização, não latência do site, rede, IndexedDB real, renderização em celular ou experiência visual. QA visual em navegador e medição após deploy continuam pendentes.

## Reconstrução

Executar python scripts/build-megapackage.py. O último passo build-page-notes.py recalcula os hashes CSP. Não editar os hashes manualmente nem contornar avisos de segurança do navegador.

Testes: node --test tests/*.test.cjs; python -m unittest discover -s tests -p 'test_*.py'; python tests/performance-ui-build.test.py.

## Resultados de validação desta entrega

117 testes Node e 101 testes Python passaram, além do teste de reconstrução da interface. Em medições isoladas locais, mercado: 367 ms na consulta fria e 20 ms na repetição; catálogo+Mitsubishi: 1.143 ms e 36 ms. Esses exemplos usam agosto/2026 e sua comparação anual, não o histórico inteiro; variam com concorrência e máquina. A extensão até setembro carregou só os dois novos meses e manteve exatamente os 531.775 registros do cálculo sem cache.
