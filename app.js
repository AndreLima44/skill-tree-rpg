const supabaseUrl = 'https://djtxrejpqunrqvgxobco.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdHhyZWpwcXVucnF2Z3hvYmNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MTQ4ODIsImV4cCI6MjA5MDQ5MDg4Mn0.bcYtB_NEpLw1cbU5SEecRtcFnlWzfuPD3iejXlKWJ2A';

const supabaseClient = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);


// =========================================================
// TEMAS DE CORES
// =========================================================

const THEME_STORAGE_KEY = 'elemento-frio-theme';

const VALID_THEMES = new Set([
  'dark',
  'ice',
  'fire',
  'earth',
  'energy',
  'void',
  'gold'
]);


/**
 * Retorna o tema atual.
 * Caso exista um tema antigo/inválido salvo,
 * volta automaticamente para o tema Escuro.
 */
function getCurrentTheme() {
  const theme =
    document.documentElement.dataset.theme || 'dark';

  return VALID_THEMES.has(theme)
    ? theme
    : 'dark';
}


/**
 * Atualiza a interface do seletor de temas
 * e também a cor do navegador/mobile.
 */
function updateThemeUI() {
  const current = getCurrentTheme();

  document
    .querySelectorAll('[data-theme-option]')
    .forEach((option) => {
      option.classList.toggle(
        'active',
        option.dataset.themeOption === current
      );
    });


  const themeColors = {
  dark: '#09090b',

  ice: '#07141d',

  fire: '#170b09',

  earth: '#09130d',

  energy: '#07111e',

  void: '#070609',

  gold: '#151007'
};


  const meta =
    document.querySelector('meta[name="theme-color"]');

  if (meta) {
    meta.setAttribute(
      'content',
      themeColors[current] || themeColors.dark
    );
  }
}


/**
 * Altera o tema e salva no navegador.
 */
window.setTheme = function(theme) {

  if (!VALID_THEMES.has(theme)) {
    theme = 'dark';
  }

  document.documentElement.dataset.theme = theme;

  try {
    localStorage.setItem(
      THEME_STORAGE_KEY,
      theme
    );
  } catch (_) {}

  updateThemeUI();

  window.closeThemeMenu();
};


/**
 * Abre/fecha o seletor de temas.
 */
window.toggleThemeMenu = function(event) {

  if (event) {
    event.stopPropagation();
  }

  const menu =
    document.getElementById('theme-menu');

  const button =
    document.getElementById('theme-toggle-btn');

  if (!menu) {
    return;
  }

  const willOpen =
    menu.classList.contains('hidden');

  menu.classList.toggle(
    'hidden',
    !willOpen
  );

  if (button) {
    button.setAttribute(
      'aria-expanded',
      String(willOpen)
    );
  }

  if (willOpen) {
    updateThemeUI();
  }
};


/**
 * Fecha o seletor de temas.
 */
window.closeThemeMenu = function() {

  const menu =
    document.getElementById('theme-menu');

  const button =
    document.getElementById('theme-toggle-btn');

  if (menu) {
    menu.classList.add('hidden');
  }

  if (button) {
    button.setAttribute(
      'aria-expanded',
      'false'
    );
  }
};


/**
 * Fecha o menu ao clicar fora.
 */
document.addEventListener(
  'click',
  (event) => {

    const picker =
      event.target.closest &&
      event.target.closest('.theme-picker-wrap');

    if (!picker) {
      window.closeThemeMenu();
    }
  }
);


/**
 * Fecha o menu com ESC.
 */
document.addEventListener(
  'keydown',
  (event) => {

    if (event.key === 'Escape') {
      window.closeThemeMenu();
    }
  }
);


/**
 * Corrige temas antigos salvos.
 *
 * Se alguém tinha "arcane" salvo antes,
 * o sistema converte automaticamente
 * para "void".
 */
function migrateOldTheme() {

  try {

    const saved =
      localStorage.getItem(
        THEME_STORAGE_KEY
      );

    if (saved === 'arcane') {

      localStorage.setItem(
        THEME_STORAGE_KEY,
        'void'
      );

      document.documentElement.dataset.theme =
        'void';

      return;
    }


    if (
      !saved ||
      !VALID_THEMES.has(saved)
    ) {

      localStorage.setItem(
        THEME_STORAGE_KEY,
        'dark'
      );

      document.documentElement.dataset.theme =
        'dark';
    }

  } catch (_) {}
}


migrateOldTheme();

document.addEventListener(
  'DOMContentLoaded',
  updateThemeUI
);
// Estado Global
let currentMainTab = 'personagem';
let currentTab = 'personagem';
let currentSkillElement = 'frio';
let activeBattle = null;
let battleEnemies = [];
let battleRealtimeChannel = null;
let battleRefreshTimer = null;
let combatPlayersCache = [];
let combatRenderedBattleId = null;
let unlocked = {};
let currentUser = null;
let currentRole = 'player';
let selectedUserId = null;
let profilesCache = [];
let currentProfile = null;
let presenceChannel = null;
let onlineUserIds = new Set();

// --- Central do Mestre ---
let masterHubSection = 'session';
let masterPlayersCache = [];
let masterEnemiesCache = [];
let masterBestiaryCache = [];
let masterNotesCache = '';
let masterBattleLogCache = [];
let masterNotesTimer = null;
let masterSetupWarnings = [];


// --- Controle de carregamento / autosave ---
// dataReady só fica true depois que a ficha do jogador selecionado terminou
// de carregar do Supabase. Isso evita o bug onde salvar/autosalvar antes do
// carregamento terminar gravava uma ficha vazia por cima da ficha salva.
let dataReady = false;
let isSaving = false;
let isDirty = false;
let autosaveTimer = null;
let loadedUpdatedAt = null;
let dirtyFields = new Set();
let realtimeChannel = null;
let isApplyingRemoteUpdate = false;
const AUTOSAVE_DELAY_MS = 1200;

function setSaveStatus(status) {
  // status: 'loading' | 'saved' | 'dirty' | 'saving' | 'error'
  const el = document.getElementById('save-status');
  const btn = document.getElementById('save-btn');
  if (!el || !btn) return;

  const labels = {
    loading: '⏳ Carregando ficha...',
    saved: '✓ Tudo salvo',
    dirty: '● Alterações não salvas',
    saving: '⏳ Salvando...',
    error: '⚠ Erro ao salvar'
  };
  el.textContent = labels[status] || '';
  el.className = 'save-status save-status-' + status;

  if (status === 'loading') {
    btn.disabled = true;
  } else {
    btn.disabled = false;
  }
}

function markDirtyAndScheduleAutosave(field = '*') {
  if (!dataReady || currentTab !== 'personagem' || isApplyingRemoteUpdate) return;
  dirtyFields.add(field);
  isDirty = true;
  setSaveStatus('dirty');

  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    window.saveCharacterData({ silent: true });
  }, AUTOSAVE_DELAY_MS);
}

function getDirtyFieldFromElement(target) {
  if (target.closest('.skill-row')) return 'skills';
  if (target.closest('.attack-editor-card')) return 'attacks';
  const map = {
    'char-name':'name','char-origin':'origin','char-class':'class_name','char-archetype':'archetype','char-player':'player_name','char-level':'level',
    'stat-strength':'strength','stat-dexterity':'dexterity','stat-constitution':'constitution','stat-intelligence':'intelligence','stat-presence':'presence',
    'hp-curr':'hp_current','hp-max':'hp_max','en-curr':'energy_current','en-max':'energy_max','stat-def':'defense','stat-rd':'damage_reduction','stat-dodge':'dodge','stat-block':'block','stat-mov':'movement_speed','char-avatar':'avatar_url'
  };
  return map[target.id] || '*';
}

function updateHeaderIdentity() {
  const avatar = document.getElementById('header-avatar');
  const title = document.getElementById('page-title');
  if (title) title.textContent = characterData?.name || 'Elemento do Frio';
  const userLabel = document.getElementById('user-label');
  if (userLabel) userLabel.textContent = [characterData?.player_name, currentUser?.email].filter(Boolean).join(' · ');
  if (!avatar) return;
  const initial = (characterData?.name || '?').charAt(0).toUpperCase();
  avatar.innerHTML = characterData?.avatar_url
    ? `<img src="${characterData.avatar_url}" alt="Avatar">`
    : `<span>${initial}</span>`;
}

function setLiveInputValue(id, value) {
  const el = document.getElementById(id);
  if (!el || document.activeElement === el) return;
  const next = value ?? '';
  if (String(el.value) !== String(next)) el.value = next;
}

function patchCharacterSheetFromRemote(remote) {
  if (currentTab !== 'personagem') return;
  const fields = {
    name: 'char-name', origin: 'char-origin', class_name: 'char-class', archetype: 'char-archetype', player_name: 'char-player', level: 'char-level',
    strength: 'stat-strength', dexterity: 'stat-dexterity', constitution: 'stat-constitution', intelligence: 'stat-intelligence', presence: 'stat-presence',
    hp_current: 'hp-curr', hp_max: 'hp-max', energy_current: 'en-curr', energy_max: 'en-max', defense: 'stat-def', damage_reduction: 'stat-rd', dodge: 'stat-dodge', block: 'stat-block', movement_speed: 'stat-mov'
  };
  Object.entries(fields).forEach(([key, id]) => {
    if (Object.prototype.hasOwnProperty.call(remote, key)) setLiveInputValue(id, remote[key]);
  });
}

function subscribeToCharacterRealtime(userId) {
  if (realtimeChannel) supabaseClient.removeChannel(realtimeChannel);
  realtimeChannel = supabaseClient.channel(`character:${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'characters', filter: `user_id=eq.${userId}` }, async (payload) => {
      if (!payload.new) return;
      const remote = payload.new;
      if (loadedUpdatedAt && remote.updated_at && new Date(remote.updated_at) <= new Date(loadedUpdatedAt)) return;
      if (isDirty) {
        console.warn('Chegou uma atualização remota enquanto existem alterações locais pendentes; mantendo os campos em edição.');
        return;
      }
      isApplyingRemoteUpdate = true;
      characterData = { ...characterData, ...remote, skills: remote.skills || characterData.skills || {}, attacks: remote.attacks || characterAttacks };
      if (Array.isArray(remote.attacks)) characterAttacks = [...remote.attacks];
      loadedUpdatedAt = remote.updated_at || loadedUpdatedAt;
      updateHeaderIdentity();
      patchCharacterSheetFromRemote(remote);
      if (currentTab === 'combate') scheduleCombatSync();
      isApplyingRemoteUpdate = false;
    }).subscribe();
}

// Backup local (rede de segurança extra). Isso NÃO substitui o Supabase,
// é só uma cópia de recuperação caso o salvamento na nuvem falhe.
function backupCharacterLocally(userId, payload) {
  try {
    localStorage.setItem('char-backup-' + userId, JSON.stringify({
      savedAt: new Date().toISOString(),
      payload
    }));
  } catch (e) {
    console.warn('Não foi possível salvar backup local:', e);
  }
}

// Avisa o jogador antes de fechar/recarregar a aba se houver alterações
// não salvas (bem comum de acontecer no Steam Deck ao fechar o navegador).
window.addEventListener('beforeunload', (e) => {
  if (isDirty) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// Corrige a causa mais provável do bug "entrei no perfil e vi uma versão
// antiga, salvei e apaguei os dados novos": quando o navegador restaura a
// página pelo cache (botão voltar, trocar de app e voltar, etc.), o
// JavaScript NÃO roda de novo — a página continua com os dados de
// personagem que estavam em memória na última vez, que podem estar
// desatualizados em relação ao que foi salvo depois (em outro dispositivo,
// outra aba, ou pelo mestre). Forçar um reload garante que a ficha
// carregada seja sempre a mais recente do banco.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    location.reload();
  }
});

let characterData = {
  name: 'Novo Personagem',
  origin: '',
  class_name: '',
  archetype: '',
  player_name: '',
  level: 1,

  strength: 0,
  dexterity: 0,
  constitution: 0,
  intelligence: 0,
  presence: 0,

  hp_current: 0,
  hp_max: 0,
  energy_current: 0,
  energy_max: 0,

  defense: 10,
  damage_reduction: 0,
  dodge: 10,
  block: 0,
  movement_speed: 9,

  avatar_url: '',

  skills: {},
  attacks: [
    { nome: "", teste: "3d20+5", dano: "2d6", crit: "x2", alcance: "Curto" }
  ]
};

// Lista de Ataques (Inicia com um vazio)
let characterAttacks = [
  { nome: "", teste: "3d20+5", dano: "2d6", crit: "x2", alcance: "Curto" }
];

// --- SALVA TUDO ---
window.saveCurrentAttacks = function() {
    const cards = document.querySelectorAll('.attack-editor-card');

    characterAttacks = Array.from(cards).map(card => ({
        nome: card.querySelector('.attack-input-name')?.value || "",
        teste: card.querySelector('input[placeholder="3d20+5"]')?.value || "",
        dano: card.querySelector('input[placeholder="2d6"]')?.value || "",
        crit: card.querySelector('input[placeholder="x2"]')?.value || "",
        alcance: card.querySelector('input[placeholder="Curto"]')?.value || ""
    }));

    if (characterAttacks.length === 0) {
        characterAttacks = [
            { nome: "", teste: "3d20+5", dano: "2d6", crit: "x2", alcance: "Curto" }
        ];
    }
};

window.addAttack = function() {
    window.saveCurrentAttacks();
    characterAttacks.push({ nome: "", teste: "", dano: "", crit: "", alcance: "" });
    switchTab('personagem');
};

window.removeAttack = function(index) {
    window.saveCurrentAttacks();

    if (characterAttacks.length > 1) {
        characterAttacks.splice(index, 1);
    } else {
        characterAttacks = [
            { nome: "", teste: "", dano: "", crit: "", alcance: "" }
        ];
    }

    switchTab('personagem');
};

const TAB_META = {
  personagem: '👤 Ficha',
  combate: '⚔️ Combate',
  habilidades: '🌳 Habilidades',
  regras: '📖 Regras'
};
const SKILL_TAB_META = {
  terra:'🌍 Terra', energia:'⚡ Energia', frio:'❄️ Frio', vento:'💨 Vento',
  agua:'💧 Água', fogo:'🔥 Fogo', universais:'✨ Universais', forca:'💪 Força Inata'
};

function getSkillKey(tab, skillName) {
  return `${tab}__${skillName}`;
}

function getTypeBadgeClass(type) {
  const t = type.toLowerCase();
  if (t.includes('área') || t.includes('area')) return 'type-badge-area';
  if (t.includes('aprimoramento')) return 'type-badge-aprimoramento';
  if (t.includes('mobilidade')) return 'type-badge-mobilidade';
  if (t.includes('ataque')) return 'type-badge-ataque';
  if (t.includes('controle')) return 'type-badge-controle';
  if (t.includes('defesa')) return 'type-badge-defesa';
  if (t.includes('cura')) return 'type-badge-cura';
  if (t.includes('suporte')) return 'type-badge-suporte';
  return 'type-badge-ataque';
}

function renderResDots(res) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="res-dot ${i <= res ? 'filled' : ''}"></span> `;
  }
  return html;
}

