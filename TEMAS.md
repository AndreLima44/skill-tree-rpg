# Temas de cores

O seletor de tema fica no header, ao lado do botão Sair.

Temas incluídos:
- Arcano (roxo original)
- Gelo (azul/ciano)
- Fogo (vermelho/laranja)
- Terra (verde)
- Energia (azul elétrico)
- Vazio (preto/grafite)
- Dourado (ouro/preto)

A escolha é salva no localStorage com a chave `elemento-frio-theme` e é aplicada antes do CSS carregar para evitar flash do tema padrão.

Arquivos alterados:
- index.html: botão/menu e aplicação antecipada do tema salvo.
- app.js: setTheme, abertura/fechamento do menu, persistência e atualização do theme-color.
- styles.css: variáveis dos sete temas e adaptação dos principais componentes.
