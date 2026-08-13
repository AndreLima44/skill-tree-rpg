// Regras básicas estruturadas a partir do livro.
export default [
  {
    "id": "atributos",
    "title": "Atributos",
    "category": "basico",
    "summary": "As cinco capacidades básicas do personagem: FOR, AGI, INT, PRE e VIG.",
    "description": "Os atributos variam de 0 a 5 e influenciam testes, combate, resistência e Ressonância.",
    "mechanics": [
      "Todos começam em 1.",
      "O livro informa 4 pontos iniciais para distribuir.",
      "Um atributo pode ser reduzido a 0 para liberar pontos extras."
    ],
    "examples": [],
    "related": [
      "teste-de-atributo",
      "forca",
      "agilidade",
      "intelecto",
      "presenca",
      "vigor"
    ],
    "keywords": [
      "atributo",
      "for",
      "agi",
      "int",
      "pre",
      "vig"
    ],
    "aliases": [],
    "status": "ok"
  },
  {
    "id": "teste-de-atributo",
    "title": "Teste de Atributo",
    "category": "basico",
    "summary": "Teste usado quando uma ação possui chance de falha.",
    "description": "Teste usado quando uma ação possui chance de falha.",
    "mechanics": [
      "Role 1d20 para cada ponto do atributo e escolha o maior resultado.",
      "Com atributo 0, role 2d20 e escolha o pior resultado."
    ],
    "examples": [
      "FOR 3: role 3d20 e use o maior.",
      "INT 0: role 2d20 e use o pior."
    ],
    "related": [
      "atributos"
    ],
    "keywords": [
      "teste",
      "d20",
      "rolagem",
      "atributo"
    ],
    "aliases": [],
    "status": "ok"
  },
  {
    "id": "forca",
    "title": "Força (FOR)",
    "category": "basico",
    "summary": "Potência física e capacidade de impacto.",
    "description": "Potência física e capacidade de impacto.",
    "mechanics": [
      "Usada em ataques corpo a corpo, força bruta, empurrar/quebrar objetos e resistência física direta."
    ],
    "examples": [],
    "related": [
      "atributos",
      "ataque-corpo-a-corpo"
    ],
    "keywords": [
      "for",
      "força",
      "forca"
    ],
    "aliases": [],
    "status": "ok"
  },
  {
    "id": "agilidade",
    "title": "Agilidade (AGI)",
    "category": "basico",
    "summary": "Reflexos, coordenação e velocidade.",
    "description": "Reflexos, coordenação e velocidade.",
    "mechanics": [
      "Usada em esquiva, reação, furtividade, ataques à distância e movimentação."
    ],
    "examples": [],
    "related": [
      "atributos",
      "esquiva",
      "reflexos",
      "deslocamento"
    ],
    "keywords": [
      "agi",
      "agilidade",
      "desviar",
      "reflexo"
    ],
    "aliases": [],
    "status": "ok"
  },
  {
    "id": "intelecto",
    "title": "Intelecto (INT)",
    "category": "basico",
    "summary": "Raciocínio, memória e conhecimento.",
    "description": "Raciocínio, memória e conhecimento.",
    "mechanics": [
      "Usado em análise, investigação, uso técnico de habilidades, planejamento e compreensão da Ressonância."
    ],
    "examples": [],
    "related": [
      "atributos",
      "ressonancia",
      "teste-de-ressonancia"
    ],
    "keywords": [
      "int",
      "intelecto",
      "investigação",
      "investigacao"
    ],
    "aliases": [],
    "status": "ok"
  },
  {
    "id": "presenca",
    "title": "Presença (PRE)",
    "category": "basico",
    "summary": "Força de vontade, percepção e influência.",
    "description": "Força de vontade, percepção e influência.",
    "mechanics": [
      "Usada para perceber ameaças, resistir a efeitos mentais, interação social e parte dos testes de Ressonância."
    ],
    "examples": [],
    "related": [
      "atributos",
      "ressonancia",
      "teste-de-ressonancia"
    ],
    "keywords": [
      "pre",
      "presença",
      "presenca",
      "vontade"
    ],
    "aliases": [],
    "status": "ok"
  },
  {
    "id": "vigor",
    "title": "Vigor (VIG)",
    "category": "basico",
    "summary": "Resistência física e vitalidade.",
    "description": "Resistência física e vitalidade.",
    "mechanics": [
      "Relaciona-se a PV, resistência a efeitos físicos e sobrevivência."
    ],
    "examples": [],
    "related": [
      "atributos",
      "pv",
      "resistencia"
    ],
    "keywords": [
      "vig",
      "vigor",
      "vida",
      "resistência",
      "resistencia"
    ],
    "aliases": [],
    "status": "ok"
  },
  {
    "id": "acao-padrao",
    "title": "Ação Padrão",
    "category": "basico",
    "summary": "Tipo de ação usado por muitas habilidades e ataques.",
    "description": "Tipo de ação usado por muitas habilidades e ataques.",
    "mechanics": [],
    "examples": [],
    "related": [
      "acao-livre",
      "acao-leve",
      "reacao"
    ],
    "keywords": [
      "ação padrão",
      "acao padrao",
      "ação",
      "acao"
    ],
    "aliases": [],
    "status": "needs-review",
    "note": "O livro usa Ação Padrão extensivamente, mas não apresenta uma seção geral definindo a economia completa de ações."
  },
  {
    "id": "acao-livre",
    "title": "Ação Livre",
    "category": "basico",
    "summary": "Ação utilizada por várias habilidades sem consumir a ação padrão.",
    "description": "Ação utilizada por várias habilidades sem consumir a ação padrão.",
    "mechanics": [],
    "examples": [],
    "related": [
      "acao-padrao",
      "acao-leve",
      "reacao"
    ],
    "keywords": [
      "ação livre",
      "acao livre"
    ],
    "aliases": [],
    "status": "needs-review",
    "note": "O livro utiliza o termo, mas não define globalmente quantas Ações Livres podem ser realizadas nem todas as suas restrições."
  },
  {
    "id": "acao-leve",
    "title": "Ação Leve",
    "category": "basico",
    "summary": "Ação menor usada em movimento, utilidade e por alguns efeitos.",
    "description": "Ação menor usada em movimento, utilidade e por alguns efeitos.",
    "mechanics": [],
    "examples": [],
    "related": [
      "acao-padrao",
      "acao-livre",
      "reacao",
      "lento"
    ],
    "keywords": [
      "ação leve",
      "acao leve"
    ],
    "aliases": [],
    "status": "needs-review",
    "note": "O livro cita Ação Leve e perda/ganho de ações leves, mas não consolida uma regra geral de economia de ações."
  },
  {
    "id": "reacao",
    "title": "Reação",
    "category": "basico",
    "summary": "Resposta realizada durante o combate a um gatilho.",
    "description": "Resposta realizada durante o combate a um gatilho.",
    "mechanics": [
      "Cada personagem pode realizar 1 Reação por turno.",
      "As duas principais reações descritas são Esquivar e Contra-Atacar."
    ],
    "examples": [],
    "related": [
      "esquiva",
      "contra-ataque"
    ],
    "keywords": [
      "reação",
      "reacao",
      "reagir"
    ],
    "aliases": [],
    "status": "ok"
  }
];
