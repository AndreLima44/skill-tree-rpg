// Navegacao principal unica para jogador e mestre.

function renderTabs() {
  const container = document.getElementById('tabs-container');
  if (!container) return;

  const tabs = currentRole === 'admin'
    ? { jogadores:'👥 Jogadores', combate:'⚔️ Combate', bestiario:'📚 Bestiário', regras:'📖 Regras', mestre:'⚙️ Mestre' }
    : TAB_META;

  container.innerHTML = Object.entries(tabs).map(([key, label]) => {
    const match = label.match(/^(\S+)\s+(.+)$/);
    const icon = match ? match[1] : '';
    const text = match ? match[2] : label;
    return `<button class="tab-btn ${key === currentTab ? 'active' : ''}" data-tab="${key}" onclick="switchTab('${key}')" title="${escapeAttr(text)}">
      <span class="nav-icon">${icon}</span><span class="nav-label">${escapeHtml(text)}</span>
    </button>`;
  }).join('');
}

function switchTab(tab) {
  if (currentTab === 'personagem' && tab !== 'personagem' && isDirty) {
    window.saveCharacterData({ silent:true });
  }
  currentTab = tab;
  renderTabs();
  document.body.dataset.section = tab;
  const main = document.getElementById('main-content');
  if (!main) return;

  if (currentRole === 'admin') {
    if (tab === 'personagem') {
      document.getElementById('save-bar')?.classList.remove('hidden');
      main.innerHTML = `<section class="master-full-sheet-bar"><button onclick="switchTab('jogadores')">← Voltar para Jogadores</button><div><span class="section-eyebrow">EDIÇÃO COMPLETA</span><strong>${escapeHtml(characterData?.name || 'Personagem')}</strong></div></section>${renderCharacterSheet()}`;
      if (window.lucide) window.lucide.createIcons();
      return;
    }
    document.getElementById('save-bar')?.classList.add('hidden');
    if (tab === 'jogadores') return loadMasterPlayersOverview();
    if (tab === 'combate') return loadCombatView();
    if (tab === 'bestiario') return loadMasterHub('bestiary');
    if (tab === 'regras') { main.innerHTML = renderRulesPage(); renderRulesContext(); searchRules(''); return; }
    if (tab === 'mestre') return loadMasterHub('session');
    return;
  }

  if (tab === 'regras') { main.innerHTML = renderRulesPage(); renderRulesContext(); searchRules(''); }
  else if (tab === 'personagem') { main.innerHTML = renderCharacterSheet(); if (window.lucide) window.lucide.createIcons(); }
  else if (tab === 'habilidades') { main.innerHTML = renderAbilitiesHub(); if (window.lucide) window.lucide.createIcons(); }
  else if (tab === 'combate') loadCombatView();
}

