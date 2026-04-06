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

// Lista de Ataques (Inicia com um vazio)
let characterAttacks = [
  { nome: "", teste: "3d20+5", dano: "2d6", crit: "x2", alcance: "Curto" }
];

// --- FUNÇÕES DE ATAQUE ---
window.saveCurrentAttacks = async function() {
    const id = selectedUserId || (currentUser ? currentUser.id : null);
    if (!id) return;

    const cards = document.querySelectorAll('.attack-card-mini');
    const updated = [];
    
    cards.forEach(card => {
        const inputs = card.querySelectorAll('input');
        if (inputs.length >= 4) {
            updated.push({
                nome: inputs[0].value,
                teste: inputs[1].value,
                dano: inputs[2].value,
                crit: inputs[3].value,
                alcance: inputs[4]?.value || ""
            });
        }
    });

    // Atualiza o cache local
    attacksCache[id] = updated;

    // ENVIA PARA O SUPABASE (Opcional: você pode ter um botão "Salvar" geral)
  
    await supabaseClient
        .from('profiles')
        .update({ attacks: updated })
        .eq('id', id);

};

window.addAttack = function() {
    window.saveCurrentAttacks();
    characterAttacks.push({ nome: "", teste: "", dano: "", crit: "", alcance: "" });
    
    // Força a atualização da interface
    if (typeof showTab === 'function') {
        showTab('personagem');
    }
};

window.removeAttack = function(index) {
    window.saveCurrentAttacks();
    if (characterAttacks.length > 1) {
        characterAttacks.splice(index, 1);
    } else {
        characterAttacks = [{ nome: "", teste: "", dano: "", crit: "", alcance: "" }];
    }
    
    if (typeof showTab === 'function') {
        showTab('personagem');
    }
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
  forca: '💪 Força Inata'
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

      <p class="text-xs opacity-70 mb-3 leading-relaxed">${s.desc}</p>

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
async function saveCharacterSheet() {
    const id = selectedUserId || (currentUser ? currentUser.id : null);
    if (!id) return;

    // 1. Captura os ataques da UI (você já tem parte dessa lógica no app.js)
    const attackCards = document.querySelectorAll('.attack-card-mini');
    const updatedAttacks = Array.from(attackCards).map(card => ({
        nome: card.querySelector('input[placeholder="Nome do Ataque"]').value,
        teste: card.querySelector('input[placeholder="3d20+5"]').value,
        dano: card.querySelector('input[placeholder="2d6"]').value,
        crit: card.querySelector('input[placeholder="x2"]').value,
        alcance: card.querySelector('input[placeholder="Curto"]').value
    }));

    // 2. Captura as perícias (ajuste os seletores conforme seu HTML)
    const skillData = {};
    document.querySelectorAll('.skill-input').forEach(input => {
        skillData[input.dataset.skillName] = parseInt(input.value) || 0;
    });

    // 3. Envia para o Supabase (Upsert: insere ou atualiza)
    const { error } = await supabaseClient
        .from('characters')
        .upsert({
            user_id: id,
            name: document.getElementById('char-name').value,
            attacks: updatedAttacks,
            skills: skillData,
            // Adicione os outros campos (hp, atributos, etc) aqui
        });

    if (error) console.error("Erro ao salvar:", error);
    else alert("Ficha salva com sucesso!");
}


function renderTabs() {
  const container = document.getElementById('tabs-container');
  container.innerHTML = Object.entries(TAB_META).map(([key, label]) => {
    return `<button class="tab-btn ${key === currentTab ? 'active' : ''}" data-tab="${key}" onclick="switchTab('${key}')">${label}</button>`;
  }).join('');
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });

  const mainContent = document.getElementById('main-content');
  
  if (tab === 'personagem') {
    mainContent.innerHTML = renderCharacterSheet();
    // Reinicializa os ícones da Lucide se você estiver usando na ficha
    if (window.lucide) window.lucide.createIcons();
  } else {
    mainContent.innerHTML = renderTab(tab);
  }
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

  if (currentRole === 'admin') {
    document.getElementById('admin-panel').classList.remove('hidden');
    await loadPlayers();
  } else {
    selectedUserId = currentUser.id;
    await loadSkills();
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
  }
}

async function loadSelectedPlayer() {
  selectedUserId = document.getElementById('player-select').value;
  await loadSkills();
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
  unlocked[key] = checkbox.checked;
  await saveSkills();
  document.getElementById('main-content').innerHTML = renderTab(currentTab);
}

