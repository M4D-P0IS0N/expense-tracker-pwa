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
     * Fast global sum for Net Worth (Receitas - Despesas) up to the specified month/year
     */
    static async getNetWorth(year, month, isSplitByTwoEnabled = false) {
        const userId = await getCurrentUserId();
        if (!userId) return 0;

        // Fetch transactions for calculation
        let query = supabase
            .from('transactions')
            .select('amount, type, is_split_by_2, is_third_party, date')
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
            const effectiveTransactionAmount = getEffectiveTransactionAmount(tx, isSplitByTwoEnabled);
            return tx.type === 'Income' ? acc + effectiveTransactionAmount : acc - effectiveTransactionAmount;
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

        const ensuredProfile = await this.ensureUserProfile(userId);
        if (ensuredProfile) {
            const base = Number(ensuredProfile.base_net_worth || 0);
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

        // Sync to cloud, creating the profile row if needed
        const { error } = await supabase
            .from('user_profiles')
            .upsert({
                id: userId,
                base_net_worth: numericBase,
                last_sync: new Date().toISOString()
            }, { onConflict: 'id' });

        if (error) {
            console.error("Error updating base net worth:", error);
        }
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

        let baseDateStr = transaction.date || new Date().toISOString();
        // Fix timezone issue when only date is provided (YYYY-MM-DD from input[type="date"])
        if (baseDateStr.length === 10) {
            baseDateStr += 'T12:00:00Z'; // Forces it to noon UTC, dodging UTC midnight day-boundary jumps
        }
        const baseDate = new Date(baseDateStr);

        const txList = [];
        const totalInstallments = transaction.total_installments || 1;
        const currentInstallment = transaction.installment_number || 1;
        const isRecurring = transaction.is_recurring || false;
        
        // Define how many transactions to generate
        let iterations = 1;
        if (totalInstallments > 1) {
             iterations = (totalInstallments - currentInstallment) + 1; // e.g 10 - 1 + 1 = 10
        } else if (isRecurring) {
             iterations = 12; // Generate next 12 months for recurring by default
        }

        // Group ID
        let installmentGroupId = null;
        let recurringGroupId = null;

        if (totalInstallments > 1) {
            installmentGroupId = crypto.randomUUID();
        } else if (isRecurring) {
            recurringGroupId = crypto.randomUUID();
        }

        // Insert from current to total (generating multiple rows for DB)
        for (let i = 0; i < iterations; i++) {
            const txDate = new Date(baseDate);
            const expectedMonth = (baseDate.getMonth() + i) % 12;
            const normalizedExpectedMonth = expectedMonth < 0 ? expectedMonth + 12 : expectedMonth;

            txDate.setMonth(txDate.getMonth() + i);
            if (txDate.getMonth() !== normalizedExpectedMonth) {
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
                // To track recurring siblings we reuse installment_group_id conceptually
                // or add a new custom field if DB allowed, but since DB has no recurring_group_id 
                // we will stick to installment_group_id to group recurring transactions too
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
        // Return all generated transactions
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
}




