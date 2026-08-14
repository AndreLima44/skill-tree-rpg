// =========================================================
// COMBATE SIMPLES V3 — inimigos, PV e acoes Nome/Dano/Efeito
// =========================================================
function normalizeEnemyActionV3(action, fallback='Ação') {
  if (!action) return { name:fallback, damage:'', effect:'' };
  if (typeof action === 'string') {
    const parts=action.split('|').map(x=>x.trim());
    return {name:parts[0]||fallback,damage:parts[1]||'',effect:parts.slice(2).join(' | ')||''};
  }
  return {
    name: action.name || action.nome || fallback,
    damage: action.damage || action.dano || '',
    effect: action.effect || action.efeito || action.desc || ''
  };
}
function normalizeEnemyActionsV3(list, fallback='Ação') {
  return (Array.isArray(list)?list:[]).map(x=>normalizeEnemyActionV3(x,fallback)).filter(x=>x.name);
}
function renderEnemyActionEditorV3(kind, actions=[]) {
  const title=kind==='attack'?'Ataques':'Habilidades';
  const singular=kind==='attack'?'Ataque':'Habilidade';
  const rows=normalizeEnemyActionsV3(actions,singular);
  return `<section class="enemy-action-editor-block"><div class="enemy-action-editor-head"><div><strong>${title}</strong><small>Cadastre apenas nome, dano de referência e efeito.</small></div><button type="button" onclick="addEnemyActionRowV3(this,'${kind}')">+ ${singular}</button></div><div class="enemy-action-editor-list" data-action-list="${kind}">${rows.map(a=>renderEnemyActionRowV3(kind,a)).join('')}</div></section>`;
}
function renderEnemyActionRowV3(kind,a={}) {
  const x=normalizeEnemyActionV3(a,kind==='attack'?'Ataque':'Habilidade');
  return `<div class="enemy-action-editor-row" data-kind="${kind}"><label>Nome<input name="${kind}_name" value="${escapeAttr(x.name||'')}" placeholder="Ex.: Machado Glacial"></label><label>Dano<input name="${kind}_damage" value="${escapeAttr(x.damage||'')}" placeholder="Ex.: 2d8+4"></label><label class="enemy-action-effect-field">Efeito<input name="${kind}_effect" value="${escapeAttr(x.effect||'')}" placeholder="Ex.: deixa Lento por 1 rodada"></label><button type="button" class="danger-text enemy-action-remove" onclick="this.closest('.enemy-action-editor-row').remove()" title="Remover">✕</button></div>`;
}
window.addEnemyActionRowV3=function(button,kind){
  const block=button.closest('.enemy-action-editor-block');
  const list=block?.querySelector(`[data-action-list="${kind}"]`); if(!list)return;
  list.insertAdjacentHTML('beforeend',renderEnemyActionRowV3(kind,{name:'',damage:'',effect:''}));
};
function collectEnemyActionsV3(form,kind){
  const rows=[...form.querySelectorAll(`.enemy-action-editor-row[data-kind="${kind}"]`)];
  return rows.map(row=>({
    name:row.querySelector(`[name="${kind}_name"]`)?.value.trim()||'',
    damage:row.querySelector(`[name="${kind}_damage"]`)?.value.trim()||'',
    effect:row.querySelector(`[name="${kind}_effect"]`)?.value.trim()||''
  })).filter(x=>x.name);
}
function renderEnemyActionButtonV3(enemy,kind,action,index){
  const a=normalizeEnemyActionV3(action,kind==='attack'?'Ataque':'Habilidade');
  const visible=currentRole==='admin'||enemyVisible(enemy,kind==='attack'?'attacks':'abilities');
  if(!visible)return '';
  if(currentRole==='admin') return `<button class="enemy-action-use-card" onclick="event.stopPropagation();useEnemyManualAction('${enemy.id}','${kind}',${index})"><strong>${escapeHtml(a.name)}</strong>${a.damage?`<span>🎲 ${escapeHtml(a.damage)}</span>`:''}${a.effect?`<small>${escapeHtml(a.effect)}</small>`:''}<b>Usar →</b></button>`;
  return `<div class="enemy-action-public-card"><strong>${escapeHtml(a.name)}</strong>${a.damage?`<span>${escapeHtml(a.damage)}</span>`:''}${a.effect?`<small>${escapeHtml(a.effect)}</small>`:''}</div>`;
}

