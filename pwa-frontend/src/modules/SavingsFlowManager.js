export function initSavingsFlow({
  savingsService,
  gamificationService,
  parseBrazilianCurrency,
  showNotification,
  renderDashboard,
  updateAvatarUI,
  elements,
}) {
  const {
    addSavingsBtn,
    savingsList,
    savingsTotal,
    savingsModal,
    savingsModalContent,
    closeSavingsBtn,
    savingsForm,
    savingsId,
    savingsName,
    savingsTarget,
    savingsIcon,
    savingsManageFunds,
    savingsFundAmount,
    savingsAddFundBtn,
    savingsWithdrawFundBtn,
    savingsDeleteBtn,
    savingsModalTitle,
  } = elements;

  let currentSavingsId = null;

  function renderSavingsGoals() {
    const goals = savingsService.getGoals();
    const totalSavedAmount = savingsService.getTotalSaved();

    savingsTotal.textContent = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(totalSavedAmount);

    if (goals.length === 0) {
      savingsList.innerHTML = '<div class="text-center text-slate-500 text-xs py-4 w-full">Nenhuma caixinha criada.</div>';
      return;
    }

    savingsList.innerHTML = '';
    goals.forEach((goal) => {
      const completionPercentage = goal.targetAmount > 0
        ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
        : 0;
      const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);

      const goalCardElement = document.createElement('div');
      goalCardElement.className = 'flex-shrink-0 w-44 bg-slate-800/50 rounded-xl p-3 border border-slate-700 cursor-pointer hover:bg-slate-800 transition group';
      goalCardElement.onclick = () => openSavingsModal(goal.id);
      goalCardElement.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <span class="text-xl">${goal.icon}</span>
                <span class="text-[10px] font-bold text-slate-400 group-hover:text-primary transition">${completionPercentage}%</span>
            </div>
            <h5 class="text-xs font-bold text-slate-300 truncate mb-1">${goal.name}</h5>
            <p class="text-[10px] text-slate-500 mb-2">Faltam R$ ${remainingAmount.toFixed(2)}</p>
            <div class="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                <div class="h-full bg-primary rounded-full transition-all duration-1000" style="width: ${completionPercentage}%"></div>
            </div>
        `;
      savingsList.appendChild(goalCardElement);
    });
  }

  function openSavingsModal(id = null) {
    currentSavingsId = id;
    savingsManageFunds.classList.add('hidden');
    savingsDeleteBtn.classList.add('hidden');

    if (id) {
      const selectedGoal = savingsService.getGoalById(id);
      if (selectedGoal) {
        savingsId.value = selectedGoal.id;
        savingsName.value = selectedGoal.name;
        savingsTarget.value = selectedGoal.targetAmount;
        savingsIcon.value = selectedGoal.icon;

        savingsManageFunds.classList.remove('hidden');
        savingsDeleteBtn.classList.remove('hidden');
        savingsModalTitle.innerHTML = '<span class="material-symbols-outlined text-primary">savings</span> Editar Caixinha';
      }
    } else {
      savingsForm.reset();
      savingsId.value = '';
      savingsIcon.value = '🎯';
      savingsModalTitle.innerHTML = '<span class="material-symbols-outlined text-primary">savings</span> Nova Caixinha';
    }

    savingsModal.classList.remove('hidden');
    setTimeout(() => {
      savingsModalContent.classList.remove('scale-95');
    }, 10);
  }

  function closeSavingsModal() {
    savingsModalContent.classList.add('scale-95');
    setTimeout(() => {
      savingsModal.classList.add('hidden');
    }, 300);
  }

  closeSavingsBtn.addEventListener('click', closeSavingsModal);
  savingsModal.addEventListener('click', (event) => {
    if (event.target === savingsModal) {
      closeSavingsModal();
    }
  });

  addSavingsBtn.addEventListener('click', () => openSavingsModal());

  savingsForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const goalId = savingsId.value;
    const goalName = savingsName.value.trim();
    const goalTargetAmount = parseBrazilianCurrency(savingsTarget.value);
    const goalIcon = savingsIcon.value.trim() || '🎯';

    if (goalId) {
      savingsService.updateGoal(goalId, {
        name: goalName,
        targetAmount: goalTargetAmount,
        icon: goalIcon,
      });
    } else {
      savingsService.addGoal(goalName, goalTargetAmount, goalIcon);
      if (gamificationService && typeof gamificationService.onSavingsGoalCreated === 'function') {
        gamificationService.onSavingsGoalCreated();
      }
      if (updateAvatarUI && typeof updateAvatarUI === 'function') {
        updateAvatarUI();
      }
    }

    closeSavingsModal();
    renderDashboard();
  });

  savingsAddFundBtn.addEventListener('click', () => {
    if (!currentSavingsId) {
      return;
    }

    const fundAmount = parseBrazilianCurrency(savingsFundAmount.value);
    if (Number.isNaN(fundAmount) || fundAmount <= 0) {
      showNotification('Valor inválido', 'error');
      return;
    }

    const updatedGoal = savingsService.addFunds(currentSavingsId, fundAmount);
    savingsFundAmount.value = '';
    if (gamificationService) {
      gamificationService.onTransactionLogged();
      if (updatedGoal && updatedGoal.targetAmount > 0 && updatedGoal.currentAmount >= updatedGoal.targetAmount) {
        gamificationService.onSavingsGoalCompleted();
      }
    }
    if (updateAvatarUI && typeof updateAvatarUI === 'function') {
      updateAvatarUI();
    }
    renderDashboard();
    closeSavingsModal();
  });

  savingsWithdrawFundBtn.addEventListener('click', () => {
    if (!currentSavingsId) {
      return;
    }

    const fundAmount = parseBrazilianCurrency(savingsFundAmount.value);
    if (Number.isNaN(fundAmount) || fundAmount <= 0) {
      showNotification('Valor inválido', 'error');
      return;
    }

    savingsService.withdrawFunds(currentSavingsId, fundAmount);
    savingsFundAmount.value = '';
    renderDashboard();
    closeSavingsModal();
  });

  savingsDeleteBtn.addEventListener('click', () => {
    if (!currentSavingsId) {
      return;
    }

    const shouldDeleteGoal = confirm('Tem certeza que deseja excluir esta caixinha? O saldo voltará para o patrimônio livre.');
    if (!shouldDeleteGoal) {
      return;
    }

    savingsService.deleteGoal(currentSavingsId);
    closeSavingsModal();
    renderDashboard();
  });

  return {
    renderSavingsGoals,
    openSavingsModal,
    closeSavingsModal,
  };
}