function normalizeSkill(skill) {
  return {
    name: skill.name,
    desc: skill.desc || '',
    prereq: skill.prereq || 'Nenhum',
    type: skill.type || 'Ataque',
    range: skill.range || 'Pessoal',
    effect: skill.effect || '',
    res: skill.res || 1
  };
}


function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function getRuleBook() { return window.RuleBook || null; }
function getRule(ruleId) { return getRuleBook()?.getById(ruleId) || null; }
function normalizeRuleId(value='') { return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function findRuleForSkill(skillName) {
  const book=getRuleBook(); if(!book) return null;
  const direct=book.getById(normalizeRuleId(skillName));
  if(direct) return direct;
  return (book.search(skillName,{limit:5})||[]).map(x=>x.rule).find(r=>normalizeRuleId(r.title)===normalizeRuleId(skillName)) || null;
}
function getRuleTerms() {
  const book=getRuleBook(); if(!book) return [];
  return book.getAll().flatMap(r=>[r.title,...(r.aliases||[])]).filter(Boolean).sort((a,b)=>b.length-a.length);
}
function escapeAttr(v=''){ return escapeHtml(v).replace(/`/g,'&#096;'); }
function linkifyRules(text='') {
  let out=escapeHtml(text); const book=getRuleBook(); if(!book) return out;
  for(const term of getRuleTerms()) {
    const results=book.search(term,{limit:3})||[];
    const exact=results.map(x=>x.rule).find(r=>String(r.title).toLocaleLowerCase('pt-BR')===String(term).toLocaleLowerCase('pt-BR') || (r.aliases||[]).some(a=>String(a).toLocaleLowerCase('pt-BR')===String(term).toLocaleLowerCase('pt-BR')));
    if(!exact) continue;
    const safe=String(term).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    out=out.replace(new RegExp(`(^|[^\\wÀ-ÿ])(${safe})(?=$|[^\\wÀ-ÿ])`,'gi'),(m,p,t)=>`${p}<button class="rule-term" type="button" data-rule-id="${exact.id}">${t}</button>`);
  }
  return out;
}
let ruleHistory=[];
let rulesSearchTimer=null;
function ruleCategoryLabel(category){ return getRuleBook()?.categories?.[category] || category || 'Regra'; }
function renderRulesPage(){
 const book=getRuleBook();
 if(!book) return `<section class="rulebook-shell"><p class="rules-empty">Carregando Livro de Regras...</p></section>`;
 const categories=Object.entries(book.categories||{});
 const popular=['pr','rd','ressonancia','esquiva','congelado','imobilizado','vanguarda','combo'];
 return `<section class="rulebook-shell">
   <header class="rulebook-header"><div><div class="rules-eyebrow">ELEMENTO DO FRIO</div><h1>📚 Livro de Regras</h1><p>Consulte regras, condições, habilidades, classes, trilhas e combos sem sair da sessão.</p></div></header>
   <div class="rule-search"><input id="rules-search" type="search" autocomplete="off" placeholder="Pesquisar uma regra, condição, habilidade, classe..." oninput="scheduleRuleSearch(this.value)"></div>
   <div class="rule-category-row">${categories.map(([id,label])=>`<button class="rule-category-chip" onclick="filterRulesCategory('${id}')">${escapeHtml(label)}</button>`).join('')}</div>
   <div class="rulebook-popular"><span>Mais usadas:</span>${popular.map(id=>{const r=book.getById(id);return r?`<button data-rule-id="${id}">${escapeHtml(r.title)}</button>`:''}).join('')}</div>
   <div id="rules-results" class="rules-results"><p class="rules-empty">Pesquise um termo ou escolha uma categoria.</p></div>
 </section>`;
}
function scheduleRuleSearch(query){ clearTimeout(rulesSearchTimer); rulesSearchTimer=setTimeout(()=>searchRules(query),180); }
function searchRules(query='',options={}){
 const box=document.getElementById('rules-results'),book=getRuleBook(); if(!box||!book)return;
 const q=String(query).trim(); if(!q){box.innerHTML='<p class="rules-empty">Digite uma regra para pesquisar.</p>';return;}
 const results=book.search(q,{...options,limit:30})||[];
 box.innerHTML=results.length?results.map(({rule})=>`<button class="rule-result-card" data-rule-id="${rule.id}"><span class="rule-kicker">${escapeHtml(ruleCategoryLabel(rule.category))}</span><strong>${escapeHtml(rule.title)}</strong><p>${escapeHtml(rule.summary||'')}</p><div class="rule-card-related">${book.getRelated(rule.id).slice(0,4).map(r=>`<span>${escapeHtml(r.title)}</span>`).join('')}</div>${rule.status==='needs-review'?'<span class="rule-status-review">⚠ Pendente de revisão</span>':''}</button>`).join(''):'<p class="rules-empty">Nenhuma regra encontrada.</p>';
}
function filterRulesCategory(category){
 const box=document.getElementById('rules-results'),book=getRuleBook(); if(!box||!book)return;
 const rules=book.getByCategory(category)||[];
 box.innerHTML=rules.map(rule=>`<button class="rule-result-card" data-rule-id="${rule.id}"><span class="rule-kicker">${escapeHtml(ruleCategoryLabel(rule.category))}</span><strong>${escapeHtml(rule.title)}</strong><p>${escapeHtml(rule.summary||'')}</p>${rule.status==='needs-review'?'<span class="rule-status-review">⚠ Pendente de revisão</span>':''}</button>`).join('')||'<p class="rules-empty">Nenhuma regra nesta categoria.</p>';
}
function openRuleById(id,push=true){
 const rule=getRule(id); if(!rule)return;
 if(push) ruleHistory.push(id);
 const main=document.getElementById('main-content'); if(!main)return;
 const book=getRuleBook(), related=book.getRelated(id)||[];
 const section=(title,content)=>content&&content.length?`<section class="rule-section"><h3>${title}</h3>${content}</section>`:'';
 // linkifyRules() já escapa o texto original e gera apenas os botões seguros
 // dos termos registrados. Portanto, não devemos escapar novamente aqui.
 const list=a=>`<ul>${a.map(x=>`<li>${x}</li>`).join('')}</ul>`;
 const meta=[['Elemento',rule.element],['Grau',rule.grade],['Tipo',rule.type],['Ação',rule.action],['Alcance',rule.range],['Duração',rule.duration],['Pré-requisito',rule.prerequisite]].filter(x=>x[1]);
 main.innerHTML=`<section class="rule-detail"><div class="rule-breadcrumb"><button onclick="backFromRule()">← Voltar</button><span>Livro de Regras › ${escapeHtml(ruleCategoryLabel(rule.category))} › ${escapeHtml(rule.title)}</span></div><div class="rule-detail-head"><div><span class="rule-kicker">${escapeHtml(ruleCategoryLabel(rule.category))}</span><h1>${escapeHtml(rule.title)}</h1><p>${escapeHtml(rule.summary||'')}</p></div>${rule.status==='needs-review'?'<div class="rule-status-review">⚠ Regra pendente de revisão</div>':''}</div>${meta.length?`<div class="rule-meta">${meta.map(([k,v])=>`<span><b>${k}:</b> ${escapeHtml(v)}</span>`).join('')}</div>`:''}${section('Como funciona',rule.description&&`<p>${linkifyRules(rule.description)}</p>`)}${section('Mecânica',rule.mechanics?.length?list(rule.mechanics.map(linkifyRules)): '')}${section('Exemplos',rule.examples?.length?list(rule.examples.map(linkifyRules)):'')}${section('Tags',rule.tags?.length?`<div class="rule-tags">${rule.tags.map(t=>`<span>${escapeHtml(t)}</span>`).join('')}</div>`:'')}${related.length?`<section class="rule-section"><h3>Relacionado</h3><div class="rule-related-list">${related.map(r=>`<button class="rule-related-item" data-rule-id="${r.id}">${escapeHtml(r.title)}</button>`).join('')}</div></section>`:''}${rule.note?`<section class="rule-section rule-review-note"><h3>Observação</h3><p>${escapeHtml(rule.note)}</p></section>`:''}</section>`;
 window.scrollTo({top:0,behavior:'smooth'});
}
function openRuleModal(term){ const book=getRuleBook(); if(!book)return; const found=(book.search(term,{limit:1})||[])[0]?.rule; if(found) openRuleById(found.id); }
function closeRuleModal(){}
function backFromRule(){
 ruleHistory.pop(); const previous=ruleHistory.pop();
 if(previous){openRuleById(previous,true);return;}
 switchTab('regras');
}
function openRuleForSkill(name){
 const rule=findRuleForSkill(name);
 if(!rule){alert('Não foi encontrada uma entrada estruturada para esta habilidade no Livro de Regras.');return;}
 switchTab('regras'); setTimeout(()=>openRuleById(rule.id),0);
}
function renderRulesContext(){}
function searchRulesFromContext(q){ switchTab('regras'); setTimeout(()=>{const i=document.getElementById('rules-search');if(i){i.value=q;searchRules(q);}},0); }
window.openRuleById=openRuleById; window.openRuleForSkill=openRuleForSkill; window.searchRules=searchRules; window.filterRulesCategory=filterRulesCategory; window.scheduleRuleSearch=scheduleRuleSearch; window.backFromRule=backFromRule;

function renderSkillCard(skill, tab, delay = 0) {
  const s = normalizeSkill(skill);
  const key = getSkillKey(tab, s.name);
  const isUnlocked = unlocked[key] || false;
  const canEdit = currentRole === 'admin' || selectedUserId === currentUser?.id;

  return `
    <div class="skill-card ${isUnlocked ? 'unlocked' : ''} fade-in" style="animation-delay:${delay}ms">
      <div class="flex items-start justify-between gap-3 mb-2">
        <h3 class="font-bold text-base" style="font-family:'Cinzel',serif; color:${isUnlocked ? 'var(--primary-color)' : 'var(--text-color)'};">
          ${s.name}
        </h3>
        <input
          type="checkbox"
          class="checkbox-custom"
          ${isUnlocked ? 'checked' : ''}
          ${!canEdit ? 'disabled' : ''}
          onchange="toggleSkill('${key}', this)"
          title="Desbloquear"
        >
      </div>

      <p class="text-xs opacity-70 mb-3 leading-relaxed">${linkifyRules(s.desc)}</p>

      <div class="flex flex-wrap gap-2 mb-3">
        <span class="badge ${getTypeBadgeClass(s.type)}">${s.type}</span>
        <span class="badge" style="background:rgba(255,255,255,0.07); color:var(--text-color);">📍 ${s.range}</span>
      </div>

      <div class="text-xs mb-2" style="color:var(--secondary-color);">
        <span class="font-semibold" style="color:var(--text-color);">Pré-requisito:</span> ${s.prereq}
      </div>

      <div class="text-xs mb-3 opacity-80">
        <span class="font-semibold" style="color:var(--text-color);">Efeito:</span> ${s.effect}
      </div>

      <div class="flex items-center gap-1 text-xs">
        <span class="opacity-60 mr-1">Ressonância:</span>
        ${renderResDots(s.res)}
      </div>
      ${findRuleForSkill(s.name) ? `<button class="skill-rule-link" type="button" onclick="openRuleForSkill('${String(s.name).replace(/'/g,"\'")}')">📖 Ver regra completa</button>` : ''}
    </div>
  `;
}

function renderTab(tab) {
  const data = SKILLS[tab];
  if (!data || !data.paths) return '<p class="opacity-60">Nenhuma habilidade cadastrada.</p>';

  let html = `<div class="skills-grid grid gap-6 element-${tab}" style="grid-template-columns: repeat(${data.paths.length}, minmax(280px, 1fr));">`;

  data.paths.forEach(path => {
    html += `<div class="flex flex-col">`;
    html += `<h2 class="path-title">${path.name}</h2>`;

    path.skills.forEach((skill, idx) => {
      if (idx > 0) {
        const prevKey = getSkillKey(tab, path.skills[idx - 1].name);
        html += `<div class="path-line ${unlocked[prevKey] ? 'active' : ''}"></div>`;
      }
      html += renderSkillCard(skill, tab, idx * 80);
    });

    html += `</div>`;
  });

  html += `</div>`;
  return html;
}



//salvar no supabase quando desbloquear ou bloquear uma skill, e atualizar a interface


function renderTabs() {
  const container = document.getElementById('tabs-container');

  let tabsHtml = Object.entries(TAB_META).map(([key, label]) => {
    const match = label.match(/^(\S+)\s+(.+)$/);
    const icon = match ? match[1] : '';
    const text = match ? match[2] : label;

    return `<button class="tab-btn ${key === currentTab ? 'active' : ''}" data-tab="${key}" onclick="switchTab('${key}')" title="${text}">
      <span class="nav-icon">${icon}</span>
      <span class="nav-label">${text}</span>
    </button>`;
  }).join('');

  if (currentRole === 'admin') {
    tabsHtml += `<button class="tab-btn ${currentTab === 'mestre' ? 'active' : ''}" data-tab="mestre" onclick="switchTab('mestre')" title="Mestre">
      <span class="nav-icon">⚙️</span>
      <span class="nav-label">Mestre</span>
    </button>`;
  }

  container.innerHTML = tabsHtml;
}

function renderAbilitiesHub() {
  const buttons = Object.entries(SKILL_TAB_META).map(([key,label]) =>
    `<button class="skill-element-btn ${currentSkillElement===key?'active':''}" onclick="selectSkillElement('${key}')">${label}</button>`
  ).join('');
  return `<section class="abilities-hub fade-in"><header class="section-hero"><div><span class="section-eyebrow">PROGRESSÃO</span><h2>🌳 Árvore de Habilidades</h2><p>Consulte e administre a progressão do personagem. Na ficha ficam apenas as habilidades já adquiridas.</p></div></header><div class="skill-element-nav">${buttons}</div><div id="skill-tree-content">${renderTab(currentSkillElement)}</div></section>`;
}
window.selectSkillElement = function(key){ currentSkillElement=key; const main=document.getElementById('main-content'); main.innerHTML=renderAbilitiesHub(); if(window.lucide) lucide.createIcons(); };

function switchTab(tab) {
  if (currentTab === 'personagem' && tab !== 'personagem' && isDirty) window.saveCharacterData({silent:true});
  currentTab = tab;
  renderTabs();
  const mainContent = document.getElementById('main-content');
  document.body.dataset.section = tab;
  if (tab === 'regras') {
    mainContent.innerHTML = renderRulesPage(); renderRulesContext(); searchRules('');
  } else if (tab === 'personagem') {
    mainContent.innerHTML = renderCharacterSheet(); if (window.lucide) window.lucide.createIcons();
  } else if (tab === 'habilidades') {
    mainContent.innerHTML = renderAbilitiesHub(); if (window.lucide) window.lucide.createIcons();
  } else if (tab === 'combate') {
    loadCombatView();
  } else if (tab === 'mestre') {
    loadMasterHub();
  }
}

function subscribeSessionPresence(profile) {
  if (presenceChannel) supabaseClient.removeChannel(presenceChannel);
  presenceChannel = supabaseClient.channel('elemento-frio-presence', {
    config: { presence: { key: currentUser?.id || crypto.randomUUID() } }
  });

  presenceChannel.on('presence', { event: 'sync' }, () => {
    const state = presenceChannel.presenceState();
    onlineUserIds = new Set(
      Object.values(state || {}).flat().map(item => item.user_id).filter(Boolean)
    );
    if (currentTab === 'mestre' && masterHubSection === 'session') {
      const counter = document.querySelector('[data-master-online]');
      if (counter) counter.textContent = String(masterPlayersCache.filter(p => onlineUserIds.has(p.user_id)).length);
    }
  });

  presenceChannel.subscribe(async status => {
    if (status === 'SUBSCRIBED') {
      await presenceChannel.track({
        user_id: currentUser.id,
        username: profile?.username || currentUser.email,
        role: profile?.role || 'player',
        online_at: new Date().toISOString()
      });
    }
  });
}

async function loadMasterHub(section = masterHubSection) {
  if (currentRole !== 'admin') return;
  masterHubSection = section;
  const main = document.getElementById('main-content');
  if (!main) return;
  main.innerHTML = '<section class="master-center"><p class="rules-empty">Carregando central do mestre...</p></section>';
  masterSetupWarnings = [];

  const combatPromise = fetchCombatState();
  const bestiaryPromise = supabaseClient.from('enemy_templates').select('*').order('name');
  const notesPromise = supabaseClient.from('gm_notes').select('*').eq('owner_id', currentUser.id).maybeSingle();

  const [combat, bestiaryRes, notesRes] = await Promise.all([combatPromise, bestiaryPromise, notesPromise]);
  if (!combat.error) {
    activeBattle = combat.battle;
    battleEnemies = combat.enemies || [];
    masterEnemiesCache = combat.enemies || [];
    masterPlayersCache = combat.players || [];
  } else {
    masterSetupWarnings.push('Combate: ' + combat.error.message);
  }

  if (bestiaryRes.error) masterSetupWarnings.push('Bestiário: ' + bestiaryRes.error.message);
  masterBestiaryCache = bestiaryRes.data || [];

  if (notesRes.error) masterSetupWarnings.push('Notas: ' + notesRes.error.message);
  masterNotesCache = notesRes.data?.content || '';

  masterBattleLogCache = [];
  if (activeBattle?.id) {
    const logRes = await supabaseClient.from('battle_log').select('*').eq('battle_id', activeBattle.id).order('created_at', { ascending: false }).limit(30);
    if (logRes.error) masterSetupWarnings.push('Histórico: ' + logRes.error.message);
    else masterBattleLogCache = logRes.data || [];
  }

  if (currentTab !== 'mestre') return;
  main.innerHTML = renderMasterHub();
  if (window.lucide) window.lucide.createIcons();
}

function renderMasterHub() {
  const nav = [
    ['session','Sessão'],
    ['players','Personagens'],
    ['bestiary','Inimigos'],
    ['notes','Notas'],
    ['rules','Regras rápidas']
  ];
  const content = masterHubSection === 'players' ? renderMasterPlayers()
    : masterHubSection === 'bestiary' ? renderMasterBestiary()
    : masterHubSection === 'notes' ? renderMasterNotes()
    : masterHubSection === 'rules' ? renderMasterQuickRules()
    : renderMasterSession();

  return `<section class="master-center fade-in">
    <header class="master-center-header">
      <div><span class="section-eyebrow">CENTRAL DA SESSÃO</span><h2>⚙️ Mestre</h2><p>Prepare encontros, controle personagens e acompanhe a sessão sem sair desta área.</p></div>
      ${activeBattle ? `<button class="primary-action" onclick="switchTab('combate')">Abrir combate →</button>` : `<button class="primary-action" onclick="startBattle();setTimeout(()=>loadMasterHub('session'),250)">+ Iniciar combate</button>`}
    </header>
    <nav class="master-center-nav">${nav.map(([id,label])=>`<button class="${masterHubSection===id?'active':''}" onclick="setMasterSection('${id}')">${label}</button>`).join('')}</nav>
    ${masterSetupWarnings.length ? `<div class="master-warning"><strong>Configuração pendente</strong><span>Execute o SQL atualizado se algum módulo ainda não existir.</span></div>` : ''}
    <div class="master-center-content">${content}</div>
  </section>`;
}

function renderMasterSession() {
  const online = masterPlayersCache.filter(p => onlineUserIds.has(p.user_id)).length;
  const injured = masterPlayersCache.filter(p => (p.hp_current ?? 0) < (p.hp_max ?? 0)).length;
  const playerConditions = masterPlayersCache.reduce((n,p)=>n+(Array.isArray(p.conditions)?p.conditions.length:0),0);
  const enemyConditions = masterEnemiesCache.reduce((n,e)=>n+(Array.isArray(e.conditions)?e.conditions.length:0),0);
  const turnOrder = Array.isArray(activeBattle?.turn_order) ? activeBattle.turn_order : [];
  const turnIndex = Math.max(0, activeBattle?.turn_index || 0);
  const currentTurn = turnOrder[turnIndex]?.label || activeBattle?.turn_label || '—';
  return `<div class="master-dashboard-grid">
    <section class="master-panel master-session-panel">
      <div class="master-panel-head"><div><span class="section-eyebrow">SESSÃO ATUAL</span><h3>${activeBattle ? escapeHtml(activeBattle.name || 'Batalha') : 'Fora de combate'}</h3></div><span class="master-live-dot ${activeBattle?'on':''}">${activeBattle?'ATIVO':'INATIVO'}</span></div>
      <div class="master-stat-grid">
        <div><strong data-master-online>${online}</strong><span>online</span></div>
        <div><strong>${masterPlayersCache.length}</strong><span>jogadores</span></div>
        <div><strong>${activeBattle?.round || '—'}</strong><span>rodada</span></div>
        <div><strong>${masterEnemiesCache.length}</strong><span>inimigos</span></div>
        <div><strong>${injured}</strong><span>feridos</span></div>
        <div><strong>${playerConditions + enemyConditions}</strong><span>condições</span></div>
      </div>
      ${activeBattle ? `<div class="master-turn-box"><span>Turno atual</span><strong>${escapeHtml(currentTurn)}</strong><div><button onclick="openInitiativeEditor()">Iniciativa</button><button onclick="advanceBattleTurn()">Próximo turno →</button></div></div>` : ''}
      <div class="master-quick-actions">
        <button onclick="switchTab('combate')">⚔️ Abrir combate</button>
        <button onclick="setMasterSection('players')">👥 Personagens</button>
        <button onclick="openBestiaryEditor()">＋ Criar inimigo</button>
        <button onclick="setMasterSection('rules')">📖 Regras rápidas</button>
      </div>
    </section>

    <section class="master-panel">
      <div class="master-panel-head"><div><span class="section-eyebrow">ROLAGENS</span><h3>Dados rápidos</h3></div></div>
      <div class="master-dice-row">${[20,12,10,8,6,4].map(d=>`<button onclick="rollMasterDie(${d})">d${d}</button>`).join('')}</div>
      <div id="master-dice-result" class="master-dice-result"><span>Resultado</span><strong>—</strong></div>
    </section>

    <section class="master-panel master-preview-panel">
      <div class="master-panel-head"><div><span class="section-eyebrow">PERSONAGENS</span><h3>Estado do grupo</h3></div><button onclick="setMasterSection('players')">Ver todos</button></div>
      <div class="master-mini-list">${masterPlayersCache.slice(0,5).map(p=>`<button onclick="openMasterCharacter('${p.user_id}')"><span>${escapeHtml(p.name||'Sem nome')}</span><b>${p.hp_current??0}/${p.hp_max??0} PV</b></button>`).join('') || '<p>Nenhum personagem.</p>'}</div>
    </section>

    <section class="master-panel master-preview-panel">
      <div class="master-panel-head"><div><span class="section-eyebrow">BESTIÁRIO</span><h3>Inimigos salvos</h3></div><button onclick="setMasterSection('bestiary')">Abrir</button></div>
      <div class="master-mini-list">${masterBestiaryCache.slice(0,5).map(e=>`<button onclick="openBestiaryEditor('${e.id}')"><span>${escapeHtml(e.name)}</span><b>${e.hp_max} PV</b></button>`).join('') || '<p>Nenhum inimigo salvo.</p>'}</div>
    </section>

    <section class="master-panel master-preview-panel master-notes-preview">
      <div class="master-panel-head"><div><span class="section-eyebrow">NOTAS</span><h3>Últimas anotações</h3></div><button onclick="setMasterSection('notes')">Editar</button></div>
      <p>${escapeHtml(masterNotesCache.trim().slice(0,240) || 'Nenhuma nota de sessão ainda.')}</p>
    </section>

    <section class="master-panel master-log-panel">
      <div class="master-panel-head"><div><span class="section-eyebrow">HISTÓRICO</span><h3>Últimos eventos</h3></div></div>
      <div class="master-log-list">${masterBattleLogCache.slice(0,8).map(item=>`<div><time>${new Date(item.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</time><span>${escapeHtml(item.message)}</span></div>`).join('') || '<p>Nenhum evento registrado nesta batalha.</p>'}</div>
    </section>
  </div>`;
}

function renderMasterPlayers() {
  const conditions = ['Lento','Caído','Imobilizado','Congelado','Sobrecarregado','Atordoado','Em Chamas','Encharcado'];
  return `<section class="master-section-block"><div class="master-section-title"><div><span class="section-eyebrow">GRUPO</span><h3>Gerenciador de personagens</h3><p>Altere recursos e condições sem abrir ficha por ficha.</p></div><button onclick="openCharacterPicker()">Trocar ficha</button></div>
    <div class="master-player-grid">${masterPlayersCache.map(p=>{
      const conds=Array.isArray(p.conditions)?p.conditions:[];
      return `<article class="master-player-card">
        <div class="master-player-head"><div class="battle-avatar">${p.avatar_url?`<img src="${escapeAttr(p.avatar_url)}">`:escapeHtml((p.name||'?')[0])}</div><div><strong>${escapeHtml(p.name||'Sem nome')}</strong><small>${escapeHtml([p.class_name,p.archetype].filter(Boolean).join(' • '))}</small></div><b>NV ${p.level||1}</b></div>
        <div class="master-player-resources"><span>PV <b>${p.hp_current??0}/${p.hp_max??0}</b></span><span>PD <b>${p.energy_current??0}/${p.energy_max??0}</b></span><span>PR <b>${p.resonance_points??3}</b></span><span>DEF <b>${p.defense??10}</b></span></div>
        <div class="master-resource-actions"><button onclick="adjustMasterResource('${p.user_id}','hp',-10)">-10 PV</button><button onclick="adjustMasterResource('${p.user_id}','hp',10)">+10 PV</button><button onclick="adjustMasterResource('${p.user_id}','pd',-1)">-1 PD</button><button onclick="adjustMasterResource('${p.user_id}','pd',1)">+1 PD</button></div>
        <div class="master-condition-list">${conds.map(c=>`<button title="Remover condição" onclick="removeMasterCondition('${p.user_id}','${escapeAttr(c)}')">${escapeHtml(c)} ×</button>`).join('') || '<span>Sem condições</span>'}</div>
        <div class="master-condition-add"><select id="condition-${p.user_id}">${conditions.map(c=>`<option>${c}</option>`).join('')}</select><button onclick="addMasterCondition('${p.user_id}')">Aplicar</button></div>
        <div class="master-card-actions"><button onclick="openMasterCharacter('${p.user_id}')">Abrir ficha</button><button onclick="openMasterSkills('${p.user_id}')">Ver habilidades</button></div>
      </article>`;
    }).join('') || '<p class="rules-empty">Nenhum personagem encontrado.</p>'}</div>
  </section>`;
}

function renderMasterBestiary() {
  return `<section class="master-section-block"><div class="master-section-title"><div><span class="section-eyebrow">BIBLIOTECA</span><h3>Bestiário / Inimigos</h3><p>Salve inimigos uma vez e reutilize em qualquer combate.</p></div><button class="primary-action" onclick="openBestiaryEditor()">+ Novo inimigo</button></div>
    <div class="bestiary-grid">${masterBestiaryCache.map(e=>`<article class="bestiary-card"><div class="bestiary-head"><div class="battle-avatar enemy">${e.image_url?`<img src="${escapeAttr(e.image_url)}">`:'👹'}</div><div><strong>${escapeHtml(e.name)}</strong><small>${escapeHtml(e.subtitle||'')}</small></div></div><div class="bestiary-stats"><span>PV <b>${e.hp_max}</b></span><span>DEF <b>${e.defense??10}</b></span><span>ESQ <b>${e.dodge??0}</b></span><span>DESL <b>${e.movement_speed??9}m</b></span></div>${e.conditions?.length?`<div class="condition-chips">${e.conditions.map(c=>`<button onclick="searchRulesFromContext('${escapeAttr(c)}')">${escapeHtml(c)}</button>`).join('')}</div>`:''}<div class="bestiary-actions"><button onclick="addTemplateToBattle('${e.id}')">+ Combate</button><button onclick="openBestiaryEditor('${e.id}')">Editar</button><button onclick="duplicateBestiary('${e.id}')">Duplicar</button><button class="danger-text" onclick="deleteBestiary('${e.id}')">Excluir</button></div></article>`).join('') || '<div class="combat-empty"><span>👹</span><h3>Bestiário vazio</h3><p>Crie o primeiro inimigo reutilizável.</p></div>'}</div>
  </section>`;
}

function renderMasterNotes() {
  return `<section class="master-section-block"><div class="master-section-title"><div><span class="section-eyebrow">PRIVADO</span><h3>Notas da sessão</h3><p>Somente sua conta de mestre consegue ler estas anotações.</p></div><span id="master-notes-status" class="master-note-status">Salvo</span></div><textarea id="master-notes-textarea" class="master-notes-textarea" placeholder="Pistas, segredos, lembretes, eventos futuros..." oninput="scheduleMasterNotesSave(this.value)">${escapeHtml(masterNotesCache)}</textarea></section>`;
}

function renderMasterQuickRules() {
  const rules=['esquiva','contra-ataque','reducao-de-dano','ressonancia-elemental','pontos-de-ressonancia','caido','imobilizado','congelado','sobrecarregado','cobertura'];
  const book=getRuleBook();
  return `<section class="master-section-block"><div class="master-section-title"><div><span class="section-eyebrow">CONSULTA</span><h3>Regras rápidas</h3><p>Abra as mecânicas mais usadas durante a sessão.</p></div><button onclick="switchTab('regras')">Livro completo →</button></div><div class="master-rule-grid">${rules.map(id=>{const r=book?.getById(id);return r?`<button onclick="switchTab('regras');setTimeout(()=>openRuleById('${r.id}'),0)"><span>${escapeHtml(ruleCategoryLabel(r.category))}</span><strong>${escapeHtml(r.title)}</strong><small>${escapeHtml(r.summary||'')}</small></button>`:''}).join('')}</div></section>`;
}

window.setMasterSection = function(section){ masterHubSection=section; const main=document.getElementById('main-content'); if(main) main.innerHTML=renderMasterHub(); };
window.rollMasterDie = function(sides){ const result=Math.floor(Math.random()*sides)+1; const box=document.getElementById('master-dice-result'); if(box) box.innerHTML=`<span>d${sides}</span><strong>${result}</strong>`; };
window.openMasterCharacter = async function(userId){ selectedUserId=userId; const select=document.getElementById('player-select'); if(select) select.value=userId; dataReady=false; setSaveStatus('loading'); await loadSkills(); await loadCharacterData(); switchTab('personagem'); };
window.openMasterSkills = async function(userId){ selectedUserId=userId; const select=document.getElementById('player-select'); if(select) select.value=userId; dataReady=false; setSaveStatus('loading'); await loadSkills(); await loadCharacterData(); switchTab('habilidades'); };

async function logBattle(message, kind='info') {
  if (!activeBattle?.id || currentRole!=='admin') return;
  const {error}=await supabaseClient.from('battle_log').insert({battle_id:activeBattle.id,message,kind,created_by:currentUser.id});
  if(error && !String(error.message).includes('battle_log')) console.warn('Histórico:',error.message);
}

window.adjustMasterResource = async function(userId, resource, delta){
  const {data,error}=await supabaseClient.rpc('master_adjust_character',{p_user_id:userId,p_resource:resource,p_delta:delta});
  if(error){alert('Não foi possível alterar o recurso. Execute o SQL atualizado.\n'+error.message);return;}
  const player=masterPlayersCache.find(p=>p.user_id===userId); const name=player?.name||'Personagem';
  await logBattle(`${name}: ${delta>0?'+':''}${delta} ${resource==='hp'?'PV':'PD'}`,'resource');
  await loadMasterHub('players');
};

window.addMasterCondition = async function(userId){ const select=document.getElementById('condition-'+userId); if(!select)return; const player=masterPlayersCache.find(p=>p.user_id===userId); const list=[...(player?.conditions||[])]; if(!list.includes(select.value)) list.push(select.value); await saveMasterConditions(userId,list,`${player?.name||'Personagem'} recebeu ${select.value}`); };
window.removeMasterCondition = async function(userId,condition){ const player=masterPlayersCache.find(p=>p.user_id===userId); const list=(player?.conditions||[]).filter(c=>c!==condition); await saveMasterConditions(userId,list,`${player?.name||'Personagem'} removeu ${condition}`); };
async function saveMasterConditions(userId,list,log){ const {error}=await supabaseClient.rpc('master_set_character_conditions',{p_user_id:userId,p_conditions:list}); if(error){alert('Não foi possível alterar condições. Execute o SQL atualizado.\n'+error.message);return;} await logBattle(log,'condition'); await loadMasterHub('players'); }

window.scheduleMasterNotesSave=function(value){ masterNotesCache=value; const status=document.getElementById('master-notes-status'); if(status)status.textContent='Salvando...'; clearTimeout(masterNotesTimer); masterNotesTimer=setTimeout(()=>saveMasterNotes(value),650); };
async function saveMasterNotes(value){ const {error}=await supabaseClient.from('gm_notes').upsert({owner_id:currentUser.id,content:value,updated_at:new Date().toISOString()},{onConflict:'owner_id'}); const status=document.getElementById('master-notes-status'); if(error){if(status)status.textContent='Erro ao salvar';console.error(error);return;} if(status)status.textContent='Salvo'; }

window.openBestiaryEditor=function(id=''){
  const e=masterBestiaryCache.find(x=>x.id===id)||{visibility:{name:true,hp:true,hp_numbers:false,conditions:true,defense:false,dodge:false,block:false,movement:true},conditions:[],attacks:[],abilities:[]};
  document.getElementById('bestiary-editor')?.remove();
  document.body.insertAdjacentHTML('beforeend',`<div id="bestiary-editor" class="picker-modal"><button class="picker-backdrop" onclick="document.getElementById('bestiary-editor').remove()"></button><form class="picker-panel bestiary-editor" onsubmit="saveBestiary(event,'${id}')"><div class="picker-head"><div><span class="section-eyebrow">BESTIÁRIO</span><h3>${id?'Editar':'Novo'} inimigo</h3></div><button type="button" onclick="document.getElementById('bestiary-editor').remove()">✕</button></div><label>Nome<input name="name" required value="${escapeAttr(e.name||'')}"></label><label>Subtítulo<input name="subtitle" value="${escapeAttr(e.subtitle||'')}"></label><label>URL da imagem<input name="image_url" value="${escapeAttr(e.image_url||'')}"></label><div class="enemy-form-grid"><label>PV máximo<input name="hp_max" type="number" value="${e.hp_max??10}"></label><label>Defesa<input name="defense" type="number" value="${e.defense??10}"></label><label>Esquiva<input name="dodge" type="number" value="${e.dodge??0}"></label><label>Bloqueio<input name="block" type="number" value="${e.block??0}"></label><label>Deslocamento<input name="movement_speed" type="number" step="0.5" value="${e.movement_speed??9}"></label></div><label>Condições padrão (vírgula)<input name="conditions" value="${escapeAttr((e.conditions||[]).join(', '))}"></label><label>Ataques (um por linha)<textarea name="attacks">${escapeHtml((e.attacks||[]).join('\n'))}</textarea></label><label>Habilidades (uma por linha)<textarea name="abilities">${escapeHtml((e.abilities||[]).join('\n'))}</textarea></label><label>Notas privadas<textarea name="notes">${escapeHtml(e.notes||'')}</textarea></label><fieldset><legend>Visível para jogadores</legend>${[['name','Nome'],['hp','Barra de PV'],['hp_numbers','PV numérico'],['conditions','Condições'],['defense','Defesa'],['dodge','Esquiva'],['block','Bloqueio'],['movement','Deslocamento']].map(([k,l])=>`<label class="check-row"><input type="checkbox" name="vis_${k}" ${e.visibility?.[k]!==false?'checked':''}> ${l}</label>`).join('')}</fieldset><button class="primary-action" type="submit">Salvar no bestiário</button></form></div>`);
};

window.saveBestiary=async function(ev,id){ ev.preventDefault(); const f=new FormData(ev.target),visibility={}; ['name','hp','hp_numbers','conditions','defense','dodge','block','movement'].forEach(k=>visibility[k]=f.get('vis_'+k)==='on'); const lines=name=>String(f.get(name)||'').split('\n').map(x=>x.trim()).filter(Boolean); const payload={owner_id:currentUser.id,name:f.get('name')||'Inimigo',subtitle:f.get('subtitle')||'',image_url:f.get('image_url')||'',hp_max:+f.get('hp_max')||1,defense:+f.get('defense')||0,dodge:+f.get('dodge')||0,block:+f.get('block')||0,movement_speed:+f.get('movement_speed')||0,conditions:String(f.get('conditions')||'').split(',').map(x=>x.trim()).filter(Boolean),attacks:lines('attacks'),abilities:lines('abilities'),notes:f.get('notes')||'',visibility}; const q=id?supabaseClient.from('enemy_templates').update(payload).eq('id',id):supabaseClient.from('enemy_templates').insert(payload); const {error}=await q; if(error){alert('Erro ao salvar bestiário. Execute o SQL atualizado.\n'+error.message);return;} document.getElementById('bestiary-editor')?.remove(); await loadMasterHub('bestiary'); };
window.deleteBestiary=async function(id){if(!confirm('Excluir este inimigo do bestiário?'))return;const {error}=await supabaseClient.from('enemy_templates').delete().eq('id',id);if(error)alert(error.message);else loadMasterHub('bestiary');};
window.duplicateBestiary=async function(id){const e=masterBestiaryCache.find(x=>x.id===id);if(!e)return;const {id:_id,created_at,_created,updated_at,_updated,...copy}=e;copy.name=(e.name||'Inimigo')+' (Cópia)';copy.owner_id=currentUser.id;const {error}=await supabaseClient.from('enemy_templates').insert(copy);if(error)alert(error.message);else loadMasterHub('bestiary');};
window.addTemplateToBattle=async function(id){let battle=activeBattle;if(!battle){const state=await fetchCombatState();battle=state.battle;activeBattle=battle;}if(!battle){alert('Inicie um combate antes de adicionar inimigos.');return;}const e=masterBestiaryCache.find(x=>x.id===id);if(!e)return;const payload={battle_id:battle.id,name:e.name,subtitle:e.subtitle,image_url:e.image_url,hp_current:e.hp_max,hp_max:e.hp_max,defense:e.defense,dodge:e.dodge,block:e.block,movement_speed:e.movement_speed,conditions:e.conditions||[],attacks:e.attacks||[],abilities:e.abilities||[],notes:e.notes||'',visibility:e.visibility||{}};const {error}=await supabaseClient.from('battle_enemies').insert(payload);if(error){alert(error.message);return;}await logBattle(`${e.name} foi adicionado ao combate`,'enemy');await loadMasterHub('bestiary');};


async function ensureBestiaryLoaded(){
  if(masterBestiaryCache.length) return true;
  const {data,error}=await supabaseClient.from('enemy_templates').select('*').order('name');
  if(error){
    alert('Não foi possível carregar o bestiário.\n'+error.message);
    return false;
  }
  masterBestiaryCache=data||[];
  return true;
}

window.openBattleBestiaryPicker=async function(){
  if(currentRole!=='admin') return;
  let battle=activeBattle;
  if(!battle){
    const state=await fetchCombatState();
    battle=state.battle;
    activeBattle=battle;
  }
  if(!battle){
    alert('Inicie um combate antes de adicionar inimigos do bestiário.');
    return;
  }
  if(!(await ensureBestiaryLoaded())) return;

  document.getElementById('battle-bestiary-picker')?.remove();
  const rows=masterBestiaryCache.map(e=>`
    <article class="battle-bestiary-row" data-bestiary-search="${escapeAttr([e.name,e.subtitle].filter(Boolean).join(' ')).toLowerCase()}">
      <div class="battle-avatar enemy">${e.image_url?`<img src="${escapeAttr(e.image_url)}" alt="">`:'👹'}</div>
      <div class="battle-bestiary-info">
        <strong>${escapeHtml(e.name||'Inimigo')}</strong>
        <small>${escapeHtml(e.subtitle||'')}</small>
        <div class="battle-bestiary-stats"><span>PV ${e.hp_max??0}</span><span>DEF ${e.defense??10}</span><span>ESQ ${e.dodge??0}</span><span>DESL ${e.movement_speed??9}m</span></div>
      </div>
      <button class="primary-action" type="button" onclick="addTemplateToActiveBattle('${e.id}', this)">+ Adicionar</button>
    </article>`).join('');

  document.body.insertAdjacentHTML('beforeend',`
    <div id="battle-bestiary-picker" class="picker-modal">
      <button class="picker-backdrop" onclick="closeBattleBestiaryPicker()"></button>
      <div class="picker-panel battle-bestiary-picker-panel">
        <div class="picker-head">
          <div><span class="section-eyebrow">BESTIÁRIO</span><h3>Adicionar ao combate</h3><small>Escolha um inimigo salvo para criar uma cópia nesta batalha.</small></div>
          <button type="button" onclick="closeBattleBestiaryPicker()">✕</button>
        </div>
        <div class="picker-search"><input id="battle-bestiary-search" placeholder="Pesquisar inimigo..." oninput="filterBattleBestiary(this.value)"></div>
        <div class="battle-bestiary-list">${rows||'<div class="combat-empty"><span>👹</span><h3>Bestiário vazio</h3><p>Crie inimigos na Central do Mestre primeiro.</p></div>'}</div>
      </div>
    </div>`);
};

window.closeBattleBestiaryPicker=function(){document.getElementById('battle-bestiary-picker')?.remove();};
window.filterBattleBestiary=function(query=''){
  const q=String(query).trim().toLocaleLowerCase('pt-BR');
  document.querySelectorAll('#battle-bestiary-picker .battle-bestiary-row').forEach(row=>{
    row.hidden=q&&!String(row.dataset.bestiarySearch||'').includes(q);
  });
};

window.addTemplateToActiveBattle=async function(id,button){
  if(button){button.disabled=true;button.textContent='Adicionando...';}
  try{
    let battle=activeBattle;
    if(!battle){
      const state=await fetchCombatState();
      battle=state.battle;
      activeBattle=battle;
    }
    if(!battle){alert('Não existe combate ativo.');return;}
    if(!(await ensureBestiaryLoaded())) return;
    const e=masterBestiaryCache.find(x=>String(x.id)===String(id));
    if(!e){alert('Inimigo não encontrado no bestiário.');return;}
    const visibility={name:true,hp:true,hp_numbers:false,conditions:true,defense:false,dodge:false,block:false,movement:true,attacks:false,abilities:false,...(e.visibility||{})};
    const payload={battle_id:battle.id,name:e.name||'Inimigo',subtitle:e.subtitle||'',image_url:e.image_url||'',hp_current:e.hp_max??10,hp_max:e.hp_max??10,defense:e.defense??10,dodge:e.dodge??0,block:e.block??0,movement_speed:e.movement_speed??9,conditions:Array.isArray(e.conditions)?e.conditions:[],attacks:Array.isArray(e.attacks)?e.attacks:[],abilities:Array.isArray(e.abilities)?e.abilities:[],notes:e.notes||'',visibility};
    const {error}=await supabaseClient.from('battle_enemies').insert(payload);
    if(error){alert('Erro ao adicionar ao combate.\n'+error.message);return;}
    await logBattle(`${e.name||'Inimigo'} foi adicionado ao combate`,'enemy');
    scheduleCombatSync(50);
    if(button){button.textContent='✓ Adicionado';setTimeout(()=>{if(button){button.disabled=false;button.textContent='+ Adicionar';}},900);}
  }finally{
    if(button&&button.textContent==='Adicionando...'){button.disabled=false;button.textContent='+ Adicionar';}
  }
};

window.openInitiativeEditor=function(){
  if(!activeBattle){alert('Nenhum combate ativo.');return;}
  const current=Array.isArray(activeBattle.turn_order)?activeBattle.turn_order:[];
  const currentMap=new Map(current.map(x=>[`${x.type}:${x.id}`,x.initiative]));
  // Na tela de Combate usamos os dados que já estão carregados ali. Na Central
  // do Mestre mantemos o fallback para os caches administrativos.
  const playerSource=(currentTab==='combate'&&combatPlayersCache.length)?combatPlayersCache:masterPlayersCache;
  const enemySource=(currentTab==='combate'&&battleEnemies.length)?battleEnemies:masterEnemiesCache;
  const entities=[
    ...playerSource.map(p=>({type:'player',id:p.user_id,label:p.name||'Personagem'})),
    ...enemySource.map(e=>({type:'enemy',id:e.id,label:e.name||'Inimigo'}))
  ];
  document.getElementById('initiative-editor')?.remove();
  document.body.insertAdjacentHTML('beforeend',`<div id="initiative-editor" class="picker-modal"><button class="picker-backdrop" onclick="document.getElementById('initiative-editor').remove()"></button><form class="picker-panel initiative-editor" onsubmit="saveInitiative(event)"><div class="picker-head"><div><span class="section-eyebrow">COMBATE</span><h3>Ordem de iniciativa</h3><small>Defina os valores. A ordem é organizada automaticamente do maior para o menor.</small></div><button type="button" onclick="document.getElementById('initiative-editor').remove()">✕</button></div><div class="initiative-list">${entities.map(x=>`<label><span>${escapeHtml(x.label)} <small>${x.type==='player'?'Jogador':'Inimigo'}</small></span><input type="number" inputmode="numeric" name="init" data-type="${x.type}" data-id="${x.id}" data-label="${escapeAttr(x.label)}" value="${currentMap.get(`${x.type}:${x.id}`)??0}"></label>`).join('')}</div><button class="primary-action" type="submit">Salvar e ordenar</button></form></div>`);
};
window.saveInitiative=async function(ev){ev.preventDefault();const order=[...ev.target.querySelectorAll('input[name="init"]')].map(i=>({type:i.dataset.type,id:i.dataset.id,label:i.dataset.label,initiative:+i.value||0})).sort((a,b)=>b.initiative-a.initiative||String(a.label).localeCompare(String(b.label),'pt-BR'));const first=order[0]?.label||null;const {error}=await supabaseClient.from('battles').update({turn_order:order,turn_index:0,turn_label:first}).eq('id',activeBattle.id);if(error){alert(error.message);return;}document.getElementById('initiative-editor')?.remove();await logBattle('Ordem de iniciativa atualizada','initiative');if(currentTab==='combate')scheduleCombatSync(40);else await loadMasterHub('session');};
window.advanceBattleTurn=async function(){if(!activeBattle)return;const order=Array.isArray(activeBattle.turn_order)?activeBattle.turn_order:[];if(!order.length){openInitiativeEditor();return;}let next=(activeBattle.turn_index||0)+1;let round=activeBattle.round||1;if(next>=order.length){next=0;round+=1;}const label=order[next]?.label||null;const {error}=await supabaseClient.from('battles').update({turn_index:next,turn_label:label,round}).eq('id',activeBattle.id);if(error){alert(error.message);return;}await logBattle(`Turno: ${label}${next===0?` • Rodada ${round}`:''}`,'turn');if(currentTab==='combate')scheduleCombatSync(40);else await loadMasterHub('session');};

// --- Escudo do Mestre ---
// Mostra, numa única tela, um resumo de todos os jogadores para o mestre
// acompanhar durante a sessão (PV, PD, Nível, PR, Defesa, Esquiva, Bloqueio,
// Deslocamento). Depende da função get_master_shield_data no Supabase
// (mesmo padrão de get_players_for_admin, só que trazendo também os dados
// da tabela characters). Veja o SQL sugerido na documentação do projeto.
async function loadMasterShieldData() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '<p class="opacity-60 text-center p-8">Carregando fichas dos jogadores...</p>';

  const { data, error } = await supabaseClient.rpc('get_master_shield_data');

  if (error) {
    console.error('Erro ao carregar Escudo do Mestre:', error);
    mainContent.innerHTML = `
      <div class="opacity-80 text-center p-8">
        <p>Não foi possível carregar o Escudo do Mestre.</p>
        <p class="text-xs opacity-60 mt-2">${error.message}</p>
        <p class="text-xs opacity-50 mt-2">Verifique se a função get_master_shield_data existe no Supabase.</p>
      </div>`;
    return;
  }

  mainContent.innerHTML = renderMasterShield(data || []);
  if (window.lucide) window.lucide.createIcons();
}

function renderMasterShield(players) {
  if (!players || players.length === 0) {
    return '<p class="opacity-60 text-center p-8">Nenhum jogador encontrado.</p>';
  }

  const cards = players.map(pl => {
    const hpMax = pl.hp_max || 0;
    const enMax = pl.energy_max || 0;
    const hpPct = hpMax ? Math.max(0, Math.min(100, Math.round((pl.hp_current / hpMax) * 100))) : 0;
    const enPct = enMax ? Math.max(0, Math.min(100, Math.round((pl.energy_current / enMax) * 100))) : 0;
    const displayName = pl.name || 'Sem nome';
    const initial = (displayName || pl.username || '?').charAt(0).toUpperCase();

    return `
      <div class="shield-card">
        <div class="shield-card-head">
          <div class="shield-avatar">
            ${pl.avatar_url
              ? `<img src="${pl.avatar_url}" alt="${displayName}">`
              : `<span>${initial}</span>`}
          </div>
          <div class="shield-head-info">
            <div class="shield-char-name">${displayName}</div>
            <div class="shield-player-name">${pl.username || ''}${pl.class_name ? ' • ' + pl.class_name : ''}</div>
            <div class="shield-player-name opacity-60">${[pl.origin, pl.archetype].filter(Boolean).join(' • ')}</div>
          </div>
          <div class="shield-level">NV<br>${pl.level ?? 1}</div>
        </div>

        <div class="shield-bar-row">
          <span class="shield-bar-label pv">PV</span>
          <div class="shield-bar-track"><div class="shield-bar-fill pv" style="width:${hpPct}%"></div></div>
          <span class="shield-bar-value">${pl.hp_current ?? 0}/${hpMax}</span>
        </div>
        <div class="shield-bar-row">
          <span class="shield-bar-label pd">PD</span>
          <div class="shield-bar-track"><div class="shield-bar-fill pd" style="width:${enPct}%"></div></div>
          <span class="shield-bar-value">${pl.energy_current ?? 0}/${enMax}</span>
        </div>

        <div class="shield-stat-grid">
          <div class="shield-stat"><span class="mini-label">PR</span><span>${pl.damage_reduction ?? 0}</span></div>
          <div class="shield-stat"><span class="mini-label">DEFESA</span><span>${pl.defense ?? 10}</span></div>
          <div class="shield-stat"><span class="mini-label">ESQUIVA</span><span>${pl.dodge ?? 10}</span></div>
          <div class="shield-stat"><span class="mini-label">BLOQUEIO</span><span>${pl.block ?? 0}</span></div>
          <div class="shield-stat"><span class="mini-label">DESLOC.</span><span>${pl.movement_speed ?? 9}m</span></div>
        </div>
      </div>
    `;
  }).join('');

  return `<div class="shield-grid">${cards}</div>`;
}

function openCharacterPicker(){
 if(currentRole!=='admin') return;
 const existing=document.getElementById('character-picker-modal'); if(existing) existing.remove();
 const rows=profilesCache.filter(p=>p.role!=='admin').map(p=>`<button class="character-picker-row" onclick="selectCharacterFromPicker('${p.id}')"><span class="picker-avatar">${escapeHtml((p.username||'?')[0].toUpperCase())}</span><span><strong>${escapeHtml(p.username||'Jogador')}</strong><small>Abrir ficha deste personagem</small></span></button>`).join('');
 document.body.insertAdjacentHTML('beforeend',`<div id="character-picker-modal" class="picker-modal"><button class="picker-backdrop" onclick="closeCharacterPicker()"></button><div class="picker-panel"><div class="picker-head"><div><span class="section-eyebrow">PERSONAGENS</span><h3>Trocar ficha</h3></div><button onclick="closeCharacterPicker()">✕</button></div><div class="picker-search"><input placeholder="Pesquisar personagem..." oninput="filterCharacterPicker(this.value)"></div><div class="picker-list">${rows}</div></div></div>`);
}
function closeCharacterPicker(){document.getElementById('character-picker-modal')?.remove()}
function filterCharacterPicker(q){q=String(q).toLowerCase();document.querySelectorAll('.character-picker-row').forEach(r=>r.hidden=!r.textContent.toLowerCase().includes(q))}
async function selectCharacterFromPicker(id){closeCharacterPicker(); const select=document.getElementById('player-select'); if(select) select.value=id; selectedUserId=id; dataReady=false; setSaveStatus('loading'); await loadSkills(); await loadCharacterData();}
window.openCharacterPicker=openCharacterPicker; window.closeCharacterPicker=closeCharacterPicker; window.filterCharacterPicker=filterCharacterPicker; window.selectCharacterFromPicker=selectCharacterFromPicker;

function subscribeBattleRealtime(){
  if (battleRealtimeChannel) supabaseClient.removeChannel(battleRealtimeChannel);
  battleRealtimeChannel = supabaseClient.channel('battle-live')
    .on('postgres_changes',{event:'*',schema:'public',table:'battles'},()=>{ if(currentTab==='combate') scheduleCombatSync(); })
    .on('postgres_changes',{event:'*',schema:'public',table:'battle_enemies'},()=>{ if(currentTab==='combate') scheduleCombatSync(); })
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'characters'},()=>{ if(currentTab==='combate') scheduleCombatSync(); })
    .subscribe();
}

function scheduleCombatSync(delay=120){
  if (battleRefreshTimer) clearTimeout(battleRefreshTimer);
  battleRefreshTimer = setTimeout(() => {
    battleRefreshTimer = null;
    if (currentTab === 'combate') syncCombatIncrementally();
  }, delay);
}

async function fetchCombatState(){
  const {data:battles,error}=await supabaseClient.from('battles').select('*').eq('active',true).order('created_at',{ascending:false}).limit(1);
  if(error) return {error};
  const battle=battles?.[0]||null;
  let enemies=[];
  if(battle){
    const res=await supabaseClient.rpc('get_battle_enemies',{p_battle_id:battle.id});
    if(res.error) return {error:res.error};
    enemies=res.data||[];
  }
  let players=[];
  const shield=await supabaseClient.rpc('get_master_shield_data');
  if(!shield.error) players=shield.data||[];
  return {battle,enemies,players,error:null};
}

async function loadCombatView(){
  const main=document.getElementById('main-content');
  main.innerHTML='<p class="rules-empty">Carregando combate...</p>';
  const state=await fetchCombatState();
  if(state.error){ main.innerHTML=renderCombatSetupNotice(state.error); return; }
  activeBattle=state.battle;
  battleEnemies=state.enemies;
  combatPlayersCache=state.players;
  combatRenderedBattleId=activeBattle?.id||null;
  main.innerHTML=renderCombat(combatPlayersCache);
  if(window.lucide)lucide.createIcons();
  subscribeBattleRealtime();
}

function patchCombatHeader(){
  const shell=document.querySelector('.combat-shell');
  if(!shell || !activeBattle) return;
  const title=shell.querySelector('[data-combat-title]');
  const meta=shell.querySelector('[data-combat-meta]');
  if(title) title.textContent='⚔️ '+(activeBattle.name||'Combate');
  if(meta) meta.textContent=`Rodada ${activeBattle.round||1}${activeBattle.turn_label?' • Turno: '+activeBattle.turn_label:''}`;
}

function patchCardCollection(containerSelector, items, idKey, renderFn, attrName, emptyHtml=''){
  const container=document.querySelector(containerSelector);
  if(!container) return;
  const wanted=new Set(items.map(item=>String(item[idKey])));
  container.querySelectorAll(`[${attrName}]`).forEach(node=>{
    if(!wanted.has(String(node.getAttribute(attrName)))) node.remove();
  });
  items.forEach(item=>{
    const id=String(item[idKey]);
    const existing=container.querySelector(`[${attrName}="${CSS.escape(id)}"]`);
    const html=renderFn(item);
    if(existing){
      if(existing.outerHTML!==html) existing.outerHTML=html;
    }else{
      container.insertAdjacentHTML('beforeend',html);
    }
  });
  const placeholder=container.querySelector('.combat-placeholder');
  if(items.length && placeholder) placeholder.remove();
  if(!items.length && emptyHtml && !container.querySelector('.combat-placeholder')) container.innerHTML=emptyHtml;
}

function renderCombatInitiative(){
  const order=Array.isArray(activeBattle?.turn_order)?activeBattle.turn_order:[];
  const currentIndex=Math.max(0,Math.min(order.length-1,activeBattle?.turn_index||0));
  if(!order.length){
    return `<section class="combat-initiative" data-initiative-section><div class="combat-initiative-head"><div><span class="section-eyebrow">ORDEM DE TURNO</span><h3>Iniciativa</h3><p>Nenhuma iniciativa definida.</p></div>${currentRole==='admin'?`<button class="primary-action" onclick="openInitiativeEditor()">+ Definir iniciativa</button>`:''}</div>${currentRole!=='admin'?'<p class="combat-initiative-empty">Aguardando o mestre definir a ordem da batalha.</p>':''}</section>`;
  }
  return `<section class="combat-initiative" data-initiative-section>
    <div class="combat-initiative-head">
      <div><span class="section-eyebrow">ORDEM DE TURNO</span><h3>Iniciativa</h3><p>${order.length} participantes • Rodada ${activeBattle?.round||1}</p></div>
      ${currentRole==='admin'?`<div class="combat-initiative-actions"><button onclick="openInitiativeEditor()">Editar</button><button class="primary-action" onclick="advanceBattleTurn()">Próximo turno →</button></div>`:''}
    </div>
    <div class="combat-initiative-order">
      ${order.map((item,index)=>`<div class="initiative-order-item ${index===currentIndex?'current':''}" data-initiative-id="${escapeAttr(item.type+':'+item.id)}">
        <span class="initiative-position">${index+1}</span>
        <span class="initiative-entity-icon">${item.type==='player'?'👤':'👹'}</span>
        <div class="initiative-entity"><strong>${escapeHtml(item.label||'Participante')}</strong><small>${item.type==='player'?'Jogador':'Inimigo'}</small></div>
        <b class="initiative-value">${Number(item.initiative)||0}</b>
        ${index===currentIndex?'<span class="initiative-turn-badge">AGINDO</span>':''}
      </div>`).join('')}
    </div>
  </section>`;
}

function patchCombatInitiative(){
  const current=document.querySelector('[data-initiative-section]');
  if(!current)return;
  const holder=document.createElement('div');
  holder.innerHTML=renderCombatInitiative().trim();
  const next=holder.firstElementChild;
  if(next && current.outerHTML!==next.outerHTML) current.replaceWith(next);
}

async function syncCombatIncrementally(){
  const state=await fetchCombatState();
  if(state.error || currentTab!=='combate') return;
  const nextBattleId=state.battle?.id||null;
  if(nextBattleId!==combatRenderedBattleId){
    activeBattle=state.battle; battleEnemies=state.enemies; combatPlayersCache=state.players;
    combatRenderedBattleId=nextBattleId;
    const main=document.getElementById('main-content');
    main.innerHTML=renderCombat(combatPlayersCache).replace(' fade-in','');
    if(window.lucide)lucide.createIcons();
    return;
  }
  activeBattle=state.battle;
  battleEnemies=state.enemies;
  combatPlayersCache=state.players;
  if(!activeBattle) return;
  patchCombatHeader();
  patchCombatInitiative();
  const allyCount=document.querySelector('[data-ally-count]');
  if(allyCount) allyCount.textContent=`${combatPlayersCache.length} personagens`;
  patchCardCollection('.battle-allies', combatPlayersCache, 'user_id', renderBattlePlayerCard, 'data-player-id');
  patchCardCollection('.battle-enemies', battleEnemies, 'id', renderEnemyCard, 'data-enemy-id', '<p class="combat-placeholder">Nenhum inimigo adicionado.</p>');
}

function renderCombatSetupNotice(error){return `<section class="combat-shell"><div class="combat-empty"><span>⚔️</span><h2>Combate ainda não configurado</h2><p>${escapeHtml(error?.message||'Execute a migração SQL atualizada para ativar batalhas.')}</p><small>O restante do site continua funcionando normalmente.</small></div></section>`}
function renderCombat(players){
 if(!activeBattle) return `<section class="combat-shell fade-in"><header class="combat-header"><div><span class="section-eyebrow">SESSÃO</span><h2>⚔️ Combate</h2><p>Nenhum combate ativo.</p></div>${currentRole==='admin'?`<button class="primary-action" onclick="startBattle()">+ Iniciar combate</button>`:''}</header><div class="combat-empty"><span>⚔️</span><h3>A mesa está fora de combate</h3><p>Quando o mestre iniciar uma batalha, aliados e inimigos aparecerão aqui em tempo real.</p></div></section>`;
 const allies=players.map(renderBattlePlayerCard).join(''); const enemies=battleEnemies.map(renderEnemyCard).join('')||'<p class="combat-placeholder">Nenhum inimigo adicionado.</p>';
 return `<section class="combat-shell fade-in"><header class="combat-header"><div><span class="section-eyebrow">BATALHA ATIVA</span><h2 data-combat-title>⚔️ ${escapeHtml(activeBattle.name||'Combate')}</h2><p data-combat-meta>Rodada ${activeBattle.round||1}${activeBattle.turn_label?' • Turno: '+escapeHtml(activeBattle.turn_label):''}</p></div>${currentRole==='admin'?`<div class="combat-admin-actions"><button onclick="advanceRound()">+ Rodada</button><button class="danger-action" onclick="endBattle()">Encerrar</button></div>`:''}</header>${renderCombatInitiative()}<div class="combat-section-head"><h3>Aliados</h3><span data-ally-count>${players.length} personagens</span></div><div class="battle-allies">${allies}</div><div class="combat-section-head"><h3>Inimigos</h3>${currentRole==='admin'?`<div class="combat-enemy-actions"><button onclick="openBattleBestiaryPicker()">📚 Do bestiário</button><button onclick="openEnemyEditor()">+ Criar manualmente</button></div>`:''}</div><div class="battle-enemies">${enemies}</div></section>`;
}
function renderBattlePlayerCard(pl){const hpMax=pl.hp_max||1,hp=Math.max(0,Math.min(100,Math.round((pl.hp_current||0)/hpMax*100))),pdMax=pl.energy_max||1,pd=Math.max(0,Math.min(100,Math.round((pl.energy_current||0)/pdMax*100))),conds=Array.isArray(pl.conditions)?pl.conditions:[];return `<article class="battle-card ally-card" data-player-id="${escapeHtml(pl.user_id||'')}"><div class="battle-card-head"><div class="battle-avatar">${pl.avatar_url?`<img src="${pl.avatar_url}">`:escapeHtml((pl.name||'?')[0])}</div><div><strong>${escapeHtml(pl.name||'Sem nome')}</strong><small>${escapeHtml([pl.class_name,pl.archetype].filter(Boolean).join(' • '))}</small></div><b>NV ${pl.level||1}</b></div><div class="battle-resource"><span>PV</span><div><i style="width:${hp}%"></i></div><b>${pl.hp_current||0}/${pl.hp_max||0}</b></div><div class="battle-resource pd"><span>PD</span><div><i style="width:${pd}%"></i></div><b>${pl.energy_current||0}/${pl.energy_max||0}</b></div><div class="battle-stats"><span>DEF <b>${pl.defense??10}</b></span><span>ESQ <b>${pl.dodge??0}</b></span><span>BLOQ <b>${pl.block??0}</b></span><span>DESL <b>${pl.movement_speed??9}m</b></span></div>${conds.length?`<div class="condition-chips">${conds.map(c=>`<button onclick="searchRulesFromContext('${escapeAttr(c)}')">${escapeHtml(c)}</button>`).join('')}</div>`:''}${currentRole==='admin'?`<button class="card-link" onclick="selectCharacterFromPicker('${pl.user_id}');setTimeout(()=>switchTab('personagem'),100)">Abrir ficha →</button>`:''}</article>`}
function enemyVisible(e,key){return currentRole==='admin'||(e.visibility||{})[key]!==false}
function renderEnemyCard(e){const max=e.hp_max||1,pct=Math.max(0,Math.min(100,Math.round((e.hp_current||0)/max*100))),v=e.visibility||{},attacks=Array.isArray(e.attacks)?e.attacks:[],abilities=Array.isArray(e.abilities)?e.abilities:[];return `<article class="battle-card enemy-card" data-enemy-id="${escapeHtml(e.id||'')}"><div class="battle-card-head"><div class="battle-avatar enemy">${e.image_url?`<img src="${e.image_url}">`:'👹'}</div><div><strong>${enemyVisible(e,'name')?escapeHtml(e.name||'Inimigo'):'Inimigo desconhecido'}</strong><small>${escapeHtml(e.subtitle||'')}</small></div>${currentRole==='admin'?`<button class="icon-action" onclick="openEnemyEditor('${e.id}')">✎</button>`:''}</div>${enemyVisible(e,'hp')?`<div class="battle-resource enemy-hp"><span>PV</span><div><i style="width:${pct}%"></i></div><b>${enemyVisible(e,'hp_numbers')?`${e.hp_current||0}/${e.hp_max||0}`:'?'}</b></div>`:''}<div class="battle-stats">${enemyVisible(e,'defense')?`<span>DEF <b>${e.defense??10}</b></span>`:''}${enemyVisible(e,'dodge')?`<span>ESQ <b>${e.dodge??0}</b></span>`:''}${enemyVisible(e,'block')?`<span>BLOQ <b>${e.block??0}</b></span>`:''}${enemyVisible(e,'movement')?`<span>DESL <b>${e.movement_speed??9}m</b></span>`:''}</div>${enemyVisible(e,'conditions')&&e.conditions?.length?`<div class="condition-chips">${e.conditions.map(c=>`<button onclick="searchRulesFromContext('${escapeAttr(c)}')">${escapeHtml(c)}</button>`).join('')}</div>`:''}${enemyVisible(e,'attacks')&&attacks.length?`<div class="enemy-public-info"><strong>Ataques</strong>${attacks.map(a=>`<span>${escapeHtml(a)}</span>`).join('')}</div>`:''}${enemyVisible(e,'abilities')&&abilities.length?`<div class="enemy-public-info"><strong>Habilidades</strong>${abilities.map(a=>`<span>${escapeHtml(a)}</span>`).join('')}</div>`:''}${currentRole==='admin'?`<div class="enemy-quick"><button onclick="changeEnemyHp('${e.id}',-1)">−1 PV</button><button onclick="changeEnemyHp('${e.id}',1)">+1 PV</button></div>`:''}</article>`}
async function startBattle(){if(currentRole!=='admin')return;const name=prompt('Nome do combate:','Batalha');if(name===null)return;await supabaseClient.from('battles').update({active:false}).eq('active',true);const {error}=await supabaseClient.from('battles').insert({name:name||'Batalha',active:true,round:1,created_by:currentUser.id});if(error)alert(error.message);else scheduleCombatSync(50)}
async function endBattle(){if(!confirm('Encerrar o combate atual?'))return;await supabaseClient.from('battles').update({active:false}).eq('id',activeBattle.id);scheduleCombatSync(50)}
async function advanceRound(){await supabaseClient.from('battles').update({round:(activeBattle.round||1)+1}).eq('id',activeBattle.id);}
function openEnemyEditor(id){const e=battleEnemies.find(x=>x.id===id)||{visibility:{name:true,hp:true,hp_numbers:false,conditions:true,defense:false,dodge:false,block:false,movement:true,attacks:false,abilities:false},conditions:[],attacks:[],abilities:[]};document.body.insertAdjacentHTML('beforeend',`<div id="enemy-editor" class="picker-modal"><button class="picker-backdrop" onclick="document.getElementById('enemy-editor').remove()"></button><form class="picker-panel enemy-editor" onsubmit="saveEnemy(event,'${id||''}')"><div class="picker-head"><div><span class="section-eyebrow">INIMIGO</span><h3>${id?'Editar':'Adicionar'} inimigo</h3></div><button type="button" onclick="document.getElementById('enemy-editor').remove()">✕</button></div><label>Nome<input name="name" value="${escapeAttr(e.name||'')}"></label><label>Subtítulo<input name="subtitle" value="${escapeAttr(e.subtitle||'')}"></label><label>URL da imagem<input name="image_url" value="${escapeAttr(e.image_url||'')}"></label><div class="enemy-form-grid"><label>PV atual<input name="hp_current" type="number" value="${e.hp_current??10}"></label><label>PV máximo<input name="hp_max" type="number" value="${e.hp_max??10}"></label><label>Defesa<input name="defense" type="number" value="${e.defense??10}"></label><label>Esquiva<input name="dodge" type="number" value="${e.dodge??0}"></label><label>Bloqueio<input name="block" type="number" value="${e.block??0}"></label><label>Deslocamento<input name="movement_speed" type="number" value="${e.movement_speed??9}"></label></div><label>Condições (separadas por vírgula)<input name="conditions" value="${escapeAttr((e.conditions||[]).join(', '))}"></label><label>Ataques (um por linha)<textarea name="attacks">${escapeHtml((e.attacks||[]).join('\n'))}</textarea></label><label>Habilidades (uma por linha)<textarea name="abilities">${escapeHtml((e.abilities||[]).join('\n'))}</textarea></label><label>Notas privadas<textarea name="notes">${escapeHtml(e.notes||'')}</textarea></label><fieldset><legend>Visível para jogadores</legend>${[['name','Nome'],['hp','Barra de PV'],['hp_numbers','PV numérico'],['conditions','Condições'],['defense','Defesa'],['dodge','Esquiva'],['block','Bloqueio'],['movement','Deslocamento'],['attacks','Ataques'],['abilities','Habilidades']].map(([k,l])=>`<label class="check-row"><input type="checkbox" name="vis_${k}" ${e.visibility?.[k]!==false?'checked':''}> ${l}</label>`).join('')}</fieldset><button class="primary-action" type="submit">Salvar inimigo</button>${id?`<button class="danger-action" type="button" onclick="deleteEnemy('${id}')">Remover inimigo</button>`:''}</form></div>`)}
async function saveEnemy(ev,id){ev.preventDefault();const f=new FormData(ev.target),visibility={};['name','hp','hp_numbers','conditions','defense','dodge','block','movement','attacks','abilities'].forEach(k=>visibility[k]=f.get('vis_'+k)==='on');const lines=name=>String(f.get(name)||'').split('\n').map(x=>x.trim()).filter(Boolean);const payload={battle_id:activeBattle.id,name:f.get('name')||'Inimigo',subtitle:f.get('subtitle')||'',image_url:f.get('image_url')||'',hp_current:+f.get('hp_current')||0,hp_max:+f.get('hp_max')||0,defense:+f.get('defense')||0,dodge:+f.get('dodge')||0,block:+f.get('block')||0,movement_speed:+f.get('movement_speed')||0,conditions:String(f.get('conditions')||'').split(',').map(x=>x.trim()).filter(Boolean),attacks:lines('attacks'),abilities:lines('abilities'),notes:f.get('notes')||'',visibility};const q=id?supabaseClient.from('battle_enemies').update(payload).eq('id',id):supabaseClient.from('battle_enemies').insert(payload);const {error}=await q;if(error)alert(error.message);else{document.getElementById('enemy-editor')?.remove();await logBattle(`${payload.name} ${id?'foi atualizado':'entrou no combate'}`,'enemy');scheduleCombatSync(50)}}
async function deleteEnemy(id){if(!confirm('Remover este inimigo?'))return;await supabaseClient.from('battle_enemies').delete().eq('id',id);document.getElementById('enemy-editor')?.remove();scheduleCombatSync(50)}
async function changeEnemyHp(id,d){const e=battleEnemies.find(x=>x.id===id);if(!e)return;await supabaseClient.from('battle_enemies').update({hp_current:Math.max(0,(e.hp_current||0)+d)}).eq('id',id)}
window.startBattle=startBattle;window.endBattle=endBattle;window.advanceRound=advanceRound;window.openEnemyEditor=openEnemyEditor;window.saveEnemy=saveEnemy;window.deleteEnemy=deleteEnemy;window.changeEnemyHp=changeEnemyHp;

async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.textContent = '';

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    errorEl.textContent = error.message;
    return;
  }

  currentUser = data.user;
  await initUser();
}

async function logout() {
  await supabaseClient.auth.signOut();
  location.reload();
}

async function initUser() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (error || !profile) {
    alert('Perfil não encontrado na tabela profiles.');
    return;
  }

  currentRole = profile.role;
  currentProfile = profile;
  subscribeSessionPresence(profile);

  document.getElementById('user-label').textContent =
    currentRole === 'admin'
      ? `Logado como ${profile.username} (admin)`
      : `Logado como ${profile.username}`;

  renderTabs();
  dataReady = false;
  setSaveStatus('loading');

  if (currentRole === 'admin') {
    document.getElementById('admin-panel').classList.remove('hidden');
    await loadPlayers();
  } else {
    selectedUserId = currentUser.id;
    await loadSkills();
    await loadCharacterData();
  }
}

async function loadPlayers() {
  const { data, error } = await supabaseClient.rpc('get_players_for_admin');

  if (error || !data) {
    console.error('Erro ao carregar jogadores:', error);
    alert('Erro ao carregar jogadores.');
    return;
  }

  profilesCache = data;

  const select = document.getElementById('player-select');
  select.innerHTML = data.map(player =>
    `<option value="${player.id}">${player.username}</option>`
  ).join('');

  const firstNonAdmin = data.find(p => p.role !== 'admin');
  selectedUserId = firstNonAdmin?.id || data[0]?.id || null;

    if (selectedUserId) {
    select.value = selectedUserId;
    await loadSkills();
    await loadCharacterData();
  }
}

async function loadSelectedPlayer() {
  dataReady = false;
  setSaveStatus('loading');
  selectedUserId = document.getElementById('player-select').value;
  await loadSkills();
  await loadCharacterData();
}

async function loadSkills() {
  unlocked = {};

  const { data, error } = await supabaseClient
    .from('skill_trees')
    .select('*')
    .eq('user_id', selectedUserId)
    .maybeSingle();

  if (error) {
    console.error('Erro ao carregar skill tree:', error);
  }

  if (data?.unlocked_skills) {
    unlocked = data.unlocked_skills;
  } else {
    unlocked = {};
  }

  switchTab(currentTab);
}

async function toggleSkill(key, checkbox) {
  if (checkbox.checked) {
    unlocked[key] = true;
  } else {
    delete unlocked[key];
  }

  await saveSkills();
  if(currentTab==='habilidades') document.getElementById('main-content').innerHTML = renderAbilitiesHub();
}

async function saveSkills() {
  const cleanedUnlocked = Object.fromEntries(
    Object.entries(unlocked).filter(([_, value]) => value === true)
  );

  unlocked = cleanedUnlocked;

  const { error } = await supabaseClient
    .from('skill_trees')
    .upsert({
      user_id: selectedUserId,
      unlocked_skills: cleanedUnlocked
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('Erro ao salvar skills:', error);
    alert('Erro ao salvar skills: ' + error.message);
  }
}

async function checkSession() {
  const { data } = await supabaseClient.auth.getUser();
  if (data.user) {
    currentUser = data.user;
    await initUser();
  } else {
    renderTabs();
  }
}

async function uploadCharacterAvatar(userId) {
    const input = document.getElementById('char-avatar');
    const file = input?.files?.[0];

    if (!file) {
        return characterData.avatar_url || '';
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';

    // 👇 AQUI está a mudança importante
    const filePath = `${userId}/perfil-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabaseClient.storage
        .from('avatars')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
        });

    if (uploadError) {
        throw uploadError;
    }

    const { data } = supabaseClient.storage
        .from('avatars')
        .getPublicUrl(filePath);

    return data.publicUrl;
}