window.openEnemyEditor=function(id=''){
  const e=battleEnemies.find(x=>String(x.id)===String(id))||{visibility:{name:true,hp:true,hp_numbers:false,conditions:true,defense:false,dodge:false,block:false,movement:true,attacks:false,abilities:false},conditions:[],attacks:[],abilities:[]};
  document.getElementById('enemy-editor')?.remove();
  document.body.insertAdjacentHTML('beforeend',`<div id="enemy-editor" class="picker-modal"><button class="picker-backdrop" onclick="document.getElementById('enemy-editor').remove()"></button><form class="picker-panel enemy-editor enemy-editor-v3" onsubmit="saveEnemyV3(event,'${escapeAttr(id)}')"><div class="picker-head"><div><span class="section-eyebrow">INIMIGO NO COMBATE</span><h3>${id?'Editar':'Criar'} inimigo</h3><small>Edite PV e ações sem sair do combate.</small></div><button type="button" onclick="document.getElementById('enemy-editor').remove()">✕</button></div><label>Nome<input name="name" required value="${escapeAttr(e.name||'')}"></label><label>Subtítulo<input name="subtitle" value="${escapeAttr(e.subtitle||'')}"></label><div class="enemy-form-grid"><label>PV atual<input name="hp_current" type="number" value="${e.hp_current??10}"></label><label>PV máximo<input name="hp_max" type="number" value="${e.hp_max??10}"></label><label>Defesa<input name="defense" type="number" value="${e.defense??10}"></label><label>Esquiva<input name="dodge" type="number" value="${e.dodge??0}"></label><label>Bloqueio<input name="block" type="number" value="${e.block??0}"></label><label>Deslocamento<input name="movement_speed" type="number" step="0.5" value="${e.movement_speed??9}"></label></div><label>Condições (vírgula)<input name="conditions" value="${escapeAttr((e.conditions||[]).join(', '))}"></label>${renderEnemyActionEditorV3('attack',e.attacks)}${renderEnemyActionEditorV3('ability',e.abilities)}<fieldset><legend>Visível para jogadores</legend>${[['name','Nome'],['hp','Barra de PV'],['hp_numbers','PV numérico'],['conditions','Condições'],['defense','Defesa'],['dodge','Esquiva'],['block','Bloqueio'],['movement','Deslocamento'],['attacks','Ataques'],['abilities','Habilidades']].map(([k,l])=>`<label class="check-row"><input type="checkbox" name="vis_${k}" ${e.visibility?.[k]!==false?'checked':''}> ${l}</label>`).join('')}</fieldset><div class="enemy-editor-actions"><button class="primary-action" type="submit">Salvar alterações</button>${id?`<button class="danger-action" type="button" onclick="deleteEnemy('${id}')">Remover do combate</button>`:''}</div></form></div>`);
};
window.saveEnemyV3=async function(ev,id){
  ev.preventDefault(); const form=ev.currentTarget,f=new FormData(form),visibility={};
  ['name','hp','hp_numbers','conditions','defense','dodge','block','movement','attacks','abilities'].forEach(k=>visibility[k]=f.get('vis_'+k)==='on');
  const payload={battle_id:activeBattle?.id,name:f.get('name')||'Inimigo',subtitle:f.get('subtitle')||'',hp_current:+f.get('hp_current')||0,hp_max:Math.max(1,+f.get('hp_max')||1),defense:+f.get('defense')||0,dodge:+f.get('dodge')||0,block:+f.get('block')||0,movement_speed:+f.get('movement_speed')||0,conditions:String(f.get('conditions')||'').split(',').map(x=>x.trim()).filter(Boolean),attacks:collectEnemyActionsV3(form,'attack'),abilities:collectEnemyActionsV3(form,'ability'),visibility};
  const q=id?supabaseClient.from('battle_enemies').update(payload).eq('id',id):supabaseClient.from('battle_enemies').insert(payload);
  const {error}=await q;if(error)return alert('Erro ao salvar inimigo:\n'+error.message);
  document.getElementById('enemy-editor')?.remove(); await logBattle(`${payload.name} foi ${id?'editado':'adicionado'} no combate`,'enemy'); scheduleCombatSync(30);
};

