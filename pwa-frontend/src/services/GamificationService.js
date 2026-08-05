export class GamificationService {
    static storageKey = '@appdecustos/user_profile';

    static EVOLUTION_STAGES = [
        {
            id: 'stage1',
            maleLabel: 'Camponês Maltrapilho',
            femaleLabel: 'Camponesa Maltrapilha',
            maleSprite: 'stage1-m.png',
            femaleSprite: 'stage1-f.png',
            minLevel: 1,
        },
        {
            id: 'stage2',
            maleLabel: 'Camponês Comum',
            femaleLabel: 'Camponesa Comum',
            maleSprite: 'stage2-m.png',
            femaleSprite: 'stage2-f.png',
            minLevel: 10,
        },
        {
            id: 'stage3',
            maleLabel: 'Nobre Elegante',
            femaleLabel: 'Nobre Elegante',
            maleSprite: 'stage3-m.png',
            femaleSprite: 'stage3-f.png',
            minLevel: 25,
        },
        {
            id: 'stage4',
            maleLabel: 'Rei',
            femaleLabel: 'Rainha',
            maleSprite: 'stage4-m.png',
            femaleSprite: 'stage4-f.png',
            minLevel: 50,
        },
    ];

    static DEFAULT_PROFILE = {
        Level: 1,
        CurrentXP: 0,
        TotalXP: 0,
        XPToNextLevel: 1000,
        UnlockedAchievements: [],
        EvolutionStage: 'stage1',
        AvatarGender: null,
        totalTransactions: 0,
        loginStreak: 0,
        lastLoginDate: null,
        daysActive: 0,
        firstLoginDate: null,
        surplusMonths: 0,
        budgetWeeks: 0,
        totalSavingsGoals: 0,
        dataExportsCount: 0,
        earlyBirdCount: 0,
        categoryCount: 0,
        usedCategories: [],
    };

    static XP_PER_TRANSACTION = 10;
    static XP_BUDGET_WEEKLY = 100;
    static XP_SAVINGS_GOAL = 500;
    static XP_PER_LEVEL = 1000;

    static ALL_ACHIEVEMENTS = [
        // --- Milestone: Transactions ---
        { Id: "first_transaction", Name: "Primeiros Passos", Description: "Registre sua primeira transação.", Icon: "egg_alt", IconColor: "text-amber-400", MaxProgress: 1, TrackKey: "totalTransactions" },
        { Id: "tx_50", Name: "Contabilista Júnior", Description: "Registre 50 transações.", Icon: "edit_note", IconColor: "text-blue-400", MaxProgress: 50, TrackKey: "totalTransactions" },
        { Id: "tx_200", Name: "Contador Dedicado", Description: "Registre 200 transações.", Icon: "insights", IconColor: "text-cyan-400", MaxProgress: 200, TrackKey: "totalTransactions" },
        { Id: "tx_500", Name: "Auditor Financeiro", Description: "Registre 500 transações.", Icon: "calculate", IconColor: "text-purple-400", MaxProgress: 500, TrackKey: "totalTransactions" },
        { Id: "tx_1000", Name: "Mestre das Planilhas", Description: "Registre 1.000 transações.", Icon: "monitoring", IconColor: "text-emerald-400", MaxProgress: 1000, TrackKey: "totalTransactions" },
        { Id: "tx_2000", Name: "Lenda da Contabilidade", Description: "Registre 2.000 transações.", Icon: "crown", IconColor: "text-yellow-400", MaxProgress: 2000, TrackKey: "totalTransactions" },
        // --- Milestone: Level ---
        { Id: "level_10", Name: "Estrela Ascendente", Description: "Alcance o Nível 10.", Icon: "star", IconColor: "text-yellow-300", MaxProgress: 10, TrackKey: "Level" },
        { Id: "level_25", Name: "Meia-Nobreza", Description: "Alcance o Nível 25.", Icon: "military_tech", IconColor: "text-orange-400", MaxProgress: 25, TrackKey: "Level" },
        { Id: "level_50", Name: "Renascimento", Description: "Complete seu primeiro ciclo de evolução.", Icon: "local_fire_department", IconColor: "text-red-400", MaxProgress: 50, TrackKey: "Level" },
        // --- Streak & Discipline ---
        { Id: "streak_7", Name: "Guerreiro Semanal", Description: "Abra o app 7 dias seguidos.", Icon: "swords", IconColor: "text-slate-300", MaxProgress: 7, TrackKey: "loginStreak" },
        { Id: "streak_30", Name: "Disciplina de Ferro", Description: "Abra o app 30 dias seguidos.", Icon: "shield", IconColor: "text-blue-300", MaxProgress: 30, TrackKey: "loginStreak" },
        { Id: "streak_100", Name: "Centenário de Elite", Description: "Mantenha o foco e abra o app por 100 dias seguidos.", Icon: "workspace_premium", IconColor: "text-amber-400", MaxProgress: 100, TrackKey: "loginStreak" },
        { Id: "budget_master", Name: "Mestre do Orçamento", Description: "Fique dentro do orçamento por 4 semanas.", Icon: "savings", IconColor: "text-green-400", MaxProgress: 4, TrackKey: "budgetWeeks" },
        // --- Savings & Tools ---
        { Id: "savings_first", Name: "Primeiro Cofre", Description: "Crie sua primeira caixinha de economia.", Icon: "savings", IconColor: "text-emerald-400", MaxProgress: 1, TrackKey: "totalSavingsGoals" },
        { Id: "savings_champion", Name: "Campeão da Poupança", Description: "Complete uma meta de caixinha.", Icon: "emoji_events", IconColor: "text-amber-500", MaxProgress: 1, TrackKey: null },
        { Id: "exporter_pro", Name: "Guardião dos Dados", Description: "Realize um backup ou exportação dos seus dados.", Icon: "cloud_download", IconColor: "text-blue-400", MaxProgress: 1, TrackKey: "dataExportsCount" },
        { Id: "early_bird", Name: "Madrugador Financeiro", Description: "Registre uma transação logo cedo (antes das 08h).", Icon: "wb_sunny", IconColor: "text-amber-300", MaxProgress: 1, TrackKey: "earlyBirdCount" },
        { Id: "category_explorer", Name: "Mestre da Organização", Description: "Categorize lançamentos em pelo menos 5 categorias diferentes.", Icon: "category", IconColor: "text-purple-400", MaxProgress: 5, TrackKey: "categoryCount" },
        // --- Anniversary ---
        { Id: "anniversary_1m", Name: "1 Mês Juntos", Description: "Use o app por 1 mês.", Icon: "event_available", IconColor: "text-teal-400", MaxProgress: 30, TrackKey: "daysActive" },
        { Id: "anniversary_6m", Name: "Meio Ano de Jornada", Description: "Use o app por 6 meses.", Icon: "calendar_month", IconColor: "text-indigo-400", MaxProgress: 180, TrackKey: "daysActive" },
        { Id: "anniversary_1y", Name: "Aniversário de 1 Ano", Description: "Use o app por 1 ano completo!", Icon: "cake", IconColor: "text-pink-400", MaxProgress: 365, TrackKey: "daysActive" },
        // --- Secret Achievement ---
        {
            Id: "secret_pao_duro", Name: "Conquista Secreta", Description: "???????", Icon: "help", IconColor: "text-slate-500", MaxProgress: 3, TrackKey: "surplusMonths", IsSecret: true,
            RevealedName: "O Pão-Duro Lendário", RevealedDescription: "Gastou menos do que ganhou por 3 meses consecutivos. Avarento de respeito!", RevealedIcon: "bakery_dining", RevealedIconColor: "text-amber-600"
        },
    ];

    static getProfile() {
        const data = localStorage.getItem(this.storageKey);
        if (!data) return { ...this.DEFAULT_PROFILE };

        const profile = { ...this.DEFAULT_PROFILE, ...JSON.parse(data) };

        // Migration: convert old EvolutionStage values to new format
        if (['Apprentice', 'Adept', 'Master', 'Archmage'].includes(profile.EvolutionStage)) {
            const migrationMap = { 'Apprentice': 'stage1', 'Adept': 'stage2', 'Master': 'stage3', 'Archmage': 'stage4' };
            profile.EvolutionStage = migrationMap[profile.EvolutionStage] || 'stage1';
        }

        if (!profile.AvatarGender) {
            profile.AvatarGender = null;
        }

        // Ensure TotalXP is calculated and consistent with Level & CurrentXP
        const previousCalculatedXP = ((profile.Level || 1) - 1) * this.XP_PER_LEVEL + (profile.CurrentXP || 0);
        profile.TotalXP = Math.max(profile.TotalXP || 0, previousCalculatedXP);

        return profile;
    }

    static saveProfile(profile) {
        profile.LastUpdated = new Date().toISOString();
        localStorage.setItem(this.storageKey, JSON.stringify(profile));
    }

    static getStageDefinition(stageId) {
        return this.EVOLUTION_STAGES.find(s => s.id === stageId) || this.EVOLUTION_STAGES[0];
    }

    static getStageLabel(stageId, avatarGender) {
        const stageDef = this.getStageDefinition(stageId);
        return avatarGender === 'female' ? stageDef.femaleLabel : stageDef.maleLabel;
    }

    static getSpriteFilename(stageId, avatarGender) {
        const stageDef = this.getStageDefinition(stageId);
        return avatarGender === 'female' ? stageDef.femaleSprite : stageDef.maleSprite;
    }

    static getEvolutionStage(level) {
        if (level >= 50) return 'stage4';
        if (level >= 25) return 'stage3';
        if (level >= 10) return 'stage2';
        return 'stage1';
    }

    static setAvatarGender(gender) {
        const profile = this.getProfile();
        profile.AvatarGender = gender;
        this.saveProfile(profile);
        return profile;
    }

    static addXP(profile, amount) {
        profile.TotalXP = (profile.TotalXP || 0) + amount;
        profile.Level = Math.floor(profile.TotalXP / this.XP_PER_LEVEL) + 1;
        profile.CurrentXP = profile.TotalXP % this.XP_PER_LEVEL;
        profile.XPToNextLevel = this.XP_PER_LEVEL;

        if (profile.Level >= 10) this.tryUnlockAchievement(profile, "level_10");
        if (profile.Level >= 25) this.tryUnlockAchievement(profile, "level_25");
        if (profile.Level >= 50) this.tryUnlockAchievement(profile, "level_50");

        profile.EvolutionStage = this.getEvolutionStage(profile.Level);
        return profile;
    }

    static tryUnlockAchievement(profile, achievementId) {
        if (profile.UnlockedAchievements.some(a => a.Id === achievementId)) return;

        const def = this.ALL_ACHIEVEMENTS.find(a => a.Id === achievementId);
        if (!def) return;

        profile.UnlockedAchievements.push({
            Id: def.Id,
            Name: def.Name,
            Description: def.Description,
            UnlockedAt: new Date().toISOString()
        });
    }

    static onTransactionLogged(transactionData = null) {
        let profile = this.getProfile();
        profile.totalTransactions = (profile.totalTransactions || 0) + 1;
        this.addXP(profile, this.XP_PER_TRANSACTION);

        if (transactionData) {
            if (transactionData.category) {
                if (!Array.isArray(profile.usedCategories)) profile.usedCategories = [];
                if (!profile.usedCategories.includes(transactionData.category)) {
                    profile.usedCategories.push(transactionData.category);
                }
                profile.categoryCount = profile.usedCategories.length;
                if (profile.categoryCount >= 5) this.tryUnlockAchievement(profile, "category_explorer");
            }

            if (transactionData.date) {
                const txDate = new Date(transactionData.date);
                if (!isNaN(txDate.getTime()) && txDate.getHours() < 8) {
                    profile.earlyBirdCount = (profile.earlyBirdCount || 0) + 1;
                    this.tryUnlockAchievement(profile, "early_bird");
                }
            }
        }

        this.tryUnlockAchievement(profile, "first_transaction");
        if (profile.totalTransactions >= 50) this.tryUnlockAchievement(profile, "tx_50");
        if (profile.totalTransactions >= 200) this.tryUnlockAchievement(profile, "tx_200");
        if (profile.totalTransactions >= 500) this.tryUnlockAchievement(profile, "tx_500");
        if (profile.totalTransactions >= 1000) this.tryUnlockAchievement(profile, "tx_1000");
        if (profile.totalTransactions >= 2000) this.tryUnlockAchievement(profile, "tx_2000");

        this.saveProfile(profile);
        return profile;
    }

    static onSavingsGoalCreated() {
        let profile = this.getProfile();
        profile.totalSavingsGoals = (profile.totalSavingsGoals || 0) + 1;
        this.tryUnlockAchievement(profile, "savings_first");
        this.addXP(profile, 100);
        this.saveProfile(profile);
        return profile;
    }

    static onSavingsGoalCompleted() {
        let profile = this.getProfile();
        this.tryUnlockAchievement(profile, "savings_champion");
        this.addXP(profile, 200);
        this.saveProfile(profile);
        return profile;
    }

    static onDataExported() {
        let profile = this.getProfile();
        profile.dataExportsCount = (profile.dataExportsCount || 0) + 1;
        this.tryUnlockAchievement(profile, "exporter_pro");
        this.addXP(profile, 50);
        this.saveProfile(profile);
        return profile;
    }

    static trackDailyLogin() {
        let profile = this.getProfile();
        const today = new Date().toISOString().split('T')[0];

        if (!profile.firstLoginDate) {
            profile.firstLoginDate = today;
        }

        const firstDate = new Date(profile.firstLoginDate);
        const todayDate = new Date(today);
        profile.daysActive = Math.floor((todayDate - firstDate) / (1000 * 60 * 60 * 24));

        if (profile.lastLoginDate) {
            const lastDate = new Date(profile.lastLoginDate);
            const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                profile.loginStreak = (profile.loginStreak || 0) + 1;
            } else if (diffDays > 1) {
                profile.loginStreak = 1;
            }
        } else {
            profile.loginStreak = 1;
        }
        profile.lastLoginDate = today;

        if (profile.loginStreak >= 7) this.tryUnlockAchievement(profile, "streak_7");
        if (profile.loginStreak >= 30) this.tryUnlockAchievement(profile, "streak_30");
        if (profile.loginStreak >= 100) this.tryUnlockAchievement(profile, "streak_100");

        if (profile.daysActive >= 30) this.tryUnlockAchievement(profile, "anniversary_1m");
        if (profile.daysActive >= 180) this.tryUnlockAchievement(profile, "anniversary_6m");
        if (profile.daysActive >= 365) this.tryUnlockAchievement(profile, "anniversary_1y");

        this.saveProfile(profile);
        return profile;
    }

    static recordSurplusMonth() {
        let profile = this.getProfile();
        profile.surplusMonths = (profile.surplusMonths || 0) + 1;
        if (profile.surplusMonths >= 3) this.tryUnlockAchievement(profile, "secret_pao_duro");
        this.saveProfile(profile);
    }

    static resetSurplusMonths() {
        let profile = this.getProfile();
        profile.surplusMonths = 0;
        this.saveProfile(profile);
    }

    static getAchievementProgress(achievementDef, profile) {
        if (!achievementDef.TrackKey) return { current: 0, max: achievementDef.MaxProgress || 1 };
        const current = Math.min(profile[achievementDef.TrackKey] || 0, achievementDef.MaxProgress);
        return { current, max: achievementDef.MaxProgress };
    }

    /**
     * Sincroniza o perfil com dados históricos do banco. 
     */
    static async syncWithDatabase(TransactionService) {
        let profile = this.getProfile();
        if (!TransactionService) return profile;

        const totalCount = await TransactionService.getTotalTransactionCount();
        const firstDateStr = await TransactionService.getFirstTransactionDate();

        let updated = false;

        if (totalCount > (profile.totalTransactions || 0)) {
            profile.totalTransactions = totalCount;
            if (profile.totalTransactions >= 1) this.tryUnlockAchievement(profile, "first_transaction");
            if (profile.totalTransactions >= 50) this.tryUnlockAchievement(profile, "tx_50");
            if (profile.totalTransactions >= 200) this.tryUnlockAchievement(profile, "tx_200");
            if (profile.totalTransactions >= 500) this.tryUnlockAchievement(profile, "tx_500");
            if (profile.totalTransactions >= 1000) this.tryUnlockAchievement(profile, "tx_1000");
            if (profile.totalTransactions >= 2000) this.tryUnlockAchievement(profile, "tx_2000");
            updated = true;
        }

        const minimumExpectedXP = (profile.totalTransactions || 0) * this.XP_PER_TRANSACTION;
        if ((profile.TotalXP || 0) < minimumExpectedXP) {
            this.addXP(profile, minimumExpectedXP - (profile.TotalXP || 0));
            updated = true;
        }

        if (firstDateStr && !profile.firstLoginDate) {
            const firstDate = new Date(firstDateStr.split('T')[0]);
            const todayDate = new Date(new Date().toISOString().split('T')[0]);
            const daysActive = Math.floor((todayDate - firstDate) / (1000 * 60 * 60 * 24));

            profile.firstLoginDate = firstDateStr.split('T')[0];
            profile.daysActive = Math.max(profile.daysActive || 0, daysActive);

            if (profile.daysActive >= 30) this.tryUnlockAchievement(profile, "anniversary_1m");
            if (profile.daysActive >= 180) this.tryUnlockAchievement(profile, "anniversary_6m");
            if (profile.daysActive >= 365) this.tryUnlockAchievement(profile, "anniversary_1y");
            updated = true;
        }

        if (updated) {
            this.saveProfile(profile);
        }
        return profile;
    }
}

