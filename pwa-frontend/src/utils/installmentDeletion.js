function normalizeTransactionDate(transactionDate) {
    const parsedTransactionDate = new Date(transactionDate);

    if (Number.isNaN(parsedTransactionDate.getTime())) {
        return null;
    }

    return parsedTransactionDate;
}

export function shouldDeleteGroupedTransaction(candidateTransaction, selectedTransaction) {
    if (!candidateTransaction || !selectedTransaction) return false;
    if (candidateTransaction.installment_group_id !== selectedTransaction.installment_group_id) return false;

    const hasInstallmentMetadata = Number(candidateTransaction.total_installments) > 1 && Number(selectedTransaction.total_installments) > 1;

    if (hasInstallmentMetadata) {
        return Number(candidateTransaction.installment_number) >= Number(selectedTransaction.installment_number);
    }

    const candidateDate = normalizeTransactionDate(candidateTransaction.date);
    const selectedDate = normalizeTransactionDate(selectedTransaction.date);

    if (!candidateDate || !selectedDate) {
        return candidateTransaction.id === selectedTransaction.id;
    }

    return candidateDate.getTime() >= selectedDate.getTime();
}

export function selectGroupedTransactionsForDeletion(groupTransactions, selectedTransaction) {
    if (!Array.isArray(groupTransactions) || !selectedTransaction) return [];

    return groupTransactions.filter((candidateTransaction) =>
        shouldDeleteGroupedTransaction(candidateTransaction, selectedTransaction)
    );
}
