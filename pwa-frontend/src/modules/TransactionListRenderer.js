import { getEffectiveTransactionAmount, shouldApplySplitByTwo, shouldIgnoreThirdParty } from '../utils/splitTransactionAmount.js';

function formatBrazilianCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function createListDivider(label) {
  const dividerElement = document.createElement('div');
  dividerElement.className = 'text-[10px] text-slate-500 font-bold mt-4 mb-1 uppercase tracking-wider border-b border-slate-700/50 pb-1 px-1';
  dividerElement.textContent = label;
  return dividerElement;
}

function createTransactionCard({
  transaction,
  categoryTotalsByMonth,
  isSplitByTwoEnabled,
  budgetService,
  openContextMenu,
}) {
  const isIncomeTransaction = transaction.type === 'Income';
  const transactionSignal = isIncomeTransaction ? '+' : '-';
  const effectiveTransactionAmount = getEffectiveTransactionAmount(transaction, isSplitByTwoEnabled);
  const transactionDateLabel = new Date(transaction.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const amountColorClass = isIncomeTransaction
    ? 'text-accent-green'
    : 'text-accent-red drop-shadow-[0_0_8px_rgba(250,101,56,0.8)]';
  const iconBackgroundClass = isIncomeTransaction
    ? 'bg-accent-green/10 border-accent-green/20 text-accent-green'
    : 'bg-red-500/10 border-red-500/20 text-red-400';
  const iconSymbol = isIncomeTransaction ? 'account_balance' : 'shopping_bag';

  const categoryLabel = transaction.category || 'General';
  const firstCategoryToken = categoryLabel.split(' ')[0] || '';
  const hasEmojiCategory = /[\u1000-\uFFFF]/.test(firstCategoryToken);
  const subCategoryLabel = hasEmojiCategory ? categoryLabel.substring(firstCategoryToken.length).trim() : categoryLabel;
  const iconHtml = hasEmojiCategory
    ? `<span style="font-size: 24px;">${firstCategoryToken}</span>`
    : `<span class="material-symbols-outlined" style="font-size: 24px; font-variation-settings: 'FILL' 1;">${iconSymbol}</span>`;

  let tagsHtml = '';

  if (!isIncomeTransaction) {
    const configuredBudget = budgetService.getBudget(subCategoryLabel);
    if (configuredBudget > 0 && (categoryTotalsByMonth[subCategoryLabel] || 0) >= configuredBudget) {
      tagsHtml += '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/20 mr-1 shadow-glow-red">Orçamento Estourado</span>';
    }
  }

  if (transaction.credit_card_name) {
    tagsHtml += `<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 mr-1">${transaction.credit_card_name}</span>`;
  }

  if (transaction.total_installments > 1) {
    const projectedTransactionDate = new Date(transaction.date);
    const remainingInstallments = transaction.total_installments - transaction.installment_number;
    projectedTransactionDate.setMonth(projectedTransactionDate.getMonth() + remainingInstallments);

    const finishDateLabel = projectedTransactionDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase();
    const basicInstallmentLabel = `Parc. ${transaction.installment_number}/${transaction.total_installments}`;
    const expandedInstallmentLabel = `Fim: ${finishDateLabel}`;

    tagsHtml += `<span title="Finaliza em: ${finishDateLabel}" onclick="this.textContent = this.textContent === '${basicInstallmentLabel}' ? '${expandedInstallmentLabel}' : '${basicInstallmentLabel}'; event.stopPropagation();" class="text-[10px] cursor-help font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/20 hover:bg-purple-500/40 transition active:scale-95 inline-block mr-1">${basicInstallmentLabel}</span>`;
  }

  if (!isIncomeTransaction && transaction.is_recurring) {
    tagsHtml += '<span title="Despesa Recorrente" class="text-[12px] cursor-help font-extrabold px-2 py-0 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/40 transition inline-block shadow-[0_0_8px_rgba(250,204,21,0.5)]">∞</span>';
  }

  if (!isIncomeTransaction && transaction.is_split_by_2) {
    const splitByTwoTitle = shouldApplySplitByTwo(transaction, isSplitByTwoEnabled)
      ? 'Valor exibido dividido por 2'
      : 'Despesa marcada como divisível por 2';
    tagsHtml += `<span title="${splitByTwoTitle}" class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 inline-block ml-1">÷2</span>`;
  }

  const transactionCard = document.createElement('div');
  transactionCard.className = 'glass-card glass-card-hover rounded-xl p-3 flex items-center gap-4 transition-all duration-200 select-none';
  transactionCard.innerHTML = `
    <div class="h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 ${iconBackgroundClass}">
      ${iconHtml}
    </div>
    <div class="flex-1 min-w-0">
      <div class="flex justify-between items-center mb-0.5">
        <h4 class="text-white font-semibold truncate">${transaction.description}</h4>
        <span class="${amountColorClass} font-bold whitespace-nowrap">${transactionSignal}${formatBrazilianCurrency(Math.abs(effectiveTransactionAmount))}</span>
      </div>
      <div class="flex justify-between items-center mt-1">
        <p class="text-xs text-slate-400">${subCategoryLabel} • ${transactionDateLabel}</p>
        <div class="flex items-center justify-end flex-wrap">${tagsHtml}</div>
      </div>
    </div>
  `;

  let pressTimer;
  const cancelPress = () => clearTimeout(pressTimer);

  transactionCard.addEventListener('touchstart', () => {
    pressTimer = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      openContextMenu(transaction);
    }, 500);
  }, { passive: true });

  transactionCard.addEventListener('touchend', cancelPress);
  transactionCard.addEventListener('touchmove', cancelPress);
  transactionCard.addEventListener('touchcancel', cancelPress);

  transactionCard.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    pressTimer = setTimeout(() => {
      openContextMenu(transaction);
    }, 500);
  });
  transactionCard.addEventListener('mouseup', cancelPress);
  transactionCard.addEventListener('mouseleave', cancelPress);

  transactionCard.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    openContextMenu(transaction);
  });

  transactionCard.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    transactionCard.dataset.pointerDownStarted = 'true';
  });
  transactionCard.addEventListener('pointermove', () => {
    transactionCard.dataset.pointerDownStarted = 'false';
  });
  transactionCard.addEventListener('pointerup', () => {
    transactionCard.dataset.pointerDownStarted = 'false';
  });

  return transactionCard;
}

