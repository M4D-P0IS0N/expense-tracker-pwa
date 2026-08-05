export class NotebookService {
    static globalStorageKey = '@appdecustos/notebook_notes';
    static globalMetaKey = '@appdecustos/notebook_meta';

    static getStorageKey(year, month) {
        if (!year || !month) return this.globalStorageKey;
        return `@appdecustos/notebook_${year}_${month}`;
    }

    static getNotes(year, month) {
        if (!year || !month) {
            return this.getLegacyNotes();
        }

        const storageKey = this.getStorageKey(year, month);
        const rawData = localStorage.getItem(storageKey);

        if (rawData === null) {
            const legacyNotes = this.getLegacyNotes();
            if (legacyNotes) {
                const legacyMeta = this.getLegacyMeta();
                const initialHistory = [];
                if (legacyMeta) {
                    initialHistory.push({
                        id: `legacy_${Date.now()}`,
                        timestamp: legacyMeta.lastEdited || new Date().toISOString(),
                        added: legacyMeta.added || [],
                        removed: legacyMeta.removed || []
                    });
                }
                const initialData = {
                    content: legacyNotes,
                    history: initialHistory
                };
                localStorage.setItem(storageKey, JSON.stringify(initialData));
                return legacyNotes;
            }
            return '';
        }

        try {
            const parsedData = JSON.parse(rawData);
            return typeof parsedData === 'object' && parsedData !== null ? (parsedData.content || '') : rawData;
        } catch {
            return rawData || '';
        }
    }

    static getHistory(year, month) {
        if (!year || !month) return [];
        const storageKey = this.getStorageKey(year, month);
        const rawData = localStorage.getItem(storageKey);
        if (!rawData) return [];

        try {
            const parsedData = JSON.parse(rawData);
            if (typeof parsedData === 'object' && parsedData !== null && Array.isArray(parsedData.history)) {
                return parsedData.history;
            }
        } catch {
            // Fallback if data was stored as plain text string
        }
        return [];
    }

    static saveNotes(newContent, year, month) {
        if (!year || !month) {
            const currentDate = new Date();
            year = currentDate.getFullYear();
            month = currentDate.getMonth() + 1;
        }

        const currentContent = this.getNotes(year, month);

        const oldLines = currentContent.split('\n').map(line => line.trim()).filter(Boolean);
        const newLines = newContent.split('\n').map(line => line.trim()).filter(Boolean);

        const removedLines = oldLines.filter(line => !newLines.includes(line));
        const addedLines = newLines.filter(line => !oldLines.includes(line));

        const existingHistory = this.getHistory(year, month);

        const newHistoryEntry = {
            id: `edit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            timestamp: new Date().toISOString(),
            added: addedLines,
            removed: removedLines
        };

        const updatedHistory = [newHistoryEntry, ...existingHistory].slice(0, 50);

        const monthlyData = {
            content: newContent,
            history: updatedHistory
        };

        const storageKey = this.getStorageKey(year, month);
        localStorage.setItem(storageKey, JSON.stringify(monthlyData));
        return monthlyData;
    }

    static getLegacyNotes() {
        let legacyNotes = localStorage.getItem(this.globalStorageKey);
        if (legacyNotes === null) {
            const oldNotes = localStorage.getItem('@appdecustos/larissa_notes');
            if (oldNotes !== null) {
                legacyNotes = oldNotes;
                localStorage.setItem(this.globalStorageKey, legacyNotes);
                localStorage.removeItem('@appdecustos/larissa_notes');

                const oldMeta = localStorage.getItem('@appdecustos/larissa_meta');
                if (oldMeta) {
                    localStorage.setItem(this.globalMetaKey, oldMeta);
                    localStorage.removeItem('@appdecustos/larissa_meta');
                }
            } else {
                legacyNotes = '';
            }
        }
        return legacyNotes;
    }

    static getLegacyMeta() {
        try {
            return JSON.parse(localStorage.getItem(this.globalMetaKey)) || null;
        } catch {
            return null;
        }
    }
}
