# Refatoracao V3

Esta versao reorganiza o projeto sem adicionar uma nova funcionalidade grande.

## Principais mudancas

- Navegacao de jogador/mestre usa uma unica implementacao (`js/navigation.js`).
- Tema isolado em `js/theme.js`.
- Cliente Supabase isolado em `js/supabase.js`.
- Acoes manuais de combate em `js/combat/actions.js`.
- Cadastro/uso de inimigos em `js/combat/enemies.js`.
- Visao agregada/mini ficha do mestre em `js/master/players.js`.
- `checkSession()` executa apenas no bootstrap final, depois de todos os modulos.
- Removidas redefinicoes duplicadas de funcoes e wrappers historicos.
- `pageshow` nao usa mais reload completo; a secao visivel e ressincronizada.
- Realtime de personagens/inimigos tenta atualizar somente o card afetado; sincronizacao completa fica como fallback.
- Linkificacao do Livro de Regras usa indice pre-calculado em vez de pesquisar cada termo repetidamente.
- Cronometro da sessao so mantem intervalo quando existe sessao ativa e a aba esta visivel.
- CSS dividido por responsabilidade e todas as regras `max-width: 640px` consolidadas em `css/mobile.css`.
- Migracao V3 consolidada: uma unica `get_battle_enemies`, sem `v2`, e assinatura definitiva de `apply_manual_combat_action`.

## SQL

Execute `supabase-migration-v3.sql` no SQL Editor. O arquivo e idempotente e tambem e copiado como `supabase-migration.sql` para manter compatibilidade com as instrucoes antigas.
