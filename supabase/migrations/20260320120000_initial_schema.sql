-- Fintrack initial schema

CREATE TYPE public.account_type AS ENUM ('checking', 'savings', 'credit_card', 'cash');
CREATE TYPE public.category_type AS ENUM ('income', 'expense');
CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
CREATE TYPE public.debit_frequency AS ENUM ('weekly', 'monthly', 'custom');
CREATE TYPE public.goal_type AS ENUM ('general', 'date_night');
CREATE TYPE public.idea_status AS ENUM ('idea', 'planned', 'done');

CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.account_type NOT NULL DEFAULT 'checking',
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.category_type NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name, type)
);

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  type public.transaction_type NOT NULL,
  note TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  debit_order_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.debit_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  frequency public.debit_frequency NOT NULL DEFAULT 'monthly',
  custom_interval_days INTEGER,
  next_due_date DATE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT debit_orders_custom_interval CHECK (
    frequency != 'custom' OR (custom_interval_days IS NOT NULL AND custom_interval_days > 0)
  )
);

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_debit_order_id_fkey
  FOREIGN KEY (debit_order_id) REFERENCES public.debit_orders(id) ON DELETE SET NULL;

CREATE TABLE public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  goal_type public.goal_type NOT NULL DEFAULT 'general',
  target_amount NUMERIC(14, 2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  target_date DATE,
  monthly_budget_cap NUMERIC(14, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.goal_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  contributed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.date_night_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  estimated_cost NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (estimated_cost >= 0),
  status public.idea_status NOT NULL DEFAULT 'idea',
  planned_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_occurred_at ON public.transactions(occurred_at);
CREATE INDEX idx_debit_orders_user_id ON public.debit_orders(user_id);
CREATE INDEX idx_debit_orders_next_due_date ON public.debit_orders(next_due_date);
CREATE INDEX idx_savings_goals_user_id ON public.savings_goals(user_id);
CREATE INDEX idx_goal_contributions_goal_id ON public.goal_contributions(goal_id);
CREATE INDEX idx_date_night_ideas_goal_id ON public.date_night_ideas(goal_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER accounts_updated_at BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER debit_orders_updated_at BEFORE UPDATE ON public.debit_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER savings_goals_updated_at BEFORE UPDATE ON public.savings_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER date_night_ideas_updated_at BEFORE UPDATE ON public.date_night_ideas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, type, color) VALUES
    (NEW.id, 'Salary', 'income', '#22c55e'),
    (NEW.id, 'Freelance', 'income', '#10b981'),
    (NEW.id, 'Other Income', 'income', '#14b8a6'),
    (NEW.id, 'Groceries', 'expense', '#ef4444'),
    (NEW.id, 'Rent', 'expense', '#f97316'),
    (NEW.id, 'Utilities', 'expense', '#eab308'),
    (NEW.id, 'Transport', 'expense', '#3b82f6'),
    (NEW.id, 'Entertainment', 'expense', '#a855f7'),
    (NEW.id, 'Fun / Relationship', 'expense', '#ec4899'),
    (NEW.id, 'Subscriptions', 'expense', '#6366f1'),
    (NEW.id, 'Other', 'expense', '#64748b');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debit_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_night_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts_select_own" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "accounts_insert_own" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "accounts_update_own" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "accounts_delete_own" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "categories_select_own" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "categories_insert_own" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_update_own" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "categories_delete_own" ON public.categories FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "transactions_select_own" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert_own" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update_own" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "transactions_delete_own" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "debit_orders_select_own" ON public.debit_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "debit_orders_insert_own" ON public.debit_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "debit_orders_update_own" ON public.debit_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "debit_orders_delete_own" ON public.debit_orders FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "savings_goals_select_own" ON public.savings_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "savings_goals_insert_own" ON public.savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "savings_goals_update_own" ON public.savings_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "savings_goals_delete_own" ON public.savings_goals FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "goal_contributions_select_own" ON public.goal_contributions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "goal_contributions_insert_own" ON public.goal_contributions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goal_contributions_update_own" ON public.goal_contributions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "goal_contributions_delete_own" ON public.goal_contributions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "date_night_ideas_select_own" ON public.date_night_ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "date_night_ideas_insert_own" ON public.date_night_ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "date_night_ideas_update_own" ON public.date_night_ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "date_night_ideas_delete_own" ON public.date_night_ideas FOR DELETE USING (auth.uid() = user_id);
