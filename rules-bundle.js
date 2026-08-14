// Bundle do Livro de Regras - Versão compatível com file://
// Este arquivo combina todos os módulos de regras em um único script
// para funcionar sem servidor web (protocolo file://)

// Regras básicas
const basicRules = [
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
    "aliases": [],
    "keywords": ["atributo", "stat", "força", "agilidade", "intelecto", "presença", "vigor"]
  },
  {
    "id": "teste-de-atributo",
    "title": "Teste de Atributo",
    "category": "basico",
    "summary": "Rolagem de 3d20 + atributo para superar uma dificuldade.",
    "description": "A rolagem padrão do sistema. Use o atributo mais relevante para a ação.",
    "mechanics": [
      "Role 3d20 e some o valor do atributo.",
      "Compare com a dificuldade (D).",
      "Se o total ≥ D, o teste é bem-sucedido.",
      "Margem de sucesso = total - D."
    ],
    "examples": ["FOR 2 rolando 3d20+2 contra D 12."],
    "related": ["atributos", "dificuldade", "critico"],
    "aliases": ["teste", "rolagem", "check"],
    "keywords": ["3d20", "d20", "teste", "rolagem"]
  },
  {
    "id": "dificuldade",
    "title": "Dificuldade",
    "category": "basico",
    "summary": "Valor numérico que representa o desafio de uma ação.",
    "description": "A dificuldade (D) define o alvo a ser atingido em um teste.",
    "mechanics": [
      "D 8: Fácil",
      "D 12: Médio (padrão)",
      "D 16: Difícil",
      "D 20: Muito difícil"
    ],
    "examples": [],
    "related": ["teste-de-atributo"],
    "aliases": ["D", "alvo"],
    "keywords": ["dificuldade", "alvo", "D"]
  },
  {
    "id": "critico",
    "title": "Crítico",
    "category": "basico",
    "summary": "Resultado especial quando todos os dados mostram o mesmo valor.",
    "description": "Em 3d20, se todos os dados mostrarem o mesmo número, é um crítico.",
    "mechanics": [
      "Crítico de Sucesso: todos os dados em 20. Dano máximo e efeito ampliado.",
      "Crítico de Falha: todos os dados em 1. Falha catastrófica."
    ],
    "examples": [],
    "related": ["teste-de-atributo"],
    "aliases": ["critical"],
    "keywords": ["crítico", "critical", "20", "1"]
  }
];

// Condições (simplificado para demo)
const conditionsRules = [
  {
    "id": "congelado",
    "title": "Congelado",
    "category": "condicoes",
    "summary": "O alvo está imobilizado pelo gelo.",
    "description": "Não pode se mover ou agir. Sofre dano adicional de Fogo.",
    "mechanics": [
      "Imobilizado.",
      "-2 em todos os testes.",
      "Dano de Fogo +1d6."
    ],
    "examples": [],
    "related": [],
    "aliases": [],
    "keywords": ["congelado", "gelo", "frio"]
  },
  {
    "id": "imobilizado",
    "title": "Imobilizado",
    "category": "condicoes",
    "summary": "O alvo não pode se mover.",
    "description": "Pode realizar ações, mas não se desloca.",
    "mechanics": [
      "Deslocamento 0.",
      "Pode atacar e usar habilidades."
    ],
    "examples": [],
    "related": [],
    "aliases": [],
    "keywords": ["imobilizado", "preso"]
  }
];

// Combate (simplificado para demo)
const combatRules = [
  {
    "id": "pr",
    "title": "PR (Ponto de Ressonância)",
    "category": "recursos",
    "summary": "Recurso usado para ativar habilidades.",
    "description": "Ponto de Ressonância. Cada habilidade custa PR.",
    "mechanics": [
      "PR máximo = 5 + Nível.",
      "Recupera 1 PR por turno.",
      "Recupera totalmente após descanso longo."
    ],
    "examples": [],
    "related": [],
    "aliases": [],
    "keywords": ["PR", "ressonância", "ponto"]
  },
  {
    "id": "rd",
    "title": "RD (Redução de Dano)",
    "category": "combate",
    "summary": "Reduz o dano recebido.",
    "description": "Subtraia a RD do dano final.",
    "mechanics": [
      "RD reduz dano físico.",
      "RD não reduz dano de elementos específicos."
    ],
    "examples": [],
    "related": [],
    "aliases": [],
    "keywords": ["RD", "redução", "armadura"]
  },
  {
    "id": "esquiva",
    "title": "Esquiva",
    "category": "combate",
    "summary": "Capacidade de evitar ataques.",
    "description": "Valor que substitui a Defesa em testes de esquiva.",
    "mechanics": [
      "Esquiva base = 10 + AGI.",
      "Pode ser modificada por habilidades."
    ],
    "examples": [],
    "related": [],
    "aliases": [],
    "keywords": ["esquiva", "evitar", "agilidade"]
  },
  {
    "id": "vanguarda",
    "title": "Vanguarda",
    "category": "combate",
    "summary": "Posição ofensiva em combate.",
    "description": "Você ganha bônus ofensivos mas fica mais vulnerável.",
    "mechanics": [
      "+1 em ataques.",
      "-1 em Defesa."
    ],
    "examples": [],
    "related": [],
    "aliases": [],
    "keywords": ["vanguarda", "ofensiva"]
  },
  {
    "id": "combo",
    "title": "Combo",
    "category": "combate",
    "summary": "Sequência de ataques que gera efeitos especiais.",
    "description": "Acertos consecutivos no mesmo alvo geram combos.",
    "mechanics": [
      "Cada acerto consecutivo aumenta o combo.",
      "Combos desbloqueiam efeitos especiais.",
      "Errar ou trocar de alvo reseta o combo."
    ],
    "examples": [],
    "related": [],
    "aliases": [],
    "keywords": ["combo", "sequência", "acerto"]
  }
];

