-- ============================================================
-- ELEMENTO DO FRIO - MIGRAÇÃO DE SINCRONIZAÇÃO SEGURA
-- Execute este arquivo no Supabase SQL Editor.
-- ============================================================

ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS resonance_points integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE OR REPLACE FUNCTION public.update_character_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_character_updated_at ON public.characters;
CREATE TRIGGER trigger_update_character_updated_at
BEFORE UPDATE ON public.characters
FOR EACH ROW EXECUTE FUNCTION public.update_character_updated_at();

-- Atualização otimista: só aplica o patch se a versão esperada ainda for a atual.
CREATE OR REPLACE FUNCTION public.save_character_patch(
  p_user_id uuid,
  p_expected_updated_at timestamptz,
  p_patch jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.characters%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.characters WHERE user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    IF p_expected_updated_at IS NOT NULL THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'conflict');
    END IF;
    INSERT INTO public.characters (user_id)
    VALUES (p_user_id)
    RETURNING * INTO v_row;
  ELSIF p_expected_updated_at IS DISTINCT FROM v_row.updated_at THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'conflict', 'updated_at', v_row.updated_at);
  END IF;

  UPDATE public.characters c
  SET
    name = CASE WHEN p_patch ? 'name' THEN p_patch->>'name' ELSE c.name END,
    origin = CASE WHEN p_patch ? 'origin' THEN p_patch->>'origin' ELSE c.origin END,
    class_name = CASE WHEN p_patch ? 'class_name' THEN p_patch->>'class_name' ELSE c.class_name END,
    archetype = CASE WHEN p_patch ? 'archetype' THEN p_patch->>'archetype' ELSE c.archetype END,
    player_name = CASE WHEN p_patch ? 'player_name' THEN p_patch->>'player_name' ELSE c.player_name END,
    level = CASE WHEN p_patch ? 'level' THEN (p_patch->>'level')::integer ELSE c.level END,
    strength = CASE WHEN p_patch ? 'strength' THEN (p_patch->>'strength')::integer ELSE c.strength END,
    dexterity = CASE WHEN p_patch ? 'dexterity' THEN (p_patch->>'dexterity')::integer ELSE c.dexterity END,
    constitution = CASE WHEN p_patch ? 'constitution' THEN (p_patch->>'constitution')::integer ELSE c.constitution END,
    intelligence = CASE WHEN p_patch ? 'intelligence' THEN (p_patch->>'intelligence')::integer ELSE c.intelligence END,
    presence = CASE WHEN p_patch ? 'presence' THEN (p_patch->>'presence')::integer ELSE c.presence END,
    hp_current = CASE WHEN p_patch ? 'hp_current' THEN (p_patch->>'hp_current')::integer ELSE c.hp_current END,
    hp_max = CASE WHEN p_patch ? 'hp_max' THEN (p_patch->>'hp_max')::integer ELSE c.hp_max END,
    energy_current = CASE WHEN p_patch ? 'energy_current' THEN (p_patch->>'energy_current')::integer ELSE c.energy_current END,
    energy_max = CASE WHEN p_patch ? 'energy_max' THEN (p_patch->>'energy_max')::integer ELSE c.energy_max END,
    defense = CASE WHEN p_patch ? 'defense' THEN (p_patch->>'defense')::integer ELSE c.defense END,
    damage_reduction = CASE WHEN p_patch ? 'damage_reduction' THEN (p_patch->>'damage_reduction')::integer ELSE c.damage_reduction END,
    dodge = CASE WHEN p_patch ? 'dodge' THEN (p_patch->>'dodge')::integer ELSE c.dodge END,
    block = CASE WHEN p_patch ? 'block' THEN (p_patch->>'block')::integer ELSE c.block END,
    movement_speed = CASE WHEN p_patch ? 'movement_speed' THEN (p_patch->>'movement_speed')::numeric ELSE c.movement_speed END,
    avatar_url = CASE WHEN p_patch ? 'avatar_url' THEN p_patch->>'avatar_url' ELSE c.avatar_url END,
    skills = CASE WHEN p_patch ? 'skills' THEN p_patch->'skills' ELSE c.skills END,
    attacks = CASE WHEN p_patch ? 'attacks' THEN p_patch->'attacks' ELSE c.attacks END
  WHERE c.user_id = p_user_id
  RETURNING * INTO v_row;

  RETURN jsonb_build_object('ok', true, 'updated_at', v_row.updated_at);
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_character_patch(uuid, timestamptz, jsonb) TO authenticated;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.characters;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Escudo do Mestre usando os nomes de coluna utilizados pelo app atual.
CREATE OR REPLACE FUNCTION public.get_master_shield_data()
RETURNS TABLE (
  user_id uuid, name text, player_name text, origin text, class_name text, archetype text,
  avatar_url text, level integer, hp_current integer, hp_max integer,
  energy_current integer, energy_max integer, resonance_points integer,
  damage_reduction integer, defense integer, dodge integer, block integer,
  movement_speed numeric, strength integer, dexterity integer, intelligence integer,
  presence integer, constitution integer, skills jsonb, attacks jsonb, updated_at timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT c.user_id, c.name, c.player_name, c.origin, c.class_name, c.archetype,
    c.avatar_url, c.level, c.hp_current, c.hp_max, c.energy_current, c.energy_max,
    COALESCE(c.resonance_points, 3), COALESCE(c.damage_reduction, 0),
    COALESCE(c.defense, 10), COALESCE(c.dodge, 0), COALESCE(c.block, 0),
    COALESCE(c.movement_speed, 9), COALESCE(c.strength, 0), COALESCE(c.dexterity, 0),
    COALESCE(c.intelligence, 0), COALESCE(c.presence, 0), COALESCE(c.constitution, 0),
    COALESCE(c.skills, '{}'::jsonb), COALESCE(c.attacks, '[]'::jsonb), c.updated_at
  FROM public.characters c
  ORDER BY c.name NULLS LAST;
$$;
GRANT EXECUTE ON FUNCTION public.get_master_shield_data() TO authenticated;

-- ============================================================
-- COMBATE COMPARTILHADO
-- ============================================================
CREATE TABLE IF NOT EXISTS public.battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Batalha',
  active boolean NOT NULL DEFAULT true,
  round integer NOT NULL DEFAULT 1,
  turn_label text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.battle_enemies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id uuid NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Inimigo', subtitle text, image_url text,
  hp_current integer NOT NULL DEFAULT 10, hp_max integer NOT NULL DEFAULT 10,
  defense integer DEFAULT 10, dodge integer DEFAULT 0, block integer DEFAULT 0,
  movement_speed numeric DEFAULT 9,
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  visibility jsonb NOT NULL DEFAULT '{"name":true,"hp":true,"hp_numbers":false,"conditions":true,"defense":false,"dodge":false,"block":false,"movement":true}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_enemies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated read battles" ON public.battles;
CREATE POLICY "authenticated read battles" ON public.battles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin manage battles" ON public.battles;
CREATE POLICY "admin manage battles" ON public.battles FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'));
DROP POLICY IF EXISTS "authenticated read enemies" ON public.battle_enemies;
CREATE POLICY "authenticated read enemies" ON public.battle_enemies FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "admin manage enemies" ON public.battle_enemies;
CREATE POLICY "admin manage enemies" ON public.battle_enemies FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin'));
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.battles; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_enemies; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Leitura segura dos inimigos: jogadores recebem somente campos autorizados
-- pela configuração de visibilidade. O mestre recebe os valores completos.
DROP POLICY IF EXISTS "authenticated read enemies" ON public.battle_enemies;
DROP FUNCTION IF EXISTS public.get_battle_enemies(uuid);
CREATE OR REPLACE FUNCTION public.get_battle_enemies(p_battle_id uuid)
RETURNS TABLE (
  id uuid, battle_id uuid, name text, subtitle text, image_url text,
  hp_current integer, hp_max integer, defense integer, dodge integer, block integer,
  movement_speed numeric, conditions jsonb, visibility jsonb, sort_order integer
)
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  WITH me AS (
    SELECT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=auth.uid() AND p.role='admin') AS is_admin
  )
  SELECT e.id,e.battle_id,
    CASE WHEN me.is_admin OR COALESCE((e.visibility->>'name')::boolean,true) THEN e.name ELSE 'Inimigo desconhecido' END,
    CASE WHEN me.is_admin OR COALESCE((e.visibility->>'name')::boolean,true) THEN e.subtitle ELSE NULL END,
    CASE WHEN me.is_admin OR COALESCE((e.visibility->>'name')::boolean,true) THEN e.image_url ELSE NULL END,
    CASE
      WHEN me.is_admin OR COALESCE((e.visibility->>'hp_numbers')::boolean,false) THEN e.hp_current
      WHEN COALESCE((e.visibility->>'hp')::boolean,true) THEN ROUND(100.0 * e.hp_current / GREATEST(e.hp_max,1))::integer
      ELSE NULL END,
    CASE
      WHEN me.is_admin OR COALESCE((e.visibility->>'hp_numbers')::boolean,false) THEN e.hp_max
      WHEN COALESCE((e.visibility->>'hp')::boolean,true) THEN 100
      ELSE NULL END,
    CASE WHEN me.is_admin OR COALESCE((e.visibility->>'defense')::boolean,false) THEN e.defense ELSE NULL END,
    CASE WHEN me.is_admin OR COALESCE((e.visibility->>'dodge')::boolean,false) THEN e.dodge ELSE NULL END,
    CASE WHEN me.is_admin OR COALESCE((e.visibility->>'block')::boolean,false) THEN e.block ELSE NULL END,
    CASE WHEN me.is_admin OR COALESCE((e.visibility->>'movement')::boolean,true) THEN e.movement_speed ELSE NULL END,
    CASE WHEN me.is_admin OR COALESCE((e.visibility->>'conditions')::boolean,true) THEN e.conditions ELSE '[]'::jsonb END,
    CASE WHEN me.is_admin THEN e.visibility ELSE jsonb_build_object(
      'name',COALESCE((e.visibility->>'name')::boolean,true),
      'hp',COALESCE((e.visibility->>'hp')::boolean,true),
      'hp_numbers',COALESCE((e.visibility->>'hp_numbers')::boolean,false),
      'conditions',COALESCE((e.visibility->>'conditions')::boolean,true),
      'defense',COALESCE((e.visibility->>'defense')::boolean,false),
      'dodge',COALESCE((e.visibility->>'dodge')::boolean,false),
      'block',COALESCE((e.visibility->>'block')::boolean,false),
      'movement',COALESCE((e.visibility->>'movement')::boolean,true)
    ) END,
    e.sort_order
  FROM public.battle_enemies e CROSS JOIN me
  WHERE e.battle_id=p_battle_id ORDER BY e.sort_order,e.created_at;
$$;
GRANT EXECUTE ON FUNCTION public.get_battle_enemies(uuid) TO authenticated;
