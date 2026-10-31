# Revisão para Android 0.2.4

## Mudanças
- Próximo passo da campanha evita núcleos redundantes quando falta um sinal único, mundo ou sistema.
- Avaliação de proteção sob demanda, reutilizada dentro do cálculo de orientação.
- Símbolos em ações de scanner, pouso, órbita, exploração, proteção, rotas, oficina e peças, preservando texto acessível.
- Controles secundários do planeta com área de toque de 44 px.
- Reconstrução da geometria da nave apenas quando mudam módulos, pintura ou recursos efetivamente representados (oxigênio e presença de minério/cristais).

## Verificações
- 16 suítes de lógica passaram, incluindo campanha, comércio, energia e restauração.
- 13 conjuntos de arte decodificados; sem redução de resolução nesta versão.
- Novo teste verifica controles visuais, nomes acessíveis, toque, layout fixo e invalidação correta do cache da nave.
- 68 regressões de navegação passaram em 320×568 e 390×844. Objetivo, extração, custo e retorno também passaram.
- Canvas verificado em densidades 1 e 2, incluindo estabilidade com movimento reduzido.
- illustrated-art-test.cjs é histórico: busca controles removidos e não passou na interface atual. As verificações atuais de arte/cache/resolução estão em release-visual-test.cjs.
- Sem teste em aparelho Android físico.
