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
        XPToNextLevel: 1000,
        UnlockedAchievements: [],
        EvolutionStage: 'stage1',
        AvatarGender: null,
        // Progress tracking
        totalTransactions: 0,
        loginStreak: 0,
        lastLoginDate: null,
        daysActive: 0,
        firstLoginDate: null,
        surplusMonths: 0,
        budgetWeeks: 0,
    };

    static XP_PER_TRANSACTION = 10;
    static XP_BUDGET_WEEKLY = 100;
    static XP_SAVINGS_GOAL = 500;
    static XP_PER_LEVEL = 1000;

    static ALL_ACHIEVEMENTS = [
        // --- Milestone: Transactions ---
        { Id: "first_transaction", Name: "Primeiros Passos", Description: "Registre sua primeira transação.", Icon: "🐣", MaxProgress: 1, TrackKey: "totalTransactions" },
        { Id: "tx_50", Name: "Contabilista Júnior", Description: "Registre 50 transações.", Icon: "📝", MaxProgress: 50, TrackKey: "totalTransactions" },
        { Id: "tx_200", Name: "Contador Dedicado", Description: "Registre 200 transações.", Icon: "📊", MaxProgress: 200, TrackKey: "totalTransactions" },
        { Id: "tx_500", Name: "Auditor Financeiro", Description: "Registre 500 transações.", Icon: "🧮", MaxProgress: 500, TrackKey: "totalTransactions" },
        { Id: "tx_1000", Name: "Mestre das Planilhas", Description: "Registre 1.000 transações.", Icon: "📈", MaxProgress: 1000, TrackKey: "totalTransactions" },
        { Id: "tx_2000", Name: "Lenda da Contabilidade", Description: "Registre 2.000 transações.", Icon: "👑", MaxProgress: 2000, TrackKey: "totalTransactions" },

        // --- Milestone: Level ---
        { Id: "level_10", Name: "Estrela Ascendente", Description: "Alcance o Nível 10.", Icon: "⭐", MaxProgress: 10, TrackKey: "level" },
        { Id: "level_25", Name: "Meia-Nobreza", Description: "Alcance o Nível 25.", Icon: "🏅", MaxProgress: 25, TrackKey: "level" },
        { Id: "level_50", Name: "Renascimento", Description: "Complete seu primeiro ciclo de evolução.", Icon: "🔥", MaxProgress: 50, TrackKey: "level" },

        // --- Streak & Discipline ---
        { Id: "streak_7", Name: "Guerreiro Semanal", Description: "Abra o app 7 dias seguidos.", Icon: "⚔️", MaxProgress: 7, TrackKey: "loginStreak" },
        { Id: "streak_30", Name: "Disciplina de Ferro", Description: "Abra o app 30 dias seguidos.", Icon: "🛡️", MaxProgress: 30, TrackKey: "loginStreak" },
        { Id: "budget_master", Name: "Mestre do Orçamento", Description: "Fique dentro do orçamento por 4 semanas.", Icon: "💰", MaxProgress: 4, TrackKey: "budgetWeeks" },

        // --- Savings ---
        { Id: "savings_champion", Name: "Campeão da Poupança", Description: "Complete uma meta de caixinha.", Icon: "🏆", MaxProgress: 1, TrackKey: null },

        // --- Anniversary ---
        { Id: "anniversary_1m", Name: "1 Mês Juntos", Description: "Use o app por 1 mês.", Icon: "📅", MaxProgress: 30, TrackKey: "daysActive" },
        { Id: "anniversary_6m", Name: "Meio Ano de Jornada", Description: "Use o app por 6 meses.", Icon: "🗓️", MaxProgress: 180, TrackKey: "daysActive" },
        { Id: "anniversary_1y", Name: "Aniversário de 1 Ano", Description: "Use o app por 1 ano completo!", Icon: "🎂", MaxProgress: 365, TrackKey: "daysActive" },

        // --- Secret Achievement ---
        {
            Id: "secret_pao_duro", Name: "Conquista Secreta", Description: "???????", Icon: "❓", MaxProgress: 3, TrackKey: "surplusMonths", IsSecret: true,
            RevealedName: "O Pão-Duro Lendário", RevealedDescription: "Gastou menos do que ganhou por 3 meses consecutivos. Avarento de respeito!", RevealedIcon: "🥖"
        },
    ];

    static getProfile() {
        const data = localStorage.getItem(this.storageKey);
        if (!data) return { ...this.DEFAULT_PROFILE };

        const profile = JSON.parse(data);

        // Migration: convert old EvolutionStage values to new format
        if (['Apprentice', 'Adept', 'Master', 'Archmage'].includes(profile.EvolutionStage)) {
            const migrationMap = { 'Apprentice': 'stage1', 'Adept': 'stage2', 'Master': 'stage3', 'Archmage': 'stage4' };
            profile.EvolutionStage = migrationMap[profile.EvolutionStage] || 'stage1';
        }

        // Ensure AvatarGender field exists for old profiles
        if (!profile.AvatarGender) {
            profile.AvatarGender = null;
        }

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

    static checkLevelUp(profile) {
        let leveledUp = false;
        while (profile.CurrentXP >= profile.XPToNextLevel) {
            profile.CurrentXP -= profile.XPToNextLevel;
            profile.Level++;
            profile.XPToNextLevel = this.XP_PER_LEVEL;
            leveledUp = true;

            // Achievements
            if (profile.Level === 10) this.tryUnlockAchievement(profile, "level_10");
            if (profile.Level === 50) this.tryUnlockAchievement(profile, "level_50");
        }

        // Update Stage
        const newStage = this.getEvolutionStage(profile.Level);
        if (newStage !== profile.EvolutionStage) {
            profile.EvolutionStage = newStage;
        }

        return { leveledUp, profile };
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

    static onTransactionLogged() {
        let profile = this.getProfile();
        profile.CurrentXP += this.XP_PER_TRANSACTION;
        profile.totalTransactions = (profile.totalTransactions || 0) + 1;

        // Check transaction milestone achievements
        this.tryUnlockAchievement(profile, "first_transaction");
        if (profile.totalTransactions >= 50) this.tryUnlockAchievement(profile, "tx_50");
        if (profile.totalTransactions >= 200) this.tryUnlockAchievement(profile, "tx_200");
        if (profile.totalTransactions >= 500) this.tryUnlockAchievement(profile, "tx_500");
        if (profile.totalTransactions >= 1000) this.tryUnlockAchievement(profile, "tx_1000");
        if (profile.totalTransactions >= 2000) this.tryUnlockAchievement(profile, "tx_2000");

        const result = this.checkLevelUp(profile);
        // Check level achievements
        if (result.profile.Level >= 25) this.tryUnlockAchievement(result.profile, "level_25");

        this.saveProfile(result.profile);
        return { xpGained: this.XP_PER_TRANSACTION, ...result };
    }

    static trackDailyLogin() {
        let profile = this.getProfile();
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Set first login date if not set
        if (!profile.firstLoginDate) {
            profile.firstLoginDate = today;
        }

        // Calculate days active since first login
        const firstDate = new Date(profile.firstLoginDate);
        const todayDate = new Date(today);
        profile.daysActive = Math.floor((todayDate - firstDate) / (1000 * 60 * 60 * 24));

        // Track login streak
        if (profile.lastLoginDate) {
            const lastDate = new Date(profile.lastLoginDate);
            const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                profile.loginStreak = (profile.loginStreak || 0) + 1;
            } else if (diffDays > 1) {
                profile.loginStreak = 1; // Reset streak
            }
            // diffDays === 0 means same day, keep streak
        } else {
            profile.loginStreak = 1;
        }
        profile.lastLoginDate = today;

        // Check streak achievements
        if (profile.loginStreak >= 7) this.tryUnlockAchievement(profile, "streak_7");
        if (profile.loginStreak >= 30) this.tryUnlockAchievement(profile, "streak_30");

        // Check anniversary achievements
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
}