async function saveSkills() {
  const { error } = await supabaseClient
    .from('skill_trees')
    .upsert({
      user_id: selectedUserId,
      unlocked_skills: unlocked
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('Erro ao salvar:', error);
    alert('Erro ao salvar: ' + error.message);
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

function renderCharacterSheet() {
  // Dados das perícias
  const skillsList = [
    ["Acrobacia","AGI"],["Adestramento","PRE"],["Artes","INT"],["Atletismo","FOR"],
    ["Atualidades","INT"],["Ciências","INT"],["Estratégia","INT"],["Diplomacia","PRE"],
    ["Enganação","PRE"],["Fortitude","VIG"],["Furtividade","AGI"],["Iniciativa","AGI"],
    ["Intimidação","PRE"],["Intuição","PRE"],["Investigação","INT"],["Luta","FOR"],
    ["Medicina","INT"],["Ressonância","INT"],["Percepção","PRE"],["Pilotagem","AGI"],
    ["Pontaria","AGI"],["Profissão","INT"],["Reflexos","AGI"],["Religião","PRE"],
    ["Sobrevivência","INT"],["Tática","INT"],["Tecnologia","INT"],["Vontade","PRE"]
  ];

  const skillsHtml = skillsList.map(([name, attr]) => `
    <div class="skill-row">
      <span class="skill-name">${name}</span>
      <span class="skill-attr">${attr}</span>
      <input class="skill-cell" type="text">
      <input class="skill-check" type="checkbox">
      <input class="skill-cell" type="text">
    </div>
  `).join('');
const unlockedSkillsDetailed = [];
  
  for (const key in unlocked) {
    if (unlocked[key]) {
      const [element, skillName] = key.split('__');
      
      // Busca no objeto SKILLS os detalhes (desc, effect, res, etc)
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
      <div class="glow-box p-4 mb-5">
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div><label class="sheet-info-label">Personagem</label><input class="field-input" type="text"></div>
          <div><label class="sheet-info-label">Origem</label><input class="field-input" type="text"></div>
          <div><label class="sheet-info-label">Classe</label><input class="field-input" type="text"></div>
          <div><label class="sheet-info-label">Trilha</label><input class="field-input" type="text"></div>
          <div><label class="sheet-info-label">Jogador</label><input class="field-input" type="text"></div>
        </div>
      </div>

<div class="grid grid-cols-1 lg:grid-cols-[200px_0.3fr_1.3fr] gap-4 items-start">
  
  <div class="flex flex-col gap-4">
    <div class="glow-box p-4">
      <div class="section-title"><i data-lucide="zap" class="w-3 h-3 inline"></i> ATRIBUTOS</div>
      <div class="flex flex-col gap-3">
        ${['FOR', 'AGI', 'INT', 'PRE', 'VIG'].map(a => `
          <div class="attr-box w-full">
            <div class="attr-label">${a}</div>
            <input class="attr-input" type="text" value="0">
          </div>
        `).join('')}
      </div>
    </div>
          <div class="glow-box p-4">
            <div class="section-title"><i data-lucide="shield" class="w-3 h-3 inline"></i> STATUS</div>
            <div class="space-y-4">
              <div class="status-card-pv">
                <button onclick="updateStat('pvAtual', -1)" class="status-btn">−</button>
                <div class="flex-1 text-center">
                  <div class="status-label-pv mb-1">PV</div>
                  <div class="flex items-center justify-center gap-1">
                    <input class="stat-main-input" id="pvAtual" type="text" value="0">
                    <span class="stat-divider">/</span>
                    <input class="stat-max-input" id="pvMax" type="text" value="0">
                  </div>
                </div>
                <button onclick="updateStat('pvAtual', 1)" class="status-btn">+</button>
              </div>

              <div class="status-card-pd">
                <button onclick="updateStat('pdAtual', -1)" class="status-btn">−</button>
                <div class="flex-1 text-center">
                  <div class="status-label-pd mb-1">PD</div>
                  <div class="flex items-center justify-center gap-1">
                    <input class="stat-main-input" id="pdAtual" type="text" value="0">
                    <span class="stat-divider">/</span>
                    <input class="stat-max-input" id="pdMax" type="text" value="0">
                  </div>
                </div>
                <button onclick="updateStat('pdAtual', 1)" class="status-btn">+</button>
              </div>

              <div class="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                <div class="text-center"><div class="mini-label">NÍVEL</div><input class="mini-input" type="text" value="1"></div>
                <div class="text-center"><div class="mini-label">PR</div><input class="mini-input" type="text" value="0"></div>
                <div class="text-center"><div class="mini-label">DEFESA</div><input class="mini-input" type="text" value="10"></div>
                <div class="text-center"><div class="mini-label">ESQUIVA</div><input class="mini-input" type="text" value="10"></div>                
                <div class="text-center"><div class="mini-label">ESQUIVA</div><input class="mini-input" type="text" value="10"></div>
                <div class="text-center"><div class="mini-label">DESLOCAMENTO</div><input class="mini-input" type="text" value="9m"></div>

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
      <div class="attack-card-mini relative group">
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
</div>`;
}
// Função global para os botões de + e -
window.updateStat = function(id, delta) {
  const el = document.getElementById(id);
  if (el) {
    let currentVal = parseInt(el.value) || 0;
    el.value = Math.max(0, currentVal + delta);
  }
};

function updateStat(id, delta) {
  const el = document.getElementById(id);
  if (el) el.value = Math.max(0, (parseInt(el.value) || 0) + delta);
}

window.saveCharacterData = async function() {
    // Identifica qual ID usar (se o admin está editando alguém ou se é o próprio player)
    const id = selectedUserId || (currentUser ? currentUser.id : null);
    
    if (!id) {
        alert("Erro: Usuário não identificado.");
        return;
    }

    try {
        // 1. Capturar Perícias
        const skillInputs = document.querySelectorAll('.skill-input');
        const skillsObj = {};
        skillInputs.forEach(input => {
            const name = input.getAttribute('data-skill');
            if (name) {
                skillsObj[name] = parseInt(input.value) || 0;
            }
        });

        // 2. Capturar Ataques
        const attackCards = document.querySelectorAll('.attack-card-mini');
        const updatedAttacks = Array.from(attackCards).map(card => ({
            nome: card.querySelector('input[placeholder="Nome do Ataque"]')?.value || "",
            teste: card.querySelector('input[placeholder="3d20+5"]')?.value || "",
            dano: card.querySelector('input[placeholder="2d6"]')?.value || "",
            crit: card.querySelector('input[placeholder="x2"]')?.value || "",
            alcance: card.querySelector('input[placeholder="Curto"]')?.value || ""
        }));

        // 3. Montar o objeto completo para o banco
        const characterData = {
            user_id: id,
            name: document.getElementById('char-name')?.value || "Novo Personagem",
            archetype: document.getElementById('char-archetype')?.value || "Nenhum",
            level: parseInt(document.getElementById('char-level')?.value) || 1,
            
            // Atributos (Pega o texto dentro do <span>)
            strength: parseInt(document.getElementById('stat-strength')?.textContent) || 0,
            dexterity: parseInt(document.getElementById('stat-dexterity')?.textContent) || 0,
            constitution: parseInt(document.getElementById('stat-constitution')?.textContent) || 0,
            intelligence: parseInt(document.getElementById('stat-intelligence')?.textContent) || 0,
            presence: parseInt(document.getElementById('stat-presence')?.textContent) || 0,
            
            // Status
            hp_current: parseInt(document.getElementById('hp-curr')?.value) || 20,
            hp_max: parseInt(document.getElementById('hp-max')?.value) || 20,
            energy_current: parseInt(document.getElementById('en-curr')?.value) || 10,
            energy_max: parseInt(document.getElementById('en-max')?.value) || 10,
            
            // Defesas
            defense: parseInt(document.getElementById('stat-def')?.value) || 10,
            damage_reduction: parseInt(document.getElementById('stat-rd')?.value) || 0,
            movement_speed: parseFloat(document.getElementById('stat-mov')?.value) || 9.0,
            
            // Dados Dinâmicos
            skills: skillsObj,
            attacks: updatedAttacks
        };

        // 4. Enviar para o Supabase
        const { error } = await supabaseClient
            .from('characters')
            .upsert(characterData, { onConflict: 'user_id' });

        if (error) throw error;

        alert("Ficha salva com sucesso!");
        
    } catch (err) {
        console.error("Erro ao salvar ficha:", err);
        alert("Erro ao salvar: " + err.message);
    }
};

checkSession();

