-- ============================================================
-- FinFlow — Migration SQL
-- Executar no Supabase Dashboard → SQL Editor
-- Projeto: msjmpjzaircvtuigpbkm (wild-pixel reutilizado)
-- ============================================================

-- Adiciona colunas FinFlow na tabela profiles existente
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS finflow_onboarding jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS finflow_salario     numeric DEFAULT 0;

-- FinFlow: Transações
CREATE TABLE IF NOT EXISTS public.finflow_transactions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        text        NOT NULL CHECK (type IN ('income', 'expense')),
  amount      numeric     NOT NULL CHECK (amount > 0),
  description text        NOT NULL,
  category    text        NOT NULL,
  date        date        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.finflow_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON public.finflow_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.finflow_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON public.finflow_transactions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ff_tx_user_id   ON public.finflow_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ff_tx_date      ON public.finflow_transactions(date DESC);

-- FinFlow: Metas
CREATE TABLE IF NOT EXISTS public.finflow_goals (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label      text        NOT NULL,
  icon       text        NOT NULL DEFAULT '🎯',
  target     numeric     NOT NULL CHECK (target > 0),
  current    numeric     NOT NULL DEFAULT 0 CHECK (current >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.finflow_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON public.finflow_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON public.finflow_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON public.finflow_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON public.finflow_goals FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ff_goals_user_id ON public.finflow_goals(user_id);
