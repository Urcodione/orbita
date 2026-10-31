# Identidade dos controles

`control-icons.js` centraliza as operações e suas artes. Telas diferentes reutilizam a identidade apenas quando executam a mesma operação. Não usar um módulo genérico como fallback visual de uma operação nova.

| Operação | Identidade |
|---|---|
| Evacuar | Cápsula com paraquedas laranja |
| Base | Plataforma de pouso |
| Retornar com carga | Trilha que termina na base |
| Scanner/analisar | Radar verde |
| Ativar baliza | Torre de transmissão dourada |
| Extrair carga | Guincho com caixa |
| Explorar/pilotar | Rover |
| Atracar/desatracar | Garra orbital; saída tem direção explícita |
| Decolar/retornar à órbita | Nave subindo com propulsão |
| Pousar | Pernas de pouso e feixe descendente |
| Viajar/localizar no mapa | Bússola estelar |
| Dobra | Vórtice violeta |
| Esperar o clima | Ampulheta |
| Decifrar/circuito | Decodificador com rotores |
| Resgate da nave | Boia e rádio de socorro |
| Descarga de emergência | Acumulador elétrico |
| Catálogo / missão / ajuda / introdução | Livro / pergaminho / holograma de ajuda / filme |
| Áudio / nova partida / partidas | Fones / mapa novo / cofre de dados |
| Guardar / exportar / importar / restaurar | Cartucho / saída / entrada / disco restaurado |
| Fabricar módulo / componente | Prensa industrial / bancada de soldagem |
| Reciclar | Alicate desmontando carcaça |
| Encomendas | Armário de entregas e moeda |

Mantidos: arte própria de módulos, materiais, componentes e espécies em seus cartões; moeda Lume em compra/venda; seta simples e consistente em navegação; estrela para favorito; controles direcionais dos puzzles. Esses elementos representam objetos, seleção ou manipulação direta, não atalhos operacionais.

Novas pranchas: `assets/flight-controls-v1.webp` e `assets/utility-controls-v1.webp`. Fontes geradas preservadas fora do pacote; jogo usa cópias locais WebP com transparência e não depende de rede.

A confirmação de evacuação exibe carga pendente, separa “Ficar no terreno” de “Evacuar sem carga” e não modifica estado ao cancelar. A atualização é visual; custos, clima, coleta e perda de carga seguem as regras existentes.
