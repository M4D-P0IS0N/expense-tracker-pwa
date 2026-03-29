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
    notesMetaContainer,
    notesDate,
    notesDiffBox,
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
        const categoryName = transaction.category || 'General';
        knownExpenseCategories.add(categoryName.replace(/[\u1000-\uFFFF]/, '').trim() || categoryName);
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

  function openNotesModal() {
    notesTextarea.value = notebookService.getNotes();

    const notesMeta = notebookService.getMeta();
    if (notesMeta) {
      notesMetaContainer.classList.remove('hidden');
      notesDate.textContent = new Date(notesMeta.lastEdited).toLocaleString('pt-BR');
      notesDiffBox.innerHTML = '';

      if (notesMeta.added.length === 0 && notesMeta.removed.length === 0) {
        notesDiffBox.innerHTML = '<span class="text-slate-500 italic">Nenhuma alteração de linha significativa detectada na última edição.</span>';
      } else {
        notesMeta.added.forEach((lineContent) => {
          notesDiffBox.innerHTML += `<div class="text-accent-green backdrop-blur-sm bg-accent-green/10 px-1.5 py-0.5 rounded truncate">+ ${lineContent}</div>`;
        });
        notesMeta.removed.forEach((lineContent) => {
          notesDiffBox.innerHTML += `<div class="text-accent-red backdrop-blur-sm bg-accent-red/10 px-1.5 py-0.5 rounded truncate line-through opacity-75">- ${lineContent}</div>`;
        });
      }
    } else {
      notesMetaContainer.classList.add('hidden');
    }

    notesModal.classList.remove('hidden');
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

  saveNotesBtn.addEventListener('click', () => {
    notebookService.saveNotes(notesTextarea.value);

    const originalButtonMarkup = saveNotesBtn.innerHTML;
    saveNotesBtn.innerHTML = 'Salvo!';
    saveNotesBtn.classList.add('bg-accent-green/20', 'text-accent-green', 'border-accent-green');
    saveNotesBtn.classList.remove('bg-primary/20', 'text-primary', 'border-primary');

    setTimeout(() => {
      saveNotesBtn.innerHTML = originalButtonMarkup;
      saveNotesBtn.classList.remove('bg-accent-green/20', 'text-accent-green', 'border-accent-green');
      saveNotesBtn.classList.add('bg-primary/20', 'text-primary', 'border-primary');
    }, 2000);
  });

  return {
    openBudgetsModal,
    closeBudgetsModal,
    openNotesModal,
    closeNotesModal,
  };
}
