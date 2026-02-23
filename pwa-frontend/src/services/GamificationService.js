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
        AvatarGender: null, // 'male' or 'female' — null means not chosen yet
    };

    static XP_PER_TRANSACTION = 10;
    static XP_BUDGET_WEEKLY = 100;
    static XP_SAVINGS_GOAL = 500;
    static XP_PER_LEVEL = 1000;

    static ALL_ACHIEVEMENTS = [
        { Id: "first_transaction", Name: "First Steps", Description: "Log your first transaction." },
        { Id: "level_10", Name: "Rising Star", Description: "Reach Level 10." },
        { Id: "level_50", Name: "Rebirth", Description: "Complete your first evolution cycle." },
        { Id: "budget_master", Name: "Budget Master", Description: "Stay under budget for 4 weeks in a row." },
        { Id: "savings_champion", Name: "Savings Champion", Description: "Complete a savings goal." },
        { Id: "streak_7", Name: "Weekly Warrior", Description: "Open the app 7 days in a row." }
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
        this.tryUnlockAchievement(profile, "first_transaction");

        const result = this.checkLevelUp(profile);
        this.saveProfile(result.profile);

        // Return UI event trigger
        return { xpGained: this.XP_PER_TRANSACTION, ...result };
    }
}
