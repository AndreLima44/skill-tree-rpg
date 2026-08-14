// =========================================================
// FLUXO DE COMBATE MANUAL + VISAO AGREGADA DO MESTRE
// =========================================================

function manualActionTargets(actorType) {
  if (actorType === 'enemy') {
    return combatPlayersCache.map(p => ({ type:'player', id:String(p.user_id), label:p.name || 'Personagem' }));
  }
  return battleEnemies.map(e => ({ type:'enemy', id:String(e.id), label:e.name || 'Inimigo' }));
}

function findManualTargetDefault(actorType) {
  const allowed = manualActionTargets(actorType);
  if (selectedCombatTarget && allowed.some(x => x.type===selectedCombatTarget.type && x.id===String(selectedCombatTarget.id))) {
    return `${selectedCombatTarget.type}:${selectedCombatTarget.id}`;
  }
  return allowed[0] ? `${allowed[0].type}:${allowed[0].id}` : '';
}
window.confirmManualCombatAction = async function(ev) {
  ev.preventDefault();
  const form = ev.currentTarget;
  const f = new FormData(form);
  const [targetType,targetId] = String(f.get('target')||'').split(':');
  const payload = {
    p_battle_id: activeBattle.id,
    p_actor_type: String(f.get('actor_type')),
    p_actor_id: String(f.get('actor_id')),
    p_target_type: targetType,
    p_target_id: targetId,
    p_action_name: String(f.get('action_name')||'Ação'),
    p_damage: Math.max(0, Number(f.get('damage'))||0),
    p_resource: String(f.get('resource')||'none'),
    p_resource_cost: Math.max(0, Number(f.get('resource_cost'))||0),
    p_condition: String(f.get('condition')||'').trim() || null,
    p_condition_rounds: Math.max(0, Number(f.get('condition_rounds'))||0),
    p_apply_rd: f.get('apply_rd')==='on'
  };
  const submit = form.querySelector('button[type="submit"]');
  if (submit) { submit.disabled=true; submit.textContent='Aplicando...'; }
  const {data,error}=await supabaseClient.rpc('apply_manual_combat_action', payload);
  if(error){ if(submit){submit.disabled=false;submit.textContent='Confirmar uso';} return alert('Não foi possível aplicar a ação. Execute o supabase-migration.sql atualizado.\n'+error.message); }
  document.getElementById('manual-action-modal')?.remove();
  scheduleCombatSync(30);
};

// Ataques e habilidades do jogador: abre painel de rolagem física em vez de prompt/automação.
window.useQuickAttack = function(index) {
  const me=combatPlayersCache.find(p=>String(p.user_id)===String(currentUser?.id));
  const a=me?.attacks?.[index]; if(!a)return;
  openManualCombatAction({actorType:'player',actorId:currentUser.id,actorName:me.name,name:a.nome||'Ataque',resource:'none',cost:0});
};
window.useQuickSkill = function(element,name) {
  let skill=null; for(const path of SKILLS[element]?.paths||[]){skill=path.skills.find(s=>s.name===name);if(skill)break;} if(!skill)return;
  const me=combatPlayersCache.find(p=>String(p.user_id)===String(currentUser?.id));
  const rawCost = skill.cost?.value ?? skill.pd_cost ?? skill.cost ?? 0;
  const cost = Number(rawCost)||0;
  const condition = Array.isArray(skill.appliesConditions) ? (skill.appliesConditions[0]||'') : (skill.condition||'');
  openManualCombatAction({actorType:'player',actorId:currentUser.id,actorName:me?.name,name:skill.name,resource:'pd',cost,condition});
};
