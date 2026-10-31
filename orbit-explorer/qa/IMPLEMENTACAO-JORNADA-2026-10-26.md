# Evolução da jornada — 26/10/2026

Implementados os sete pontos aprovados e áudio original sintetizado, sem serviços online ou cadastro.

1. **Partida segura:** cópia local periódica da última partida válida (intervalo mínimo de 60 s), checkpoint manual, recuperação automática quando a principal está inválida, exportação/importação com validação e revisão antes da substituição. O arquivo atual pode ser exportado pelo navegador; o Android ganhou seletor nativo de arquivos, compilado com sucesso, ainda não testado em aparelho.
2. **Renderização:** cena principal e terreno pausam atrás dos painéis; retomam ao fechar. Modo de efeitos leves em configurações. Prévia da nave continua ativa quando visível; movimento reduzido desenha a prévia estática.
3. **Áudio e preferências:** 13 identidades musicais (10 biomas, espaço, nave, entreposto), variação rítmica de expedição, ambientes filtrados, motor e efeitos de ações. Música por síntese original de acordes/arpejos, sem gravações ou samples de terceiros. Ativação pelo usuário em Menu → Som e efeitos; música/ambiente/efeitos separados. Preferências fora do save de campanha. Áudio suspende em segundo plano e ao desligar.
4. **Variedade de exploração:** locais comuns passam a alternar circuitos existentes com equilíbrio de três reservatórios, observação de respostas e protocolo de preservação de amostra. Sem substituir tutorial ou encontros narrativos. Operações são por turno, sem timer; recuperação continua custando três unidades de energia e exige extração. Tipos e progresso persistem.
5. **Benefício da conquista:** missão indica o benefício operacional da próxima tecnologia; instalar um módulo cósmico mostra a resistência resultante. Estilos Ultravioletas/Boreais/Nova recebem marcos de conquista nos capítulos correspondentes. Cosméticos continuam todos livres para teste.
6. **Comércio com propósito:** dois contratos determinísticos por entreposto, materiais disponíveis na galáxia, preferência por biomas de outros sistemas, consumo explícito de carga e pagamento único. Sem prazo, repetição por recarregar ou moedas novas. A raridade entra na quantidade e o valor base determina o pagamento.
7. **Preparação:** confirmação de rota reúne gasto, saldo após chegada, espaço livre, condição de superfície e uma estimativa conservadora de retorno equivalente, sem prometer cobertura de exploração ou troca de equipamentos.

## Verificações

- 19 suítes de regras passaram após integração, incluindo `voyage.test.cjs`; teste adicional `save-recovery.test.cjs` cobre recuperação e falhas de armazenamento.
- 64 retornos de navegação passaram em 320×568 e 390×844. A preparação de fabricação foi corrigida para não encher artificialmente o depósito.
- `qa/voyage-browser-test.cjs`: áudio ligado/volumes persistidos, pausa da cena coberta, retomada, checkpoint, exportação, importação inválida, contratos e retorno.
- `qa/voyage-operations-test.cjs`: os três tipos de operação completos, layout sem rolagem e recuperação em dois tamanhos de celular.
- Java Android compilado; sem novo APK nesta etapa. Seletor nativo e reprodução no alto-falante de aparelho físico ainda exigem teste real.

## Limites e próximas medições

As músicas são paisagens sonoras procedurais, não gravações orquestradas. A qualidade percebida e o equilíbrio dos volumes precisam de escuta em aparelho. Os efeitos não alteram consumo de recursos do jogo.

As novas operações inauguram variedade, sem prometer cinco horas comprovadas. Observar partidas humanas antes de ampliar quotas. Contratos são limitados por entreposto e devem ser acompanhados no balanço de Lumes.
