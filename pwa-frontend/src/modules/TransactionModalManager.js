export function initTransactionModal({
  addButton,
  closeButton,
  formElement,
  modalElement,
  modalContentElement,
  filterMonthEl,
  filterYearEl,
  typeRadios,
  toggleAdvancedButton,
  advancedFields,
  getElementById,
  getTransactions,
  clearEditTransactionId,
}) {
  function closeModal() {
    modalContentElement.classList.add('translate-y-full');
    setTimeout(() => {
      modalElement.classList.add('hidden');
    }, 300);
  }

  addButton.addEventListener('click', () => {
    formElement.reset();
    clearEditTransactionId();
    document.querySelector('#modal-content h3').textContent = 'Nova Transação';
    document.querySelector('#transaction-form button[type="submit"]').textContent = 'Salvar Transação';

    const selectedMonth = parseInt(filterMonthEl.value, 10);
    const selectedYear = parseInt(filterYearEl.value, 10);
    const today = new Date();
    const isViewingCurrentMonth = selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear();
    getElementById('tx-date').valueAsDate = isViewingCurrentMonth
      ? today
      : new Date(selectedYear, selectedMonth - 1, 1);

    const incomeRadio = document.querySelector('input[name="type"][value="Income"]');
    incomeRadio.checked = true;
    incomeRadio.dispatchEvent(new Event('change'));

    getElementById('tx-custom-category-container').classList.add('hidden');
    getElementById('tx-emoji-display').textContent = '🏷️';

    if (advancedFields) {
      advancedFields.classList.add('hidden');
      getElementById('advanced-icon').textContent = '▼';
    }

    modalElement.classList.remove('hidden');
    setTimeout(() => {
      modalContentElement.classList.remove('translate-y-full');
    }, 10);
  });

  closeButton.addEventListener('click', closeModal);
  modalContentElement.parentElement.addEventListener('click', (event) => {
    if (event.target === modalContentElement.parentElement) {
      closeModal();
    }
  });

  getElementById('tx-category').addEventListener('change', (event) => {
    const customCategoryContainer = getElementById('tx-custom-category-container');
    const selectedValue = event.target.value;

    if (selectedValue === 'New') {
      customCategoryContainer.classList.remove('hidden');
      getElementById('tx-emoji-display').textContent = '🏷️';
      return;
    }

    customCategoryContainer.classList.add('hidden');
    const transactions = getTransactions();
    if (transactions.length > 0) {
      const matchingTransaction = transactions.find((transaction) => (transaction.category || '').includes(selectedValue));
      if (matchingTransaction) {
        const firstCategoryToken = (matchingTransaction.category || '').split(' ')[0] || '';
        if (/[\u1000-\uFFFF]/.test(firstCategoryToken)) {
          getElementById('tx-emoji-display').textContent = firstCategoryToken;
          return;
        }
      }
    }

    getElementById('tx-emoji-display').textContent = '🏷️';
  });

  typeRadios.forEach((radioElement) => {
    radioElement.addEventListener('change', () => {
      document.querySelectorAll('label.flex-1').forEach((labelElement) => {
        labelElement.classList.remove('border-green-500', 'bg-green-500/10', 'text-green-400');
        labelElement.classList.remove('border-red-500', 'bg-red-500/10', 'text-red-400');
        labelElement.classList.add('border-transparent', 'bg-slate-800', 'text-slate-400');
      });

      const activeLabel = radioElement.parentElement;
      activeLabel.classList.remove('border-transparent', 'bg-slate-800', 'text-slate-400');

      if (radioElement.value === 'Income') {
        activeLabel.classList.add('border-green-500', 'bg-green-500/10', 'text-green-400');
      } else {
        activeLabel.classList.add('border-red-500', 'bg-red-500/10', 'text-red-400');
      }
    });
  });

  toggleAdvancedButton.addEventListener('click', () => {
    advancedFields.classList.toggle('hidden');
    const advancedIcon = getElementById('advanced-icon');
    advancedIcon.textContent = advancedFields.classList.contains('hidden') ? '▼' : '▲';
  });

  return { closeModal };
}
