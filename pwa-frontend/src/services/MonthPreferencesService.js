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

export class MonthPreferencesService {
    static getStorageKey(year, month) {
        const parsedMonth = parseInt(month, 10).toString();
        const parsedYear = parseInt(year, 10).toString();
        return `split_by_two_${parsedYear}_${parsedMonth}`;
    }

    static getSplitByTwoFromCache(year, month) {
        if (typeof localStorage === 'undefined') return false;
        const storageKey = this.getStorageKey(year, month);
        return localStorage.getItem(storageKey) === 'true';
    }

    static async getSplitByTwo(year, month) {
        const parsedYear = parseInt(year, 10);
        const parsedMonth = parseInt(month, 10);
        const cachedValue = this.getSplitByTwoFromCache(parsedYear, parsedMonth);

        const userId = await getCurrentUserId();
        if (!userId || !supabase) {
            return cachedValue;
        }

        try {
            const { data, error } = await supabase
                .from('month_preferences')
                .select('is_split_by_2')
                .eq('user_id', userId)
                .eq('year', parsedYear)
                .eq('month', parsedMonth)
                .maybeSingle();

            if (error) {
                console.warn('Erro ao carregar preferência de mês do Supabase:', error);
                return cachedValue;
            }

            if (data) {
                const isEnabled = Boolean(data.is_split_by_2);
                if (typeof localStorage !== 'undefined') {
                    const storageKey = this.getStorageKey(parsedYear, parsedMonth);
                    if (isEnabled) {
                        localStorage.setItem(storageKey, 'true');
                    } else {
                        localStorage.removeItem(storageKey);
                    }
                }
                return isEnabled;
            } else if (cachedValue) {
                // Auto-migração: Se existia apenas no localStorage, sobe para o Supabase
                this.setSplitByTwo(parsedYear, parsedMonth, true).catch(err => {
                    console.warn('Falha na auto-migração de preferência local para Supabase:', err);
                });
                return true;
            }

            return false;
        } catch (err) {
            console.warn('Exceção ao obter preferência do Supabase:', err);
            return cachedValue;
        }
    }

    static async setSplitByTwo(year, month, isEnabled) {
        const parsedYear = parseInt(year, 10);
        const parsedMonth = parseInt(month, 10);
        const booleanValue = Boolean(isEnabled);

        if (typeof localStorage !== 'undefined') {
            const storageKey = this.getStorageKey(parsedYear, parsedMonth);
            if (booleanValue) {
                localStorage.setItem(storageKey, 'true');
            } else {
                localStorage.removeItem(storageKey);
            }
        }

        const userId = await getCurrentUserId();
        if (!userId || !supabase) {
            return booleanValue;
        }

        try {
            const { error } = await supabase
                .from('month_preferences')
                .upsert({
                    user_id: userId,
                    year: parsedYear,
                    month: parsedMonth,
                    is_split_by_2: booleanValue,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,year,month' });

            if (error) {
                console.error('Erro ao salvar preferência de mês no Supabase:', error);
            }
        } catch (err) {
            console.error('Exceção ao salvar preferência no Supabase:', err);
        }

        return booleanValue;
    }

    static async syncAllPreferences() {
        const userId = await getCurrentUserId();
        if (!userId || !supabase) return [];

        try {
            const { data, error } = await supabase
                .from('month_preferences')
                .select('*')
                .eq('user_id', userId);

            if (error) {
                console.warn('Erro ao sincronizar todas as preferências do Supabase:', error);
                return [];
            }

            const cloudMap = new Map();
            if (Array.isArray(data)) {
                data.forEach(item => {
                    const key = `${item.year}_${item.month}`;
                    cloudMap.set(key, item);
                    if (typeof localStorage !== 'undefined') {
                        const storageKey = this.getStorageKey(item.year, item.month);
                        if (item.is_split_by_2) {
                            localStorage.setItem(storageKey, 'true');
                        } else {
                            localStorage.removeItem(storageKey);
                        }
                    }
                });
            }

            // Sobe configurações locais que ainda não estão na nuvem
            if (typeof localStorage !== 'undefined') {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('split_by_two_')) {
                        const parts = key.split('_');
                        // Formato: split_by_two_YYYY_M ou split_by_two_USERID_YYYY_M
                        let y, m;
                        if (parts.length === 4) {
                            y = parseInt(parts[2], 10);
                            m = parseInt(parts[3], 10);
                        } else if (parts.length === 5) {
                            y = parseInt(parts[3], 10);
                            m = parseInt(parts[4], 10);
                        }

                        if (y && m && localStorage.getItem(key) === 'true') {
                            const cloudKey = `${y}_${m}`;
                            if (!cloudMap.has(cloudKey)) {
                                await this.setSplitByTwo(y, m, true);
                            }
                        }
                    }
                }
            }

            return data || [];
        } catch (err) {
            console.warn('Exceção ao sincronizar preferências:', err);
            return [];
        }
    }

    static async getAllPreferences() {
        const userId = await getCurrentUserId();
        if (!userId || !supabase) return [];

        const { data, error } = await supabase
            .from('month_preferences')
            .select('*')
            .eq('user_id', userId)
            .order('year', { ascending: true })
            .order('month', { ascending: true });

        if (error) {
            console.error('Erro ao buscar todas as preferências:', error);
            return [];
        }
        return data || [];
    }

    static async bulkUpsertPreferences(preferencesList) {
        const userId = await getCurrentUserId();
        if (!userId || !supabase) return 0;
        if (!Array.isArray(preferencesList) || preferencesList.length === 0) return 0;

        const payload = preferencesList.map(pref => ({
            user_id: userId,
            year: parseInt(pref.year, 10),
            month: parseInt(pref.month, 10),
            is_split_by_2: Boolean(pref.is_split_by_2),
            updated_at: new Date().toISOString()
        }));

        const { data, error } = await supabase
            .from('month_preferences')
            .upsert(payload, { onConflict: 'user_id,year,month' })
            .select('id');

        if (error) {
            console.error('Erro ao importar lote de preferências:', error);
            throw error;
        }

        return data ? data.length : payload.length;
    }
}
