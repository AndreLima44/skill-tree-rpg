# Combat Suite 2.0

## Antes de testar
Execute `supabase-migration.sql` novamente no SQL Editor do Supabase.

## Implementado
- Seleção de alvo clicando em cards de aliados/inimigos.
- Ações rápidas do jogador: ataques cadastrados e habilidades adquiridas.
- Fila de confirmação do mestre para ações enviadas pelos jogadores.
- Histórico ampliado de combate.
- Condições/efeitos temporários com duração em rodadas e expiração automática.
- Condições clicáveis levando para a busca de regras.
- Controles rápidos de PV/PD e PV de inimigos (-10/-5/-1/+1/+5/+10).
- Destaque automático visual para entidades em 0 PV, sem impor uma regra de morte/inconsciência.
- Ficha detalhada de inimigo.
- Duplicação rápida de inimigos.
- Bestiário com nível, categoria, elemento, RD, pesquisa e filtros.
- Encontros salvos que adicionam grupos de inimigos ao combate.
- Modo de sessão com nome, cronômetro, início/fim e notas finais.
- Realtime incremental preservado; novas tabelas de efeitos e ações também disparam sync leve.

## Observação
O sistema não decide automaticamente dano, testes ou efeitos ambíguos. A automação é assistida e o mestre confirma as ações.
