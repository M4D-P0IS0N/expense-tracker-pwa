/**
 * ThemeManager.js
 * Responsável por gerenciar a seleção, aplicação e persistência de temas visuais do aplicativo.
 */

const STORAGE_KEY = 'expense_tracker_design_theme';

export function initThemeManager() {
  const themeSelectorBtn = document.getElementById('theme-selector-btn');
  const themeDropdown = document.getElementById('theme-dropdown');
  const themeOptionBtns = document.querySelectorAll('.theme-opt-btn');

  // Recupera tema salvo ou usa 'default'
  const savedTheme = localStorage.getItem(STORAGE_KEY) || 'default';
  applyTheme(savedTheme);

  if (themeSelectorBtn && themeDropdown) {
    // Abrir/Fechar dropdown ao clicar no botão
    themeSelectorBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      themeDropdown.classList.toggle('hidden');
    });

    // Fechar ao clicar fora
    document.addEventListener('click', (event) => {
      if (!themeDropdown.contains(event.target) && !themeSelectorBtn.contains(event.target)) {
        themeDropdown.classList.add('hidden');
      }
    });
  }

  // Event Listeners para cada opção do dropdown
  themeOptionBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const selectedTheme = btn.getAttribute('data-theme-opt');
      if (selectedTheme) {
        applyTheme(selectedTheme);
        if (themeDropdown) {
          themeDropdown.classList.add('hidden');
        }
      }
    });
  });
}

export function applyTheme(themeName) {
  const rootElement = document.documentElement;

  if (themeName === 'schematic') {
    rootElement.setAttribute('data-theme', 'schematic');
  } else {
    rootElement.setAttribute('data-theme', 'default');
  }

  localStorage.setItem(STORAGE_KEY, themeName);
  updateThemeDropdownUI(themeName);
}

function updateThemeDropdownUI(activeTheme) {
  const themeOptionBtns = document.querySelectorAll('.theme-opt-btn');

  themeOptionBtns.forEach((btn) => {
    const optValue = btn.getAttribute('data-theme-opt');
    const checkIcon = btn.querySelector('.check-icon');

    if (optValue === activeTheme) {
      btn.classList.add('bg-slate-700/80', 'font-bold');
      if (checkIcon) checkIcon.classList.remove('hidden');
    } else {
      btn.classList.remove('bg-slate-700/80', 'font-bold');
      if (checkIcon) checkIcon.classList.add('hidden');
    }
  });
}
