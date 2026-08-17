import { normalizeCategory } from '../utils/categoryUtils.js';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function initBudgetNotebookManager({
  budgetService,
  notebookService,
  parseBrazilianCurrency,
  renderDashboard,
  updateUI,
  getTransactions,
  getCurrentTab,
  elements,
}) {
  const {
    configBudgetsBtn,
    budgetModal,
    budgetOverlay,
    closeBudgetBtn,
    saveBudgetsBtn,
    budgetListEl,
    notesBtn,
    notesModal,
    notesOverlay,
    closeNotesBtn,
    saveNotesBtn,
    notesTextarea,
    filterMonthEl,
    filterYearEl,
    notesMonthBadge,
    notesHistoryList,
    notesHistoryCount,
  } = elements;

  function closeBudgetsModal() {
    budgetModal.classList.add('hidden');
  }

  function openBudgetsModal() {
    budgetListEl.innerHTML = '';

    const knownExpenseCategories = new Set();
    getTransactions()
      .filter((transaction) => transaction.type === 'Expense')
      .forEach((transaction) => {
        knownExpenseCategories.add(normalizeCategory(transaction.category).name);
      });

    const currentBudgets = budgetService.getBudgets();
    const sortedCategories = Array.from(knownExpenseCategories).sort();

    Object.keys(currentBudgets).forEach((categoryName) => {
      if (!sortedCategories.includes(categoryName)) {
        sortedCategories.push(categoryName);
      }
    });

    if (sortedCategories.length === 0) {
      budgetListEl.innerHTML = '<p class="text-sm text-slate-400 text-center">Nenhuma categoria de despesa registrada ainda.</p>';
    }

    sortedCategories.forEach((categoryName) => {
      const budgetAmount = currentBudgets[categoryName] || '';
      const budgetRowElement = document.createElement('div');
      budgetRowElement.className = 'flex items-center justify-between p-2 rounded-lg bg-slate-700/30 border border-slate-700';
      budgetRowElement.innerHTML = `
        <span class="text-sm text-white font-medium">${categoryName}</span>
        <div class="relative w-32">
          <span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">R$</span>
          <input type="text" inputmode="decimal" value="${budgetAmount}" data-category="${categoryName}" placeholder="Ilimitado" class="budget-input w-full bg-slate-800 border border-slate-600 rounded-md text-white text-sm py-1.5 pl-7 pr-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none">
        </div>
      `;
      budgetListEl.appendChild(budgetRowElement);
    });

    budgetModal.classList.remove('hidden');
  }

  function getSelectedMonthAndYear() {
    const selectedMonth = filterMonthEl ? parseInt(filterMonthEl.value, 10) : (new Date().getMonth() + 1);
    const selectedYear = filterYearEl ? parseInt(filterYearEl.value, 10) : new Date().getFullYear();
    return { month: selectedMonth, year: selectedYear };
  }

  function renderHistoryList(history) {
    if (!notesHistoryList) return;
    notesHistoryList.innerHTML = '';

    const historyItems = Array.isArray(history) ? history : [];

    if (notesHistoryCount) {
      notesHistoryCount.textContent = `${historyItems.length} edição${historyItems.length === 1 ? '' : 'ões'}`;
    }

    if (historyItems.length === 0) {
      notesHistoryList.innerHTML = '<div class="text-slate-500 italic p-3 text-center">Nenhuma edição registrada neste mês.</div>';
      return;
    }

    historyItems.forEach((entry) => {
      const formattedTimestamp = new Date(entry.timestamp).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const entryContainerElement = document.createElement('div');
      entryContainerElement.className = 'bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60 space-y-1.5';

      let diffMarkup = '';
      if ((!entry.added || entry.added.length === 0) && (!entry.removed || entry.removed.length === 0)) {
        diffMarkup = '<div class="text-slate-400 text-[11px] italic">Sem alterações de texto significativas</div>';
      } else {
        if (entry.added && entry.added.length > 0) {
          entry.added.forEach(lineContent => {
            diffMarkup += `<div class="text-accent-green bg-accent-green/10 px-2 py-0.5 rounded truncate text-[11px] font-mono">+ ${lineContent}</div>`;
          });
        }
        if (entry.removed && entry.removed.length > 0) {
          entry.removed.forEach(lineContent => {
            diffMarkup += `<div class="text-accent-red bg-accent-red/10 px-2 py-0.5 rounded truncate line-through opacity-80 text-[11px] font-mono">- ${lineContent}</div>`;
          });
        }
      }

      entryContainerElement.innerHTML = `
        <div class="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-700/40">
          <span class="font-bold text-slate-300 flex items-center gap-1">
            <span class="material-symbols-outlined text-[13px] text-primary">schedule</span>
            ${formattedTimestamp}
          </span>
        </div>
        <div class="space-y-1 pt-0.5">
          ${diffMarkup}
        </div>
      `;
      notesHistoryList.appendChild(entryContainerElement);
    });
  }

  async function openNotesModal() {
    const { month, year } = getSelectedMonthAndYear();
    const monthName = MONTH_NAMES[month - 1] || 'Mês';

    if (notesMonthBadge) {
      notesMonthBadge.textContent = `${monthName} / ${year}`;
    }

    // 1. Mostrar imediatamente do cache local para resposta visual instantânea
    notesTextarea.value = notebookService.getNotes(year, month);
    const cachedHistory = notebookService.getHistory(year, month);
    renderHistoryList(cachedHistory);

    notesModal.classList.remove('hidden');

    // 2. Sincronização em segundo plano da nuvem
    if (typeof notebookService.fetchNotes === 'function') {
      try {
        const cloudData = await notebookService.fetchNotes(year, month);
        if (cloudData && typeof cloudData === 'object') {
          // Atualiza caso o usuário ainda não tenha começado a digitar uma nova nota
          if (document.activeElement !== notesTextarea) {
            notesTextarea.value = cloudData.content || '';
          }
          renderHistoryList(cloudData.history || []);
        }
      } catch (err) {
        console.warn('Erro ao sincronizar notas da nuvem:', err);
      }
    }
  }

  function closeNotesModal() {
    notesModal.classList.add('hidden');
  }

  configBudgetsBtn.addEventListener('click', openBudgetsModal);
  closeBudgetBtn.addEventListener('click', closeBudgetsModal);
  budgetOverlay.addEventListener('click', closeBudgetsModal);

  saveBudgetsBtn.addEventListener('click', () => {
    document.querySelectorAll('.budget-input').forEach((inputElement) => {
      const parsedBudgetAmount = parseBrazilianCurrency(inputElement.value);
      const categoryName = inputElement.getAttribute('data-category');
      budgetService.setBudget(categoryName, Number.isNaN(parsedBudgetAmount) ? 0 : parsedBudgetAmount);
    });

    closeBudgetsModal();
    if (getCurrentTab() === 'Dashboard') {
      renderDashboard();
      return;
    }

    updateUI();
  });

  notesBtn.addEventListener('click', openNotesModal);
  closeNotesBtn.addEventListener('click', closeNotesModal);
  notesOverlay.addEventListener('click', closeNotesModal);

  saveNotesBtn.addEventListener('click', async () => {
    const { month, year } = getSelectedMonthAndYear();
    const originalButtonMarkup = saveNotesBtn.innerHTML;
    saveNotesBtn.disabled = true;

    try {
      const saveResult = await Promise.resolve(notebookService.saveNotes(notesTextarea.value, year, month));
      const history = (saveResult && saveResult.history) ? saveResult.history : notebookService.getHistory(year, month);
      renderHistoryList(history);

      saveNotesBtn.innerHTML = 'Salvo!';
      saveNotesBtn.classList.add('bg-accent-green/20', 'text-accent-green', 'border-accent-green');
      saveNotesBtn.classList.remove('bg-primary/20', 'text-primary', 'border-primary');
    } catch (err) {
      console.error('Erro ao salvar notas:', err);
      saveNotesBtn.innerHTML = 'Erro ao salvar';
      saveNotesBtn.classList.add('bg-accent-red/20', 'text-accent-red', 'border-accent-red');
      saveNotesBtn.classList.remove('bg-primary/20', 'text-primary', 'border-primary');
    } finally {
      setTimeout(() => {
        saveNotesBtn.innerHTML = originalButtonMarkup;
        saveNotesBtn.classList.remove('bg-accent-green/20', 'text-accent-green', 'border-accent-green', 'bg-accent-red/20', 'text-accent-red', 'border-accent-red');
        saveNotesBtn.classList.add('bg-primary/20', 'text-primary', 'border-primary');
        saveNotesBtn.disabled = false;
      }, 2000);
    }
  });

  return {
    openBudgetsModal,
    closeBudgetsModal,
    openNotesModal,
    closeNotesModal,
  };
}
