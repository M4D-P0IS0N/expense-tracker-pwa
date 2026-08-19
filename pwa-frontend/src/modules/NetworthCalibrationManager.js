/**
 * NetworthCalibrationManager.js
 * Gerencia a abertura, exibição, validação e sincronização do Modal de Calibração do Patrimônio Líquido.
 */

function formatBrazilianCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function initNetworthCalibrationManager({
  dashNetworthCard,
  calibrateNetworthModal,
  calibrateNetworthOverlay,
  calibrateNetworthContent,
  calibrateCurrentNetworth,
  calibrateNetworthInput,
  closeCalibrateNetworthBtn,
  cancelCalibrateNetworthBtn,
  saveCalibrateNetworthBtn,
  saveCalibrateNetworthText,
  patrimonioReminder,
  markPatrimonioCalibrated,
  transactionService,
  parseBrazilianCurrency,
  getCurrentNetWorth,
  renderDashboard,
}) {
  let isSubmitting = false;

  function openModal() {
    if (!calibrateNetworthModal) return;

    try {
      const currentNetWorthValue = typeof getCurrentNetWorth === 'function' ? getCurrentNetWorth() : 0;
      
      if (calibrateCurrentNetworth) {
        calibrateCurrentNetworth.textContent = formatBrazilianCurrency(currentNetWorthValue);
      }

      if (calibrateNetworthInput) {
        // Pre-fill with clean formatted value (e.g. "2248,23")
        const formattedInitial = currentNetWorthValue.toFixed(2).replace('.', ',');
        calibrateNetworthInput.value = formattedInitial;
      }

      calibrateNetworthModal.classList.remove('hidden');
      
      // Auto-focus input for fast typing
      setTimeout(() => {
        if (calibrateNetworthInput) {
          calibrateNetworthInput.focus();
          calibrateNetworthInput.select();
        }
      }, 50);
    } catch (error) {
      console.error('Erro ao abrir modal de calibração de patrimônio:', error);
    }
  }

  function closeModal() {
    if (!calibrateNetworthModal) return;
    calibrateNetworthModal.classList.add('hidden');
    isSubmitting = false;
    if (saveCalibrateNetworthBtn && saveCalibrateNetworthText) {
      saveCalibrateNetworthBtn.disabled = false;
      saveCalibrateNetworthText.textContent = 'Salvar Ajuste';
    }
  }

  async function handleSave() {
    if (isSubmitting || !calibrateNetworthInput) return;

    const rawInput = calibrateNetworthInput.value.trim();
    if (!rawInput) {
      alert('Por favor, informe o saldo real atual.');
      return;
    }

    const targetNetWorth = parseBrazilianCurrency(rawInput);
    if (Number.isNaN(targetNetWorth)) {
      alert('Valor inválido. Exemplo correto: 2248,23 ou -150,00');
      return;
    }

    isSubmitting = true;
    if (saveCalibrateNetworthBtn && saveCalibrateNetworthText) {
      saveCalibrateNetworthBtn.disabled = true;
      saveCalibrateNetworthText.textContent = 'Sincronizando...';
    }

    try {
      const currentNetWorthValue = typeof getCurrentNetWorth === 'function' ? getCurrentNetWorth() : 0;
      const currentBase = await transactionService.getBaseNetWorth();
      const sumOfTransactions = currentNetWorthValue - currentBase;
      const newBase = targetNetWorth - sumOfTransactions;

      await transactionService.updateBaseNetWorth(newBase);

      if (typeof markPatrimonioCalibrated === 'function') {
        markPatrimonioCalibrated();
      }

      if (patrimonioReminder) {
        patrimonioReminder.classList.add('hidden');
      }

      closeModal();

      if (typeof renderDashboard === 'function') {
        await renderDashboard();
      }
    } catch (error) {
      console.error('Falha ao atualizar base de patrimônio:', error);
      alert('Erro ao sincronizar saldo com a nuvem. O valor foi atualizado localmente.');
      closeModal();
      if (typeof renderDashboard === 'function') {
        await renderDashboard();
      }
    } finally {
      isSubmitting = false;
    }
  }

  // Click on Net Worth Card
  if (dashNetworthCard) {
    dashNetworthCard.addEventListener('click', openModal);
    dashNetworthCard.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openModal();
      }
    });
  }

  // Click on floating reminder card opens modal directly
  if (patrimonioReminder) {
    patrimonioReminder.addEventListener('click', (event) => {
      // Don't trigger if clicked on the dismiss close icon
      if (!event.target.closest('#dismiss-patrimonio-reminder')) {
        openModal();
      }
    });
  }

  // Close triggers
  if (closeCalibrateNetworthBtn) {
    closeCalibrateNetworthBtn.addEventListener('click', closeModal);
  }

  if (cancelCalibrateNetworthBtn) {
    cancelCalibrateNetworthBtn.addEventListener('click', closeModal);
  }

  if (calibrateNetworthOverlay) {
    calibrateNetworthOverlay.addEventListener('click', closeModal);
  }

  // Save trigger
  if (saveCalibrateNetworthBtn) {
    saveCalibrateNetworthBtn.addEventListener('click', handleSave);
  }

  // Enter to submit in input field
  if (calibrateNetworthInput) {
    calibrateNetworthInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSave();
      } else if (event.key === 'Escape') {
        closeModal();
      }
    });
  }

  return {
    openModal,
    closeModal,
  };
}
