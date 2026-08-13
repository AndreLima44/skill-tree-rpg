const supabaseUrl = 'https://djtxrejpqunrqvgxobco.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdHhyZWpwcXVucnF2Z3hvYmNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MTQ4ODIsImV4cCI6MjA5MDQ5MDg4Mn0.bcYtB_NEpLw1cbU5SEecRtcFnlWzfuPD3iejXlKWJ2A';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// Estado Global
let currentMainTab = 'personagem';
let currentTab = 'personagem';
let unlocked = {};
let currentUser = null;
let currentRole = 'player';
let selectedUserId = null;
let profilesCache = [];

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

function subscribeToCharacterRealtime(userId) {
  if (realtimeChannel) supabaseClient.removeChannel(realtimeChannel);
  realtimeChannel = supabaseClient.channel(`character:${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'characters', filter: `user_id=eq.${userId}` }, async (payload) => {
      if (!payload.new) return;
      const remote = payload.new;
      if (loadedUpdatedAt && remote.updated_at && new Date(remote.updated_at) <= new Date(loadedUpdatedAt)) return;
      if (isDirty) {
        setSaveStatus('error');
        console.warn('Conflito: existe uma versão mais nova no servidor. O salvamento local foi bloqueado.');
        return;
      }
      isApplyingRemoteUpdate = true;
      characterData = { ...characterData, ...remote, skills: remote.skills || {}, attacks: remote.attacks || characterAttacks };
      characterAttacks = [...characterData.attacks];
      loadedUpdatedAt = remote.updated_at || loadedUpdatedAt;
      updateHeaderIdentity();
      if (currentTab === 'personagem') switchTab('personagem');
      if (currentTab === 'escudo' && currentRole === 'admin') loadMasterShieldData();
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
personagem: '👤 Ficha de Personagem', // Nova aba
  terra: '🌍 Terra',
  energia: '⚡ Energia',
  frio: '❄️ Frio',
  vento: '💨 Vento',
  agua: '💧 Água',
  fogo: '🔥 Fogo',
  universais: '✨ Universais',
  forca: '💪 Força Inata',
  regras: '📖 Regras & Combos'
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
    return `<button class="tab-btn ${key === currentTab ? 'active' : ''}" data-tab="${key}" onclick="switchTab('${key}')">${label}</button>`;
  }).join('');

  // Aba extra, visível só para o mestre (admin): resumo de todos os jogadores.
  if (currentRole === 'admin') {
    tabsHtml += `<button class="tab-btn ${currentTab === 'escudo' ? 'active' : ''}" data-tab="escudo" onclick="switchTab('escudo')">🛡️ Escudo do Mestre</button>`;
  }

  container.innerHTML = tabsHtml;
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });

  const mainContent = document.getElementById('main-content');
  
  if (tab === 'regras') {
    mainContent.innerHTML = renderRulesPage();
    renderRulesContext();
    searchRules('');
  } else if (tab === 'personagem') {
    mainContent.innerHTML = renderCharacterSheet();
    // Reinicializa os ícones da Lucide se você estiver usando na ficha
    if (window.lucide) window.lucide.createIcons();
  } else if (tab === 'escudo') {
    loadMasterShieldData();
  } else {
    mainContent.innerHTML = renderTab(tab);
  }
}

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
  document.getElementById('main-content').innerHTML = renderTab(currentTab);
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
              <span class="uppercase tracking-widest">Combate</span>
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
