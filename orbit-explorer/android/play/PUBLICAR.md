# Publicar o Órbita na Google Play

Roteiro do primeiro envio. Requisitos conferidos em 4/11/2026: a Play exige o formato **AAB** e, desde 31/08/2026, apps novos e atualizações precisam ter **targetSdk 36** (Android 16). A 0.3.0 já atende os dois.

## 1. Conta de desenvolvedor

- Crie a conta em play.google.com/console (taxa única de US$ 25) e conclua a verificação de identidade.
- **Conta pessoal ou de organização.** Conta pessoal criada depois de 13/11/2023 só libera a produção depois de um **teste fechado com pelo menos 12 testadores inscritos por 14 dias seguidos**. A conta de organização não tem essa etapa, mas exige um número D-U-N-S, que pode levar semanas para sair.
- O e-mail de contato do desenvolvedor aparece publicamente na ficha.

## 2. Nome do pacote

O app usa `com.orbita.explorer`. Esse nome é definitivo depois do primeiro envio e precisa estar livre na Play. Se o Console recusar, troque em `android/AndroidManifest.xml` (atributo `package`) antes de gerar o AAB. Um pacote diferente vira outro app no celular: a partida do APK de teste não passa para ele, mas pode ser levada com **Exportar** e **Importar**.

## 3. Gerar o AAB

No computador com as ferramentas (a partir de `orbit-explorer/`):

```bash
python3 android/prepare-toolchain.py
```

```bash
python3 android/build-apk.py --bundle
```

O primeiro comando baixa e confere o JDK 17, a Android Platform 36, o Build Tools 36 e o bundletool. Na primeira execução, ele grava o hash do bundletool em `android/toolchain.lock.json`: faça commit desse arquivo, para que os próximos downloads sejam comparados com ele.

O segundo comando gera `android/dist/orbita-0.3.0.aab`, valida o pacote e assina com a **chave de upload** `android/.private/orbita-upload.jks`. Na primeira vez, ele cria essa chave e pede uma senha (ou use a variável `ORBITA_UPLOAD_PASSWORD`). O resumo fica em `android/dist/bundle-report.json`, com o SHA-256 do certificado de upload.

**Guarde a chave de upload e a senha fora do computador** (gerenciador de senhas ou um pendrive guardado). Ela não vai para o Git. Se for perdida, dá para pedir a troca ao suporte da Play, mas os envios ficam parados até lá.

## 4. Assinatura pela Play

No primeiro envio, aceite a **Assinatura de apps do Google Play**. O Google guarda a chave que assina o app instalado pelos jogadores, e você envia os AABs com a chave de upload.

A chave de teste (`orbita-test.jks`) continua servindo só para os APKs instalados à mão. Um celular com o APK de teste não atualiza para a versão da Play: assinaturas diferentes. Para passar a partida, exporte no APK, desinstale, instale pela Play e importe o arquivo.

## 5. Conteúdo do app (Play Console → Política → Conteúdo do app)

| Formulário | Resposta |
|---|---|
| Política de privacidade | URL pública da página `android/play/privacidade.html` (ver seção 7) |
| Anúncios | Não contém anúncios |
| Acesso ao app | Todas as funções estão disponíveis sem acesso especial |
| Segurança dos dados | Não coleta nem compartilha dados do usuário. Sem criptografia em trânsito porque nada é transmitido. Sem solicitação de exclusão de conta porque não há conta. |
| Classificação de conteúdo (IARC) | Categoria Jogo. Sem violência explícita, sangue, linguagem imprópria, drogas, conteúdo sexual ou apostas. Sem interação entre usuários, sem compartilhamento de localização, sem compras digitais. Resultado esperado: Livre. |
| Público-alvo | 13 anos ou mais (recomendado). Incluir faixas abaixo de 13 anos coloca o app nas regras de Famílias, com revisão extra. O app já atenderia essas regras (sem dados, sem anúncios), mas o processo fica mais longo. |
| App de notícias / governo / financeiro / saúde | Não |

## 6. Ficha da loja

Textos em `android/play/ficha.md`; ícone, gráfico de recursos e capturas em `promo/2026-10-playstore/`.

## 7. Hospedar a política de privacidade

A Play pede uma URL pública, que abra sem login. O arquivo `privacidade.html` é uma página única, sem dependências. Antes de publicar, troque `CONTATO@EXEMPLO.COM` pelo e-mail de contato. Opções gratuitas: GitHub Pages (num repositório público), Google Sites ou o site que você já tiver.

## 8. Teste fechado e produção

1. Teste interno (opcional, até 100 testadores, disponível em minutos): suba o AAB e instale no seu celular pelo link de teste.
2. Teste fechado: crie a lista de e-mails, suba o AAB e mantenha pelo menos 12 testadores inscritos por 14 dias. Peça que joguem de verdade: a Play pode olhar o uso durante o teste.
3. Depois dos 14 dias, peça o acesso à produção no Console e responda o questionário sobre o teste.
4. Produção: lançamento gradual (por exemplo, 20% dos usuários) e depois 100%.

A cada nova versão, aumente `android:versionCode` (e `android:versionName`) no `AndroidManifest.xml`. A Play recusa um versionCode repetido.

## O que muda no app com o Android 16

- **Voltar:** no Android 13 ou mais novo, o botão Voltar chega pelo `OnBackInvokedCallback` (o manifesto tem `enableOnBackInvokedCallback`). Apps com targetSdk 36 não recebem mais `onBackPressed`. O comportamento é o mesmo de antes: volta uma tela no jogo e, na tela principal, pergunta se quer sair.
- **Tablets e telas grandes:** com targetSdk 36, o Android 16 ignora a trava de orientação retrato em telas com 600 dp ou mais. Os testes de navegador cobrem larguras de 320 a 1024 px, mas o jogo ainda não foi testado num tablet em paisagem: confira antes de liberar para tablets.
- **Tela cheia:** as barras do sistema ficam ocultas pelo `WindowInsetsController` (Android 11+) e reaparecem com um gesto da borda.
