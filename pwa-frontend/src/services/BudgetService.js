import { accountStorage } from './accountStorage.js';
export class BudgetService {
    static storageKey = '@appdecustos/budgets';

    static getBudgets() {
        const data = accountStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : {};
    }

    static getBudget(category) {
        const budgets = this.getBudgets();
        return budgets[category] || 0; // 0 means no budget set
    }

    static setBudget(category, amount) {
        const budgets = this.getBudgets();
        if (amount <= 0) {
            delete budgets[category];
        } else {
            budgets[category] = amount;
        }
        accountStorage.setItem(this.storageKey, JSON.stringify(budgets));
    }
}
