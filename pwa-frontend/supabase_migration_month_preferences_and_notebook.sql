-- ===========================================================
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
