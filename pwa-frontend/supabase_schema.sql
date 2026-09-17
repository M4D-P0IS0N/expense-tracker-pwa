-- Tabela de Perfil de Usuário
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    level INT NOT NULL DEFAULT 1,
    current_xp INT NOT NULL DEFAULT 0,
    xp_to_next_level INT NOT NULL DEFAULT 1000,
    base_net_worth DECIMAL(12,2) DEFAULT 0.00,
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Conquistas (Achievements)
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon_path TEXT,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    is_unlocked BOOLEAN DEFAULT FALSE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela de Metas de Economia (Savings Goals)
CREATE TABLE savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    target_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabela de Transações (Income/Expense)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    type TEXT NOT NULL CHECK (type IN ('Income', 'Expense')),
    category TEXT DEFAULT 'General',
    installment_number INT,
    total_installments INT,
    credit_card_name TEXT,
    installment_group_id UUID,
    is_recurring BOOLEAN DEFAULT FALSE,
    is_split_by_2 BOOLEAN DEFAULT FALSE,
    is_third_party BOOLEAN DEFAULT FALSE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "Users can delete own profile"
ON public.user_profiles
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "Users can view own achievements"
ON public.achievements
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements"
ON public.achievements
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
ON public.achievements
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete own achievements"
ON public.achievements
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can view own savings goals"
ON public.savings_goals
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can insert own savings goals"
ON public.savings_goals
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update own savings goals"
ON public.savings_goals
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete own savings goals"
ON public.savings_goals
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can view own transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
ON public.transactions
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
ON public.transactions
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);


-- Monthly storage and atomic editing (kept in sync with additive migrations).
﻿-- ===========================================================
-- MIGRAÇÃO: Tabelas month_preferences e notebook_notes
-- Sincronização multi-dispositivo de preferências mensais e notas
-- ===========================================================

-- 1. Tabela month_preferences (ex: Dividir por 2 por mês)
CREATE TABLE IF NOT EXISTS public.month_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    is_split_by_2 BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT month_preferences_user_year_month_key UNIQUE (user_id, year, month)
);

ALTER TABLE public.month_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own month preferences" ON public.month_preferences;
    CREATE POLICY "Users can view own month preferences"
    ON public.month_preferences FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can insert own month preferences" ON public.month_preferences;
    CREATE POLICY "Users can insert own month preferences"
    ON public.month_preferences FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can update own month preferences" ON public.month_preferences;
    CREATE POLICY "Users can update own month preferences"
    ON public.month_preferences FOR UPDATE TO authenticated
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete own month preferences" ON public.month_preferences;
    CREATE POLICY "Users can delete own month preferences"
    ON public.month_preferences FOR DELETE TO authenticated
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
END $$;

-- 2. Tabela notebook_notes (Bloco de Notas e Histórico por mês)
CREATE TABLE IF NOT EXISTS public.notebook_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    history JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT notebook_notes_user_year_month_key UNIQUE (user_id, year, month)
);

ALTER TABLE public.notebook_notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own notebook notes" ON public.notebook_notes;
    CREATE POLICY "Users can view own notebook notes"
    ON public.notebook_notes FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can insert own notebook notes" ON public.notebook_notes;
    CREATE POLICY "Users can insert own notebook notes"
    ON public.notebook_notes FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can update own notebook notes" ON public.notebook_notes;
    CREATE POLICY "Users can update own notebook notes"
    ON public.notebook_notes FOR UPDATE TO authenticated
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete own notebook notes" ON public.notebook_notes;
    CREATE POLICY "Users can delete own notebook notes"
    ON public.notebook_notes FOR DELETE TO authenticated
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
END $$;

