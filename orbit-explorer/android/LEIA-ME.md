# Órbita para Android — versão 0.3.9

Pacotes da versão 0.3.9 gerados e assinados em `dist/orbita-0.3.9.apk` e `dist/orbita-0.3.9.aab`. O APK usa a chave local de teste, e o AAB usa a chave de upload da Play. Os relatórios de build registram os hashes e o conteúdo empacotado. A publicação está descrita em `play/PUBLICAR.md`.

## Instalar

Transfira o APK para o celular, toque no arquivo e, se o Android solicitar, permita a instalação por esse aplicativo de arquivos. Abra **Órbita**.

Na instalação limpa, a campanha começa zerada, com uma introdução ilustrada de três cenas e **Iniciar jornada**. É possível pular a introdução. Após a introdução, há uma primeira expedição guiada: scanner, pouso, minério, cristais, circuito, módulo, extração e instalação. O treinamento tem 48 de energia e pode ser pulado. Não há cadastro, login ou conexão necessária. A partida é salva no aparelho a cada ação; reabrir continua o progresso. Atualizar o APK preserva a partida. Limpar os dados do aplicativo ou desinstalar apaga o progresso local.

## Empacotamento

O APK contém somente o jogo offline completo e o invólucro Android. Não inclui fixtures de teste, partidas salvas ou referências ao servidor localhost. Não solicita permissões de internet, arquivos, câmera ou localização. Backup Android desativado. Arte completa incluída.

O botão Voltar do Android acompanha o retorno de cada tela do jogo: de um cartão para sua origem, do cartão de um módulo para a nave aberta e das áreas principais para a exploração. Na tela principal, pede confirmação para sair. Durante a introdução e o tutorial, use os controles da cena e a opção de pular. A área do jogo reserva espaço para recortes da tela e barras do sistema quando estão visíveis.

## Compilar novamente

`python3 android/build-apk.py --toolchain /caminho/para/ferramentas`

A pasta de ferramentas deve conter um JDK 17, a Android Platform e o Build Tools da versão alvo do manifesto (36), extraídos dos distribuidores oficiais; `prepare-toolchain.py` prepara tudo. O script executa o build do jogo e inclui apenas `assets/index.html`.

A chave local de teste é criada em `android/.private/orbita-test.jks`. Preserve-a para assinar futuras atualizações compatíveis. Não é uma chave de publicação na Play Store. `dist/build-report.json` contém o hash SHA-256 e o resumo do pacote.

## Verificação desta versão

- APK assinado e verificado com apksigner (v2/v3).
- Manifesto inspecionado: Activity de abertura, Android mínimo e ausência de permissões.
- Arquivos extraídos do próprio APK testados no Chromium em dois tamanhos de celular: campanha zerada, intro, iniciar, primeira ação e restauração após recarregar.
- Ainda não executado em aparelho Android físico ou emulador Android. A compatibilidade do WebView, os gestos e o ciclo de vida nativo precisam ser confirmados no celular.

## Atualizar uma versão anterior

Instale por cima para preservar a partida. Para testar a nova introdução e o tutorial desde o início, use Menu → Nova expedição → Começar do zero. Essa ação apaga a partida atual. Não force o reset ao instalar: atualizações devem preservar seu progresso.

## Alterações 0.2.4

Orientação da campanha prioriza os requisitos realmente pendentes. Controles de scanner, pouso, expedição, oficina, peças e rotas receberam símbolos mantendo rótulos e acessibilidade. A geometria da nave é reutilizada quando mudam recursos que não alteram sua aparência. As imagens mantêm a resolução original do pacote completo.

## Alterações 0.2.6

Inclui as revisões atuais de exploração e reservas, catálogo em cartões, mercado por categorias, missão por assunto, controles ilustrados e painéis compactos. Exploração permanece no mapa visto de cima. Terreno revelado com mais contraste; neblina restrita aos setores desconhecidos. Sem partida de teste embutida.

## Alterações 0.2.7

Trilhas nos dez biomas, perigos com custo visível, distinção entre cristais coletáveis e obstáculos, controles ilustrados por função e confirmação compacta de evacuação. Extração apresenta cartões de recursos, módulos e descobertas e retorna ao planeta ao concluir. Testes de clima, tutorial, rotas e primeira abertura do pacote acompanham a revisão.

## Alterações 0.2.8

