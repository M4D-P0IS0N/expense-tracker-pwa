export function shouldApplySplitByTwo(transaction, isSplitByTwoEnabled) {
  if (!transaction || transaction.type !== 'Expense' || !transaction.is_split_by_2) {
    return false;
  }

  if (transaction.date) {
    const dateStr = String(transaction.date);
    // Permite apenas a partir de junho de 2026 (2026-06-01)
    if (dateStr.substring(0, 10) < '2026-06-01') {
      return false;
    }

    // Se estiver no navegador, consulta a configuração do localStorage específica do mês/ano da transação.
    // Isso garante que a seleção afete apenas as parcelas no mês vigente correspondente.
    if (typeof localStorage !== 'undefined') {
      const txYear = dateStr.substring(0, 4);
      const txMonth = parseInt(dateStr.substring(5, 7), 10).toString();
      const storageKey = `split_by_two_${txYear}_${txMonth}`;
      return localStorage.getItem(storageKey) === 'true';
    }
  } else {
    return false;
  }

  // Fallback para ambientes de teste onde o localStorage não está definido (Node.js)
  return Boolean(isSplitByTwoEnabled);
}

export function getEffectiveTransactionAmount(transaction, isSplitByTwoEnabled = false) {
  const originalTransactionAmount = Number(transaction?.amount || 0);

  if (shouldApplySplitByTwo(transaction, isSplitByTwoEnabled)) {
    return originalTransactionAmount / 2;
  }

  return originalTransactionAmount;
}
