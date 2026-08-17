import { MonthPreferencesService } from '../services/MonthPreferencesService.js';

export function initNavigationFilters({
  transactionService,
  gamificationService,
  monthPreferencesService = MonthPreferencesService,
  showNotification,
  loadData,
  updateUI,
  renderDashboard,
  elements,
  getCurrentSearchQuery,
  setCurrentSearchQuery,
  getCurrentQuickFilter,
  setCurrentQuickFilter,
  getCurrentCardFilter,
  setCurrentCardFilter,
  getCurrentSort,
  setCurrentSort,
  getCurrentTab,
  setCurrentTab,
  setSplitByTwoEnabled,
}) {
  async function syncSplitByTwoState(fetchCloud = true) {
    if (!elements.filterSplitByTwoEl) return;
    const year = parseInt(elements.filterYearEl.value, 10);
    const month = parseInt(elements.filterMonthEl.value, 10);
    if (!year || !month) return;

    // 1. Estado imediato via cache local
    const cachedEnabled = monthPreferencesService.getSplitByTwoFromCache(year, month);
    elements.filterSplitByTwoEl.checked = cachedEnabled;
    setSplitByTwoEnabled(cachedEnabled);

    // 2. Sincronização assíncrona em nuvem com Supabase
    if (fetchCloud && typeof monthPreferencesService.getSplitByTwo === 'function') {
      try {
        const cloudEnabled = await monthPreferencesService.getSplitByTwo(year, month);
        if (cloudEnabled !== cachedEnabled) {
          elements.filterSplitByTwoEl.checked = cloudEnabled;
          setSplitByTwoEnabled(cloudEnabled);
          updateUI();
          if (getCurrentTab() === 'Dashboard') {
            renderDashboard();
          }
        }
      } catch (err) {
        console.warn('Erro ao sincronizar Dividir por 2 da nuvem:', err);
      }
    }
  }

  async function initTemporalNav() {
    const currentDate = new Date();
    const years = await transactionService.getAvailableYears();

    elements.filterYearEl.innerHTML = '';
    years.forEach((year) => {
      const yearOptionElement = document.createElement('option');
      yearOptionElement.value = year;
      yearOptionElement.textContent = year;
      elements.filterYearEl.appendChild(yearOptionElement);
    });

    const addYearOption = document.createElement('option');
    addYearOption.value = '__add_year__';
    addYearOption.textContent = '+ Ano';
    elements.filterYearEl.appendChild(addYearOption);

    elements.filterMonthEl.value = (currentDate.getMonth() + 1).toString();
    elements.filterYearEl.value = currentDate.getFullYear().toString();
    await syncSplitByTwoState(true);

    elements.filterMonthEl.addEventListener('change', async () => {
      await syncSplitByTwoState(true);
      loadData();
    });
    elements.filterYearEl.addEventListener('change', async () => {
      if (elements.filterYearEl.value === '__add_year__') {
        const newYearString = prompt('Digite o ano que deseja adicionar (ex: 2030):');
        if (newYearString) {
          const newYear = parseInt(newYearString, 10);
          if (!Number.isNaN(newYear) && newYear >= 2020 && newYear <= 2050) {
            const existingValues = Array.from(elements.filterYearEl.options).map((optionElement) => optionElement.value);
            if (!existingValues.includes(String(newYear))) {
              const newOptionElement = document.createElement('option');
              newOptionElement.value = newYear;
              newOptionElement.textContent = newYear;
              elements.filterYearEl.insertBefore(newOptionElement, addYearOption);
            }
            elements.filterYearEl.value = String(newYear);
            await syncSplitByTwoState(true);
            loadData();
          } else {
            showNotification('Ano inválido. Use entre 2020 e 2050.', 'error');
            elements.filterYearEl.value = currentDate.getFullYear().toString();
          }
        } else {
          elements.filterYearEl.value = currentDate.getFullYear().toString();
        }
      } else {
        await syncSplitByTwoState(true);
        loadData();
      }
    });

    await gamificationService.syncWithDatabase(transactionService);
    gamificationService.trackDailyLogin();
    await loadData();
  }

  function initFilters() {
    let searchTimeout;

    elements.searchInput.addEventListener('input', (event) => {
      clearTimeout(searchTimeout);
      setCurrentSearchQuery(event.target.value.trim());

      if (getCurrentSearchQuery().length > 0) {
        elements.filterMonthEl.parentElement.classList.add('opacity-50', 'pointer-events-none');
      } else {
        elements.filterMonthEl.parentElement.classList.remove('opacity-50', 'pointer-events-none');
      }

      searchTimeout = setTimeout(() => {
        loadData();
      }, 400);
    });

    elements.filterCardEl.addEventListener('change', (event) => {
      setCurrentCardFilter(event.target.value);
      updateUI();
    });

    if (elements.sortTransactionsEl) {
      elements.sortTransactionsEl.addEventListener('change', (event) => {
        setCurrentSort(event.target.value);
        updateUI();
      });
    }

    if (elements.filterSplitByTwoEl) {
      syncSplitByTwoState(false);
      elements.filterSplitByTwoEl.addEventListener('change', async (event) => {
        const year = parseInt(elements.filterYearEl.value, 10);
        const month = parseInt(elements.filterMonthEl.value, 10);
        const isChecked = event.target.checked;

        setSplitByTwoEnabled(isChecked);
        await monthPreferencesService.setSplitByTwo(year, month, isChecked);

        updateUI();
        if (getCurrentTab() === 'Dashboard') {
          renderDashboard();
        }
      });
    }

    elements.filterChips.forEach((chipElement) => {
      chipElement.addEventListener('click', (event) => {
        const filterType = event.target.getAttribute('data-filter');

        if (getCurrentQuickFilter() === filterType) {
          setCurrentQuickFilter(null);
          event.target.classList.remove('bg-primary/20', 'text-white', 'border-primary');
          event.target.classList.add('bg-slate-800/50', 'text-slate-400', 'border-slate-700');
        } else {
          elements.filterChips.forEach((filterChipElement) => {
            filterChipElement.classList.remove('bg-primary/20', 'text-white', 'border-primary');
            filterChipElement.classList.add('bg-slate-800/50', 'text-slate-400', 'border-slate-700');
          });

          setCurrentQuickFilter(filterType);
          event.target.classList.remove('bg-slate-800/50', 'text-slate-400', 'border-slate-700');
          event.target.classList.add('bg-primary/20', 'text-white', 'border-primary');
        }

        updateUI();
      });
    });
  }

  function setActiveTab(tabId, type) {
    setCurrentTab(type);

    const inactiveClassList = 'text-slate-400 hover:text-white hover:bg-slate-700/50'.split(' ');
    const activeClassList = 'text-white bg-slate-700 shadow-sm'.split(' ');

    [elements.tabAll, elements.tabIncome, elements.tabExpense, elements.tabDashboard].forEach((tabElement) => {
      tabElement.classList.remove(...activeClassList);
      tabElement.classList.add(...inactiveClassList);
    });

    const activeTabElement = document.getElementById(tabId);
    activeTabElement.classList.remove(...inactiveClassList);
    activeTabElement.classList.add(...activeClassList);

    if (type === 'Dashboard') {
      elements.listEl.classList.add('hidden');
      elements.dashboardView.classList.remove('hidden');
      elements.emptyEl.style.display = 'none';
      renderDashboard();
    } else {
      elements.listEl.classList.remove('hidden');
      elements.dashboardView.classList.add('hidden');
      updateUI();
    }
  }

  elements.tabAll.addEventListener('click', () => setActiveTab('tab-all', 'All'));
  elements.tabIncome.addEventListener('click', () => setActiveTab('tab-income', 'Income'));
  elements.tabExpense.addEventListener('click', () => setActiveTab('tab-expense', 'Expense'));
  elements.tabDashboard.addEventListener('click', () => setActiveTab('tab-dashboard', 'Dashboard'));

  return {
    initTemporalNav,
    initFilters,
    setActiveTab,
    syncSplitByTwoState,
  };
}