window.openBestiaryEditor=function(id=''){
  const e=masterBestiaryCache.find(x=>String(x.id)===String(id))||{visibility:{name:true,hp:true,hp_numbers:false,conditions:true,defense:false,dodge:false,block:false,movement:true,attacks:false,abilities:false},conditions:[],attacks:[],abilities:[]};
  document.getElementById('bestiary-editor')?.remove();
  document.body.insertAdjacentHTML('beforeend',`<div id="bestiary-editor" class="picker-modal"><button class="picker-backdrop" onclick="document.getElementById('bestiary-editor').remove()"></button><form class="picker-panel bestiary-editor enemy-editor-v3" onsubmit="saveBestiaryV3(event,'${escapeAttr(id)}')"><div class="picker-head"><div><span class="section-eyebrow">BESTIÁRIO</span><h3>${id?'Editar':'Novo'} inimigo</h3><small>Ataques e habilidades simples: Nome • Dano • Efeito.</small></div><button type="button" onclick="document.getElementById('bestiary-editor').remove()">✕</button></div><label>Nome<input name="name" required value="${escapeAttr(e.name||'')}"></label><label>Subtítulo<input name="subtitle" value="${escapeAttr(e.subtitle||'')}"></label><div class="enemy-form-grid"><label>PV máximo<input name="hp_max" type="number" value="${e.hp_max??10}"></label><label>Defesa<input name="defense" type="number" value="${e.defense??10}"></label><label>Esquiva<input name="dodge" type="number" value="${e.dodge??0}"></label><label>Bloqueio<input name="block" type="number" value="${e.block??0}"></label><label>Deslocamento<input name="movement_speed" type="number" step="0.5" value="${e.movement_speed??9}"></label><label>Nível<input name="level" type="number" value="${e.level??1}"></label></div><div class="enemy-form-grid"><label>Categoria<select name="rank">${['comum','elite','chefe'].map(x=>`<option value="${x}" ${(e.rank||'comum')===x?'selected':''}>${x[0].toUpperCase()+x.slice(1)}</option>`).join('')}</select></label><label>Elemento<input name="element" value="${escapeAttr(e.element||'')}"></label></div><label>Condições padrão (vírgula)<input name="conditions" value="${escapeAttr((e.conditions||[]).join(', '))}"></label>${renderEnemyActionEditorV3('attack',e.attacks)}${renderEnemyActionEditorV3('ability',e.abilities)}<label>Notas privadas<textarea name="notes">${escapeHtml(e.notes||'')}</textarea></label><fieldset><legend>Visível para jogadores</legend>${[['name','Nome'],['hp','Barra de PV'],['hp_numbers','PV numérico'],['conditions','Condições'],['defense','Defesa'],['dodge','Esquiva'],['block','Bloqueio'],['movement','Deslocamento'],['attacks','Ataques'],['abilities','Habilidades']].map(([k,l])=>`<label class="check-row"><input type="checkbox" name="vis_${k}" ${e.visibility?.[k]!==false?'checked':''}> ${l}</label>`).join('')}</fieldset><button class="primary-action" type="submit">Salvar no bestiário</button></form></div>`);
};
window.saveBestiaryV3=async function(ev,id){
  ev.preventDefault();const form=ev.currentTarget,f=new FormData(form),visibility={};
  ['name','hp','hp_numbers','conditions','defense','dodge','block','movement','attacks','abilities'].forEach(k=>visibility[k]=f.get('vis_'+k)==='on');
  const payload={owner_id:currentUser.id,name:f.get('name')||'Inimigo',subtitle:f.get('subtitle')||'',hp_max:Math.max(1,+f.get('hp_max')||1),defense:+f.get('defense')||0,dodge:+f.get('dodge')||0,block:+f.get('block')||0,movement_speed:+f.get('movement_speed')||0,level:Math.max(1,+f.get('level')||1),rank:f.get('rank')||'comum',element:f.get('element')||'',conditions:String(f.get('conditions')||'').split(',').map(x=>x.trim()).filter(Boolean),attacks:collectEnemyActionsV3(form,'attack'),abilities:collectEnemyActionsV3(form,'ability'),notes:f.get('notes')||'',visibility};
  const q=id?supabaseClient.from('enemy_templates').update(payload).eq('id',id):supabaseClient.from('enemy_templates').insert(payload);
  const {error}=await q;if(error)return alert('Erro ao salvar bestiário:\n'+error.message);
  document.getElementById('bestiary-editor')?.remove(); masterBestiaryCache=[]; await loadMasterHub('bestiary');
};

