export function initSavingsManager({
  appElements,
  getElementById,
  savingsService,
  parseBrazilianCurrency,
  showNotification,
  gamificationService,
  updateAvatarUI,
  renderDashboard,
}) {
  let currentSavingsId = null;

  function renderSavingsGoals() {
    const savingsGoals = savingsService.getGoals();
    const totalSavedAmount = savingsService.getTotalSaved();

    appElements.savingsTotal.textContent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSavedAmount);

    if (savingsGoals.length === 0) {
      appElements.savingsList.innerHTML = '<div class="text-center text-slate-500 text-xs py-4 w-full">Nenhuma caixinha criada.</div>';
      return;
    }

    appElements.savingsList.innerHTML = '';
    savingsGoals.forEach((savingsGoal) => {
      const progressPercent = savingsGoal.targetAmount > 0
        ? Math.min(100, Math.round((savingsGoal.currentAmount / savingsGoal.targetAmount) * 100))
        : 0;
      const remainingAmount = Math.max(0, savingsGoal.targetAmount - savingsGoal.currentAmount);

      const savingsCard = document.createElement('div');
      savingsCard.className = 'flex-shrink-0 w-44 bg-slate-800/50 rounded-xl p-3 border border-slate-700 cursor-pointer hover:bg-slate-800 transition group';
      savingsCard.onclick = () => openSavingsModal(savingsGoal.id);
      savingsCard.innerHTML = `
        <div class="flex items-center justify-between mb-2">
          <span class="text-xl">${savingsGoal.icon}</span>
          <span class="text-[10px] font-bold text-slate-400 group-hover:text-primary transition">${progressPercent}%</span>
        </div>
        <h5 class="text-xs font-bold text-slate-300 truncate mb-1">${savingsGoal.name}</h5>
        <p class="text-[10px] text-slate-500 mb-2">Faltam R$ ${remainingAmount.toFixed(2)}</p>
        <div class="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
          <div class="h-full bg-primary rounded-full transition-all duration-1000" style="width: ${progressPercent}%"></div>
        </div>
      `;
      appElements.savingsList.appendChild(savingsCard);
    });
  }

  function openSavingsModal(savingsGoalId = null) {
    currentSavingsId = savingsGoalId;
    appElements.savingsManageFunds.classList.add('hidden');
    appElements.savingsDeleteBtn.classList.add('hidden');

    if (savingsGoalId) {
      const savingsGoal = savingsService.getGoalById(savingsGoalId);
      if (savingsGoal) {
        appElements.savingsId.value = savingsGoal.id;
        appElements.savingsName.value = savingsGoal.name;
        appElements.savingsTarget.value = savingsGoal.targetAmount;
        appElements.savingsIcon.value = savingsGoal.icon;

        appElements.savingsManageFunds.classList.remove('hidden');
        appElements.savingsDeleteBtn.classList.remove('hidden');
        getElementById('savings-modal-title').innerHTML = '<span class="material-symbols-outlined text-primary">savings</span> Editar Caixinha';
      }
    } else {
      appElements.savingsForm.reset();
      appElements.savingsId.value = '';
      appElements.savingsIcon.value = '🎯';
      getElementById('savings-modal-title').innerHTML = '<span class="material-symbols-outlined text-primary">savings</span> Nova Caixinha';
    }

    appElements.savingsModal.classList.remove('hidden');
    setTimeout(() => {
      appElements.savingsModalContent.classList.remove('scale-95');
    }, 10);
  }

  function closeSavingsModal() {
    appElements.savingsModalContent.classList.add('scale-95');
    setTimeout(() => {
      appElements.savingsModal.classList.add('hidden');
    }, 300);
  }

  appElements.closeSavingsBtn.addEventListener('click', closeSavingsModal);
  appElements.savingsModal.addEventListener('click', (event) => {
    if (event.target === appElements.savingsModal) {
      closeSavingsModal();
    }
  });
  appElements.addSavingsBtn.addEventListener('click', () => openSavingsModal());

  appElements.savingsForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const savingsGoalId = appElements.savingsId.value;
    const savingsGoalName = appElements.savingsName.value.trim();
    const savingsGoalTarget = parseBrazilianCurrency(appElements.savingsTarget.value);
    const savingsGoalIcon = appElements.savingsIcon.value.trim() || '🎯';

    if (savingsGoalId) {
      savingsService.updateGoal(savingsGoalId, {
        name: savingsGoalName,
        targetAmount: savingsGoalTarget,
        icon: savingsGoalIcon,
      });
    } else {
      savingsService.addGoal(savingsGoalName, savingsGoalTarget, savingsGoalIcon);
    }

    closeSavingsModal();
    renderDashboard();
  });

  appElements.savingsAddFundBtn.addEventListener('click', () => {
    if (!currentSavingsId) return;

    const parsedAmount = parseBrazilianCurrency(appElements.savingsFundAmount.value);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      showNotification('Valor inválido', 'error');
      return;
    }

    savingsService.addFunds(currentSavingsId, parsedAmount);
    appElements.savingsFundAmount.value = '';
    gamificationService.onTransactionLogged();
    updateAvatarUI();
    renderDashboard();
    closeSavingsModal();
  });

  appElements.savingsWithdrawFundBtn.addEventListener('click', () => {
    if (!currentSavingsId) return;

    const parsedAmount = parseBrazilianCurrency(appElements.savingsFundAmount.value);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      showNotification('Valor inválido', 'error');
      return;
    }

    savingsService.withdrawFunds(currentSavingsId, parsedAmount);
    appElements.savingsFundAmount.value = '';
    renderDashboard();
    closeSavingsModal();
  });

  appElements.savingsDeleteBtn.addEventListener('click', () => {
    if (currentSavingsId && confirm('Tem certeza que deseja excluir esta caixinha? O saldo voltará para o patrimônio livre.')) {
      savingsService.deleteGoal(currentSavingsId);
      closeSavingsModal();
      renderDashboard();
    }
  });

  return {
    renderSavingsGoals,
    openSavingsModal,
    closeSavingsModal,
  };
}
