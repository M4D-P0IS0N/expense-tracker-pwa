-- Tabela de Perfil de Usuário
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level INT NOT NULL DEFAULT 1,
    current_xp INT NOT NULL DEFAULT 0,
    xp_to_next_level INT NOT NULL DEFAULT 1000,
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
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- Tabela de Metas de Economia (Savings Goals)
CREATE TABLE savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    target_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
    is_recurring BOOLEAN DEFAULT FALSE
);
