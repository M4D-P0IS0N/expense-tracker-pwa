import { supabase } from './supabaseClient.js';
import { AuthService } from './AuthService.js';

async function getCurrentUserId() {
    const session = await AuthService.getSession();
    return session?.user?.id || null;
}

export class TransactionService {
    /**
     * Get all transactions ordered by date descending, filtered by year and month
     * @param {number} year 
     * @param {number} month (1-12)
     */
    static async getTransactions(year, month) {
        const userId = await getCurrentUserId();
        if (!userId) return [];

        const startDate = new Date(year, month - 1, 1).toISOString();
        const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

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
     * Search transactions across all time
     */
    static async searchTransactions(query) {
        const userId = await getCurrentUserId();
        if (!userId) return [];

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .or(`description.ilike.%${query}%,category.ilike.%${query}%`)
            .order('date', { ascending: false });

        if (error) {
            console.error("Error searching transactions:", error);
            return [];
        }
        return data;
    }

    /**
     * Fast global sum for Net Worth (Receitas - Despesas) up to the specified month/year
     */
    static async getNetWorth(year, month) {
        const userId = await getCurrentUserId();
        if (!userId) return 0;

        // Fetch transactions for calculation
        let query = supabase
            .from('transactions')
            .select('amount, type')
            .eq('user_id', userId);

        if (year && month) {
            const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
            query = query.lte('date', endDate);
        }

        const { data: txData, error: txError } = await query;
        if (txError) {
            console.error("Error fetching net worth:", txError);
            return 0;
        }

        // Fetch baseNetWorth from Cloud Profile
        let baseNetWorth = 0;
        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('base_net_worth')
            .eq('id', userId)
            .single();

        if (!profileError && profileData) {
            baseNetWorth = Number(profileData.base_net_worth || 0);
            // Cache locally for offline resilience
            localStorage.setItem('baseNetWorth', baseNetWorth.toString());
        } else {
            // Fallback to local storage if offline or profile read fails
            baseNetWorth = Number(localStorage.getItem('baseNetWorth') || 0);
        }

        return txData.reduce((acc, tx) => {
            return tx.type === 'Income' ? acc + Number(tx.amount) : acc - Number(tx.amount);
        }, baseNetWorth);
    }

    /**
     * Retrieves ONLY the base adjustment value from the cloud or local fallback
     */
    static async getBaseNetWorth() {
        const userId = await getCurrentUserId();
        if (!userId) return Number(localStorage.getItem('baseNetWorth') || 0);

        const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('base_net_worth')
            .eq('id', userId)
            .single();

        if (!profileError && profileData) {
            const base = Number(profileData.base_net_worth || 0);
            localStorage.setItem('baseNetWorth', base.toString());
            return base;
        }

        return Number(localStorage.getItem('baseNetWorth') || 0);
    }

    /**
     * Updates the base net worth on the cloud profile
     */
    static async updateBaseNetWorth(newBaseAmount) {
        const userId = await getCurrentUserId();
        if (!userId) return;

        const numericBase = Number(newBaseAmount);

        // Save locally immediately for fast UI response
        localStorage.setItem('baseNetWorth', numericBase.toString());

        // Sync to cloud
        await supabase
            .from('user_profiles')
            .update({
                base_net_worth: numericBase,
                last_sync: new Date().toISOString()
            })
            .eq('id', userId);
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
     * Add a new transaction
     */
    static async addTransaction(transaction) {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error("Usuário não autenticado");

        // Prepare the basic object
        const txToInsert = {
            user_id: userId,
            description: transaction.description,
            amount: transaction.amount,
            type: transaction.type, // 'Income' ou 'Expense'
            category: transaction.category || 'General',
            date: transaction.date || new Date().toISOString(),
            is_recurring: transaction.is_recurring || false,
            credit_card_name: transaction.credit_card_name || null
        };

        // Handle installments if exist
        if (transaction.total_installments > 1) {
            txToInsert.total_installments = transaction.total_installments;
            txToInsert.installment_number = transaction.installment_number || 1;
            // Generate a fake group ID since Vanilla JS doesn't have Guid.NewGuid natively
            // In a real scenario we'd use crypto.randomUUID()
            txToInsert.installment_group_id = crypto.randomUUID();
        }

        const { data, error } = await supabase
            .from('transactions')
            .insert([txToInsert])
            .select();

        if (error) {
            console.error("Error adding transaction:", error);
            throw error;
        }
        return data[0];
    }

    /**
     * Update an existing transaction
     */
    static async updateTransaction(id, transaction) {
        const txToUpdate = {
            description: transaction.description,
            amount: transaction.amount,
            type: transaction.type,
            category: transaction.category || 'General',
            date: transaction.date,
            credit_card_name: transaction.credit_card_name || null
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
        return data[0];
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
}
