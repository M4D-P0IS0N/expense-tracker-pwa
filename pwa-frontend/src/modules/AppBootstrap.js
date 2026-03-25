export function initAppBootstrap({
  authService,
  userDisplayNameEl,
  getElementById,
  initTemporalNav,
  initFilters,
  initNeuralBorder,
}) {
  document.addEventListener('DOMContentLoaded', async () => {
    const currentSession = await authService.getSession();
    if (!currentSession) {
      window.location.replace(`${import.meta.env.BASE_URL}login.html`);
      return;
    }

    if (userDisplayNameEl && currentSession.user) {
      const normalizedUserDisplayName = currentSession.user.email?.split('@')[0] || 'Meu Perfil';
      userDisplayNameEl.textContent = normalizedUserDisplayName;
    }

    getElementById('tx-date').valueAsDate = new Date();

    await initTemporalNav();
    initFilters();
    initNeuralBorder();
  });
}