window.useEnemyManualAction=function(enemyId,kind,index){
  if(currentRole!=='admin')return;
  const e=battleEnemies.find(x=>String(x.id)===String(enemyId));if(!e)return;
  const list=kind==='ability'?normalizeEnemyActionsV3(e.abilities,'Habilidade'):normalizeEnemyActionsV3(e.attacks,'Ataque');
  const a=list[index];if(!a)return;
  openManualCombatAction({actorType:'enemy',actorId:e.id,actorName:e.name,name:a.name,damageFormula:a.damage,effect:a.effect,resource:'none',cost:0});
};

window.openManualCombatAction=function(options={}){
  if(!activeBattle?.id)return alert('Nenhum combate ativo.');
  const actorType=options.actorType||'player',actorId=String(options.actorId||(actorType==='player'?currentUser?.id:''));
  const actorName=options.actorName||(actorType==='enemy'?(battleEnemies.find(e=>String(e.id)===actorId)?.name||'Inimigo'):(combatPlayersCache.find(p=>String(p.user_id)===actorId)?.name||'Personagem'));
  if(actorType==='enemy'&&currentRole!=='admin')return;
  const targets=manualActionTargets(actorType);if(!targets.length)return alert('Não há alvos disponíveis.');
  const defaultTarget=findManualTargetDefault(actorType),condition=options.condition||'',cost=Number(options.cost||0),resource=options.resource||'pd';
  document.getElementById('manual-action-modal')?.remove();
  document.body.insertAdjacentHTML('beforeend',`<div id="manual-action-modal" class="picker-modal manual-action-modal"><button class="picker-backdrop" onclick="document.getElementById('manual-action-modal').remove()"></button><form class="picker-panel manual-action-panel manual-action-simple" onsubmit="confirmManualCombatAction(event)"><div class="picker-head"><div><span class="section-eyebrow">REGISTRAR AÇÃO</span><h3>${escapeHtml(options.name||'Ação')}</h3><small>${escapeHtml(actorName)}</small></div><button type="button" onclick="document.getElementById('manual-action-modal').remove()">✕</button></div>${options.damageFormula||options.effect?`<div class="action-reference-box">${options.damageFormula?`<div><span>Dano da ficha</span><strong>${escapeHtml(options.damageFormula)}</strong></div>`:''}${options.effect?`<p>${escapeHtml(options.effect)}</p>`:''}</div>`:''}<label>Alvo<select name="target" required>${targets.map(t=>`<option value="${t.type}:${escapeAttr(t.id)}" ${`${t.type}:${t.id}`===defaultTarget?'selected':''}>${escapeHtml(t.label)}</option>`).join('')}</select></label><div class="manual-roll-callout"><strong>Role os dados fisicamente</strong><span>Depois digite só o dano final.</span></div><label class="damage-input-big">Dano rolado<input name="damage" type="number" min="0" inputmode="numeric" value="0" required autofocus></label><input type="hidden" name="actor_type" value="${escapeAttr(actorType)}"><input type="hidden" name="actor_id" value="${escapeAttr(actorId)}"><input type="hidden" name="action_name" value="${escapeAttr(options.name||'Ação')}">${actorType==='player'?`<div class="manual-action-grid"><label>Custo<input name="resource_cost" type="number" min="0" value="${cost}"></label><label>Recurso<select name="resource"><option value="pd" ${resource==='pd'?'selected':''}>PD</option><option value="pr" ${resource==='pr'?'selected':''}>PR</option><option value="none" ${resource==='none'?'selected':''}>Nenhum</option></select></label></div>`:`<input type="hidden" name="resource" value="none"><input type="hidden" name="resource_cost" value="0">`}<details class="manual-action-more"><summary>Opções extras</summary><label class="check-row"><input name="apply_rd" type="checkbox"> Aplicar RD automaticamente</label><div class="manual-action-grid"><label>Condição<input name="condition" value="${escapeAttr(condition)}" placeholder="Opcional"></label><label>Rodadas<input name="condition_rounds" type="number" min="0" value="${condition?2:0}"></label></div></details><div class="manual-action-buttons"><button type="button" onclick="document.getElementById('manual-action-modal').remove()">Cancelar</button><button class="primary-action" type="submit">Aplicar dano e registrar</button></div></form></div>`);
};