export function renderTransactionList({
  appElements,
  transactions,
  currentTab,
  currentCardFilter,
  currentQuickFilter,
  currentSort,
  currentSearchQuery,
  isSplitByTwoEnabled,
  budgetService,
  openContextMenu,
}) {
  const normalizedAmounts = transactions.map((transaction) => (
    transaction.type === 'Income'
      ? getEffectiveTransactionAmount(transaction, isSplitByTwoEnabled)
      : -getEffectiveTransactionAmount(transaction, isSplitByTwoEnabled)
  ));
  const totalBalance = normalizedAmounts.reduce((sum, amount) => sum + amount, 0).toFixed(2);
  const totalIncome = normalizedAmounts.filter((amount) => amount > 0).reduce((sum, amount) => sum + amount, 0).toFixed(2);
  const totalExpense = (normalizedAmounts.filter((amount) => amount < 0).reduce((sum, amount) => sum + amount, 0) * -1).toFixed(2);

  appElements.balanceEl.textContent = formatBrazilianCurrency(totalBalance);
  appElements.incomeEl.textContent = formatBrazilianCurrency(totalIncome);
  appElements.expenseEl.textContent = formatBrazilianCurrency(totalExpense);
  appElements.listEl.innerHTML = '';

  const uniqueCards = [...new Set(transactions.map((transaction) => transaction.credit_card_name).filter(Boolean))];
  const previousCardValue = appElements.filterCardEl.value;
  appElements.filterCardEl.innerHTML = '<option value="All">💳 Todos (Cartões)</option>';
  uniqueCards.forEach((cardName) => {
    const optionElement = document.createElement('option');
    optionElement.value = cardName;
    optionElement.textContent = `💳 ${cardName} `;
    appElements.filterCardEl.appendChild(optionElement);
  });
  if (uniqueCards.includes(previousCardValue)) {
    appElements.filterCardEl.value = previousCardValue;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const filteredTransactions = transactions.filter((transaction) => {
    if (currentTab !== 'All' && transaction.type !== currentTab) return false;
    if (currentCardFilter !== 'All' && transaction.credit_card_name !== currentCardFilter) return false;

    if (currentQuickFilter) {
      const transactionDate = new Date(transaction.date);
      transactionDate.setHours(0, 0, 0, 0);

      switch (currentQuickFilter) {
        case 'Today':
          if (transactionDate.getTime() !== today.getTime()) return false;
          break;
        case 'Week':
          if (transactionDate < weekAgo || transactionDate > today) return false;
          break;
        case 'Fixed':
          if (!transaction.is_recurring) return false;
          break;
        case 'Install':
          if (!transaction.total_installments || transaction.total_installments <= 1) return false;
          break;
      }
    }

    return true;
  });

  filteredTransactions.sort((transactionA, transactionB) => {
    const aIgnored = shouldIgnoreThirdParty(transactionA, isSplitByTwoEnabled);
    const bIgnored = shouldIgnoreThirdParty(transactionB, isSplitByTwoEnabled);
    
    if (aIgnored && !bIgnored) return 1;
    if (!aIgnored && bIgnored) return -1;

    if (currentSort === 'date-desc') return new Date(transactionB.date) - new Date(transactionA.date);
    if (currentSort === 'date-asc') return new Date(transactionA.date) - new Date(transactionB.date);
    if (currentSort === 'value-desc') return getEffectiveTransactionAmount(transactionB, isSplitByTwoEnabled) - getEffectiveTransactionAmount(transactionA, isSplitByTwoEnabled);
    if (currentSort === 'value-asc') return getEffectiveTransactionAmount(transactionA, isSplitByTwoEnabled) - getEffectiveTransactionAmount(transactionB, isSplitByTwoEnabled);
    if (currentSort === 'alpha-asc') return (transactionA.description || '').localeCompare(transactionB.description || '');
    if (currentSort === 'alpha-desc') return (transactionB.description || '').localeCompare(transactionA.description || '');
    return 0;
  });

  if (filteredTransactions.length === 0) {
    appElements.emptyEl.style.display = 'block';
    appElements.listEl.appendChild(appElements.emptyEl);
    return;
  }

  appElements.emptyEl.style.display = 'none';

  const categoryTotalsByMonth = {};
  transactions
    .filter((transaction) => transaction.type === 'Expense')
    .forEach((transaction) => {
      const categoryName = transaction.category || 'General';
      const normalizedCategoryName = categoryName.replace(/[\u1000-\uFFFF]/, '').trim() || categoryName;
      categoryTotalsByMonth[normalizedCategoryName] = (categoryTotalsByMonth[normalizedCategoryName] || 0) + getEffectiveTransactionAmount(transaction, isSplitByTwoEnabled);
    });

  const appendTransactionCard = (transaction) => {
    appElements.listEl.appendChild(createTransactionCard({
      transaction,
      categoryTotalsByMonth,
      isSplitByTwoEnabled,
      budgetService,
      openContextMenu,
    }));
  };

  if (currentSearchQuery.length > 0) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMatches = [];
    const futureMatches = [];
    const pastMatches = [];

    filteredTransactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.date);
      if (transactionDate.getFullYear() === currentYear && transactionDate.getMonth() === currentMonth) {
        currentMatches.push(transaction);
      } else if (transactionDate > now) {
        futureMatches.push(transaction);
      } else {
        pastMatches.push(transaction);
      }
    });

    if (currentMatches.length > 0) {
      appElements.listEl.appendChild(createListDivider('Mês Atual'));
      currentMatches.forEach(appendTransactionCard);
    }
    if (futureMatches.length > 0) {
      appElements.listEl.appendChild(createListDivider('Futuras'));
      futureMatches.forEach(appendTransactionCard);
    }
    if (pastMatches.length > 0) {
      appElements.listEl.appendChild(createListDivider('Passadas'));
      pastMatches.forEach(appendTransactionCard);
    }
  } else {
    filteredTransactions.forEach(appendTransactionCard);
  }
}

