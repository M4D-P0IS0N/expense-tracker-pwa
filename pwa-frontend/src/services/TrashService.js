export class TrashService {
    static storageKey = '@appdecustos/deleted_ids';

    static getDeletedIds() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }

    static moveToTrash(transactionId) {
        const ids = this.getDeletedIds();
        if (!ids.includes(transactionId)) {
            ids.push(transactionId);
            localStorage.setItem(this.storageKey, JSON.stringify(ids));
        }
    }

    static restoreFromTrash(transactionId) {
        let ids = this.getDeletedIds();
        ids = ids.filter(id => id !== transactionId);
        localStorage.setItem(this.storageKey, JSON.stringify(ids));
    }
}