Prisma: mundo exclusivo do tutorial com quatro regiões climáticas, coleta, extração, produção de oxigênio e combustível, fabricação e instalação do abrigo criogênico. Concluir entrega o abrigo e inicia a campanha limpa; pular não transfere recursos de treinamento. Partidas existentes são preservadas.

Explorações persistentes: reconhecimento, balizas, circuitos e clima continuam entre visitas. Retirar tecnologia anuncia uma reação após seis ações; estabilizador opcional custa 8 minério e 2 cristais. Avisos de falta de recursos ficam junto à descida. Cartão de recuperação em uma única tela.

## Alterações 0.2.9 (01/11/2026)

Inclui também as correções do invólucro Android listadas abaixo, que estavam prontas no código desde a 0.2.8.

Detalhes em `qa/REVISAO-2026-10-31.md`.

- **Carregamento:** a página é lida direto do APK, sem montar uma cópia de ~27 MB na memória. A origem é a mesma, então as partidas salvas são preservadas.
- **Travamento do WebView:** se o processo da página cair, o WebView é recriado e o app não fecha.
- **Mudanças de configuração:** tema escuro, escala de fonte, densidade e janelas múltiplas não recriam mais a Activity.
- **Teclado:** o espaço ocupado pelo teclado (inset) agora é respeitado no Android 15.
- **Exportar e importar:**
  - um toque duplo não abre dois seletores de arquivo;
  - a exportação sobrevive à recriação da Activity;
  - a importação espera a página carregar.
- **Conteúdo misto:** fica bloqueado (`MIXED_CONTENT_NEVER_ALLOW`).
- **Botão Voltar:** não empilha mais dois diálogos "Sair de Órbita?". Na introdução e no tutorial, continua sem efeito, como definido.


**Jogo:**

- **Xenobiologia com arte dedicada:** 16 exemplares únicos e 6 ferramentas de captura pintados, com cinemática exclusiva por exemplar; os não descobertos aparecem como silhueta no catálogo.
- **Estaleiro estelar aposentado:** quem tinha peças recebe o valor de volta em Lumes ao abrir a partida, com aviso no registro.
- **Frota:** 9 naves prontas além da Andorinha, cada uma com pintura fechada, aberta e chamas nos próprios bocais. Em cada galáxia, um viajante pode vendê-las no entreposto; o Hangar guarda as compradas e a troca é feita atracado. Preços calibrados pelo bot de campanha (1.300 a 6.000 Lumes).

`versionCode` 11, `versionName` 0.2.9. Atualizar por cima preserva a partida, desde que o APK seja assinado com a mesma chave das versões anteriores.

## Alterações 0.3.0 (04/11/2026)

- **Android 16 e Google Play:** targetSdk 36, exigido pela Play desde 31/08/2026. O botão Voltar passa pelo `OnBackInvokedCallback` no Android 13 ou mais novo (o Android 16 não chama mais `onBackPressed` em apps com esse alvo). A tela cheia usa o `WindowInsetsController` no Android 11 ou mais novo.
- **AAB:** `build-apk.py --bundle` gera o pacote da Play, assinado com a chave de upload.
- **Jogo:** trunfos exclusivos das naves e dicas de onde cada uma pousaria, sinais no mapa que apontam o próximo passo da missão, marcos e cartão de fim de capítulo, atributos da nave na nave aberta, cartão do módulo direto sobre a nave aberta (sem a aproximação da peça) e o tópico "Naves e hangar" na Ajuda.

`versionCode` 12, `versionName` 0.3.0.

## Gerar o APK de teste e o AAB 0.3.0

Os comandos rodam a partir de `orbit-explorer/`. Primeiro, prepare as ferramentas (JDK 17, Android Platform 36, Build Tools 36 e bundletool, conferidos por hash):

```bash
python3 android/prepare-toolchain.py
```

**APK de teste**, para instalar à mão por cima das versões anteriores. Ele é assinado com `android/.private/orbita-test.jks`, que fica fora do Git. Com outra chave, o Android recusa a atualização e seria preciso desinstalar, o que apaga a partida. Por isso, gere-o no computador que tem essa chave:

```bash
python3 android/build-apk.py
```

**AAB da Google Play**, assinado com a chave de upload (`android/.private/orbita-upload.jks`, criada no primeiro uso; detalhes em `play/PUBLICAR.md`):

```bash
python3 android/build-apk.py --bundle
```


## Alterações 0.3.1