function renderCharacterSheet() {
  const skillsList = [
    ["Acrobacia","AGI"],["Adestramento","PRE"],["Artes","INT"],["Atletismo","FOR"],
    ["Atualidades","INT"],["Ciências","INT"],["Diplomacia","PRE"],["Enganação","PRE"],
    ["Estratégia","INT"],["Fortitude","VIG"],["Furtividade","AGI"],["Iniciativa","AGI"],
    ["Intimidação","PRE"],["Intuição","PRE"],["Investigação","INT"],["Luta","FOR"],
    ["Medicina","INT"],["Percepção","PRE"],["Pilotagem","AGI"],["Pontaria","AGI"],
    ["Profissão","INT"],["Reflexos","AGI"],["Religião","PRE"],["Ressonância","INT"],
    ["Sobrevivência","INT"],["Tática","INT"],["Tecnologia","INT"],["Vontade","PRE"]
  ].sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));

  window.toggleSkillTraining = function(skillName) {
    const checkbox = document.getElementById(`skill-trained-${skillName}`);
    const bonusInput = document.getElementById(`skill-bonus-${skillName}`);
    if (!checkbox || !bonusInput) return;
    const current = parseInt(bonusInput.value) || 0;
    const wasTrained = bonusInput.dataset.trained === 'true';
    const base = wasTrained ? current - 5 : current;
    bonusInput.value = checkbox.checked ? base + 5 : base;
    bonusInput.dataset.trained = checkbox.checked ? 'true' : 'false';
    markDirtyAndScheduleAutosave('skills');
  };

  const skillsHtml = skillsList.map(([name, attr]) => {
    const savedSkill = characterData.skills?.[name];

    const bonus =
      typeof savedSkill === 'object' && savedSkill !== null
        ? (savedSkill.bonus ?? 0)
        : (savedSkill ?? 0);

    const trained =
      typeof savedSkill === 'object' && savedSkill !== null
        ? !!savedSkill.trained
        : false;

    const others =
      typeof savedSkill === 'object' && savedSkill !== null
        ? (savedSkill.others ?? 0)
        : 0;

    return `
      <div class="skill-row">
        <span class="skill-name">${name}</span>
        <span class="skill-attr">${attr}</span>

        <input
          id="skill-bonus-${name}"
          class="skill-cell skill-bonus"
          type="text"
          data-skill="${name}"
          data-trained="${trained ? 'true' : 'false'}"
          value="${bonus}"
        >

        <input
          id="skill-trained-${name}"
          class="skill-check skill-trained"
          type="checkbox"
          data-skill="${name}"
          onchange="toggleSkillTraining('${name}')"
          ${trained ? 'checked' : ''}
        >

        <input
          class="skill-cell skill-others"
          type="text"
          data-skill="${name}"
          value="${others}"
        >
      </div>
    `;
  }).join('');

  const unlockedSkillsDetailed = [];

  for (const key in unlocked) {
    if (unlocked[key]) {
      const [element, skillName] = key.split('__');

      if (SKILLS[element]) {
        SKILLS[element].paths.forEach(path => {
          const found = path.skills.find(s => s.name === skillName);
          if (found) {
            unlockedSkillsDetailed.push({ ...found, element });
          }
        });
      }
    }
  }

  const skillsListHtml = unlockedSkillsDetailed.length > 0
    ? unlockedSkillsDetailed.map(s => `
        <div class="attack-card-mini border-l-2 border-l-purple-500">
          <div class="flex justify-between items-start mb-1">
            <span class="attack-input-name" style="border:none; color:#a5b4fc;">${s.name}</span>
            <span class="text-[9px] bg-purple-900/50 px-1 rounded text-purple-200">RES ${s.res}</span>
          </div>

          <div class="space-y-1">
            <div class="flex gap-1 text-[10px]">
              <span class="text-purple-400/70 uppercase font-bold">${s.type}</span>
              <span class="text-white/30">|</span>
              <span class="text-gray-400">${s.range}</span>
            </div>

            <p class="text-[14px] text-gray-300 leading-tight italic line-clamp-2" title="${s.desc}">
              ${s.desc}
            </p>

            <div class="bg-black/30 p-1 rounded border border-white/5">
              <p class="text-[14px] text-purple-200 leading-tight">
                <strong>EF:</strong> ${s.effect}
              </p>
            </div>
          </div>
        </div>
      `).join('')
    : '<p class="text-[10px] text-gray-500 italic p-4 text-center w-full">Nenhuma habilidade desbloqueada.</p>';

  return `
    <div class="sheet-wrapper fade-in p-4">
      <div class="glow-box character-summary p-3 mb-3">
        <div class="character-fields-grid grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div class="col-span-2 lg:col-span-1">
            <label class="sheet-info-label">Personagem</label>
            <input id="char-name" class="field-input" type="text" value="${characterData.name || ''}">
          </div>
          <div><label class="sheet-info-label">Origem</label><input id="char-origin" class="field-input" type="text" value="${characterData.origin || ''}"></div>
          <div><label class="sheet-info-label">Classe</label><input id="char-class" class="field-input" type="text" value="${characterData.class_name || ''}"></div>
          <div><label class="sheet-info-label">Trilha</label><input id="char-archetype" class="field-input" type="text" value="${characterData.archetype || ''}"></div>
          <div><label class="sheet-info-label">Jogador</label><input id="char-player" class="field-input" type="text" value="${characterData.player_name || ''}"></div>
        </div>
        <div class="character-avatar-control mt-2">
          <label for="char-avatar" class="avatar-change-label">Alterar foto</label>
          <input id="char-avatar" type="file" accept="image/*" class="avatar-file-input">
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-[200px_0.3fr_1.3fr] gap-4 items-start">

        <div class="flex flex-col gap-4">
          <div class="glow-box p-4">
            <div class="section-title"><i data-lucide="zap" class="w-3 h-3 inline"></i> ATRIBUTOS</div>
            <div class="flex flex-col gap-3">
              ${[
                { sigla: 'FOR', id: 'stat-strength', value: characterData.strength ?? 0 },
                { sigla: 'AGI', id: 'stat-dexterity', value: characterData.dexterity ?? 0 },
                { sigla: 'INT', id: 'stat-intelligence', value: characterData.intelligence ?? 0 },
                { sigla: 'PRE', id: 'stat-presence', value: characterData.presence ?? 0 },
                { sigla: 'VIG', id: 'stat-constitution', value: characterData.constitution ?? 0 }
              ].map(a => `
                <div class="attr-box w-full">
                  <div class="attr-label">${a.sigla}</div>
                  <input id="${a.id}" class="attr-input" type="text" value="${a.value}">
                </div>
              `).join('')}
            </div>
          </div>

          <div class="glow-box p-4">
            <div class="section-title"><i data-lucide="shield" class="w-3 h-3 inline"></i> STATUS</div>
            <div class="space-y-4">
              <div class="status-card-pv">
                <button onclick="updateStat('hp-curr', -1)" class="status-btn">−</button>
                <div class="flex-1 text-center">
                  <div class="status-label-pv mb-1">PV</div>
                  <div class="flex items-center justify-center gap-1">
                    <input class="stat-main-input" id="hp-curr" type="text" value="${characterData.hp_current ?? 0}">
                    <span class="stat-divider">/</span>
                    <input class="stat-max-input" id="hp-max" type="text" value="${characterData.hp_max ?? 0}">
                  </div>
                </div>
                <button onclick="updateStat('hp-curr', 1)" class="status-btn">+</button>
              </div>

              <div class="status-card-pd">
                <button onclick="updateStat('en-curr', -1)" class="status-btn">−</button>
                <div class="flex-1 text-center">
                  <div class="status-label-pd mb-1">PD</div>
                  <div class="flex items-center justify-center gap-1">
                    <input class="stat-main-input" id="en-curr" type="text" value="${characterData.energy_current ?? 0}">
                    <span class="stat-divider">/</span>
                    <input class="stat-max-input" id="en-max" type="text" value="${characterData.energy_max ?? 0}">
                  </div>
                </div>
                <button onclick="updateStat('en-curr', 1)" class="status-btn">+</button>
              </div>

              <div class="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                <div class="text-center">
                  <div class="mini-label">NÍVEL</div>
                  <input id="char-level" class="mini-input" type="text" value="${characterData.level ?? 1}">
                </div>
                <div class="text-center">
                  <div class="mini-label">PR</div>
                  <input id="stat-rd" class="mini-input" type="text" value="${characterData.damage_reduction ?? 0}">
                </div>
                <div class="text-center">
                  <div class="mini-label">DEFESA</div>
                  <input id="stat-def" class="mini-input" type="text" value="${characterData.defense ?? 10}">
                </div>
                <div class="text-center">
                  <div class="mini-label">ESQUIVA</div>
                  <input id="stat-dodge" class="mini-input" type="text" value="${characterData.dodge ?? 10}">
                </div>
                <div class="text-center">
                  <div class="mini-label">BLOQUEIO</div>
                  <input id="stat-block" class="mini-input" type="text" value="${characterData.block ?? 0}">
                </div>
                <div class="text-center">
                  <div class="mini-label">DESLOCAMENTO</div>
                  <input id="stat-mov" class="mini-input" type="text" value="${characterData.movement_speed ?? 9}">
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="glow-box p-4 h-full">
          <div class="section-title"><i data-lucide="book-open" class="w-3 h-3 inline"></i> PERÍCIAS</div>
          <div class="skill-header mb-2 text-[10px]">
            <span>NOME</span><span class="text-center">ATRIBUTO</span>
            <span>BONUS</span><span>TREINO</span><span>OUTROS</span>
          </div>
          <div class="space-y-0">
            ${skillsHtml}
          </div>
        </div>

        <div class="glow-box p-4 h-full overflow-y-auto scroll-container">
          <div class="section-title flex justify-between items-center mb-6">
            <div class="flex items-center gap-2">
              <i data-lucide="swords" class="w-4 h-4 text-purple-400"></i>
              <span class="uppercase tracking-widest">Ataques</span>
            </div>
            <button onclick="window.addAttack()" class="text-[9px] bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 px-3 py-1 rounded border border-purple-500/30 transition-all font-bold">
              + ADICIONAR
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            ${characterAttacks.map((ataque, index) => `
              <div class="attack-card-mini attack-editor-card relative group">
                <button onclick="window.removeAttack(${index})" class="absolute -top-1 -right-1 bg-red-600/80 hover:bg-red-600 text-white text-[8px] w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center">✕</button>

                <input class="attack-input-name" type="text" placeholder="Nome da Arma" value="${ataque.nome || ''}">

                <div class="space-y-1 mt-2">
                  <div class="flex items-center gap-1">
                    <span class="attack-mini-label">TESTE</span>
                    <input class="attack-input-field" type="text" placeholder="3d20+5" value="${ataque.teste || ''}">
                  </div>
                  <div class="grid grid-cols-2 gap-1">
                    <div class="flex items-center gap-1">
                      <span class="attack-mini-label">DANO</span>
                      <input class="attack-input-field" type="text" placeholder="2d6" value="${ataque.dano || ''}">
                    </div>
                    <div class="flex items-center gap-1">
                      <span class="attack-mini-label text-[7px]">CRIT</span>
                      <input class="attack-input-field" type="text" placeholder="x2" value="${ataque.crit || ''}">
                    </div>
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="attack-mini-label">ALCANCE</span>
                    <input class="attack-input-field" type="text" placeholder="Curto" value="${ataque.alcance || ''}">
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="pt-6 border-t border-purple-500/30">
            <div class="flex items-center gap-3 mb-5">
              <i data-lucide="sparkles" class="w-5 h-5 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"></i>
              <span class="text-[16px] font-bold text-purple-400 uppercase tracking-[0.2em] font-['Orbitron']">
                Habilidades Desbloqueadas
              </span>
              <button type="button" onclick="switchTab('habilidades')" class="view-tree-btn">Ver árvore →</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${skillsListHtml}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
