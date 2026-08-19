// Vou seguir a criação de um módulo isolado KeyboardShortcutsManager porque ele evita poluir o main.js e centraliza todas as regras de teclado e acessibilidade Desktop.

export function initKeyboardShortcuts({
  openAddModal,
  closeModal,
  filterMonthEl,
  onMonthChanged,
  getModalsToClose,
}) {
  const monthSelectorModal = document.getElementById('month-selector-modal');
  const monthSelectorOverlay = document.getElementById('month-selector-overlay');
  const monthSelectorContent = document.getElementById('month-selector-content');
  const closeMonthSelectorBtn = document.getElementById('close-month-selector-btn');
  const monthButtons = Array.from(document.querySelectorAll('.month-opt-btn'));

  const labelIncome = document.getElementById('label-income');
  const labelExpense = document.getElementById('label-expense');
  const incomeRadio = document.querySelector('input[name="type"][value="Income"]');
  const expenseRadio = document.querySelector('input[name="type"][value="Expense"]');

  let currentHighlightedMonthIndex = 0;

  // --- Type Selector (Income / Expense) Keyboard Support ---
  function selectIncomeType() {
    if (incomeRadio) {
      incomeRadio.checked = true;
      incomeRadio.dispatchEvent(new Event('change'));
    }
  }

  function selectExpenseType() {
    if (expenseRadio) {
      expenseRadio.checked = true;
      expenseRadio.dispatchEvent(new Event('change'));
    }
  }

  if (labelIncome && labelExpense) {
    labelIncome.addEventListener('keydown', (event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        selectIncomeType();
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        labelExpense.focus();
      }
    });

    labelExpense.addEventListener('keydown', (event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        selectExpenseType();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        labelIncome.focus();
      }
    });
  }

  // --- Month Selector Modal Management ---
  function highlightMonthButton(index) {
    currentHighlightedMonthIndex = (index + 12) % 12;
    monthButtons.forEach((btn, idx) => {
      const isSelected = idx === currentHighlightedMonthIndex;
      if (isSelected) {
        btn.classList.add('bg-primary', 'text-white', 'border-primary', 'shadow-glow-primary', 'ring-2', 'ring-primary', 'is-selected');
        btn.classList.remove('bg-slate-800/80', 'text-slate-300', 'border-slate-700');
        btn.setAttribute('aria-selected', 'true');
        btn.focus();
      } else {
        btn.classList.remove('bg-primary', 'text-white', 'border-primary', 'shadow-glow-primary', 'ring-2', 'ring-primary', 'is-selected');
        btn.classList.add('bg-slate-800/80', 'text-slate-300', 'border-slate-700');
        btn.setAttribute('aria-selected', 'false');
      }
    });
  }

  function openMonthSelector() {
    if (!monthSelectorModal) return;

    const currentSelectedMonth = parseInt(filterMonthEl ? filterMonthEl.value : '1', 10);
    currentHighlightedMonthIndex = currentSelectedMonth >= 1 && currentSelectedMonth <= 12
      ? currentSelectedMonth - 1
      : 0;

    monthSelectorModal.classList.remove('hidden');
    setTimeout(() => {
      if (monthSelectorContent) {
        monthSelectorContent.classList.remove('scale-95');
        monthSelectorContent.classList.add('scale-100');
      }
      highlightMonthButton(currentHighlightedMonthIndex);
    }, 20);
  }

  function closeMonthSelector() {
    if (!monthSelectorModal || monthSelectorModal.classList.contains('hidden')) return;
    if (monthSelectorContent) {
      monthSelectorContent.classList.remove('scale-100');
      monthSelectorContent.classList.add('scale-95');
    }
    setTimeout(() => {
      monthSelectorModal.classList.add('hidden');
    }, 150);
  }

  function applyMonthSelection(monthNumber) {
    if (filterMonthEl) {
      filterMonthEl.value = String(monthNumber);
      filterMonthEl.dispatchEvent(new Event('change'));
    }
    if (typeof onMonthChanged === 'function') {
      onMonthChanged(monthNumber);
    }
    closeMonthSelector();
  }

  // Click & keyboard handlers on month buttons
  monthButtons.forEach((buttonElement, index) => {
    buttonElement.addEventListener('click', () => {
      const monthNum = parseInt(buttonElement.getAttribute('data-month'), 10) || (index + 1);
      applyMonthSelection(monthNum);
    });

    buttonElement.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        highlightMonthButton(currentHighlightedMonthIndex + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        highlightMonthButton(currentHighlightedMonthIndex - 1);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        highlightMonthButton(currentHighlightedMonthIndex + 3);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        highlightMonthButton(currentHighlightedMonthIndex - 3);
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const monthNum = parseInt(buttonElement.getAttribute('data-month'), 10) || (index + 1);
        applyMonthSelection(monthNum);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        closeMonthSelector();
      }
    });
  });

  if (closeMonthSelectorBtn) {
    closeMonthSelectorBtn.addEventListener('click', closeMonthSelector);
  }
  if (monthSelectorOverlay) {
    monthSelectorOverlay.addEventListener('click', closeMonthSelector);
  }

  // --- Global Keyboard Shortcuts ---
  window.addEventListener('keydown', (event) => {
    const isAltKey = event.altKey;
    const keyLower = event.key.toLowerCase();

    // Alt + N: New Transaction Modal
    if (isAltKey && keyLower === 'n') {
      event.preventDefault();
      if (typeof openAddModal === 'function') {
        openAddModal();
      }
      return;
    }

    // Alt + M: Month Quick-Selector
    if (isAltKey && keyLower === 'm') {
      event.preventDefault();
      openMonthSelector();
      return;
    }

    // Escape Key: Close open modals in priority order
    if (event.key === 'Escape') {
      if (monthSelectorModal && !monthSelectorModal.classList.contains('hidden')) {
        event.preventDefault();
        closeMonthSelector();
        return;
      }

      if (typeof closeModal === 'function') {
        const addModalEl = document.getElementById('add-modal');
        if (addModalEl && !addModalEl.classList.contains('hidden')) {
          event.preventDefault();
          closeModal();
          return;
        }
      }

      if (typeof getModalsToClose === 'function') {
        const otherModals = getModalsToClose();
        for (const modalEntry of otherModals) {
          if (modalEntry.element && !modalEntry.element.classList.contains('hidden')) {
            event.preventDefault();
            modalEntry.close();
            return;
          }
        }
      }
    }
  });

  return {
    openMonthSelector,
    closeMonthSelector,
  };
}
