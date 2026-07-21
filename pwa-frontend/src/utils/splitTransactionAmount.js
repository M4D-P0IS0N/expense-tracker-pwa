export function getSplitByTwoStorageKey(year, month, userId = null) {
  const parsedMonth = parseInt(month, 10).toString();
  if (userId) {
    return 'split_by_two_' + userId + '_' + year + '_' + parsedMonth;
  }
  return 'split_by_two_' + year + '_' + parsedMonth;
}

function isSplitByTwoActiveInStorage(dateStr) {
  if (typeof localStorage === 'undefined') return null;

  const txYear = dateStr.substring(0, 4);
  const txMonth = parseInt(dateStr.substring(5, 7), 10).toString();
  const legacyKey = 'split_by_two_' + txYear + '_' + txMonth;

  if (localStorage.getItem(legacyKey) === 'true') {
    return true;
  }

  const suffix = '_' + txYear + '_' + txMonth;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('split_by_two_') && key.endsWith(suffix)) {
      if (localStorage.getItem(key) === 'true') {
        return true;
      }
    }
  }

  return false;
}

export function shouldApplySplitByTwo(transaction, isSplitByTwoEnabled) {
  if (!transaction || transaction.type !== 'Expense' || !transaction.is_split_by_2) {
    return false;
  }

  if (transaction.date) {
    const dateStr = String(transaction.date);
    if (dateStr.substring(0, 10) < '2026-06-01') {
      return false;
    }

    const storageState = isSplitByTwoActiveInStorage(dateStr);
    if (storageState !== null) {
      return storageState;
    }
  } else {
    return false;
  }

  return Boolean(isSplitByTwoEnabled);
}

export function shouldIgnoreThirdParty(transaction, isSplitByTwoEnabled) {
  if (!transaction || transaction.type !== 'Expense' || !transaction.is_third_party) {
    return false;
  }

  if (transaction.date) {
    const dateStr = String(transaction.date);
    if (dateStr.substring(0, 10) < '2026-06-01') {
      return false;
    }

    const storageState = isSplitByTwoActiveInStorage(dateStr);
    if (storageState !== null) {
      return storageState;
    }
  } else {
    return false;
  }

  return Boolean(isSplitByTwoEnabled);
}

export function getEffectiveTransactionAmount(transaction, isSplitByTwoEnabled = false) {
  if (shouldIgnoreThirdParty(transaction, isSplitByTwoEnabled)) {
    return 0;
  }

  const originalTransactionAmount = Number(transaction?.amount || 0);

  if (shouldApplySplitByTwo(transaction, isSplitByTwoEnabled)) {
    return originalTransactionAmount / 2;
  }

  return originalTransactionAmount;
}
