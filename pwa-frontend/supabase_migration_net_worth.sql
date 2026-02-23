-- Adiciona a coluna base_net_worth na tabela de perfis de usuário existente
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS base_net_worth DECIMAL(12,2) DEFAULT 0.00;

-- Atualizar o último momento de sync
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW();
