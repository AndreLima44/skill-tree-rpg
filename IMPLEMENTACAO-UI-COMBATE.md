# Implementação: nova navegação + modo Combate

## O que mudou
- Navegação principal reduzida para **Ficha, Combate, Habilidades e Regras**.
- Mestre recebe um quinto item **Mestre**.
- Os oito elementos saíram da navegação principal e agora aparecem dentro de **Habilidades**.
- Desktop usa uma barra lateral compacta; Steam Deck/mobile usam navegação inferior.
- A Ficha ganhou um atalho **Ver árvore →** junto das habilidades desbloqueadas.
- O seletor de personagem do mestre virou um painel pesquisável acionado pelo bloco do personagem.
- O antigo conceito de Escudo do Mestre foi absorvido por **Combate**.
- Combate mostra aliados e inimigos e atualiza durante a sessão.
- Mestre pode iniciar/encerrar batalha, avançar rodada, criar/editar/remover inimigos, ajustar PV e escolher quais dados de inimigos ficam visíveis aos jogadores.
- Condições dos inimigos levam à pesquisa correspondente no Livro de Regras.

## Antes de usar Combate
Execute novamente `supabase-migration.sql` no SQL Editor do Supabase. O final do arquivo cria `battles`, `battle_enemies`, políticas RLS, Realtime e a RPC `get_battle_enemies`.

A RPC mascara informações secretas dos inimigos no servidor. Quando PV numérico está oculto, jogadores recebem apenas a porcentagem necessária para desenhar a barra, e não o valor real.
