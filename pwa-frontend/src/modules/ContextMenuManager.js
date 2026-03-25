export function initContextMenu({
  appElements,
  getElementById,
  loadData,
  showNotification,
  transactionService,
  trashService,
  selectGroupedTransactionsForDeletion,
  setEditTransactionId,
}) {
  let selectedTransaction = null;

  function closeContextMenu() {
    appElements.contextSheet.classList.add('translate-y-full');
    setTimeout(() => {
      appElements.contextMenuModal.classList.add('hidden');
      selectedTransaction = null;
    }, 300);
  }

  function upsertCategoryOption(transactionCategoryName) {
    const transactionCategorySelect = getElementById('tx-category');
    const hasExistingCategoryOption = Array.from(transactionCategorySelect.options).some((option) => option.value === transactionCategoryName);

    if (hasExistingCategoryOption) {
      transactionCategorySelect.value = transactionCategoryName;
      getElementById('tx-custom-category-container').classList.add('hidden');
      return;
    }

    const injectedCategoryOption = document.createElement('option');
    injectedCategoryOption.value = transactionCategoryName;
    injectedCategoryOption.textContent = transactionCategoryName;
    injectedCategoryOption.className = 'custom-injected-option';

    const newOptionAnchor = transactionCategorySelect.querySelector('option[value="New"]');
    transactionCategorySelect.insertBefore(injectedCategoryOption, newOptionAnchor);
    transactionCategorySelect.value = transactionCategoryName;
    getElementById('tx-custom-category-container').classList.add('hidden');
  }

  function openContextMenu(transactionToInspect) {
    selectedTransaction = transactionToInspect;

    appElements.ctxTitle.textContent = transactionToInspect.description;

    const isIncomeTransaction = transactionToInspect.type === 'Income';
    const transactionSignal = isIncomeTransaction ? '+' : '-';
    const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(transactionToInspect.amount));
    appElements.ctxAmount.textContent = `${transactionSignal}${formattedAmount}`;
    appElements.ctxAmount.className = `text-sm font-medium ${isIncomeTransaction ? 'text-accent-green' : 'text-accent-red'}`;

    const firstCategoryToken = (transactionToInspect.category || '').split(' ')[0] || '';
    const hasEmojiCategory = /[\u1000-\uFFFF]/.test(firstCategoryToken);
    appElements.ctxIcon.innerHTML = hasEmojiCategory
      ? `<span style="font-size: 24px;">${firstCategoryToken}</span>`
      : '<span class="material-symbols-outlined text-slate-400">receipt_long</span>';

    appElements.contextMenuModal.classList.remove('hidden');
    setTimeout(() => appElements.contextSheet.classList.remove('translate-y-full'), 10);
  }

  appElements.ctxCancelBtn.addEventListener('click', closeContextMenu);
  appElements.contextOverlay.addEventListener('click', closeContextMenu);

  appElements.ctxDeleteBtn.addEventListener('click', async () => {
    if (!selectedTransaction) return;

    const originalDeleteButtonText = appElements.ctxDeleteBtn.textContent;
    appElements.ctxDeleteBtn.textContent = 'Apagando...';
    appElements.ctxDeleteBtn.disabled = true;

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
            trashService.moveToTrash(selectedTransaction.id);
          } else {
            groupedTransactionsToDelete.forEach((groupedTransaction) => trashService.moveToTrash(groupedTransaction.id));
          }
        } else {
          trashService.moveToTrash(selectedTransaction.id);
        }
      } else {
        trashService.moveToTrash(selectedTransaction.id);
      }

      closeContextMenu();
      await loadData();
      showNotification('Despesa apagada com sucesso.', 'success');
    } catch (error) {
      console.error('Falha ao apagar a transação parcelada/recorrente:', error);
      showNotification('Não foi possível apagar a despesa. Verifique sua conexão e tente novamente.', 'error');
    } finally {
      appElements.ctxDeleteBtn.textContent = originalDeleteButtonText;
      appElements.ctxDeleteBtn.disabled = false;
    }
  });

  appElements.ctxEditBtn.addEventListener('click', () => {
    if (!selectedTransaction) return;

    setEditTransactionId(selectedTransaction.id);

    const typeValue = selectedTransaction.type === 'Income' ? 'Income' : 'Expense';
    const typeRadio = document.querySelector(`input[name="type"][value="${typeValue}"]`);
    typeRadio.checked = true;
    typeRadio.dispatchEvent(new Event('change'));

    getElementById('tx-amount').value = selectedTransaction.amount;
    getElementById('tx-description').value = selectedTransaction.description;

    const originalTransactionDate = new Date(selectedTransaction.date);
    originalTransactionDate.setMinutes(originalTransactionDate.getMinutes() - originalTransactionDate.getTimezoneOffset());
    getElementById('tx-date').valueAsDate = originalTransactionDate;

    document.querySelectorAll('.custom-injected-option').forEach((element) => element.remove());

    const fullCategoryName = selectedTransaction.category || 'General';
    const firstCategoryToken = fullCategoryName.split(' ')[0] || '';
    const hasEmojiCategory = /[\u1000-\uFFFF]/.test(firstCategoryToken);

    if (hasEmojiCategory) {
      getElementById('tx-emoji-display').textContent = firstCategoryToken;
      upsertCategoryOption(fullCategoryName.substring(firstCategoryToken.length).trim());
    } else {
      getElementById('tx-emoji-display').textContent = '🏷️';
      upsertCategoryOption(fullCategoryName);
    }

    getElementById('tx-card').value = selectedTransaction.credit_card_name || '';
    getElementById('tx-install-total').value = selectedTransaction.total_installments || 1;
    getElementById('tx-recurring').checked = selectedTransaction.is_recurring || false;

    document.querySelector('#modal-content h3').textContent = 'Editar Transação';
    document.querySelector('#transaction-form button[type="submit"]').textContent = 'Salvar Alterações';

    closeContextMenu();
    appElements.modal.classList.remove('hidden');
    setTimeout(() => {
      appElements.modalContent.classList.remove('translate-y-full');
    }, 10);
  });

  return { openContextMenu, closeContextMenu };
}
