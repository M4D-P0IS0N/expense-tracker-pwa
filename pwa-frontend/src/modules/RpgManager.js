export function initRpgManager({
  appElements,
  authService,
  gamificationService,
  getElementById,
}) {
  function closeHelpModal() {
    getElementById('help-modal').classList.add('hidden');
  }

  function updateAvatarUI() {
    const profile = gamificationService.getProfile();
    const spriteFile = gamificationService.getSpriteFilename(profile.EvolutionStage, profile.AvatarGender);
    const stageLabel = gamificationService.getStageLabel(profile.EvolutionStage, profile.AvatarGender);
    const avatarPlaceholder = getElementById('avatar-placeholder');

    appElements.avatarLevelBadge.textContent = `Lvl ${profile.Level}`;
    appElements.avatarStageName.textContent = profile.AvatarGender ? stageLabel : 'Escolha seu Avatar';

    if (profile.AvatarGender) {
      appElements.avatarImg.src = `./assets/sprites/${spriteFile}`;
      appElements.avatarImg.classList.remove('hidden');
      if (avatarPlaceholder) avatarPlaceholder.classList.add('hidden');
      appElements.avatarImg.onerror = () => {
        appElements.avatarImg.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile.EvolutionStage}`;
      };
    } else {
      appElements.avatarImg.classList.add('hidden');
      if (avatarPlaceholder) avatarPlaceholder.classList.remove('hidden');
    }
  }

  function showGenderChoiceModal() {
    const existingModal = getElementById('gender-choice-modal');
    if (existingModal) existingModal.remove();

    const choiceModal = document.createElement('div');
    choiceModal.id = 'gender-choice-modal';
    choiceModal.className = 'fixed inset-0 z-[70] flex items-center justify-center p-6';
    choiceModal.innerHTML = `
      <div class="fixed inset-0 bg-slate-900/95"></div>
      <div class="relative z-10 w-full max-w-sm">
        <div class="glass-card rounded-3xl p-6 border border-primary/20 text-center space-y-5">
          <div>
            <span class="material-symbols-outlined text-primary text-4xl">person</span>
            <h3 class="text-xl font-bold text-white mt-2">Escolha seu Avatar</h3>
            <p class="text-sm text-slate-400 mt-1">A linha evolutiva seguirá a sua escolha.</p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <button id="choose-male-btn" class="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-slate-700 hover:border-primary bg-slate-800 hover:bg-primary/10 transition-all group overflow-hidden">
              <div class="w-28 h-28 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                <img src="./assets/sprites/stage1-m.png" alt="Camponês" class="w-full h-full object-cover" style="transform: scale(1.3);" />
              </div>
              <span class="text-sm font-bold text-white group-hover:text-primary transition-colors">Camponês</span>
            </button>
            <button id="choose-female-btn" class="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-slate-700 hover:border-pink-400 bg-slate-800 hover:bg-pink-400/10 transition-all group overflow-hidden">
              <div class="w-28 h-28 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center">
                <img src="./assets/sprites/stage1-f.png" alt="Camponesa" class="w-full h-full object-cover" style="transform: scale(1.3);" />
              </div>
              <span class="text-sm font-bold text-white group-hover:text-pink-400 transition-colors">Camponesa</span>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(choiceModal);

    getElementById('choose-male-btn').addEventListener('click', () => {
      gamificationService.setAvatarGender('male');
      choiceModal.remove();
      updateAvatarUI();
      openRpgModal();
    });

    getElementById('choose-female-btn').addEventListener('click', () => {
      gamificationService.setAvatarGender('female');
      choiceModal.remove();
      updateAvatarUI();
      openRpgModal();
    });
  }

  function renderAchievements(profile) {
    appElements.achievementsGrid.innerHTML = '';

    gamificationService.ALL_ACHIEVEMENTS.forEach((achievementDefinition) => {
      const isUnlocked = profile.UnlockedAchievements.some((achievement) => achievement.Id === achievementDefinition.Id);
      const progress = gamificationService.getAchievementProgress(achievementDefinition, profile);
      const progressPct = progress.max > 0 ? Math.min(Math.round((progress.current / progress.max) * 100), 100) : 0;

      const isSecret = achievementDefinition.IsSecret && !isUnlocked;
      const displayName = isSecret
        ? achievementDefinition.Name
        : (isUnlocked && achievementDefinition.RevealedName ? achievementDefinition.RevealedName : achievementDefinition.Name);
      const displayDesc = isSecret
        ? achievementDefinition.Description
        : (isUnlocked && achievementDefinition.RevealedDescription ? achievementDefinition.RevealedDescription : achievementDefinition.Description);
      const iconName = isSecret
        ? achievementDefinition.Icon
        : (isUnlocked && achievementDefinition.RevealedIcon ? achievementDefinition.RevealedIcon : achievementDefinition.Icon);
      const iconColor = isUnlocked
        ? (achievementDefinition.RevealedIconColor || achievementDefinition.IconColor || 'text-yellow-400')
        : 'text-slate-600';

      const cardClass = isUnlocked ? 'border-purple-500/40 bg-purple-500/10' : 'border-slate-700/50 bg-slate-800/30';
      const iconWrapperClass = isUnlocked
        ? 'bg-slate-900/80 border-purple-500/30'
        : 'bg-slate-900/50 border-slate-700/30 grayscale opacity-40';
      const titleClass = isUnlocked ? 'text-white' : 'text-slate-500';
      const descClass = isUnlocked ? 'text-slate-400' : 'text-slate-600';
      const dateHtml = isUnlocked ? '<span class="text-[9px] text-primary font-bold">✓ Concluída</span>' : '';

      const showProgress = !isUnlocked && achievementDefinition.MaxProgress > 1 && achievementDefinition.TrackKey;
      const progressBarHtml = showProgress ? `
        <div class="mt-1.5 flex items-center gap-2">
          <div class="flex-1 h-1.5 bg-slate-700/40 rounded-full overflow-hidden">
            <div class="h-full bg-slate-500/40 rounded-full transition-all duration-700" style="width: ${progressPct}%"></div>
          </div>
          <span class="text-[9px] text-slate-600 font-medium shrink-0">${progress.current}/${progress.max}</span>
        </div>` : '';

      appElements.achievementsGrid.innerHTML += `
        <div class="flex items-start gap-3 p-3 rounded-xl border ${cardClass} transition-all">
          <div class="h-10 w-10 shrink-0 rounded-full flex items-center justify-center border ${iconWrapperClass}">
            <span class="material-symbols-outlined ${iconColor}" style="font-size: 22px;">${iconName}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-center mb-0.5">
              <h5 class="text-sm font-bold ${titleClass} truncate">${displayName}</h5>
              ${dateHtml}
            </div>
            <p class="text-xs ${descClass}">${displayDesc}</p>
            ${progressBarHtml}
          </div>
        </div>
      `;
    });
  }

  function ensureRpgActionButtons() {
    if (getElementById('rpg-logout-btn')) return;

    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.className = 'mt-4 pt-4 border-t border-slate-700 space-y-3';
    buttonsWrapper.innerHTML = `
      <button id="rpg-help-btn" class="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
        <span class="material-symbols-outlined">help</span> Dúvidas
      </button>
      <button id="rpg-logout-btn" class="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
        <span class="material-symbols-outlined">logout</span> Sair da Conta
      </button>
    `;
    appElements.achievementsGrid.parentElement.appendChild(buttonsWrapper);

    getElementById('rpg-help-btn').addEventListener('click', () => {
      appElements.rpgModal.classList.add('hidden');
      getElementById('help-modal').classList.remove('hidden');
    });

    getElementById('rpg-logout-btn').addEventListener('click', async () => {
      try {
        getElementById('rpg-logout-btn').innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Saindo...';
        await authService.signOut();
        window.location.replace(`${import.meta.env.BASE_URL}login.html`);
      } catch (error) {
        alert(`Erro ao sair da conta: ${error.message}`);
      }
    });
  }

  function openRpgModal() {
    const profile = gamificationService.getProfile();

    if (!profile.AvatarGender) {
      showGenderChoiceModal();
      return;
    }

    const spriteFile = gamificationService.getSpriteFilename(profile.EvolutionStage, profile.AvatarGender);
    const stageLabel = gamificationService.getStageLabel(profile.EvolutionStage, profile.AvatarGender);

    appElements.rpgStageTitle.textContent = stageLabel;
    appElements.rpgLevelText.textContent = profile.Level;
    appElements.rpgXpText.textContent = `${profile.CurrentXP} / ${profile.XPToNextLevel}`;

    const progressPercent = Math.min(100, Math.round((profile.CurrentXP / profile.XPToNextLevel) * 100));
    appElements.rpgXpBar.style.width = '0%';
    setTimeout(() => {
      appElements.rpgXpBar.style.width = `${progressPercent}%`;
    }, 100);

    appElements.rpgLargeAvatar.src = `./assets/sprites/${spriteFile}`;
    appElements.rpgLargeAvatar.onerror = () => {
      appElements.rpgLargeAvatar.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile.EvolutionStage}`;
    };

    renderAchievements(profile);
    ensureRpgActionButtons();
    appElements.rpgModal.classList.remove('hidden');
  }

  const closeRpgModal = () => appElements.rpgModal.classList.add('hidden');

  appElements.avatarControl.addEventListener('click', openRpgModal);
  appElements.closeRpgBtn.addEventListener('click', closeRpgModal);
  appElements.rpgOverlay.addEventListener('click', closeRpgModal);
  getElementById('close-help-btn').addEventListener('click', closeHelpModal);
  getElementById('help-overlay').addEventListener('click', closeHelpModal);

  return { updateAvatarUI, openRpgModal };
}
