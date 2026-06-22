export function shouldApplySplitByTwo(transaction, isSplitByTwoEnabled) {
  if (!isSplitByTwoEnabled || !transaction || transaction.type !== 'Expense' || !transaction.is_split_by_2) {
    return false;
  }

  if (transaction.date) {
    const dateStr = String(transaction.date);
    // Permite apenas a partir de junho de 2026 (2026-06-01)
    if (dateStr.substring(0, 10) < '2026-06-01') {
      return false;
    }
  } else {
    return false;
  }

  return true;
}

export function getEffectiveTransactionAmount(transaction, isSplitByTwoEnabled = false) {
  const originalTransactionAmount = Number(transaction?.amount || 0);

  if (shouldApplySplitByTwo(transaction, isSplitByTwoEnabled)) {
    return originalTransactionAmount / 2;
  }

  return originalTransactionAmount;
}
