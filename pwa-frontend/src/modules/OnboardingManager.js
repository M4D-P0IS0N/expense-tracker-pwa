export function initOnboardingFlow({
  appElements,
  getElementById,
  getTransactions,
  showNotification,
  updateAvatarUI,
  gamificationService,
  isOnboardingCompleted,
  markOnboardingCompleted,
  isPatrimonioCalibrated,
  markPatrimonioCalibrated,
}) {
  let onboardingAvatarGender = null;

  const existingProfile = gamificationService.getProfile();
  if (!isOnboardingCompleted() && !existingProfile.AvatarGender) {
    appElements.onboardingModal.classList.remove('hidden');
  } else if (!isOnboardingCompleted() && existingProfile.AvatarGender) {
    markOnboardingCompleted();
  }

  getElementById('onb-avatar-male').addEventListener('click', () => {
    onboardingAvatarGender = 'male';
    appElements.onbAvatarChosen.classList.remove('hidden');
    getElementById('onb-avatar-male').querySelector('div').classList.add('border-primary', 'ring-2', 'ring-primary/50');
    getElementById('onb-avatar-female').querySelector('div').classList.remove('border-primary', 'ring-2', 'ring-primary/50');
  });

  getElementById('onb-avatar-female').addEventListener('click', () => {
    onboardingAvatarGender = 'female';
    appElements.onbAvatarChosen.classList.remove('hidden');
    getElementById('onb-avatar-female').querySelector('div').classList.add('border-primary', 'ring-2', 'ring-primary/50');
    getElementById('onb-avatar-male').querySelector('div').classList.remove('border-primary', 'ring-2', 'ring-primary/50');
  });

  getElementById('onb-next-1').addEventListener('click', () => {
    const normalizedUserName = appElements.onbNameInput.value.trim();
    if (!normalizedUserName) {
      showNotification('Por favor, digite seu nome.', 'error');
      return;
    }
    if (!onboardingAvatarGender) {
      showNotification('Escolha um avatar para continuar.', 'error');
      return;
    }

    if (appElements.userDisplayNameEl) {
      appElements.userDisplayNameEl.textContent = normalizedUserName;
    }
    localStorage.setItem('userDisplayName', normalizedUserName);
    gamificationService.setAvatarGender(onboardingAvatarGender);
    updateAvatarUI();

    appElements.onbStep1.classList.add('hidden');
    appElements.onbStep2.classList.remove('hidden');
    appElements.onbDot1.classList.replace('bg-primary', 'bg-slate-600');
    appElements.onbDot2.classList.replace('bg-slate-600', 'bg-primary');
  });

  getElementById('onb-finish').addEventListener('click', () => {
    markOnboardingCompleted();
    appElements.onboardingModal.classList.add('hidden');
    showNotification('Bem-vindo! Adicione suas primeiras transações 🎉', 'success');
  });

  getElementById('dismiss-patrimonio-reminder').addEventListener('click', () => {
    markPatrimonioCalibrated();
    appElements.patrimonioReminder.classList.add('hidden');
  });

  function checkPatrimonioReminder() {
    if (!isOnboardingCompleted()) return;
    if (isPatrimonioCalibrated()) return;

    const currentTransactions = getTransactions();
    if (currentTransactions && currentTransactions.length > 0) {
      appElements.patrimonioReminder.classList.remove('hidden');
    }
  }

  return { checkPatrimonioReminder };
}
