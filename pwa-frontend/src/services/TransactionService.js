import { supabase } from './supabaseClient.js';
import { AuthService } from './AuthService.js';
import { getEffectiveTransactionAmount } from '../utils/splitTransactionAmount.js';

async function getCurrentUserId() {
    const session = await AuthService.getSession();
    return session?.user?.id || null;
}

export class TransactionService {
    static async ensureUserProfile(userId) {
        if (!userId) return null;

        const profilePayload = {
            id: userId,
            last_sync: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('user_profiles')
            .upsert(profilePayload, { onConflict: 'id' })
            .select('id, base_net_worth')
            .single();

        if (error) {
            console.error("Error ensuring user profile:", error);
            return null;
        }

        return data;
    }

    /**
     * Get all transactions ordered by date descending, filtered by year and month
     * @param {number} year 
     * @param {number} month (1-12)
     */
    static async getTransactions(year, month) {
        const userId = await getCurrentUserId();
        if (!userId) return [];

        const parsedYear = parseInt(year, 10);
        const parsedMonth = parseInt(month, 10);
        const padMonth = String(parsedMonth).padStart(2, '0');
        const startDate = `${parsedYear}-${padMonth}-01T00:00:00.000Z`;
        const lastDay = new Date(Date.UTC(parsedYear, parsedMonth, 0)).getUTCDate();
        const endDate = `${parsedYear}-${padMonth}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`;

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false });

