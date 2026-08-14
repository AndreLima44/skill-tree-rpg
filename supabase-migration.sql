-- ============================================================
-- ELEMENTO DO FRIO — MIGRACAO V3 CONSOLIDADA E IDEMPOTENTE
-- Pode ser executada novamente sem duplicar modulos.
-- ============================================================

-- ---------- PERSONAGENS ----------
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS resonance_points integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS damage_reduction integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.update_character_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN NEW.updated_at=now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trigger_update_character_updated_at ON public.characters;
CREATE TRIGGER trigger_update_character_updated_at
BEFORE UPDATE ON public.characters
FOR EACH ROW EXECUTE FUNCTION public.update_character_updated_at();

CREATE OR REPLACE FUNCTION public.save_character_patch(
  p_user_id uuid, p_expected_updated_at timestamptz, p_patch jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_row public.characters%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Usuario nao autenticado'; END IF;
  IF auth.uid()<>p_user_id AND NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin') THEN
    RAISE EXCEPTION 'Sem permissao para editar esta ficha';
  END IF;
  SELECT * INTO v_row FROM public.characters WHERE user_id=p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    IF p_expected_updated_at IS NOT NULL THEN RETURN jsonb_build_object('ok',false,'reason','conflict'); END IF;
    INSERT INTO public.characters(user_id) VALUES(p_user_id) RETURNING * INTO v_row;
  ELSIF p_expected_updated_at IS DISTINCT FROM v_row.updated_at THEN
    RETURN jsonb_build_object('ok',false,'reason','conflict','updated_at',v_row.updated_at);
  END IF;
  UPDATE public.characters c SET
    name=CASE WHEN p_patch?'name' THEN p_patch->>'name' ELSE c.name END,
    origin=CASE WHEN p_patch?'origin' THEN p_patch->>'origin' ELSE c.origin END,
    class_name=CASE WHEN p_patch?'class_name' THEN p_patch->>'class_name' ELSE c.class_name END,
    archetype=CASE WHEN p_patch?'archetype' THEN p_patch->>'archetype' ELSE c.archetype END,
    player_name=CASE WHEN p_patch?'player_name' THEN p_patch->>'player_name' ELSE c.player_name END,
    level=CASE WHEN p_patch?'level' THEN (p_patch->>'level')::integer ELSE c.level END,
    strength=CASE WHEN p_patch?'strength' THEN (p_patch->>'strength')::integer ELSE c.strength END,
    dexterity=CASE WHEN p_patch?'dexterity' THEN (p_patch->>'dexterity')::integer ELSE c.dexterity END,
    constitution=CASE WHEN p_patch?'constitution' THEN (p_patch->>'constitution')::integer ELSE c.constitution END,
    intelligence=CASE WHEN p_patch?'intelligence' THEN (p_patch->>'intelligence')::integer ELSE c.intelligence END,
    presence=CASE WHEN p_patch?'presence' THEN (p_patch->>'presence')::integer ELSE c.presence END,
    hp_current=CASE WHEN p_patch?'hp_current' THEN (p_patch->>'hp_current')::integer ELSE c.hp_current END,
    hp_max=CASE WHEN p_patch?'hp_max' THEN (p_patch->>'hp_max')::integer ELSE c.hp_max END,
    energy_current=CASE WHEN p_patch?'energy_current' THEN (p_patch->>'energy_current')::integer ELSE c.energy_current END,
    energy_max=CASE WHEN p_patch?'energy_max' THEN (p_patch->>'energy_max')::integer ELSE c.energy_max END,
    resonance_points=CASE WHEN p_patch?'resonance_points' THEN (p_patch->>'resonance_points')::integer ELSE c.resonance_points END,
    defense=CASE WHEN p_patch?'defense' THEN (p_patch->>'defense')::integer ELSE c.defense END,
    damage_reduction=CASE WHEN p_patch?'damage_reduction' THEN (p_patch->>'damage_reduction')::integer ELSE c.damage_reduction END,
    dodge=CASE WHEN p_patch?'dodge' THEN (p_patch->>'dodge')::integer ELSE c.dodge END,
    block=CASE WHEN p_patch?'block' THEN (p_patch->>'block')::integer ELSE c.block END,
    movement_speed=CASE WHEN p_patch?'movement_speed' THEN (p_patch->>'movement_speed')::numeric ELSE c.movement_speed END,
    avatar_url=CASE WHEN p_patch?'avatar_url' THEN p_patch->>'avatar_url' ELSE c.avatar_url END,
    skills=CASE WHEN p_patch?'skills' THEN p_patch->'skills' ELSE c.skills END,
    attacks=CASE WHEN p_patch?'attacks' THEN p_patch->'attacks' ELSE c.attacks END,
    conditions=CASE WHEN p_patch?'conditions' THEN p_patch->'conditions' ELSE c.conditions END
  WHERE c.user_id=p_user_id RETURNING * INTO v_row;
  RETURN jsonb_build_object('ok',true,'updated_at',v_row.updated_at);
END; $$;
GRANT EXECUTE ON FUNCTION public.save_character_patch(uuid,timestamptz,jsonb) TO authenticated;

-- ---------- COMBATE ----------
CREATE TABLE IF NOT EXISTS public.battles(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL DEFAULT 'Batalha', active boolean NOT NULL DEFAULT true,
  round integer NOT NULL DEFAULT 1, turn_label text, turn_order jsonb NOT NULL DEFAULT '[]'::jsonb, turn_index integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.battles
  ADD COLUMN IF NOT EXISTS turn_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS turn_index integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.battle_enemies(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), battle_id uuid NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Inimigo', subtitle text, image_url text,
  hp_current integer NOT NULL DEFAULT 10, hp_max integer NOT NULL DEFAULT 10,
  defense integer NOT NULL DEFAULT 10, dodge integer NOT NULL DEFAULT 0, block integer NOT NULL DEFAULT 0,
  movement_speed numeric NOT NULL DEFAULT 9, damage_reduction integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1, rank text NOT NULL DEFAULT 'comum', element text NOT NULL DEFAULT '',
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb, attacks jsonb NOT NULL DEFAULT '[]'::jsonb,
  abilities jsonb NOT NULL DEFAULT '[]'::jsonb, notes text NOT NULL DEFAULT '',
  visibility jsonb NOT NULL DEFAULT '{"name":true,"hp":true,"hp_numbers":false,"conditions":true,"defense":false,"dodge":false,"block":false,"movement":true,"attacks":false,"abilities":false}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.battle_enemies
  ADD COLUMN IF NOT EXISTS attacks jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS abilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rank text NOT NULL DEFAULT 'comum',
  ADD COLUMN IF NOT EXISTS element text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS damage_reduction integer NOT NULL DEFAULT 0;

ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_enemies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated read battles" ON public.battles;
CREATE POLICY "authenticated read battles" ON public.battles FOR SELECT TO authenticated USING(true);
DROP POLICY IF EXISTS "admin manage battles" ON public.battles;
CREATE POLICY "admin manage battles" ON public.battles FOR ALL TO authenticated
USING(EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'))
WITH CHECK(EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'));
-- Leitura direta de battle_enemies fica restrita ao mestre; jogadores usam RPC mascarada.
DROP POLICY IF EXISTS "authenticated read enemies" ON public.battle_enemies;
DROP POLICY IF EXISTS "admin read enemies" ON public.battle_enemies;
CREATE POLICY "admin read enemies" ON public.battle_enemies FOR SELECT TO authenticated
USING(EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'));
DROP POLICY IF EXISTS "admin manage enemies" ON public.battle_enemies;
CREATE POLICY "admin manage enemies" ON public.battle_enemies FOR ALL TO authenticated
USING(EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'))
WITH CHECK(EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'));

-- ---------- BESTIARIO ----------
CREATE TABLE IF NOT EXISTS public.enemy_templates(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Inimigo', subtitle text, image_url text,
  hp_max integer NOT NULL DEFAULT 10, defense integer NOT NULL DEFAULT 10, dodge integer NOT NULL DEFAULT 0, block integer NOT NULL DEFAULT 0,
  movement_speed numeric NOT NULL DEFAULT 9, damage_reduction integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1, rank text NOT NULL DEFAULT 'comum', element text NOT NULL DEFAULT '',
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb, attacks jsonb NOT NULL DEFAULT '[]'::jsonb,
  abilities jsonb NOT NULL DEFAULT '[]'::jsonb, notes text NOT NULL DEFAULT '',
  visibility jsonb NOT NULL DEFAULT '{"name":true,"hp":true,"hp_numbers":false,"conditions":true,"defense":false,"dodge":false,"block":false,"movement":true,"attacks":false,"abilities":false}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.enemy_templates
  ADD COLUMN IF NOT EXISTS damage_reduction integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS rank text NOT NULL DEFAULT 'comum',
  ADD COLUMN IF NOT EXISTS element text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS attacks jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS abilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS visibility jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';
ALTER TABLE public.enemy_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin own enemy templates" ON public.enemy_templates;
CREATE POLICY "admin own enemy templates" ON public.enemy_templates FOR ALL TO authenticated
USING(owner_id=auth.uid() AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'))
WITH CHECK(owner_id=auth.uid() AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'));

-- ---------- APOIO DA SESSAO ----------
CREATE TABLE IF NOT EXISTS public.gm_notes(
  owner_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, content text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gm_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gm owns notes" ON public.gm_notes;
CREATE POLICY "gm owns notes" ON public.gm_notes FOR ALL TO authenticated
USING(owner_id=auth.uid() AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'))
WITH CHECK(owner_id=auth.uid() AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'));

CREATE TABLE IF NOT EXISTS public.battle_log(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), battle_id uuid NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  message text NOT NULL, kind text NOT NULL DEFAULT 'info', created_by uuid REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.battle_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin battle log" ON public.battle_log;
CREATE POLICY "admin battle log" ON public.battle_log FOR ALL TO authenticated
USING(EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'))
WITH CHECK(EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'));

CREATE TABLE IF NOT EXISTS public.battle_effects(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), battle_id uuid NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK(entity_type IN('player','enemy')), entity_id text NOT NULL, name text NOT NULL,
  rounds_remaining integer NOT NULL DEFAULT 0, created_by uuid REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.battle_effects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated read battle effects" ON public.battle_effects;
CREATE POLICY "authenticated read battle effects" ON public.battle_effects FOR SELECT TO authenticated USING(true);
DROP POLICY IF EXISTS "admin manage battle effects" ON public.battle_effects;
CREATE POLICY "admin manage battle effects" ON public.battle_effects FOR ALL TO authenticated
USING(EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'))
WITH CHECK(EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'));

CREATE TABLE IF NOT EXISTS public.encounter_templates(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL, members jsonb NOT NULL DEFAULT '[]'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.encounter_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin own encounters" ON public.encounter_templates;
CREATE POLICY "admin own encounters" ON public.encounter_templates FOR ALL TO authenticated
USING(owner_id=auth.uid() AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'))
WITH CHECK(owner_id=auth.uid() AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'));

CREATE TABLE IF NOT EXISTS public.game_sessions(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL, active boolean NOT NULL DEFAULT true, notes text NOT NULL DEFAULT '', started_at timestamptz NOT NULL DEFAULT now(), ended_at timestamptz
);
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin own sessions" ON public.game_sessions;
CREATE POLICY "admin own sessions" ON public.game_sessions FOR ALL TO authenticated
USING(owner_id=auth.uid() AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'))
WITH CHECK(owner_id=auth.uid() AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'));

CREATE TABLE IF NOT EXISTS public.battle_action_requests(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), battle_id uuid NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, message text NOT NULL, payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','approved','rejected')),
  resolved_by uuid REFERENCES auth.users(id), resolved_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.battle_action_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "players create own combat actions" ON public.battle_action_requests;
CREATE POLICY "players create own combat actions" ON public.battle_action_requests FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid());
DROP POLICY IF EXISTS "players read own combat actions" ON public.battle_action_requests;
CREATE POLICY "players read own combat actions" ON public.battle_action_requests FOR SELECT TO authenticated
USING(user_id=auth.uid() OR EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'));
DROP POLICY IF EXISTS "admin resolve combat actions" ON public.battle_action_requests;
CREATE POLICY "admin resolve combat actions" ON public.battle_action_requests FOR UPDATE TO authenticated
USING(EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'))
WITH CHECK(EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'));

-- ---------- RPCS DEFINITIVAS ----------

-- Lista de jogadores para o seletor administrativo.
DROP FUNCTION IF EXISTS public.get_players_for_admin();
CREATE FUNCTION public.get_players_for_admin()
RETURNS TABLE(id uuid, username text, role text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin') THEN
    RAISE EXCEPTION 'Apenas administradores';
  END IF;
  RETURN QUERY SELECT p.id,p.username,p.role FROM public.profiles p ORDER BY p.username NULLS LAST;
END; $$;
GRANT EXECUTE ON FUNCTION public.get_players_for_admin() TO authenticated;

DROP FUNCTION IF EXISTS public.get_master_shield_data();
CREATE FUNCTION public.get_master_shield_data()
RETURNS TABLE(
  user_id uuid,name text,player_name text,origin text,class_name text,archetype text,avatar_url text,level integer,
  hp_current integer,hp_max integer,energy_current integer,energy_max integer,resonance_points integer,damage_reduction integer,
  defense integer,dodge integer,block integer,movement_speed numeric,strength integer,dexterity integer,intelligence integer,
  presence integer,constitution integer,skills jsonb,attacks jsonb,conditions jsonb,updated_at timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  WITH me AS (
    SELECT auth.uid() AS uid,
      EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin') AS is_admin
  )
  SELECT c.user_id,c.name,c.player_name,c.origin,c.class_name,c.archetype,c.avatar_url,c.level,
    c.hp_current,c.hp_max,c.energy_current,c.energy_max,COALESCE(c.resonance_points,3),COALESCE(c.damage_reduction,0),
    COALESCE(c.defense,10),COALESCE(c.dodge,0),COALESCE(c.block,0),COALESCE(c.movement_speed,9),
    COALESCE(c.strength,0),COALESCE(c.dexterity,0),COALESCE(c.intelligence,0),COALESCE(c.presence,0),COALESCE(c.constitution,0),
    CASE WHEN me.is_admin OR c.user_id=me.uid THEN COALESCE(c.skills,'{}'::jsonb) ELSE '{}'::jsonb END,
    CASE WHEN me.is_admin OR c.user_id=me.uid THEN COALESCE(c.attacks,'[]'::jsonb) ELSE '[]'::jsonb END,
    COALESCE(c.conditions,'[]'::jsonb),c.updated_at
  FROM public.characters c CROSS JOIN me ORDER BY c.name NULLS LAST;
$$;
GRANT EXECUTE ON FUNCTION public.get_master_shield_data() TO authenticated;

-- Substitui get_battle_enemies_v2. Existe uma unica RPC oficial.
DROP FUNCTION IF EXISTS public.get_battle_enemies(uuid);
DROP FUNCTION IF EXISTS public.get_battle_enemies_v2(uuid);
CREATE FUNCTION public.get_battle_enemies(p_battle_id uuid)
RETURNS TABLE(
  id uuid,battle_id uuid,name text,subtitle text,image_url text,hp_current integer,hp_max integer,
  defense integer,dodge integer,block integer,movement_speed numeric,conditions jsonb,visibility jsonb,sort_order integer,
  attacks jsonb,abilities jsonb,notes text,level integer,rank text,element text,damage_reduction integer
)
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
WITH me AS(SELECT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin') is_admin)
SELECT e.id,e.battle_id,
  CASE WHEN me.is_admin OR COALESCE((e.visibility->>'name')::boolean,true) THEN e.name ELSE 'Inimigo desconhecido' END,
  CASE WHEN me.is_admin OR COALESCE((e.visibility->>'name')::boolean,true) THEN e.subtitle ELSE NULL END,
  CASE WHEN me.is_admin OR COALESCE((e.visibility->>'name')::boolean,true) THEN e.image_url ELSE NULL END,
  CASE WHEN me.is_admin OR COALESCE((e.visibility->>'hp_numbers')::boolean,false) THEN e.hp_current WHEN COALESCE((e.visibility->>'hp')::boolean,true) THEN ROUND(100.0*e.hp_current/GREATEST(e.hp_max,1))::integer ELSE NULL END,
  CASE WHEN me.is_admin OR COALESCE((e.visibility->>'hp_numbers')::boolean,false) THEN e.hp_max WHEN COALESCE((e.visibility->>'hp')::boolean,true) THEN 100 ELSE NULL END,
  CASE WHEN me.is_admin OR COALESCE((e.visibility->>'defense')::boolean,false) THEN e.defense ELSE NULL END,
  CASE WHEN me.is_admin OR COALESCE((e.visibility->>'dodge')::boolean,false) THEN e.dodge ELSE NULL END,
  CASE WHEN me.is_admin OR COALESCE((e.visibility->>'block')::boolean,false) THEN e.block ELSE NULL END,
  CASE WHEN me.is_admin OR COALESCE((e.visibility->>'movement')::boolean,true) THEN e.movement_speed ELSE NULL END,
  CASE WHEN me.is_admin OR COALESCE((e.visibility->>'conditions')::boolean,true) THEN e.conditions ELSE '[]'::jsonb END,
  CASE WHEN me.is_admin THEN e.visibility ELSE jsonb_build_object(
    'name',COALESCE((e.visibility->>'name')::boolean,true),'hp',COALESCE((e.visibility->>'hp')::boolean,true),
    'hp_numbers',COALESCE((e.visibility->>'hp_numbers')::boolean,false),'conditions',COALESCE((e.visibility->>'conditions')::boolean,true),
    'defense',COALESCE((e.visibility->>'defense')::boolean,false),'dodge',COALESCE((e.visibility->>'dodge')::boolean,false),
    'block',COALESCE((e.visibility->>'block')::boolean,false),'movement',COALESCE((e.visibility->>'movement')::boolean,true),
    'attacks',COALESCE((e.visibility->>'attacks')::boolean,false),'abilities',COALESCE((e.visibility->>'abilities')::boolean,false)) END,
  e.sort_order,
  CASE WHEN me.is_admin OR COALESCE((e.visibility->>'attacks')::boolean,false) THEN e.attacks ELSE '[]'::jsonb END,
  CASE WHEN me.is_admin OR COALESCE((e.visibility->>'abilities')::boolean,false) THEN e.abilities ELSE '[]'::jsonb END,
  CASE WHEN me.is_admin THEN e.notes ELSE NULL END,e.level,e.rank,e.element,
  CASE WHEN me.is_admin THEN e.damage_reduction ELSE 0 END
FROM public.battle_enemies e CROSS JOIN me WHERE e.battle_id=p_battle_id ORDER BY e.sort_order,e.created_at;
$$;
GRANT EXECUTE ON FUNCTION public.get_battle_enemies(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.master_adjust_character(p_user_id uuid,p_resource text,p_delta integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v public.characters%ROWTYPE;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin') THEN RAISE EXCEPTION 'Apenas administradores'; END IF;
  IF p_resource='hp' THEN UPDATE public.characters SET hp_current=GREATEST(0,LEAST(COALESCE(hp_max,0),COALESCE(hp_current,0)+p_delta)) WHERE user_id=p_user_id RETURNING * INTO v;
  ELSIF p_resource='pd' THEN UPDATE public.characters SET energy_current=GREATEST(0,LEAST(COALESCE(energy_max,0),COALESCE(energy_current,0)+p_delta)) WHERE user_id=p_user_id RETURNING * INTO v;
  ELSE RAISE EXCEPTION 'Recurso invalido'; END IF;
  RETURN jsonb_build_object('ok',true,'hp_current',v.hp_current,'energy_current',v.energy_current,'updated_at',v.updated_at);
END; $$;
GRANT EXECUTE ON FUNCTION public.master_adjust_character(uuid,text,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.master_set_character_conditions(p_user_id uuid,p_conditions jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_updated timestamptz;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin') THEN RAISE EXCEPTION 'Apenas administradores'; END IF;
  IF jsonb_typeof(COALESCE(p_conditions,'[]'::jsonb))<>'array' THEN RAISE EXCEPTION 'conditions deve ser array'; END IF;
  UPDATE public.characters SET conditions=COALESCE(p_conditions,'[]'::jsonb) WHERE user_id=p_user_id RETURNING updated_at INTO v_updated;
  RETURN jsonb_build_object('ok',true,'updated_at',v_updated);
END; $$;
GRANT EXECUTE ON FUNCTION public.master_set_character_conditions(uuid,jsonb) TO authenticated;

-- Assinatura EXATA usada pelo frontend atual.
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT p.oid::regprocedure sig FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='apply_manual_combat_action'
  LOOP EXECUTE 'DROP FUNCTION IF EXISTS '||r.sig||' CASCADE'; END LOOP;
END $$;
CREATE FUNCTION public.apply_manual_combat_action(
  p_action_name text,p_actor_id uuid,p_actor_type text,p_apply_rd boolean,p_battle_id uuid,p_condition text,
  p_condition_rounds integer,p_damage integer,p_resource text,p_resource_cost integer,p_target_id uuid,p_target_type text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_admin boolean:=false; v_damage integer:=GREATEST(COALESCE(p_damage,0),0); v_final integer:=0; v_rd integer:=0;
  v_before integer:=0; v_after integer:=0; v_actor text:=''; v_target text:=''; v_resource text:=lower(trim(COALESCE(p_resource,'')));
  v_cost integer:=GREATEST(COALESCE(p_resource_cost,0),0); v_condition text:=NULLIF(trim(COALESCE(p_condition,'')),'');
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin') INTO v_admin;
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Usuario nao autenticado'; END IF;
  IF p_actor_type NOT IN('player','enemy') OR p_target_type NOT IN('player','enemy') THEN RAISE EXCEPTION 'Tipo de ator/alvo invalido'; END IF;
  IF p_actor_type='enemy' AND NOT v_admin THEN RAISE EXCEPTION 'Somente o mestre controla inimigos'; END IF;
  IF p_actor_type='player' AND p_actor_id<>auth.uid() AND NOT v_admin THEN RAISE EXCEPTION 'Sem permissao'; END IF;

  IF p_actor_type='player' THEN SELECT COALESCE(name,'Personagem') INTO v_actor FROM public.characters WHERE user_id=p_actor_id;
  ELSE SELECT COALESCE(name,'Inimigo') INTO v_actor FROM public.battle_enemies WHERE id=p_actor_id; END IF;

  IF p_actor_type='player' AND v_cost>0 THEN
    IF v_resource IN('pd','energy','energia') THEN
      UPDATE public.characters SET energy_current=GREATEST(0,COALESCE(energy_current,0)-v_cost) WHERE user_id=p_actor_id;
    ELSIF v_resource='pr' THEN
      UPDATE public.characters SET resonance_points=GREATEST(0,COALESCE(resonance_points,0)-v_cost) WHERE user_id=p_actor_id;
    END IF;
  END IF;

  IF p_target_type='player' THEN
    SELECT COALESCE(name,'Personagem'),COALESCE(hp_current,0),COALESCE(damage_reduction,0) INTO v_target,v_before,v_rd FROM public.characters WHERE user_id=p_target_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Jogador alvo nao encontrado'; END IF;
    v_final:=CASE WHEN COALESCE(p_apply_rd,false) THEN GREATEST(v_damage-v_rd,0) ELSE v_damage END;
    v_after:=GREATEST(v_before-v_final,0);
    UPDATE public.characters SET hp_current=v_after WHERE user_id=p_target_id;
  ELSE
    SELECT COALESCE(name,'Inimigo'),COALESCE(hp_current,0),COALESCE(damage_reduction,0) INTO v_target,v_before,v_rd FROM public.battle_enemies WHERE id=p_target_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Inimigo alvo nao encontrado'; END IF;
    v_final:=CASE WHEN COALESCE(p_apply_rd,false) THEN GREATEST(v_damage-v_rd,0) ELSE v_damage END;
    v_after:=GREATEST(v_before-v_final,0);
    UPDATE public.battle_enemies SET hp_current=v_after WHERE id=p_target_id;
  END IF;

  IF v_condition IS NOT NULL THEN
    INSERT INTO public.battle_effects(battle_id,entity_type,entity_id,name,rounds_remaining,created_by)
    VALUES(p_battle_id,p_target_type,p_target_id::text,v_condition,GREATEST(COALESCE(p_condition_rounds,0),0),auth.uid());
  END IF;
  INSERT INTO public.battle_log(battle_id,message,kind,created_by)
  VALUES(p_battle_id,format('%s usou %s em %s • %s dano%s',v_actor,COALESCE(NULLIF(trim(p_action_name),''),'Acao'),v_target,v_final,
    CASE WHEN v_condition IS NULL THEN '' ELSE ' • '||v_condition END),'action',auth.uid());
  RETURN jsonb_build_object('success',true,'actor',v_actor,'target',v_target,'damage_rolled',v_damage,'rd_applied',CASE WHEN p_apply_rd THEN v_rd ELSE 0 END,'damage_applied',v_final,'hp_before',v_before,'hp_after',v_after,'condition',v_condition);
END; $$;
GRANT EXECUTE ON FUNCTION public.apply_manual_combat_action(text,uuid,text,boolean,uuid,text,integer,integer,text,integer,uuid,text) TO authenticated;

-- ---------- REALTIME / CACHE ----------
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.characters; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.battles; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_enemies; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_effects; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_action_requests; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
NOTIFY pgrst, 'reload schema';
