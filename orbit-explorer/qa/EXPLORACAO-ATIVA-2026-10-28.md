# Exploração ativa — 28/10/2026

Novas saídas após o tutorial usam duas balizas alcançáveis no corredor garantido do terreno. Cada ativação custa 1 energia, revela uma área de raio 2 e habilita uma das duas leituras necessárias para abrir a operação do núcleo. A ação é validada no motor, não apenas no botão. Saídas já salvas mantêm suas regras antigas; missões guiadas preservam o percurso introdutório.

Clima rigoroso: meteorologia >=35 ou biomas gasoso, magma, vulcânico, gelo, tóxico. Ciclo por ação: 3 ações de calmaria, 2 de aviso, 3 de tempestade. Sem relógio real ou consumo enquanto menus são lidos. Setores perigosos custam 1 energia adicional durante atividade. Esperar custa 1 energia fora da base e zero na base. Não recupera energia. A reserva/retorno automático usa custo conservador de tempestade em todos os perigos, para nunca prometer uma volta barata que mude durante o caminho. O retorno automático continua disponível, com a reserva conservadora cobrada explicitamente.

Desenho: pintura de chão contínua, remoção da grade de fundo, rastro de setores visitados, balizas ilustradas e partículas/faixas de clima por bioma. Respeita efeitos reduzidos e pausa das cenas cobertas. Controles de campo reunidos em uma faixa.

Verificações: 23 suítes de regras passaram; navegador 320×568 e 390×844 completou balizas, clima, circuito, recuperação e extração sem erros ou sobreposição. Teste de clima no navegador usa um mundo inicial com intensidade aumentada apenas na sessão isolada de QA; não modifica campanhas reais.

Limites: esta etapa acrescenta exploração e clima por turnos, não tempestades físicas em tempo real nem uma nova campanha. Abrir menus locais do entreposto continua gratuito; deslocamentos entre sistemas usam os custos existentes. Nenhum APK foi gerado.
