import { normalizeCategory } from '../utils/categoryUtils.js';

export function initContextMenuManager({
  transactionService,
  selectGroupedTransactionsForDeletion,
  showNotification,
  loadData,
  setEditTransactionId,
  openTransactionModal,
  elements,
}) {
  const {
    contextMenuModal,
    contextOverlay,
    contextSheet,
    ctxIcon,
    ctxTitle,
    ctxAmount,
    ctxEditBtn,
    ctxDeleteBtn,
    ctxCancelBtn,
    typeRadios,
    amountInput,
    descriptionInput,
    dateInput,
    categorySelect,
    emojiDisplay,
    customCategoryContainer,
    cardInput,
    installmentTotalInput,
    recurringInput,
    splitByTwoInput,
    thirdPartyInput,
    modalTitleElement,
    modalSubmitButton,
  } = elements;

  let selectedTransaction = null;

  function openContextMenu(transaction) {
    selectedTransaction = transaction;
    ctxTitle.textContent = transaction.description;

    const isIncomeTransaction = transaction.type === 'Income';
    const amountSign = isIncomeTransaction ? '+' : '-';
    const formattedAmount = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Math.abs(transaction.amount));

    ctxAmount.textContent = `${amountSign}${formattedAmount}`;
    ctxAmount.className = `text-sm font-medium ${isIncomeTransaction ? 'text-accent-green' : 'text-accent-red'}`;

    const normalizedCat = normalizeCategory(transaction.category);
    ctxIcon.innerHTML = `<span style="font-size: 24px;">${normalizedCat.emoji}</span>`;

    contextMenuModal.classList.remove('hidden');
    setTimeout(() => contextSheet.classList.remove('translate-y-full'), 10);
  }

  function closeContextMenu() {
    contextSheet.classList.add('translate-y-full');
    setTimeout(() => {
      contextMenuModal.classList.add('hidden');
      selectedTransaction = null;
    }, 300);
  }

  function populateCategoryFields(transaction) {
    document.querySelectorAll('.custom-injected-option').forEach((optionElement) => optionElement.remove());

    const normalizedCat = normalizeCategory(transaction.category);
    emojiDisplay.textContent = normalizedCat.emoji;

    const optionFound = Array.from(categorySelect.options).some((optionElement) => optionElement.value === normalizedCat.name);

    if (!optionFound) {
      const injectedOptionElement = document.createElement('option');
      injectedOptionElement.value = normalizedCat.name;
      injectedOptionElement.textContent = normalizedCat.name;
      injectedOptionElement.className = 'custom-injected-option';
      categorySelect.insertBefore(injectedOptionElement, categorySelect.querySelector('option[value="New"]'));
    }

    categorySelect.value = normalizedCat.name;
    customCategoryContainer.classList.add('hidden');
  }

  async function handleDeleteTransaction() {
    if (!selectedTransaction) return;

    const originalDeleteButtonText = ctxDeleteBtn.textContent;
    ctxDeleteBtn.textContent = 'Apagando...';
    ctxDeleteBtn.disabled = true;

    try {
      if (selectedTransaction.installment_group_id) {
        const groupedTransactionTypeLabel = selectedTransaction.is_recurring ? 'Recorrente' : 'Parcelada';
        const shouldDeleteFutureTransactions = window.confirm(`Esta transação é ${groupedTransactionTypeLabel}.\n\nDeseja excluir também TODAS as cobranças (desta série) deste mês em diante?\n\n[OK] = Sim, excluir esta e as futuras.\n[Cancelar] = Apenas esta.`);

        if (shouldDeleteFutureTransactions) {
          const groupedTransactions = await transactionService.getTransactionsByInstallmentGroup(selectedTransaction.installment_group_id);
          const groupedTransactionsToDelete = selectGroupedTransactionsForDeletion(groupedTransactions, selectedTransaction);

          if (groupedTransactionsToDelete.length === 0) {
            console.warn('Nenhuma transação futura foi encontrada para a série selecionada.', {
              installmentGroupId: selectedTransaction.installment_group_id,
              selectedTransactionId: selectedTransaction.id,
            });
            await transactionService.deleteTransaction(selectedTransaction.id);
          } else {
            await transactionService.deleteTransactions(groupedTransactionsToDelete.map((transaction) => transaction.id));
          }
        } else {
          await transactionService.deleteTransaction(selectedTransaction.id);
        }
      } else {
        await transactionService.deleteTransaction(selectedTransaction.id);
      }

      closeContextMenu();
      await loadData();
      showNotification('Despesa apagada com sucesso.', 'success');
    } catch (error) {
      console.error('Falha ao apagar a transação parcelada/recorrente:', error);
      showNotification('Não foi possível apagar a despesa. Verifique sua conexão e tente novamente.', 'error');
    } finally {
      ctxDeleteBtn.textContent = originalDeleteButtonText;
      ctxDeleteBtn.disabled = false;
    }
  }

  function handleEditTransaction() {
    if (!selectedTransaction) return;

    setEditTransactionId(selectedTransaction.id);

    const typeValue = selectedTransaction.type === 'Income' ? 'Income' : 'Expense';
    const typeRadio = Array.from(typeRadios).find((radioElement) => radioElement.value === typeValue);
    typeRadio.checked = true;
    typeRadio.dispatchEvent(new Event('change'));

    amountInput.value = selectedTransaction.amount;
    descriptionInput.value = selectedTransaction.description;

    const originalDate = new Date(selectedTransaction.date);
    originalDate.setMinutes(originalDate.getMinutes() - originalDate.getTimezoneOffset());
    dateInput.valueAsDate = originalDate;

    populateCategoryFields(selectedTransaction);
    cardInput.value = selectedTransaction.credit_card_name || '';
    installmentTotalInput.value = selectedTransaction.total_installments || 1;
    recurringInput.checked = selectedTransaction.is_recurring || false;
    if (splitByTwoInput) {
      splitByTwoInput.checked = selectedTransaction.type === 'Expense' && Boolean(selectedTransaction.is_split_by_2);
    }
    if (thirdPartyInput) {
      thirdPartyInput.checked = selectedTransaction.type === 'Expense' && Boolean(selectedTransaction.is_third_party);
    }

    modalTitleElement.textContent = 'Editar Transação';
    modalSubmitButton.textContent = 'Salvar Alterações';

    closeContextMenu();
    openTransactionModal();
  }

  ctxCancelBtn.addEventListener('click', closeContextMenu);
  contextOverlay.addEventListener('click', closeContextMenu);
  ctxDeleteBtn.addEventListener('click', handleDeleteTransaction);
  ctxEditBtn.addEventListener('click', handleEditTransaction);

  return {
    openContextMenu,
    closeContextMenu,
  };
}

