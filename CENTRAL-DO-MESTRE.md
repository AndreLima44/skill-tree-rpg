# Central do Mestre

## Antes de usar
Execute `supabase-migration.sql` novamente no SQL Editor do Supabase.

A migracao adiciona:
- `characters.conditions`
- iniciativa em `battles` (`turn_order` e `turn_index`)
- `enemy_templates` para o bestiario
- `gm_notes` para notas privadas
- `battle_log` para historico
- RPCs seguras para alterar PV/PD e condicoes
- ataques/habilidades/notas em `battle_enemies`

## Nova area Mestre
A aba Mestre agora possui:
- Sessao: resumo, jogadores online, rodada, turno, inimigos, feridos e condicoes
- Personagens: PV/PD rapido, condicoes, abrir ficha e habilidades
- Inimigos: bestiario reutilizavel, editar, duplicar e adicionar ao combate
- Notas: bloco privado com autosave
- Regras rapidas: atalhos para o Livro de Regras

## Combate
- Iniciativa manual e proximo turno
- Condicoes dos personagens visiveis no combate
- Inimigos podem carregar ataques e habilidades
- Mestre decide se ataques/habilidades dos inimigos ficam visiveis aos jogadores
- Historico privado do mestre registra eventos importantes

## Observacao
O contador "online" usa Supabase Presence. Ele conta usuarios com esta versao do site aberta e conectada naquele momento.
