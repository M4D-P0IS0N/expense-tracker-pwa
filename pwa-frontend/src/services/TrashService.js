import { accountStorage } from './accountStorage.js';
export class TrashService {
    static storageKey = '@appdecustos/deleted_ids';

    static getDeletedIds() {
        const data = accountStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }

    static moveToTrash(transactionId) {
        const ids = this.getDeletedIds();
        if (!ids.includes(transactionId)) {
            ids.push(transactionId);
            accountStorage.setItem(this.storageKey, JSON.stringify(ids));
        }
    }

    static restoreFromTrash(transactionId) {
        let ids = this.getDeletedIds();
        ids = ids.filter(id => id !== transactionId);
        accountStorage.setItem(this.storageKey, JSON.stringify(ids));
    }

    static clearTrash() {
        accountStorage.removeItem(this.storageKey);
    }
}