function renderEnemyCard(e){
  const max=e.hp_max||1,pct=Math.max(0,Math.min(100,Math.round((e.hp_current||0)/max*100))),can=k=>enemyVisible(e,k),down=(e.hp_current||0)<=0;
  const attacks=normalizeEnemyActionsV3(e.attacks,'Ataque'),abilities=normalizeEnemyActionsV3(e.abilities,'Habilidade');
  const actionSection=[...attacks.map((a,i)=>renderEnemyActionButtonV3(e,'attack',a,i)),...abilities.map((a,i)=>renderEnemyActionButtonV3(e,'ability',a,i))].join('');
  return `<article class="battle-card enemy-card enemy-card-v3 ${down?'combat-down':''} ${selectedCombatTarget?.type==='enemy'&&String(selectedCombatTarget.id)===String(e.id)?'targeted':''}" data-enemy-id="${escapeHtml(e.id||'')}" onclick="selectCombatTarget('enemy','${escapeAttr(e.id)}')"><div class="battle-card-head"><div class="battle-avatar enemy">${e.image_url?`<img src="${escapeAttr(e.image_url)}">`:'👹'}</div><div><strong>${can('name')?escapeHtml(e.name||'Inimigo'):'Inimigo desconhecido'}</strong><small>${escapeHtml(e.subtitle||'')}</small></div>${down?'<b class="enemy-down-label">0 PV</b>':''}</div>${can('hp')?`<div class="battle-resource enemy-hp"><span>PV</span><div><i style="width:${pct}%"></i></div><b>${can('hp_numbers')?`${e.hp_current||0}/${e.hp_max||0}`:'?'}</b></div>`:''}<div class="battle-stats">${can('defense')?`<span>DEF <b>${e.defense??10}</b></span>`:''}${can('dodge')?`<span>ESQ <b>${e.dodge??0}</b></span>`:''}${can('block')?`<span>BLOQ <b>${e.block??0}</b></span>`:''}${can('movement')?`<span>DESL <b>${e.movement_speed??9}m</b></span>`:''}</div>${renderTimedEffects('enemy',e.id)}${actionSection?`<div class="enemy-actions-v3" onclick="event.stopPropagation()">${actionSection}</div>`:''}${currentRole==='admin'?`<div class="enemy-admin-v3" onclick="event.stopPropagation()"><div class="enemy-hp-buttons"><button onclick="quickAdjustEnemy('${e.id}',-10)">−10</button><button onclick="quickAdjustEnemy('${e.id}',-5)">−5</button><button onclick="quickAdjustEnemy('${e.id}',-1)">−1</button><button onclick="quickAdjustEnemy('${e.id}',1)">+1</button><button onclick="quickAdjustEnemy('${e.id}',5)">+5</button><button onclick="quickAdjustEnemy('${e.id}',10)">+10</button></div><div class="enemy-main-actions"><button onclick="openEnemyEditor('${e.id}')">✎ Editar</button><button onclick="openEnemyDetails('${e.id}')">Ficha</button><button onclick="addBattleEffect('enemy','${e.id}')">+ Condição</button></div></div>`:''}</article>`;
};

