/**
 * Utility functions for propagating transaction edits across grouped/recurring transactions
 */

/**
 * Checks if a transaction is part of an installment or recurring series
 * @param {Object} transaction
 * @returns {boolean}
 */
export function isGroupedTransaction(transaction) {
    if (!transaction) return false;
    const hasGroupId = Boolean(transaction.installment_group_id);
    const hasMultipleInstallments = Number(transaction.total_installments) > 1;
    const isRecurring = Boolean(transaction.is_recurring);

    return hasGroupId || hasMultipleInstallments || isRecurring;
}

/**
 * Builds the payload that should propagate to subsequent transactions in the series
 * @param {Object} updatedTransaction - The transaction containing the updated fields
 * @returns {Object} Payload to apply to future transactions in the series
 */
export function buildPropagationPayload(updatedTransaction) {
    if (!updatedTransaction) {
        throw new Error('Transação atualizada é necessária para construir o payload de propagação.');
    }

    const isExpense = updatedTransaction.type === 'Expense';

    return {
        description: updatedTransaction.description,
        amount: updatedTransaction.amount,
        type: updatedTransaction.type,
        category: updatedTransaction.category || 'General',
        credit_card_name: updatedTransaction.credit_card_name || null,
        is_split_by_2: isExpense ? Boolean(updatedTransaction.is_split_by_2) : false,
        is_third_party: isExpense ? Boolean(updatedTransaction.is_third_party) : false,
    };
}

/**
 * Determines whether a candidate transaction should receive the propagated update from the reference transaction
 * @param {Object} candidateTransaction
 * @param {Object} referenceTransaction
 * @returns {boolean}
 */
export function shouldPropagateToTransaction(candidateTransaction, referenceTransaction) {
    if (!candidateTransaction || !referenceTransaction) return false;
    if (candidateTransaction.id === referenceTransaction.id) return false;

    if (candidateTransaction.installment_group_id && referenceTransaction.installment_group_id) {
        if (candidateTransaction.installment_group_id !== referenceTransaction.installment_group_id) {
            return false;
        }
    }

    const hasCandidateInstallment = Number(candidateTransaction.installment_number) > 0;
    const hasReferenceInstallment = Number(referenceTransaction.installment_number) > 0;

    if (hasCandidateInstallment && hasReferenceInstallment) {
        return Number(candidateTransaction.installment_number) > Number(referenceTransaction.installment_number);
    }

    const candidateDate = new Date(candidateTransaction.date);
    const referenceDate = new Date(referenceTransaction.date);

    if (!Number.isNaN(candidateDate.getTime()) && !Number.isNaN(referenceDate.getTime())) {
        return candidateDate.getTime() > referenceDate.getTime();
    }

    return false;
}
