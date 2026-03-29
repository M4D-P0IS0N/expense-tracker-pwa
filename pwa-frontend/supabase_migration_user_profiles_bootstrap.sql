-- ===========================================================
-- MIGRAÇÃO: Bootstrap seguro de user_profiles
-- Execute este script no SQL Editor do Supabase
-- ===========================================================

-- Garante que cada usuário autenticado tenha uma linha em public.user_profiles.
-- Isso evita falhas silenciosas quando o app tenta atualizar base_net_worth
-- antes de existir um perfil correspondente ao auth.users.id.

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_create_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_profile();

-- Backfill para usuários já existentes
INSERT INTO public.user_profiles (id)
SELECT auth_user.id
FROM auth.users AS auth_user
LEFT JOIN public.user_profiles AS user_profile
  ON user_profile.id = auth_user.id
WHERE user_profile.id IS NULL;