        if (error) {
            console.error("Error fetching transactions:", error);
            return [];
        }
        return data;
    }

    /**
     * Get the total count of transactions for the current user
     */
    static async getTotalTransactionCount() {
        const userId = await getCurrentUserId();
        if (!userId) return 0;

        const { count, error } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (error) {
            console.error("Error getting transaction count:", error);
            return 0;
        }
        return count || 0;
    }

    /**
     * Get the date of the very first transaction logged by the current user
     */
    static async getFirstTransactionDate() {
        const userId = await getCurrentUserId();
        if (!userId) return null;

        const { data, error } = await supabase
            .from('transactions')
            .select('date')
            .eq('user_id', userId)
            .order('date', { ascending: true })
            .limit(1);

        if (error || !data || data.length === 0) {
            return null;
        }
        return data[0].date;
    }

    /**
     * Search transactions across all time
     */
    static async searchTransactions(query) {
        const userId = await getCurrentUserId();
        if (!userId) return [];

        // Sanitize query: strip PostgREST filter special characters to prevent filter manipulation
        const sanitizedQuery = query.replace(/[,.()"\\]/g, '');
        if (!sanitizedQuery.trim()) return [];

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .or(`description.ilike.%${sanitizedQuery}%,category.ilike.%${sanitizedQuery}%`)
            .order('date', { ascending: false });

        if (error) {
            console.error("Error searching transactions:", error);
            return [];
        }
        return data;
    }

    /**
     * Retrieves ONLY the base adjustment value from cloud or local fallback
     */
    static async getBaseNetWorth() {
        const userId = await getCurrentUserId();
        if (!userId) return Number(localStorage.getItem('baseNetWorth') || 0);

        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('base_net_worth')
                .eq('id', userId)
                .maybeSingle();

            if (!error && data && data.base_net_worth !== null && data.base_net_worth !== undefined) {
                const base = Number(data.base_net_worth || 0);
                localStorage.setItem('baseNetWorth', base.toString());
                return base;
            }
        } catch (err) {
            console.error("Error reading baseNetWorth from Supabase:", err);
        }

        return Number(localStorage.getItem('baseNetWorth') || 0);
    }

    /**
     * Updates the base net worth on the cloud profile and local cache
     */
    static async updateBaseNetWorth(newBaseAmount) {
        const numericBase = Number(newBaseAmount) || 0;
        
        // Save locally first for instant resilience and responsiveness
        localStorage.setItem('baseNetWorth', numericBase.toString());

        const userId = await getCurrentUserId();
        if (!userId) return;

        const { error } = await supabase
            .from('user_profiles')
            .upsert({
                id: userId,
                base_net_worth: numericBase,
                last_sync: new Date().toISOString()
            }, { onConflict: 'id' });

        if (error) {
            console.error("Error updating base net worth in Supabase:", error);
            throw error;
        }
    }

    /**
     * Fast global sum for Net Worth (Receitas - Despesas) up to the specified month/year
     */
    static async getNetWorth(year, month, isSplitByTwoEnabled = false) {
        const userId = await getCurrentUserId();
        if (!userId) return Number(localStorage.getItem('baseNetWorth') || 0);

        const baseNetWorth = await this.getBaseNetWorth();

        const parsedYear = parseInt(year, 10);
        const parsedMonth = parseInt(month, 10);
        const padMonth = String(parsedMonth).padStart(2, '0');
        const lastDay = new Date(Date.UTC(parsedYear, parsedMonth, 0)).getUTCDate();
        const endOfMonthISO = `${parsedYear}-${padMonth}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`;

        const { data, error } = await supabase
            .from('transactions')
            .select('amount, type, date, is_split_by_2, is_third_party')
            .eq('user_id', userId)
            .lte('date', endOfMonthISO);

        if (error) {
            console.error("Error fetching net worth:", error);
            return baseNetWorth;
        }

        const historicalDiff = data.reduce((acc, tx) => {
            const effectiveTransactionAmount = getEffectiveTransactionAmount(tx, isSplitByTwoEnabled);
            return tx.type === 'Income' ? acc + effectiveTransactionAmount : acc - effectiveTransactionAmount;
        }, 0);

        return baseNetWorth + historicalDiff;
    }

    /**
     * Gets available years from the database by fetching unique dates
     */
    static async getAvailableYears() {
        const userId = await getCurrentUserId();
        if (!userId) {
            return [new Date().getFullYear()];
        }

        const { data, error } = await supabase
            .from('transactions')
            .select('date')
            .eq('user_id', userId);

        if (error) {
            console.error("Error fetching years:", error);
            const currentYear = new Date().getFullYear();
            return [currentYear];
        }

        const years = new Set(data.map(tx => new Date(tx.date).getFullYear()));
        const currentYear = new Date().getFullYear();
        years.add(currentYear); // Always include current year

        return Array.from(years).sort((a, b) => a - b);
    }

    /**
     * Add a new transaction (supports multiple installments)
     */
    static async addTransaction(transaction) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error("Usuário não autenticado");

        const totalInstallments = parseInt(transaction.total_installments, 10) || 1;
        const currentInstallment = parseInt(transaction.installment_number, 10) || 1;
        const installmentGroupId = totalInstallments > 1 ? crypto.randomUUID() : null;
        const isRecurring = Boolean(transaction.is_recurring);
        const recurringGroupId = isRecurring ? crypto.randomUUID() : null;

        let baseDateStr = transaction.date;
        if (baseDateStr && baseDateStr.length === 10) {
            baseDateStr += 'T12:00:00Z';
        }
        const baseDate = baseDateStr ? new Date(baseDateStr) : new Date();

        const txList = [];
        const installmentsToGenerate = isRecurring ? 12 : (totalInstallments - currentInstallment + 1);

        for (let i = 0; i < installmentsToGenerate; i++) {
            const txDate = new Date(baseDate);
            const originalDay = baseDate.getDate();
            txDate.setMonth(baseDate.getMonth() + i);

            if (txDate.getDate() !== originalDay) {
                txDate.setDate(0);
            }

            const txToInsert = {
                user_id: userId,
                description: transaction.description,
                amount: transaction.amount,
                type: transaction.type, // 'Income' ou 'Expense'
                category: transaction.category || 'General',
                date: txDate.toISOString(),
                is_recurring: isRecurring,
                credit_card_name: transaction.credit_card_name || null,
                is_split_by_2: transaction.type === 'Expense' ? Boolean(transaction.is_split_by_2) : false,
                is_third_party: transaction.type === 'Expense' ? Boolean(transaction.is_third_party) : false
            };

            if (totalInstallments > 1) {
                txToInsert.total_installments = totalInstallments;
                txToInsert.installment_number = currentInstallment + i;
                txToInsert.installment_group_id = installmentGroupId;
            } else if (isRecurring) {
                txToInsert.installment_group_id = recurringGroupId;
            }
            txList.push(txToInsert);
        }

        const { data, error } = await supabase
            .from('transactions')
            .insert(txList)
            .select();

        if (error) {
            console.error("Error adding transaction:", error);
            throw error;
        }
        return data;
    }

    /**
     * Update an existing transaction
     */
    static async updateTransaction(id, transaction) {
        let baseDateStr = transaction.date;
        if (baseDateStr && baseDateStr.length === 10) baseDateStr += 'T12:00:00Z';

        const txToUpdate = {
            description: transaction.description,
            amount: transaction.amount,
            type: transaction.type,
            category: transaction.category || 'General',
            date: baseDateStr ? new Date(baseDateStr).toISOString() : undefined,
            credit_card_name: transaction.credit_card_name || null,
            is_recurring: transaction.is_recurring !== undefined ? transaction.is_recurring : false,
            is_split_by_2: transaction.type === 'Expense' ? Boolean(transaction.is_split_by_2) : false,
            is_third_party: transaction.type === 'Expense' ? Boolean(transaction.is_third_party) : false
        };

        const { data, error } = await supabase
            .from('transactions')
            .update(txToUpdate)
            .eq('id', id)
            .select();

        if (error) {
            console.error("Error updating transaction:", error);
            throw error;
        }

        if (data && data.length > 0) {
            const updatedTx = data[0];
            const isGrouped = updatedTx.installment_group_id || updatedTx.total_installments > 1 || updatedTx.is_recurring;
            
            if (updatedTx.type === 'Expense' && isGrouped) {
                const updatePayload = {
                    amount: updatedTx.amount,
                    is_split_by_2: updatedTx.is_split_by_2,
                    is_third_party: updatedTx.is_third_party,
                    category: updatedTx.category,
                    credit_card_name: updatedTx.credit_card_name
                };

                if (updatedTx.installment_group_id) {
                    await supabase
                        .from('transactions')
                        .update(updatePayload)
                        .eq('installment_group_id', updatedTx.installment_group_id)
                        .gt('date', updatedTx.date);
                } else {
                    await supabase
                        .from('transactions')
                        .update(updatePayload)
                        .eq('user_id', updatedTx.user_id)
                        .eq('description', updatedTx.description)
                        .gt('date', updatedTx.date);
                }
            }
        }

        return data[0];
    }

    /**
     * Fetch all transactions that belong to the same installment or recurring group
     */
    static async getTransactionsByInstallmentGroup(installmentGroupId) {
        const userId = await getCurrentUserId();
        if (!userId || !installmentGroupId) return [];

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .eq('installment_group_id', installmentGroupId)
            .order('date', { ascending: true });

        if (error) {
            console.error("Error fetching grouped transactions:", error);
            throw error;
        }

        return data || [];
    }

    /**
     * Delete a transaction by ID
     */
    static async deleteTransaction(id) {
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting transaction:", error);
            throw error;
        }
        return true;
    }

    /**
     * Delete multiple transactions by ID in a single request
     */
    static async deleteTransactions(ids) {
        const validIds = Array.isArray(ids) ? ids.filter(Boolean) : [];
        if (validIds.length === 0) return true;

        const { error } = await supabase
            .from('transactions')
            .delete()
            .in('id', validIds);

        if (error) {
            console.error("Error deleting transactions:", error);
            throw error;
        }
        return true;
    }

    /**
     * Get all transactions for the current user across all time
     */
    static async getAllTransactions() {
        const userId = await getCurrentUserId();
        if (!userId) return [];

        const { data, error } = await supabase
            .from("transactions")
            .select("*")
            .eq("user_id", userId)
            .order("date", { ascending: false });

        if (error) {
            console.error("Error fetching all transactions for backup:", error);
            throw error;
        }
        return data || [];
    }

    /**
     * Bulk upsert transactions into Supabase for the current user
     * Breaks operations into chunks of 100 to prevent payload limits
     */
    static async bulkUpsertTransactions(rawTransactionsList) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error("Usuário não autenticado no Supabase");

        if (!Array.isArray(rawTransactionsList) || rawTransactionsList.length === 0) {
            return 0;
        }

        // Sanitize and attach current user_id
        const sanitizedTransactions = rawTransactionsList.map(t => {
            const copy = { ...t };
            copy.user_id = userId;
            if (!copy.description) copy.description = "Sem descrição";
            if (typeof copy.amount !== "number") copy.amount = parseFloat(copy.amount) || 0;
            return copy;
        });

        const chunkSize = 100;
        let totalUpserted = 0;

        for (let i = 0; i < sanitizedTransactions.length; i += chunkSize) {
            const chunk = sanitizedTransactions.slice(i, i + chunkSize);
            const { data, error } = await supabase
                .from("transactions")
                .upsert(chunk, { onConflict: "id" })
                .select("id");

            if (error) {
                console.error("Error bulk upserting transaction chunk:", error);
                throw error;
            }

            totalUpserted += (data ? data.length : chunk.length);
        }

        return totalUpserted;
    }

}
