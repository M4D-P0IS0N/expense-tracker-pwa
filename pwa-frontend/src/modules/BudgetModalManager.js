export function initBudgetModal({
  appElements,
  budgetService,
  getTransactions,
  parseBrazilianCurrency,
  renderDashboard,
  updateUI,
  getCurrentTab,
}) {
  function closeBudgetsModal() {
    appElements.budgetModal.classList.add('hidden');
  }

  function openBudgetsModal() {
    appElements.budgetListEl.innerHTML = '';

    const categoryNames = new Set();
    getTransactions()
      .filter((transaction) => transaction.type === 'Expense')
      .forEach((transaction) => {
        const categoryName = transaction.category || 'General';
        categoryNames.add(categoryName.replace(/[\u1000-\uFFFF]/, '').trim() || categoryName);
      });

    const currentBudgets = budgetService.getBudgets();
    const sortedCategories = Array.from(categoryNames).sort();

    Object.keys(currentBudgets).forEach((categoryName) => {
      if (!sortedCategories.includes(categoryName)) {
        sortedCategories.push(categoryName);
      }
    });

    if (sortedCategories.length === 0) {
      appElements.budgetListEl.innerHTML = '<p class="text-sm text-slate-400 text-center">Nenhuma categoria de despesa registrada ainda.</p>';
    }

    sortedCategories.forEach((categoryName) => {
      const budgetAmount = currentBudgets[categoryName] || '';
      const budgetRow = document.createElement('div');
      budgetRow.className = 'flex items-center justify-between p-2 rounded-lg bg-slate-700/30 border border-slate-700';
      budgetRow.innerHTML = `
        <span class="text-sm text-white font-medium">${categoryName}</span>
        <div class="relative w-32">
          <span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">R$</span>
          <input type="text" inputmode="decimal" value="${budgetAmount}" data-category="${categoryName}" placeholder="Ilimitado" class="budget-input w-full bg-slate-800 border border-slate-600 rounded-md text-white text-sm py-1.5 pl-7 pr-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none">
        </div>
      `;
      appElements.budgetListEl.appendChild(budgetRow);
    });

    appElements.budgetModal.classList.remove('hidden');
  }

  appElements.configBudgetsBtn.addEventListener('click', openBudgetsModal);
  appElements.closeBudgetBtn.addEventListener('click', closeBudgetsModal);
  appElements.budgetOverlay.addEventListener('click', closeBudgetsModal);
  appElements.saveBudgetsBtn.addEventListener('click', () => {
    const budgetInputs = document.querySelectorAll('.budget-input');

    budgetInputs.forEach((budgetInput) => {
      const parsedBudgetValue = parseBrazilianCurrency(budgetInput.value);
      const categoryName = budgetInput.getAttribute('data-category');
      budgetService.setBudget(categoryName, Number.isNaN(parsedBudgetValue) ? 0 : parsedBudgetValue);
    });

    closeBudgetsModal();

    if (getCurrentTab() === 'Dashboard') {
      renderDashboard();
    } else {
      updateUI();
    }
  });

  return { openBudgetsModal, closeBudgetsModal };
}