-- Additive migration: no existing financial rows are rewritten here.
-- SECURITY INVOKER retains the caller's RLS policies.
create or replace function public.edit_transaction_series(p_id uuid, p_transaction jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  original public.transactions%rowtype;
  edited public.transactions%rowtype;
  group_id uuid;
  member_ids uuid[];
  total integer := coalesce((p_transaction->>'total_installments')::integer, 1);
  current_number integer := coalesce((p_transaction->>'installment_number')::integer, 1);
  recurring boolean := coalesce((p_transaction->>'is_recurring')::boolean, false);
  n integer;
begin
  if owner_id is null then raise exception 'Usuário não autenticado'; end if;
  -- Serialize edits by account, including legacy rows with no group ID yet.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text, 0));
  select * into original from public.transactions where id = p_id and user_id = owner_id for update;
  if not found then raise exception 'Transação não encontrada'; end if;
  if total not between 1 and 600 or current_number not between 1 and total then
    raise exception 'Número de parcelas inválido';
  end if;
  if total > 1 and recurring then raise exception 'Escolha parcelas ou recorrência'; end if;
  if coalesce(length(trim(p_transaction->>'description')), 0) not between 1 and 2000
    or coalesce(p_transaction->>'type', '') not in ('Income', 'Expense')
    or p_transaction->>'amount' is null
    or (p_transaction->>'amount')::numeric < 0
    or (p_transaction->>'amount')::numeric > 9999999999.99
    or coalesce(p_transaction->>'amount', '') in ('NaN', 'Infinity', '-Infinity')
    or p_transaction->>'date' is null
    or coalesce(length(p_transaction->>'category'), 0) > 200
    or coalesce(length(p_transaction->>'credit_card_name'), 0) > 200 then
    raise exception 'Dados da transação inválidos';
  end if;
  if coalesce(original.total_installments, 1) > 1 and current_number <> original.installment_number then
    raise exception 'Não é possível renumerar uma parcela existente';
  end if;
  if (original.is_recurring and total > 1) or (coalesce(original.total_installments,1) > 1 and recurring) then
    raise exception 'Não é possível converter uma série entre parcelas e recorrência';
  end if;

  group_id := original.installment_group_id;
  if group_id is null and coalesce(original.total_installments, 1) > 1 then
    -- Legacy membership requires matching purchase metadata AND month offset.
    select array_agg(t.id) into member_ids from public.transactions t
    where t.user_id = owner_id and t.installment_group_id is null
      and t.description = original.description and t.type = original.type
      and t.amount = original.amount and t.credit_card_name is not distinct from original.credit_card_name
      and t.total_installments = original.total_installments
      and t.installment_number between 1 and original.total_installments
      and date_trunc('month', t.date at time zone 'UTC') =
        date_trunc('month', original.date at time zone 'UTC') + make_interval(months => t.installment_number - original.installment_number);
    if exists(select 1 from public.transactions where id = any(member_ids) group by installment_number having count(*) > 1) then
      raise exception 'Série antiga ambígua: há parcelas duplicadas. Revise antes de editar';
    end if;
    group_id := gen_random_uuid();
    update public.transactions set installment_group_id = group_id where id = any(member_ids) and user_id = owner_id;
  elsif group_id is null and original.is_recurring then
    raise exception 'Recorrência antiga sem grupo: revise os lançamentos antes de editar a série';
  elsif group_id is null and (total > 1 or recurring) then
    group_id := gen_random_uuid();
  end if;
  if group_id is not null and exists(
    select 1 from public.transactions where user_id = owner_id and installment_group_id = group_id
      and installment_number > total
  ) then
    raise exception 'Existem parcelas acima do novo total. Exclua as excedentes explicitamente antes de reduzir';
  end if;
  if group_id is not null and exists(
    select 1 from public.transactions where user_id = owner_id and installment_group_id = group_id
      and installment_number is not null group by installment_number having count(*) > 1
  ) then raise exception 'A série contém parcelas duplicadas. Revise antes de editar'; end if;

  update public.transactions set
    description = p_transaction->>'description', amount = (p_transaction->>'amount')::numeric,
    type = p_transaction->>'type', category = coalesce(nullif(p_transaction->>'category',''), 'General'),
    date = (p_transaction->>'date')::timestamptz,
    credit_card_name = nullif(p_transaction->>'credit_card_name',''),
    is_recurring = recurring,
    is_split_by_2 = p_transaction->>'type' = 'Expense' and coalesce((p_transaction->>'is_split_by_2')::boolean,false),
    is_third_party = p_transaction->>'type' = 'Expense' and coalesce((p_transaction->>'is_third_party')::boolean,false),
    total_installments = case when total > 1 then total end,
    installment_number = case when total > 1 then current_number end,
    installment_group_id = group_id
  where id = p_id and user_id = owner_id returning * into edited;

  if group_id is not null then
    update public.transactions set description = edited.description, amount = edited.amount,
      type = edited.type, category = edited.category, credit_card_name = edited.credit_card_name,
      is_split_by_2 = edited.is_split_by_2, is_third_party = edited.is_third_party, is_recurring = recurring
    where user_id = owner_id and installment_group_id = group_id and id <> p_id
      and ((total > 1 and installment_number > current_number) or (total = 1 and date > original.date));
    if total > 1 then
      update public.transactions set total_installments = total
      where user_id = owner_id and installment_group_id = group_id;
      for n in current_number+1..total loop
        if not exists(select 1 from public.transactions where user_id = owner_id and installment_group_id = group_id and installment_number = n) then
          insert into public.transactions(user_id, description, amount, type, category, date, credit_card_name,
            is_recurring, is_split_by_2, is_third_party, total_installments, installment_number, installment_group_id)
          values(owner_id, edited.description, edited.amount, edited.type, edited.category,
            ((edited.date at time zone 'UTC') + make_interval(months => n-current_number)) at time zone 'UTC',
            edited.credit_card_name, false, edited.is_split_by_2, edited.is_third_party, total, n, group_id);
        end if;
      end loop;
    end if;
  end if;
  return to_jsonb(edited);
end;
$$;
revoke all on function public.edit_transaction_series(uuid,jsonb) from public, anon;
grant execute on function public.edit_transaction_series(uuid,jsonb) to authenticated;
