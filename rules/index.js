import basic from './basic-rules.js';
import skills from './skills-rules.js';
import combat from './combat-rules.js';
import resources from './resources-rules.js';
import resonance from './resonance-rules.js';
import conditions from './conditions-rules.js';
import characterClasses from './classes-rules.js';
import trails from './trails-rules.js';
import trailAbilities from './trail-abilities-rules.js';
import origins from './origins-rules.js';
import equipment from './equipment-rules.js';
import elements from './elemental-rules.js';
import progression from './progression-rules.js';
import skillTree from './skill-tree-rules.js';
import abilities from './abilities-rules.js';
import combos from './combo-rules.js';
import reviewIssues from './review-issues.js';

export const RULE_CATEGORIES = {
  basico: 'Regras Básicas', 'habilidades-trilha': 'Habilidades de Trilha', combate: 'Combate', recursos: 'Recursos', ressonancia: 'Ressonância',
  condicoes: 'Condições e Status', classes: 'Classes', trilhas: 'Trilhas', origens: 'Origens',
  equipamentos: 'Equipamentos', elementos: 'Elementos', personagem: 'Personagem e Progressão',
  'skill-tree': 'Skill Tree', habilidades: 'Habilidades', combos: 'Combos e Sinergias'
};

export const RULES = [
  ...basic, ...skills, ...combat, ...resources, ...resonance, ...conditions, ...characterClasses,
  ...trails, ...trailAbilities, ...origins, ...equipment, ...elements, ...progression, ...skillTree, ...abilities, ...combos
];
export const REVIEW_ISSUES = reviewIssues;
export const RULE_BY_ID = new Map(RULES.map(rule => [rule.id, rule]));

function normalize(value='') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
}

export function getRule(id) { return RULE_BY_ID.get(id) || null; }
export function getRelatedRules(ruleOrId) {
  const rule = typeof ruleOrId === 'string' ? getRule(ruleOrId) : ruleOrId;
  if (!rule) return [];
  return (rule.related || []).map(getRule).filter(Boolean);
}
export function getRulesByCategory(category) { return RULES.filter(r => r.category === category); }

export function searchRules(query, options={}) {
  const q=normalize(query);
  if (!q) return [];
  const terms=q.split(/\s+/).filter(Boolean);
  const category=options.category || null;
  return RULES.filter(r => !category || r.category===category).map(rule => {
    const title=normalize(rule.title), id=normalize(rule.id);
    const aliases=(rule.aliases||[]).map(normalize);
    const keywords=(rule.keywords||[]).map(normalize);
    const body=normalize([rule.summary,rule.description,...(rule.mechanics||[])].join(' '));
    let score=0;
    if (title===q || id===q) score+=100;
    if (title.startsWith(q)) score+=70;
    if (aliases.includes(q)) score+=85;
    if (keywords.includes(q)) score+=70;
    for (const term of terms) {
      if (title.includes(term)) score+=25;
      if (aliases.some(a=>a.includes(term))) score+=22;
      if (keywords.some(k=>k.includes(term))) score+=18;
      if (body.includes(term)) score+=4;
    }
    const exactKeywordIndex=keywords.indexOf(q);
    if (exactKeywordIndex >= 0) score += Math.max(0, 10-exactKeywordIndex);
    return {rule,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score || a.rule.title.localeCompare(b.rule.title,'pt-BR')).slice(0,options.limit||30);
}

// API pública para o app. A base continua modular; o app só conhece RuleBook.
function getAll(){ return RULES; }
function getById(id){ return getRule(id); }
function getRelated(id){ return getRelatedRules(id); }
function getByCategory(category){ return getRulesByCategory(category); }
function getReviewIssues(){ return REVIEW_ISSUES; }

export const RuleBook = { getAll, getById, getRelated, getByCategory, getReviewIssues, search: searchRules, categories: RULE_CATEGORIES };

if (typeof window !== 'undefined') {
  window.RuleBook = RuleBook;
  window.RPG_RULES = RULES;
  window.RPG_RULE_SEARCH = searchRules;
  window.RPG_RULE_BY_ID = RULE_BY_ID;
  window.dispatchEvent(new CustomEvent('rulebook-ready'));
}
