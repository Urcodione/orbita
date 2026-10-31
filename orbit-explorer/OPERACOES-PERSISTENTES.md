# Operações de superfície persistentes

- O reconhecimento do terreno, as balizas, os rotores e as operações locais/da campanha persistem entre visitas. A carga só é salva por extração, como antes.
- Cada local registra o próprio relógio: ações de campo o avançam; menus, tempo real e outras regiões não. Uma nova aproximação acrescenta duas ações ao relógio, sem reiniciar o ciclo natural. As despesas normais de combustível e oxigênio continuam.
- Recuperar a tecnologia com sucesso dispara uma reação de acordo com o bioma, anunciada antes da recuperação. Há seis ações locais de antecedência. Depois, cada deslocamento fora da base custa +1 energia, além dos efeitos climáticos normais. A tempestade visual e os indicadores refletem a reação persistente.
- Evacuar, extrair, visitar novamente ou carregar o save não limpa a reação. Ela é disparada uma única vez, inclusive se a tecnologia daquela saída for perdida.
- O estabilizador custa 8 minério e 2 cristais. Pode ser instalado pela preparação de um local já visitado, na base ou junto ao núcleo. Contém a reação nesse local permanentemente, sem eliminar o clima natural. O custo e o estoque ficam visíveis. A compra não pode ser repetida.
- A previsão de retorno inclui de forma conservadora a reação que poderá ocorrer após recuperar o núcleo. A confirmação de risco já existente continua responsável por alertar quando a energia não cobre essa previsão.
- Prisma não recebe essa pressão adicional. Registros anteriores sem operações persistentes continuam aceitos. A campanha preserva os registros da origem e da fronteira ao alternar entre elas.

Validação: persistent-sites.test.cjs; site-revisits.test.cjs; energy-return.test.cjs; campanha completa; qa/persistent-sites-browser-test.cjs em 320×568 e 390×740; regressão completa do tutorial por toque.