// Função global para os botões de + e -
window.updateStat = function(id, delta) {
  const el = document.getElementById(id);
  if (el) {
    let currentVal = parseInt(el.value) || 0;
    el.value = Math.max(0, currentVal + delta);
    markDirtyAndScheduleAutosave(getDirtyFieldFromElement(el));
  }
};

window.saveCharacterData = async function(options = {}) {
  const silent = options.silent === true;
  const id = selectedUserId || currentUser?.id;
  if (!id || !dataReady) return;
  if (isSaving) { if (dirtyFields.size) markDirtyAndScheduleAutosave(); return; }
  if (!dirtyFields.size && !document.getElementById('char-avatar')?.files?.[0]) { setSaveStatus('saved'); return; }

  isSaving = true;
  if (autosaveTimer) clearTimeout(autosaveTimer);
  setSaveStatus('saving');
  try {
    const patch = {};
    const has = (key) => dirtyFields.has(key) || dirtyFields.has('*');
    const text = (id, fallback='') => document.getElementById(id)?.value ?? fallback;
    const int = (id, fallback=0) => parseInt(text(id, fallback)) || 0;
    const num = (id, fallback=0) => parseFloat(String(text(id, fallback)).replace(',', '.').replace('m','')) || 0;
    const fields = {
      name: () => text('char-name','Novo Personagem'), origin: () => text('char-origin'), class_name: () => text('char-class'), archetype: () => text('char-archetype'), player_name: () => text('char-player'), level: () => int('char-level',1),
      strength: () => int('stat-strength'), dexterity: () => int('stat-dexterity'), constitution: () => int('stat-constitution'), intelligence: () => int('stat-intelligence'), presence: () => int('stat-presence'),
      hp_current: () => int('hp-curr'), hp_max: () => int('hp-max'), energy_current: () => int('en-curr'), energy_max: () => int('en-max'), defense: () => int('stat-def',10), damage_reduction: () => int('stat-rd'), dodge: () => int('stat-dodge',10), block: () => int('stat-block'), movement_speed: () => num('stat-mov',9)
    };
    Object.entries(fields).forEach(([key, getter]) => { if (has(key)) patch[key] = getter(); });
    if (has('skills')) {
      const skills = {};
      document.querySelectorAll('.skill-row').forEach(row => {
        const bonus = row.querySelector('.skill-bonus'); const trained = row.querySelector('.skill-trained'); const others = row.querySelector('.skill-others'); const attr = row.querySelector('.skill-attr');
        if (bonus?.dataset.skill) skills[bonus.dataset.skill] = { bonus: parseInt(bonus.value)||0, trained: !!trained?.checked, others: parseInt(others?.value)||0, attr: attr?.textContent||'' };
      });
      patch.skills = skills;
    }
    if (has('attacks')) { window.saveCurrentAttacks(); patch.attacks = characterAttacks; }
    if (document.getElementById('char-avatar')?.files?.[0]) patch.avatar_url = await uploadCharacterAvatar(id);
    if (!Object.keys(patch).length) { isSaving=false; return; }

    const { data, error } = await supabaseClient.rpc('save_character_patch', { p_user_id: id, p_expected_updated_at: loadedUpdatedAt, p_patch: patch });
    if (error) throw error;
    if (!data?.ok) {
      backupCharacterLocally(id, { conflict: true, patch, server_updated_at: data?.updated_at });
      dirtyFields.clear(); isDirty = false;
      await loadCharacterData();
      setSaveStatus('error');
      if (!silent) alert('A ficha foi alterada em outro lugar. A versão mais recente foi carregada e sua alteração local ficou no backup.');
      return;
    }
    characterData = { ...characterData, ...patch, updated_at: data.updated_at };
    loadedUpdatedAt = data.updated_at;
    dirtyFields.clear(); isDirty = false;
    backupCharacterLocally(id, patch);
    updateHeaderIdentity(); setSaveStatus('saved');
    if (!silent) alert('Ficha salva com sucesso!');
  } catch (err) {
    console.error('Erro ao salvar ficha:', err); setSaveStatus('error');
    if (!silent) alert('Erro ao salvar ficha: ' + err.message);
  } finally { isSaving = false; }
};