// Habilidades (simplificado para demo)
const skillsRules = [
  {
    "id": "projetil-rochoso",
    "title": "Projétil Rochoso",
    "category": "habilidades",
    "summary": "Arremessa um fragmento de rocha contra o alvo.",
    "description": "Habilidade básica do elemento Terra.",
    "mechanics": [
      "Dano: 2d6 contundente.",
      "Teste: FOR vs Defesa.",
      "Se falhar: -1 Defesa."
    ],
    "examples": [],
    "related": [],
    "aliases": [],
    "keywords": ["projétil", "rocha", "terra"]
  }
];

// Outras categorias (placeholders)
const otherRules = [];

// Combine todas as regras
const ALL_RULES = [
  ...basicRules,
  ...conditionsRules,
  ...combatRules,
  ...skillsRules,
  ...otherRules
];

// Categorias
const RULE_CATEGORIES = {
  basico: 'Regras Básicas',
  combate: 'Combate',
  recursos: 'Recursos',
  condicoes: 'Condições e Status',
  habilidades: 'Habilidades',
  'skill-tree': 'Skill Tree'
};

// Mapa por ID
const RULE_BY_ID = new Map(ALL_RULES.map(rule => [rule.id, rule]));

// Funções de busca
function normalize(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function getRule(id) {
  return RULE_BY_ID.get(id) || null;
}

function getRelatedRules(ruleOrId) {
  const rule = typeof ruleOrId === 'string' ? getRule(ruleOrId) : ruleOrId;
  if (!rule) return [];
  return (rule.related || []).map(getRule).filter(Boolean);
}

function getRulesByCategory(category) {
  return ALL_RULES.filter(r => r.category === category);
}

function searchRules(query, options = {}) {
  const q = normalize(query);
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const category = options.category || null;
  return ALL_RULES.filter(r => !category || r.category === category).map(rule => {
    const title = normalize(rule.title), id = normalize(rule.id);
    const aliases = (rule.aliases || []).map(normalize);
    const keywords = (rule.keywords || []).map(normalize);
    const body = normalize([rule.summary, rule.description, ...(rule.mechanics || [])].join(' '));
    let score = 0;
    if (title === q || id === q) score += 100;
    if (title.startsWith(q)) score += 70;
    if (aliases.includes(q)) score += 85;
    if (keywords.includes(q)) score += 70;
    for (const term of terms) {
      if (title.includes(term)) score += 25;
      if (aliases.some(a => a.includes(term))) score += 22;
      if (keywords.some(k => k.includes(term))) score += 18;
      if (body.includes(term)) score += 4;
    }
    const exactKeywordIndex = keywords.indexOf(q);
    if (exactKeywordIndex >= 0) score += Math.max(0, 10 - exactKeywordIndex);
    return { rule, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score || a.rule.title.localeCompare(b.rule.title, 'pt-BR')).slice(0, options.limit || 30);
}

// API pública
function getAll() { return ALL_RULES; }
function getById(id) { return RULE_BY_ID.get(id) || null; }
function getRelated(id) { return getRelatedRules(id); }
function getByCategory(category) { return getRulesByCategory(category); }
function getReviewIssues() { return []; }

const RuleBook = {
  getAll,
  getById,
  getRelated,
  getByCategory,
  getReviewIssues,
  search: searchRules,
  categories: RULE_CATEGORIES
};

// Expor para o window
window.RuleBook = RuleBook;
window.RPG_RULES = ALL_RULES;
window.RPG_RULE_SEARCH = searchRules;
window.RPG_RULE_BY_ID = RULE_BY_ID;

// Disparar evento de pronto
window.dispatchEvent(new CustomEvent('rulebook-ready'));
