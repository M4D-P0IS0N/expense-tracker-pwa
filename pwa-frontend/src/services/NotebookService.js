import { supabase } from './supabaseClient.js';
import { AuthService } from './AuthService.js';

async function getCurrentUserId() {
    try {
        const session = await AuthService.getSession();
        return session?.user?.id || null;
    } catch {
        return null;
    }
}

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
        const rawData = (typeof localStorage !== 'undefined') ? localStorage.getItem(storageKey) : null;

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
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(storageKey, JSON.stringify(initialData));
                }
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
        const rawData = (typeof localStorage !== 'undefined') ? localStorage.getItem(storageKey) : null;
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

    static async fetchNotes(year, month) {
        const parsedYear = parseInt(year, 10);
        const parsedMonth = parseInt(month, 10);
        const localContent = this.getNotes(parsedYear, parsedMonth);
        const localHistory = this.getHistory(parsedYear, parsedMonth);

        const userId = await getCurrentUserId();
        if (!userId || !supabase) {
            return { content: localContent, history: localHistory };
        }

        try {
            const { data, error } = await supabase
                .from('notebook_notes')
                .select('*')
                .eq('user_id', userId)
                .eq('year', parsedYear)
                .eq('month', parsedMonth)
                .maybeSingle();

            if (error) {
                console.warn('Erro ao buscar notas do Supabase:', error);
                return { content: localContent, history: localHistory };
            }

            if (data) {
                const cloudContent = data.content || '';
                const cloudHistory = Array.isArray(data.history) ? data.history : [];
                const monthlyData = {
                    content: cloudContent,
                    history: cloudHistory
                };

                if (typeof localStorage !== 'undefined') {
                    const storageKey = this.getStorageKey(parsedYear, parsedMonth);
                    localStorage.setItem(storageKey, JSON.stringify(monthlyData));
                }

                return monthlyData;
            } else if (localContent) {
                // Auto-migração para nuvem se existia localmente mas não no Supabase
                const monthlyData = {
                    content: localContent,
                    history: localHistory
                };
                await this.saveNotesToCloud(localContent, localHistory, parsedYear, parsedMonth, userId);
                return monthlyData;
            }

            return { content: '', history: [] };
        } catch (err) {
            console.warn('Exceção ao buscar notas do Supabase:', err);
            return { content: localContent, history: localHistory };
        }
    }

    static async saveNotesToCloud(content, history, year, month, userId = null) {
        const uid = userId || await getCurrentUserId();
        if (!uid || !supabase) return;

        try {
            const { error } = await supabase
                .from('notebook_notes')
                .upsert({
                    user_id: uid,
                    year: parseInt(year, 10),
                    month: parseInt(month, 10),
                    content: content || '',
                    history: Array.isArray(history) ? history : [],
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,year,month' });

            if (error) {
                console.error('Erro ao salvar notas no Supabase:', error);
            }
        } catch (err) {
            console.error('Exceção ao salvar notas no Supabase:', err);
        }
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
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(storageKey, JSON.stringify(monthlyData));
        }

        // Salva de forma assíncrona no Supabase
        this.saveNotesToCloud(newContent, updatedHistory, year, month).catch(err => {
            console.error('Falha ao sincronizar nota com a nuvem:', err);
        });

        return monthlyData;
    }

    static async syncAllNotes() {
        const userId = await getCurrentUserId();
        if (!userId || !supabase) return [];

        try {
            const { data, error } = await supabase
                .from('notebook_notes')
                .select('*')
                .eq('user_id', userId);

            if (error) {
                console.warn('Erro ao sincronizar todas as notas do Supabase:', error);
                return [];
            }

            const cloudMap = new Map();
            if (Array.isArray(data)) {
                data.forEach(item => {
                    const key = `${item.year}_${item.month}`;
                    cloudMap.set(key, item);
                    if (typeof localStorage !== 'undefined') {
                        const storageKey = this.getStorageKey(item.year, item.month);
                        localStorage.setItem(storageKey, JSON.stringify({
                            content: item.content || '',
                            history: item.history || []
                        }));
                    }
                });
            }

            // Sobe notas locais que ainda não estão no Supabase
            if (typeof localStorage !== 'undefined') {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('@appdecustos/notebook_') && !key.includes('meta')) {
                        const parts = key.replace('@appdecustos/notebook_', '').split('_');
                        if (parts.length === 2) {
                            const y = parseInt(parts[0], 10);
                            const m = parseInt(parts[1], 10);
                            if (y && m) {
                                const cloudKey = `${y}_${m}`;
                                if (!cloudMap.has(cloudKey)) {
                                    const localContent = this.getNotes(y, m);
                                    const localHistory = this.getHistory(y, m);
                                    if (localContent || (localHistory && localHistory.length > 0)) {
                                        await this.saveNotesToCloud(localContent, localHistory, y, m, userId);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            return data || [];
        } catch (err) {
            console.warn('Exceção ao sincronizar todas as notas:', err);
            return [];
        }
    }

    static async getAllNotes() {
        const userId = await getCurrentUserId();
        if (!userId || !supabase) return [];

        const { data, error } = await supabase
            .from('notebook_notes')
            .select('*')
            .eq('user_id', userId)
            .order('year', { ascending: true })
            .order('month', { ascending: true });

        if (error) {
            console.error('Erro ao buscar todas as notas:', error);
            return [];
        }
        return data || [];
    }

    static async bulkUpsertNotes(notesList) {
        const userId = await getCurrentUserId();
        if (!userId || !supabase) return 0;
        if (!Array.isArray(notesList) || notesList.length === 0) return 0;

        const payload = notesList.map(note => ({
            user_id: userId,
            year: parseInt(note.year, 10),
            month: parseInt(note.month, 10),
            content: note.content || '',
            history: Array.isArray(note.history) ? note.history : [],
            updated_at: new Date().toISOString()
        }));

        const { data, error } = await supabase
            .from('notebook_notes')
            .upsert(payload, { onConflict: 'user_id,year,month' })
            .select('id');

        if (error) {
            console.error('Erro ao importar lote de notas:', error);
            throw error;
        }

        return data ? data.length : payload.length;
    }

    static getLegacyNotes() {
        if (typeof localStorage === 'undefined') return '';
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
        if (typeof localStorage === 'undefined') return null;
        try {
            return JSON.parse(localStorage.getItem(this.globalMetaKey)) || null;
        } catch {
            return null;
        }
    }
}
