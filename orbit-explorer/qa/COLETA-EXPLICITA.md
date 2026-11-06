# Extração sem materiais automáticos

Causa: economy.js usava o número de depósitos coletados para conceder todos os materiais locais ao extrair, incluindo flora e fauna. A regra foi removida.

No mundo normal, dois depósitos do mapa mantêm recursos básicos e os outros podem representar materiais específicos do bioma. A distribuição é determinística por local. A figura, legenda da coleta e carga pendente identificam o material. Coletar é necessário; extrair transfere exatamente a carga. Mantém as regras atuais de energia, ocupação por depósito, coleta intensiva, esgotamento e limite por recurso.

Prisma mantém seus depósitos básicos. A aula de oxigênio usa uma samambaia do kit inicial, informada na orientação; não é recompensa de extração. Partidas de treino anteriores sem esse insumo recebem o material para não bloquear a aula. Ao sair do treino, o kit é devolvido como antes. Recursos já recebidos em saves antigos não foram removidos.

Recompensas de núcleo (módulo, fragmento e suprimentos), coleta de Lumes e o kit didático de pesquisa/minério continuam existindo; não são o bônus automático de bioma corrigido aqui.

Verificação: todos os testes de regras passaram; explicit-cargo.test cobre todos os biomas comparando estoque, pending e recibo, com restauração do save. Testes biológicos/minerais e alianças agora coletam o material correto. Tutorial completo em 320/360 e coleção identificada/manifesto em 320/390 passaram. Build offline atualizado; APK/AAB não regenerados.
