# Órbita — Xenobiologia e Estaleiro estelar

Abra **galeria.html** depois de extrair o pacote, mantendo a pasta assets ao lado dela. Não requer internet. Use 30, 48 ou 120 px para comparar a leitura dos ícones. Em Exemplares, alterne para as silhuetas. Toque numa pintura para ampliá-la.

## Conteúdo para o jogo

- assets/src/xeno-tools/: seis ferramentas de captura.
- assets/src/xeno-specimens/: oito exemplares de fauna e oito de flora.
- assets/src/yard-parts/: doze peças de casco, quatro por facção.
- assets/: os três atlas WebP e suas versões compactas, com o sufixo -inline.

Os PNGs são quadrados de 1024 px com transparência real; o tamanho de cada objeto considera as margens e a proporção pedidas no briefing. O arquivo prompts.json registra a geração individual, os prompts finais e os IDs. As quatro referências em references/ são miniaturas dos originais da direção de arte de Órbita, fornecidas à ferramenta; não são novos itens.

As fontes e os WebP estão instalados no projeto indicado. Para montar novamente os atlas após trocar alguma pintura, use o script existente `python3 qa/prepare-xeno-yard-art.py`. O próximo build incorpora os atlas: o HTML offline ou APK gerado antes da troca continuará com a arte anterior até ser recompilado.

## Ajuste opcional — não aplicado

O código atual já lê os atlas para ferramentas nos painéis, exemplares no laboratório e nas cenas e peças no casco. Duas situações têm comportamento próprio:

1. A regra de estilo da arte pintada se sobrepõe ao filtro preto do exemplar desconhecido. O atlas tem alfa e contornos adequados à silhueta; é o filtro da interface que precisa de ajuste.
2. Na cinemática de captura o exemplar usa o atlas, mas o acessório animado ainda usa a ferramenta vetorial. A loja e o laboratório já usam a ferramenta pintada.

O arquivo **ajuste-de-exibicao.patch** trata exclusivamente desses dois pontos. Está separado, para aplicação futura se desejada; não foi aplicado ao jogo.

## Conferência

As pranchas com sufixo -previa.jpg permitem revisar nomes, acabamentos e escala sem abrir o jogo. verificacao.json registra a checagem dos 34 PNGs e das 68 células (três atlas, duas resoluções). montagem-no-casco.png usa a função de desenho do próprio estaleiro, e captura-leviata.png é um quadro da cinemática existente.
