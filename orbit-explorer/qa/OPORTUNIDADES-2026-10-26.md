# Revisão global de oportunidades — 26/10/2026

Escopo: código atual e execução em navegador isolado. Nenhuma regra do jogo foi alterada nesta revisão. Não foi gerado APK e não houve teste em Android físico.

## Validação executada

- As 18 suítes `*.test.cjs` passaram, incluindo campanha, economia, energia, expedições, materiais, módulos, estoque e tutorial.
- Passaram `qa/commerce-test.cjs`, `qa/semantic-storage-test.cjs` e `qa/customization-test.cjs`: mercado, compra/venda, estoque persistido, componentes, retornos de relíquias, personalização e layout em 320×568 e 390×844.
- `qa/route-consistency-test.cjs` não concluiu: sua preparação injeta 500 minérios, 500 cristais e 20 de cada componente. A fabricação fica corretamente bloqueada por volume. Isso é incompatibilidade do teste com o estoque atual, não evidência de defeito nessa fabricação. As demais rotas dessa suíte permanecem sem revalidação nesta rodada.
- Reprodução isolada: fabricar Olho do Antes com depósito em 250/250 exige mais cinco unidades livres; preview e execução rejeitaram, preservando o estado.
- Medição isolada: a cena principal desenhou 62 vezes em cerca de um segundo atrás do menu de tela inteira. Isso confirma trabalho invisível; não é medição de bateria ou FPS em aparelho físico.
- Reprodução isolada: ligar o som e recarregar retornou a “Som desligado”.

## Prioridade 1 — confiabilidade e fluidez

### Progresso recuperável
Hoje há persistência local e validação de snapshots, mas não uma interface de exportação/importação ou um segundo checkpoint recuperável. `ui.js` grava a chave principal; o Android desativa backup no manifesto. Uma desinstalação ou limpeza de dados pode eliminar uma campanha longa.
Proposta: cópia anterior válida, exportar/importar partida com validação e confirmação de substituição, mensagem clara quando não for possível salvar. Não exigir conta.
Aceitação: recuperar uma cópia anterior sem perder silenciosamente o progresso e rejeitar arquivos inválidos sem substituir a partida.

### Suspender renderização invisível
`scene.js:tick` só para quando o documento fica oculto; um painel aberto não suspende a cena. O estúdio ainda tem seu próprio ciclo de prévia. Movimento reduzido congela o tempo, mas mantém redesenho contínuo.
Proposta: pausar a cena coberta por painéis, manter apenas a prévia visível e desenhar sob demanda quando movimento reduzido estiver ativo. Acrescentar opção de efeitos leves sem alterar a arte base.
Aceitação: nenhum quadro da cena coberta; retomada sem saltos; medir fluidez e temperatura em Android físico.

### Preferências persistentes
Som reinicia desligado por `sound=false` e não faz parte do salvamento. Guardar som e eventual qualidade visual separadamente da campanha; iniciar nova jornada não deve apagar preferências.

### Atualizar a validação das rotas
Refazer as preparações dos testes com estoque válido. Criar casos distintos para fabricação normal e estoque cheio. Incluir o fluxo atual Sistema → Mundos → planeta → órbita e comparar o destino confirmado ao selecionado.
Não tratar a suíte interrompida como certificação das rotas restantes.

## Prioridade 2 — valor de cada descoberta

### Variar a atividade, não apenas o bioma
A campanha tem oito capítulos e quotas somando 70 núcleos. Já existem sete encontros exclusivos e uma negociação, mas boa parte do avanço ainda depende de completar expedições do mesmo formato. A hipótese de cinco horas não foi demonstrada por uma partida humana completa.
Proposta: introduzir gradualmente três famílias de objetivo usando a estrutura existente: estabilizar uma instalação, observar uma criatura por uma sequência de posições e extrair uma amostra antes que uma rota se feche. Evitar encher todos os locais de eventos.
Aceitação: o jogador consegue descrever uma decisão nova por capítulo; medir desistências e repetição de coleta, não só duração.

### Transformar evolução em consequência visível
O jogo já tem marcos, orientação e resumo de extração. Aprimorar essas superfícies: mostrar o próximo benefício concreto (“esta tecnologia abre os oceanos”) e celebrar a instalação, não somente a posse do módulo. Usar recompensas cosméticas como lembranças dos capítulos.
Premium continua livre nesta versão, conforme solicitado. Qualquer bloqueio real fica para uma decisão futura.

### Preparação de viagem em um quadro visual
O destino já é escolhido explicitamente. O próximo ganho é um resumo único: custo orbital, proteção da superfície, espaço livre e indicação de recurso para retorno. Quando faltarem dados de destino/rota, indicar estimativa em vez de prometer retorno garantido. Não adicionar atalhos de oficina dentro de todos os cartões.

### Estação com objetivos comerciais alcançáveis
A economia já tem oferta/demanda, spread e limites. Acrescentar contratos finitos por visita: entregar um material de outro clima ou uma amostra catalogada, com pagamento e custo de viagem legíveis. Não pagar novamente pela mesma entrega e não exigir espera para concluir a campanha.

## Prioridade 3 — clareza e manutenção

- Personalização: algumas legendas têm 7–8 px. Manter ícones e uma linha de nome/efeito da seleção em tamanho legível, sem criar outra página.
- Catálogo: transformar percentuais em pequenos marcos opcionais por bioma/coleção, sem revelar nomes de itens desconhecidos.
- Equipamentos: estudar dois conjuntos salvos (exploração/comércio), aplicados apenas quando a troca for permitida e mostrando perdas de capacidade. Nunca trocar automaticamente.
- Identidade: preservar a arte aprovada e criar referências visuais antes de novas substituições; efeitos premium precisam ter regras comuns de intensidade.
- Conteúdo offline: `index.html` tem aproximadamente 10 MB, com imagens embutidas. Não é um problema de tamanho comprovado; medir tempo de abertura e memória antes de separar recursos no APK. O novo fundo WebP ocupa cerca de 415 KB.
- Documentação: LEIA-ME ainda menciona botão “Abrir nave” e paginação generalizada; CAMPANHA-RITMO contém medição histórica com 144 núcleos, embora explicite que é anterior à revisão atual. Atualizar para não confundir desenvolvimento/testes.
- Release: APK 0.2.5 é anterior às últimas alterações visuais. A revisão atual vale para o navegador; gerar outra versão somente no próximo pedido de build.

## Ordem recomendada

1. Checkpoints/backup, persistência de preferências e pausa de renderização invisível.
2. Atualizar testes de rotas e conferir em Android físico.
3. Resumo visual da preparação e recompensas ligadas a marcos existentes.
4. Uma nova família de exploração e dois contratos comerciais; observar uma partida antes de multiplicar conteúdo.

Não recomendo priorizar mais moedas, mais menus, destruição aleatória de módulos ou aumentar quotas para alongar a campanha.