async function loadCharacterData() {
    if (!selectedUserId) return;

    const { data, error } = await supabaseClient
        .from('characters')
        .select('*')
        .eq('user_id', selectedUserId)
        .maybeSingle();

    if (error) {
        console.error('Erro ao carregar ficha:', error);
        return;
    }

    if (data) {
        characterData = {
            ...characterData,
            ...data,
            skills: data.skills || {},
            attacks: Array.isArray(data.attacks) && data.attacks.length > 0
                ? data.attacks
                : [{ nome: "", teste: "3d20+5", dano: "2d6", crit: "x2", alcance: "Curto" }]
        };

        characterAttacks = [...characterData.attacks];
        loadedUpdatedAt = data.updated_at || null;
        updateHeaderIdentity();
    } else {
        characterData = {
            name: 'Novo Personagem',
            origin: '',
            class_name: '',
            archetype: '',
            player_name: '',
            level: 1,

            strength: 0,
            dexterity: 0,
            constitution: 0,
            intelligence: 0,
            presence: 0,

            hp_current: 0,
            hp_max: 0,
            energy_current: 0,
            energy_max: 0,

            defense: 10,
            damage_reduction: 0,
            dodge: 10,
            block: 0,
            movement_speed: 9,

            skills: {},
            attacks: [
                { nome: "", teste: "3d20+5", dano: "2d6", crit: "x2", alcance: "Curto" }
            ]
        };

        characterAttacks = [...characterData.attacks];
    }

    switchTab(currentTab);

    // Só a partir daqui é seguro salvar: a ficha atual reflete o que está
    // no banco (ou é comprovadamente uma ficha nova).
    dataReady = true;
    isDirty = false;
    dirtyFields.clear();
    subscribeToCharacterRealtime(selectedUserId);
    setSaveStatus('saved');
}

// Autosave: qualquer edição na ficha de personagem (campos de texto,
// atributos, perícias, ataques) agenda um salvamento automático silencioso
// depois de alguns segundos sem digitar. O toggle de habilidades já salva
// na hora (toggleSkill/saveSkills), então não precisa passar por aqui.
document.addEventListener('input', (e) => {
  if (!e.target.closest('#main-content')) return;
  markDirtyAndScheduleAutosave(getDirtyFieldFromElement(e.target));
});
document.addEventListener('change', (e) => {
  if (!e.target.closest('#main-content')) return;
  markDirtyAndScheduleAutosave(getDirtyFieldFromElement(e.target));
});

checkSession();



/* RuleBook delegated term navigation */
document.addEventListener('click', (event) => {
  const button = event.target.closest && event.target.closest('[data-rule-id]');
  if (!button) return;
  event.preventDefault();
  const ruleId = button.dataset.ruleId;
  if (ruleId && typeof window.openRuleById === 'function') {
    window.openRuleById(ruleId);
  }
});

window.loadMasterHub = loadMasterHub;
