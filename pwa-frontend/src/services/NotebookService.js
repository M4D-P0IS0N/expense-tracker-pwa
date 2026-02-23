export class NotebookService {
    static storageKey = '@appdecustos/notebook_notes';
    static metaKey = '@appdecustos/notebook_meta';

    static getNotes() {
        let notes = localStorage.getItem(this.storageKey);
        if (notes === null) {
            // Migration from old 'larissa' key to new 'notebook' key
            const oldNotes = localStorage.getItem('@appdecustos/larissa_notes');
            if (oldNotes !== null) {
                notes = oldNotes;
                localStorage.setItem(this.storageKey, notes);
                localStorage.removeItem('@appdecustos/larissa_notes');

                // Migrate meta as well if present
                const oldMeta = localStorage.getItem('@appdecustos/larissa_meta');
                if (oldMeta) {
                    localStorage.setItem(this.metaKey, oldMeta);
                    localStorage.removeItem('@appdecustos/larissa_meta');
                }
            } else {
                notes = '';
            }
        }
        return notes;
    }

    static getMeta() {
        try {
            return JSON.parse(localStorage.getItem(this.metaKey)) || null;
        } catch {
            return null;
        }
    }

    static saveNotes(newContent) {
        const oldContent = this.getNotes();

        // Compute minimal line diff
        const oldLines = oldContent.split('\n').map(l => l.trim()).filter(Boolean);
        const newLines = newContent.split('\n').map(l => l.trim()).filter(Boolean);

        const removed = oldLines.filter(line => !newLines.includes(line));
        const added = newLines.filter(line => !oldLines.includes(line));

        const meta = {
            lastEdited: new Date().toISOString(),
            added: added,
            removed: removed
        };

        localStorage.setItem(this.storageKey, newContent);
        localStorage.setItem(this.metaKey, JSON.stringify(meta));
    }
}
