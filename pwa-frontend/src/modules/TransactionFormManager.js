import { normalizeCategory } from '../utils/categoryUtils.js';

export function initTransactionForm({
  formElement,
  getElementById,
  parseBrazilianCurrency,
  showNotification,
  transactionService,
  gamificationService,
  updateAvatarUI,
  loadData,
  closeModal,
  getEditTransactionId,
}) {
  formElement.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = formElement.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Salvando...';
    submitButton.disabled = true;

    try {
      const transactionType = document.querySelector('input[name="type"]:checked').value;
      const selectedCategoryValue = getElementById('tx-category').value;
      const selectedEmoji = getElementById('tx-emoji-display').textContent;
      const customCategoryValue = getElementById('tx-custom-category').value;
      const rawCategoryName = selectedCategoryValue === 'New' ? customCategoryValue : selectedCategoryValue;
      const finalCategoryLabel = normalizeCategory(rawCategoryName, selectedEmoji).full;

      const transactionDescription = getElementById('tx-description').value;
      const parsedAmount = parseBrazilianCurrency(getElementById('tx-amount').value);
      if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
        showNotification('Por favor, informe um valor válido acima de zero.', 'error');
        return;
      }

      const transactionPayload = {
        description: transactionDescription,
        amount: parsedAmount,
        type: transactionType,
        category: finalCategoryLabel,
        date: getElementById('tx-date').value,
        credit_card_name: getElementById('tx-card').value || null,
        total_installments: parseInt(getElementById('tx-install-total').value, 10) || 1,
        installment_number: parseInt(getElementById('tx-install-number').value, 10) || 1,
        is_recurring: getElementById('tx-recurring').checked,
        is_split_by_2: transactionType === 'Expense' && getElementById('tx-split-by-two').checked,
        is_third_party: transactionType === 'Expense' && getElementById('tx-third-party').checked,
      };

      const editingTransactionId = getEditTransactionId();
      if (editingTransactionId) {
        await transactionService.updateTransaction(editingTransactionId, transactionPayload);
      } else {
        await transactionService.addTransaction(transactionPayload);
        if (gamificationService) {
          gamificationService.onTransactionLogged(transactionPayload);
        }
        if (updateAvatarUI && typeof updateAvatarUI === 'function') {
          updateAvatarUI();
        }
      }

      await loadData();
      closeModal();
    } catch (error) {
      alert('Erro ao salvar transação. Verifique se o Supabase está configurado corretamente.');
      console.error(error);
    } finally {
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
    }
  });
}

