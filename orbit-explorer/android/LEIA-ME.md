# Órbita para Android — versão de teste 0.2.9

Último APK gerado: `dist/orbita-0.2.8.apk` (Android 8.0 ou superior, WebView atualizado). A 0.2.9 está pronta no código e no `index.html`; o APK é gerado no computador que tem a chave de assinatura (veja "Gerar o APK 0.2.9").

## Instalar

Transfira o APK para o celular, toque no arquivo e, se o Android solicitar, permita a instalação por esse aplicativo de arquivos. Abra **Órbita**.

Na instalação limpa, a campanha começa zerada, com uma introdução ilustrada de três cenas e **Iniciar jornada**. É possível pular a introdução. Após a introdução, há uma primeira expedição guiada: scanner, pouso, minério, cristais, circuito, módulo, extração e instalação. O treinamento tem 48 de energia e pode ser pulado. Não há cadastro, login ou conexão necessária. A partida é salva no aparelho a cada ação; reabrir continua o progresso. Atualizar o APK preserva a partida. Limpar os dados do aplicativo ou desinstalar apaga o progresso local.

## Empacotamento

O APK contém somente o jogo offline completo e o invólucro Android. Não inclui fixtures de teste, partidas salvas ou referências ao servidor localhost. Não solicita permissões de internet, arquivos, câmera ou localização. Backup Android desativado. Arte completa incluída.

O botão Voltar do Android acompanha o retorno de cada tela do jogo: de um cartão para sua origem, da inspeção para a nave aberta e das áreas principais para a exploração. Na tela principal, pede confirmação para sair. Durante a introdução e o tutorial, use os controles da cena e a opção de pular. A área do jogo reserva espaço para recortes da tela e barras do sistema quando estão visíveis.

## Compilar novamente

`python3 android/build-apk.py --toolchain /caminho/para/ferramentas`

A pasta de ferramentas deve conter um JDK 17, Android Platform 35 e Build Tools 35 extraídos dos distribuidores oficiais. O script executa o build do jogo e inclui apenas `assets/index.html`.

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

## Gerar o APK 0.2.9

O APK precisa ser assinado com a mesma chave das versões instaladas (`android/.private/orbita-test.jks`, que fica fora do Git). Com outra chave, o Android recusa a atualização e seria preciso desinstalar, o que apaga a partida. Por isso, gere-o no computador que tem essa chave:

```bash
python3 android/prepare-toolchain.py
python3 android/build-apk.py
```

Os comandos rodam a partir de `orbit-explorer/`. O primeiro baixa e confere as ferramentas oficiais (JDK 17, Android Platform 35 e Build Tools 35) em `/tmp/orbita-android-toolchain`; o segundo refaz o `index.html`, empacota, assina e verifica `dist/orbita-0.2.9.apk`. Se a pasta `android/.private/` não existir nesse computador, o script cria uma chave nova: nesse caso, desinstale a versão anterior antes de instalar a 0.2.9.
