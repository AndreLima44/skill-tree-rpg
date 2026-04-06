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
    const filePath = `${userId}/perfil.${fileExt}`;

    const { error: uploadError } = await supabaseClient.storage
        .from('avatars')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
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
    ["Atualidades","INT"],["Ciências","INT"],["Estratégia","INT"],["Diplomacia","PRE"],
    ["Enganação","PRE"],["Fortitude","VIG"],["Furtividade","AGI"],["Iniciativa","AGI"],
    ["Intimidação","PRE"],["Intuição","PRE"],["Investigação","INT"],["Luta","FOR"],
    ["Medicina","INT"],["Ressonância","INT"],["Percepção","PRE"],["Pilotagem","AGI"],
    ["Pontaria","AGI"],["Profissão","INT"],["Reflexos","AGI"],["Religião","PRE"],
    ["Sobrevivência","INT"],["Tática","INT"],["Tecnologia","INT"],["Vontade","PRE"]
  ];

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
          class="skill-cell skill-bonus"
          type="text"
          data-skill="${name}"
          value="${bonus}"
        >

        <input
          class="skill-check skill-trained"
          type="checkbox"
          data-skill="${name}"
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
      <div class="glow-box p-4 mb-5">
        <div class="flex flex-col lg:flex-row gap-4 items-start">
          
          <div class="w-full lg:w-[180px] flex flex-col items-center">
            <div class="w-36 h-36 rounded-xl overflow-hidden border border-white/10 bg-black/20 flex items-center justify-center mb-3">
              ${
                characterData.avatar_url
                  ? `<img src="${characterData.avatar_url}" alt="Avatar do personagem" class="w-full h-full object-cover">`
                  : `<span class="text-xs opacity-60 text-center px-3">Sem foto</span>`
              }
            </div>

            <label class="sheet-info-label text-center w-full">Foto do Personagem</label>
            <input id="char-avatar" class="field-input text-sm" type="file" accept="image/*">
          </div>

          <div class="flex-1 w-full">
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label class="sheet-info-label">Personagem</label>
                <input id="char-name" class="field-input" type="text" value="${characterData.name || ''}">
              </div>
              <div>
                <label class="sheet-info-label">Origem</label>
                <input id="char-origin" class="field-input" type="text" value="${characterData.origin || ''}">
              </div>
              <div>
                <label class="sheet-info-label">Classe</label>
                <input id="char-class" class="field-input" type="text" value="${characterData.class_name || ''}">
              </div>
              <div>
                <label class="sheet-info-label">Trilha</label>
                <input id="char-archetype" class="field-input" type="text" value="${characterData.archetype || ''}">
              </div>
              <div>
                <label class="sheet-info-label">Jogador</label>
                <input id="char-player" class="field-input" type="text" value="${characterData.player_name || ''}">
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-[200px_0.3fr_1.3fr] gap-4 items-start">

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
  }
};

window.saveCharacterData = async function() {
    const id = selectedUserId || (currentUser ? currentUser.id : null);

    if (!id) {
        alert("Erro: Usuário não identificado.");
        return;
    }

    try {
        const skillsObj = {};

document.querySelectorAll('.skill-row').forEach(row => {
    const bonusInput = row.querySelector('.skill-bonus');
    const trainedInput = row.querySelector('.skill-trained');
    const othersInput = row.querySelector('.skill-others');
    const attrEl = row.querySelector('.skill-attr');

    const name = bonusInput?.getAttribute('data-skill');

    if (name) {
        skillsObj[name] = {
            bonus: parseInt(bonusInput?.value) || 0,
            trained: !!trainedInput?.checked,
            others: parseInt(othersInput?.value) || 0,
            attr: attrEl?.textContent || ''
        };
    }
});

        window.saveCurrentAttacks();


        const avatarUrl = await uploadCharacterAvatar(id);

        const characterPayload = {
            user_id: id,

            name: document.getElementById('char-name')?.value || "Novo Personagem",
            origin: document.getElementById('char-origin')?.value || "",
            class_name: document.getElementById('char-class')?.value || "",
            archetype: document.getElementById('char-archetype')?.value || "",
            player_name: document.getElementById('char-player')?.value || "",
            level: parseInt(document.getElementById('char-level')?.value) || 1,

            strength: parseInt(document.getElementById('stat-strength')?.value) || 0,
            dexterity: parseInt(document.getElementById('stat-dexterity')?.value) || 0,
            constitution: parseInt(document.getElementById('stat-constitution')?.value) || 0,
            intelligence: parseInt(document.getElementById('stat-intelligence')?.value) || 0,
            presence: parseInt(document.getElementById('stat-presence')?.value) || 0,

            hp_current: parseInt(document.getElementById('hp-curr')?.value) || 0,
            hp_max: parseInt(document.getElementById('hp-max')?.value) || 0,
            energy_current: parseInt(document.getElementById('en-curr')?.value) || 0,
            energy_max: parseInt(document.getElementById('en-max')?.value) || 0,

            defense: parseInt(document.getElementById('stat-def')?.value) || 10,
            damage_reduction: parseInt(document.getElementById('stat-rd')?.value) || 0,
            dodge: parseInt(document.getElementById('stat-dodge')?.value) || 10,
            block: parseInt(document.getElementById('stat-block')?.value) || 0,
            movement_speed: parseFloat(
                String(document.getElementById('stat-mov')?.value || '9').replace(',', '.').replace('m', '')
            ) || 9,
            
            avatar_url: avatarUrl,
            skills: skillsObj,
            attacks: characterAttacks
        };

        const { error } = await supabaseClient
            .from('characters')
            .upsert(characterPayload, { onConflict: 'user_id' });

        if (error) {
            throw error;
        }

        characterData = {
            ...characterData,
            ...characterPayload
        };

        alert("Ficha salva com sucesso!");

    } catch (err) {
        console.error("Erro ao salvar ficha:", err);
        alert("Erro ao salvar ficha: " + err.message);
    }
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
}

checkSession();

