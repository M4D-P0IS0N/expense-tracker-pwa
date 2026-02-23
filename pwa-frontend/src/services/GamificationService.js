export class GamificationService {
    static storageKey = '@appdecustos/user_profile';

    static DEFAULT_PROFILE = {
        Level: 1,
        CurrentXP: 0,
        XPToNextLevel: 1000,
        UnlockedAchievements: [],
        EvolutionStage: 'Apprentice', // Apprentice, Adept, Master, Archmage
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
        return data ? JSON.parse(data) : { ...this.DEFAULT_PROFILE };
    }

    static saveProfile(profile) {
        profile.LastUpdated = new Date().toISOString();
        localStorage.setItem(this.storageKey, JSON.stringify(profile));
    }

    static getEvolutionStage(level) {
        if (level >= 50) return 'Archmage';
        if (level >= 25) return 'Master';
        if (level >= 10) return 'Adept';
        return 'Apprentice';
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