window.openEnemyDetails=function(id){
  const e=battleEnemies.find(x=>String(x.id)===String(id));if(!e)return;const can=k=>enemyVisible(e,k),attacks=normalizeEnemyActionsV3(e.attacks,'Ataque'),abilities=normalizeEnemyActionsV3(e.abilities,'Habilidade');
  document.getElementById('enemy-detail-modal')?.remove();
  document.body.insertAdjacentHTML('beforeend',`<div id="enemy-detail-modal" class="picker-modal"><button class="picker-backdrop" onclick="document.getElementById('enemy-detail-modal').remove()"></button><div class="picker-panel enemy-detail-sheet enemy-detail-v3"><div class="picker-head"><div><span class="section-eyebrow">INIMIGO</span><h3>${can('name')?escapeHtml(e.name):'Inimigo desconhecido'}</h3><small>${escapeHtml(e.subtitle||'')}</small></div><button onclick="document.getElementById('enemy-detail-modal').remove()">✕</button></div><div class="enemy-detail-stats">${can('hp')?`<span>PV <b>${can('hp_numbers')?`${e.hp_current}/${e.hp_max}`:'Oculto'}</b></span>`:''}${can('defense')?`<span>DEF <b>${e.defense}</b></span>`:''}${can('dodge')?`<span>ESQ <b>${e.dodge}</b></span>`:''}${can('block')?`<span>BLOQ <b>${e.block}</b></span>`:''}${can('movement')?`<span>DESL <b>${e.movement_speed}m</b></span>`:''}</div>${currentRole==='admin'?`<div class="enemy-detail-hp-tools"><span>Ajustar PV</span><button onclick="quickAdjustEnemy('${e.id}',-10)">−10</button><button onclick="quickAdjustEnemy('${e.id}',-5)">−5</button><button onclick="quickAdjustEnemy('${e.id}',-1)">−1</button><button onclick="quickAdjustEnemy('${e.id}',1)">+1</button><button onclick="quickAdjustEnemy('${e.id}',5)">+5</button><button onclick="quickAdjustEnemy('${e.id}',10)">+10</button></div>`:''}${attacks.length&&can('attacks')?`<h4>Ataques</h4><div class="enemy-detail-actions-v3">${attacks.map((a,i)=>renderEnemyActionButtonV3(e,'attack',a,i)).join('')}</div>`:''}${abilities.length&&can('abilities')?`<h4>Habilidades</h4><div class="enemy-detail-actions-v3">${abilities.map((a,i)=>renderEnemyActionButtonV3(e,'ability',a,i)).join('')}</div>`:''}${currentRole==='admin'?`<div class="enemy-detail-footer"><button onclick="document.getElementById('enemy-detail-modal').remove();openEnemyEditor('${e.id}')">Editar inimigo</button></div>`:''}</div></div>`);
};
