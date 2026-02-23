export class SavingsService {
    static storageKey = '@appdecustos/savings_goals';

    static getGoals() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }

    static getGoalById(id) {
        return this.getGoals().find(g => g.id === id);
    }

    static getTotalSaved() {
        const goals = this.getGoals();
        return goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    }

    static saveGoals(goals) {
        localStorage.setItem(this.storageKey, JSON.stringify(goals));
    }

    static addGoal(name, targetAmount, icon = '🎯') {
        const goals = this.getGoals();
        const newGoal = {
            id: crypto.randomUUID(),
            name,
            targetAmount: Number(targetAmount),
            currentAmount: 0,
            icon,
            createdAt: new Date().toISOString()
        };
        goals.push(newGoal);
        this.saveGoals(goals);
        return newGoal;
    }

    static updateGoal(id, updates) {
        const goals = this.getGoals();
        const index = goals.findIndex(g => g.id === id);
        if (index !== -1) {
            goals[index] = { ...goals[index], ...updates, updatedAt: new Date().toISOString() };
            this.saveGoals(goals);
            return goals[index];
        }
        return null;
    }

    static addFunds(id, amount) {
        const goals = this.getGoals();
        const index = goals.findIndex(g => g.id === id);
        if (index !== -1) {
            goals[index].currentAmount += Number(amount);
            this.saveGoals(goals);
            return goals[index];
        }
        return null;
    }

    static withdrawFunds(id, amount) {
        const goals = this.getGoals();
        const index = goals.findIndex(g => g.id === id);
        if (index !== -1) {
            goals[index].currentAmount = Math.max(0, goals[index].currentAmount - Number(amount));
            this.saveGoals(goals);
            return goals[index];
        }
        return null;
    }

    static deleteGoal(id) {
        let goals = this.getGoals();
        goals = goals.filter(g => g.id !== id);
        this.saveGoals(goals);
    }
}