- Registro do explorador integrado, com conquistas e duração dos capítulos.
- Relações com Aural, Veyra e Thar, três etapas de aliança por povo, encomendas, contribuições e postos planetários.
- Receitas próprias em 40 de reputação, pintura em 60 e compra garantida de uma nave da frota em 80. As naves continuam com seus preços normais.
- Cenas pintadas de atracagem e colheita, com opção de continuar, repetição curta e movimento reduzido.
- A primeira receita do Coro entrega duas células de dobra. A célula adicional poupa 24 minérios e 3 cristais da conversão na abertura da próxima rota.
- Estação reorganizada para celular de 320 px e retorno dos postos para o planeta.

`versionCode` 13, `versionName` 0.3.1. Partidas anteriores recebem o registro das civilizações ao carregar. Instalações limpas iniciam pela introdução.


## Alterações 0.3.2

- Aural exige restauração do viveiro e extração de duas espécies de flora.
- Veyra exige reparo do farol e extração após ativar as duas balizas em dois locais perigosos.
- Thar exige três biomas analisados, calibração do observatório e núcleos extraídos em dois sistemas.
- Os postos oferecem uma troca única por povo. Orquídea de geada libera Arca de Sementes, Ferronita libera Âncora dos Viajantes e Medusa de vidro libera Prisma de Ecos.
- As receitas recebidas são fabricadas na oficina. Cartões mostram recursos, componentes e bloqueios antes de confirmar.
- Etapas de aliança já concluídas são preservadas. As novas atividades passam a contar após iniciar a aliança, e os objetivos de extração exigem retorno com sucesso.

`versionCode` 14, `versionName` 0.3.2.

## Alterações 0.3.3

Viveiro Aural ilustrado antes e depois da restauração. Um canteiro custa 12 Lumes e 2 minérios e rende 3 samambaias-lume após duas extrações com coleta em locais distintos. Evacuações e repetições não aceleram o crescimento. Colheitas aguardam espaço no depósito. Partidas anteriores recebem o cultivo sem perder progresso.

## Alterações 0.3.4

Inclui leituras Veyra e recuperação de componentes Thar. Alianças reorganizadas em Jornada, Recompensas e Apoio, com próximo desbloqueio e pontos restantes. Etapas existentes receberam consequências narrativas específicas ligadas à Aurora e ao Coro, sem reiniciar progresso. Desbloqueio de nave é acesso à compra, não entrega gratuita.

## Alterações 0.3.5

Resumo da extração informa avanço das alianças. Veyra não cobra por leituras de mundos já analisados. Auditoria de regras, navegação, tutorial e salvamento; nenhuma nova mecânica ou conteúdo.

## Alterações 0.3.6

Tutorial com mensagens unificadas e introdução atualizada para as civilizações. Materiais de bioma exigem coleta explícita; extração não concede flora/fauna automaticamente. Kit inicial de Prisma fornece a samambaia didática. Saves existentes preservados.

## Alterações 0.3.7

- Encomendas com fontes reais de recursos e identidade estável após entrega, retorno ao entreposto e recarregamento. Novas entregas guardam item, quantidade e pagamento; contratos antigos continuam concluídos, sem pagamento duplicado.
- Leituras Veyra indicam recursos realmente presentes e o ponto correspondente. Recuperação Thar explica custos e a origem da liga.
- Navegação do mercado conserva a categoria e a opção de compra/venda.
- Regressão: 408 entregas em ambas as ordens, 3.408 encomendas com fonte e 5.460 indicações de depósito; testes de economia, civilizações e serviços.

## Alterações 0.3.8

- Depósito: troca de módulos e de naves verifica o volume dos materiais e equipamentos guardados, além dos espaços de módulos.
- Previsão de viagem considera o oxigênio gratuito da Albatroz, mantendo o custo de desatracar.
- Descobertas de recursos negociados permanecem no catálogo após vender a última unidade.
- Validação de recibos inválidos e redução de cálculos repetidos de carga e descobertas.
- Inclui todas as correções da revisão complementar posterior à 0.3.7.

## Alterações 0.3.9

- Custos de viagem e avaliação de resgate respeitam as habilidades da frota.
- Pelicano recupera recursos especiais e registra os depósitos que forneceram a carga salva.
- Viajante permanece na galáxia de origem durante o retorno da campanha.
- 41 arquivos de testes de lógica aprovados; rotas, intro, alianças e serviços móveis validados. Primeira abertura dos assets do APK testada em dois tamanhos móveis.
