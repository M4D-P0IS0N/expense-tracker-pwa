import './style.css';
import { TransactionService } from './services/TransactionService.js';
import { BudgetService } from './services/BudgetService.js';
import { TrashService } from './services/TrashService.js';
import { NotebookService } from './services/NotebookService.js';
import { GamificationService } from './services/GamificationService.js';
import { SavingsService } from './services/SavingsService.js';
import { AuthService } from './services/AuthService.js';
import { initNeuralBorder } from './modules/NeuralBorderAnimation.js';
import { initPullToRefresh } from './modules/PullToRefresh.js';
import { renderDashboardSection } from './modules/DashboardRenderer.js';
import { initExportManager } from './modules/ExportManager.js';
import { initNavigationFilters } from './modules/NavigationFiltersManager.js';
import { initTransactionModal } from './modules/TransactionModalManager.js';
import { renderTransactionList } from './modules/TransactionListRenderer.js';
import { initTransactionForm } from './modules/TransactionFormManager.js';
import { selectGroupedTransactionsForDeletion } from './utils/installmentDeletion.js';

// --- Utils ---
function parseBrazilianCurrency(valueStr) {
  if (!valueStr) return 0;
  let str = String(valueStr).trim();
  if (str === '') return 0;

  if (!isNaN(str) && !str.includes(',')) return parseFloat(str);

  str = str.replace(/[^\d.,-]/g, '');

  const commaCount = (str.match(/,/g) || []).length;
  const dotCount = (str.match(/\./g) || []).length;

  if (commaCount > 0 && dotCount > 0) {
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    if (lastComma > lastDot) str = str.replace(/\./g, '').replace(',', '.');
    else str = str.replace(/,/g, '');
  } else if (commaCount > 0) {
    if (commaCount === 1) str = str.replace(',', '.');
    else str = str.replace(/,/g, '');
  } else if (dotCount === 1) {
    const parts = str.split('.');
    if (parts[1].length === 3) str = str.replace('.', '');
  } else if (dotCount > 1) {
    str = str.replace(/\./g, '');
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

// --- Notification Toast ---
function showNotification(message, type = 'info') {
  const existing = document.getElementById('app-toast');
  if (existing) existing.remove();

  const colorMap = {
    success: 'border-accent-green bg-accent-green/10 text-accent-green',
    error: 'border-accent-red bg-accent-red/10 text-accent-red',
    info: 'border-primary bg-primary/10 text-primary',
  };
  const colors = colorMap[type] || colorMap.info;

  const toast = document.createElement('div');
  toast.id = 'app-toast';
  toast.className = `fixed top-16 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 rounded-xl border text-sm font-medium shadow-lg backdrop-blur-md transition-all duration-300 ${colors}`;
  toast.textContent = message;
  toast.style.opacity = '0';
  toast.style.transform = 'translate(-50%, -10px)';
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%, 0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// --- State ---
let transactions = [];
let currentSearchQuery = '';
let currentQuickFilter = null;
let currentCardFilter = 'All';
let currentSort = 'date-desc';
let currentTab = 'All';

// --- DOM Elements ---
const balanceEl = document.getElementById('total-balance');
const incomeEl = document.getElementById('total-income');
const expenseEl = document.getElementById('total-expense');
const listEl = document.getElementById('transactions-list');
const emptyEl = document.getElementById('empty-state');

// Temporal Navigation Elements
const filterMonthEl = document.getElementById('filter-month');
const filterYearEl = document.getElementById('filter-year');

const tabAll = document.getElementById('tab-all');
const tabIncome = document.getElementById('tab-income');
const tabExpense = document.getElementById('tab-expense');
const tabDashboard = document.getElementById('tab-dashboard');

const dashboardView = document.getElementById('dashboard-view');
const dashInsights = document.getElementById('dash-insights');
const dashForecast = document.getElementById('dash-forecast');
const dashNetworth = document.getElementById('dash-networth');
const dashNetworthTrend = document.getElementById('dash-networth-trend');
const dashCategories = document.getElementById('dash-categories');
const dashCreditCards = document.getElementById('dash-credit-cards');
// Savings Elements
const addSavingsBtn = document.getElementById('add-savings-btn');
const savingsList = document.getElementById('savings-list');
const savingsTotal = document.getElementById('savings-total');
const savingsModal = document.getElementById('savings-modal');
const savingsModalContent = document.getElementById('savings-modal-content');
const closeSavingsBtn = document.getElementById('close-savings-btn');
const savingsForm = document.getElementById('savings-form');
const savingsId = document.getElementById('savings-id');
const savingsName = document.getElementById('savings-name');
const savingsTarget = document.getElementById('savings-target');
const savingsIcon = document.getElementById('savings-icon');
const savingsManageFunds = document.getElementById('savings-manage-funds');
const savingsFundAmount = document.getElementById('savings-fund-amount');
const savingsAddFundBtn = document.getElementById('savings-add-fund-btn');
const savingsWithdrawFundBtn = document.getElementById('savings-withdraw-fund-btn');
const savingsDeleteBtn = document.getElementById('savings-delete-btn');

// Search & Filter Elements
const searchInput = document.getElementById('search-input');
const filterCardEl = document.getElementById('filter-card');
const sortTransactionsEl = document.getElementById('sort-transactions');
const filterChips = document.querySelectorAll('.filter-chip');

// Budget Tools
const configBudgetsBtn = document.getElementById('config-budgets-btn');
const budgetModal = document.getElementById('budget-modal');
const budgetOverlay = document.getElementById('budget-overlay');
const closeBudgetBtn = document.getElementById('close-budget-btn');
const saveBudgetsBtn = document.getElementById('save-budgets-btn');
const budgetListEl = document.getElementById('budget-list');

// Context Menu Elements
const contextMenuModal = document.getElementById('context-menu-modal');
const contextOverlay = document.getElementById('context-overlay');
const contextSheet = document.getElementById('context-sheet');
const ctxIcon = document.getElementById('ctx-icon');
const ctxTitle = document.getElementById('ctx-title');
const ctxAmount = document.getElementById('ctx-amount');
const ctxEditBtn = document.getElementById('ctx-edit-btn');
const ctxDeleteBtn = document.getElementById('ctx-delete-btn');
const ctxCancelBtn = document.getElementById('ctx-cancel-btn');

// Notebook Elements
const notesBtn = document.getElementById('notes-btn');
const notesModal = document.getElementById('notes-modal');
const notesOverlay = document.getElementById('notes-overlay');
const closeNotesBtn = document.getElementById('close-notes-btn');
const saveNotesBtn = document.getElementById('save-notes-btn');
const notesTextarea = document.getElementById('notes-textarea');

// Export Elements
const exportCsvBtn = document.getElementById('export-csv-btn');
const exportPdfBtn = document.getElementById('export-pdf-btn');

// RPG Elements
const avatarControl = document.getElementById('avatar-control');
const avatarImg = document.getElementById('avatar-img');
const avatarLevelBadge = document.getElementById('avatar-level-badge');
const avatarStageName = document.getElementById('avatar-stage-name');
const rpgModal = document.getElementById('rpg-modal');
const rpgOverlay = document.getElementById('rpg-overlay');
const closeRpgBtn = document.getElementById('close-rpg-btn');
const rpgLargeAvatar = document.getElementById('rpg-large-avatar');
const rpgStageTitle = document.getElementById('rpg-stage-title');
const rpgLevelText = document.getElementById('rpg-level-text');
const rpgXpText = document.getElementById('rpg-xp-text');
const rpgXpBar = document.getElementById('rpg-xp-bar');
const achievementsGrid = document.getElementById('achievements-grid');

let selectedTransaction = null;

const modal = document.getElementById('add-modal');
const modalContent = document.getElementById('modal-content');
const addBtn = document.getElementById('add-btn');
const closeBtn = document.getElementById('close-modal-btn');
const form = document.getElementById('transaction-form');

const typeRadios = document.querySelectorAll('input[name="type"]');
const toggleAdvancedBtn = document.getElementById('toggle-advanced-btn');
const advancedFields = document.getElementById('advanced-fields');

const transactionListElements = {
  balanceEl,
  incomeEl,
  expenseEl,
  listEl,
  emptyEl,
  filterCardEl,
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {

  // --- AUTH GUARD ---
  const session = await AuthService.getSession();
  if (!session) {
    window.location.replace(import.meta.env.BASE_URL + "login.html");
    return;
  }

  // --- Populate user display name ---
  const userDisplayNameEl = document.getElementById('user-display-name');
  if (userDisplayNameEl && session.user) {
    const emailPrefix = session.user.email?.split('@')[0] || 'Meu Perfil';
    userDisplayNameEl.textContent = emailPrefix;
  }

  // Set default date
  document.getElementById('tx-date').valueAsDate = new Date();

  // Load Years and set default selectors
  await initTemporalNav();
  initFilters();

  // Init neural border
  initNeuralBorder();
});

const { initTemporalNav, initFilters } = initNavigationFilters({
  transactionService: TransactionService,
  gamificationService: GamificationService,
  showNotification,
  loadData,
  updateUI,
  renderDashboard,
  elements: {
    filterMonthEl,
    filterYearEl,
    searchInput,
    filterCardEl,
    sortTransactionsEl,
    filterChips,
    tabAll,
    tabIncome,
    tabExpense,
    tabDashboard,
    listEl,
    dashboardView,
    emptyEl,
  },
  getCurrentSearchQuery: () => currentSearchQuery,
  setCurrentSearchQuery: (value) => { currentSearchQuery = value; },
  getCurrentQuickFilter: () => currentQuickFilter,
  setCurrentQuickFilter: (value) => { currentQuickFilter = value; },
  getCurrentCardFilter: () => currentCardFilter,
  setCurrentCardFilter: (value) => { currentCardFilter = value; },
  getCurrentSort: () => currentSort,
  setCurrentSort: (value) => { currentSort = value; },
  getCurrentTab: () => currentTab,
  setCurrentTab: (value) => { currentTab = value; },
});

let editTransactionId = null;

// --- UI Logic: Modal & Interactions ---
const { closeModal } = initTransactionModal({
  addButton: addBtn,
  closeButton: closeBtn,
  formElement: form,
  modalElement: modal,
  modalContentElement: modalContent,
  filterMonthEl,
  filterYearEl,
  typeRadios,
  toggleAdvancedButton: toggleAdvancedBtn,
  advancedFields,
  getElementById: (elementId) => document.getElementById(elementId),
  getTransactions: () => transactions,
  clearEditTransactionId: () => {
    editTransactionId = null;
  },
});

// --- UI Logic: Budgets Modal ---
configBudgetsBtn.addEventListener('click', () => {
  openBudgetsModal();
});

closeBudgetBtn.addEventListener('click', closeBudgetsModal);
budgetOverlay.addEventListener('click', closeBudgetsModal);

function closeBudgetsModal() {
  budgetModal.classList.add('hidden');
}

function openBudgetsModal() {
  budgetListEl.innerHTML = '';

  // Extract all categories historically known
  const catNames = new Set();
  transactions.filter(t => t.type === 'Expense').forEach(t => {
    let cat = t.category || "General";
    catNames.add(cat.replace(/[\u1000-\uFFFF]/, '').trim() || cat);
  });

  const currentBudgets = BudgetService.getBudgets();
  const sortedCats = Array.from(catNames).sort();

  // Also add explicitly existing budgets that might not have transactions this month
  Object.keys(currentBudgets).forEach(c => sortedCats.indexOf(c) === -1 ? sortedCats.push(c) : null);

  if (sortedCats.length === 0) {
    budgetListEl.innerHTML = '<p class="text-sm text-slate-400 text-center">Nenhuma categoria de despesa registrada ainda.</p>';
  }

  sortedCats.forEach(cat => {
    const budgetAmount = currentBudgets[cat] || '';

    const div = document.createElement('div');
    div.className = "flex items-center justify-between p-2 rounded-lg bg-slate-700/30 border border-slate-700";
    div.innerHTML = `
        <span class="text-sm text-white font-medium">${cat}</span>
        <div class="relative w-32">
          <span class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">R$</span>
          <input type="text" inputmode="decimal" value="${budgetAmount}" data-category="${cat}" placeholder="Ilimitado" class="budget-input w-full bg-slate-800 border border-slate-600 rounded-md text-white text-sm py-1.5 pl-7 pr-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none">
        </div>
      `;
    budgetListEl.appendChild(div);
  });

  budgetModal.classList.remove('hidden');
}

saveBudgetsBtn.addEventListener('click', () => {
  const inputs = document.querySelectorAll('.budget-input');
  inputs.forEach(input => {
    const val = parseBrazilianCurrency(input.value);
    const cat = input.getAttribute('data-category');
    BudgetService.setBudget(cat, isNaN(val) ? 0 : val);
  });

  closeBudgetsModal();
  if (currentTab === 'Dashboard') renderDashboard();
  else updateUI();
});

// --- UI Logic: Notebook ---
notesBtn.addEventListener('click', () => {
  notesTextarea.value = NotebookService.getNotes();

  const meta = NotebookService.getMeta();
  const metaContainer = document.getElementById('notes-meta-container');
  const dateEl = document.getElementById('notes-date');
  const diffBox = document.getElementById('notes-diff-box');

  if (meta) {
    metaContainer.classList.remove('hidden');
    const d = new Date(meta.lastEdited);
    dateEl.textContent = d.toLocaleString('pt-BR');

    diffBox.innerHTML = '';
    if (meta.added.length === 0 && meta.removed.length === 0) {
      diffBox.innerHTML = '<span class="text-slate-500 italic">Nenhuma alteração de linha significativa detectada na última edição.</span>';
    } else {
      meta.added.forEach(line => {
        diffBox.innerHTML += `<div class="text-accent-green backdrop-blur-sm bg-accent-green/10 px-1.5 py-0.5 rounded truncate">+ ${line}</div>`;
      });
      meta.removed.forEach(line => {
        diffBox.innerHTML += `<div class="text-accent-red backdrop-blur-sm bg-accent-red/10 px-1.5 py-0.5 rounded truncate line-through opacity-75">- ${line}</div>`;
      });
    }
  } else {
    metaContainer.classList.add('hidden');
  }

  notesModal.classList.remove('hidden');
});

const closeNotesModal = () => notesModal.classList.add('hidden');
closeNotesBtn.addEventListener('click', closeNotesModal);
notesOverlay.addEventListener('click', closeNotesModal);

saveNotesBtn.addEventListener('click', () => {
  NotebookService.saveNotes(notesTextarea.value);

  const origHtml = saveNotesBtn.innerHTML;
  saveNotesBtn.innerHTML = 'Salvo!';
  saveNotesBtn.classList.add('bg-accent-green/20', 'text-accent-green', 'border-accent-green');
  saveNotesBtn.classList.remove('bg-primary/20', 'text-primary', 'border-primary');

  setTimeout(() => {
    saveNotesBtn.innerHTML = origHtml;
    saveNotesBtn.classList.remove('bg-accent-green/20', 'text-accent-green', 'border-accent-green');
    saveNotesBtn.classList.add('bg-primary/20', 'text-primary', 'border-primary');
  }, 2000);
});

// --- UI Logic: Exports (delegated to ExportManager module) ---
initExportManager(exportPdfBtn, exportCsvBtn, () => transactions);

// --- UI Logic: RPG Gamification ---

function updateAvatarUI() {
  const profile = GamificationService.getProfile();
  const spriteFile = GamificationService.getSpriteFilename(profile.EvolutionStage, profile.AvatarGender);
  const stageLabel = GamificationService.getStageLabel(profile.EvolutionStage, profile.AvatarGender);
  const avatarPlaceholder = document.getElementById('avatar-placeholder');

  avatarLevelBadge.textContent = `Lvl ${profile.Level}`;
  avatarStageName.textContent = profile.AvatarGender ? stageLabel : 'Escolha seu Avatar';

  if (profile.AvatarGender) {
    avatarImg.src = `./assets/sprites/${spriteFile}`;
    avatarImg.classList.remove('hidden');
    if (avatarPlaceholder) avatarPlaceholder.classList.add('hidden');
    avatarImg.onerror = () => { avatarImg.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile.EvolutionStage}`; };
  } else {
    avatarImg.classList.add('hidden');
    if (avatarPlaceholder) avatarPlaceholder.classList.remove('hidden');
  }
}

avatarControl.addEventListener('click', openRpgModal);

function showGenderChoiceModal() {
  const existingModal = document.getElementById('gender-choice-modal');
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

  document.getElementById('choose-male-btn').addEventListener('click', () => {
    GamificationService.setAvatarGender('male');
    choiceModal.remove();
    updateAvatarUI();
    openRpgModal();
  });

  document.getElementById('choose-female-btn').addEventListener('click', () => {
    GamificationService.setAvatarGender('female');
    choiceModal.remove();
    updateAvatarUI();
    openRpgModal();
  });
}

function openRpgModal() {
  const profile = GamificationService.getProfile();

  // If gender not chosen yet, show choice modal instead
  if (!profile.AvatarGender) {
    showGenderChoiceModal();
    return;
  }

  const spriteFile = GamificationService.getSpriteFilename(profile.EvolutionStage, profile.AvatarGender);
  const stageLabel = GamificationService.getStageLabel(profile.EvolutionStage, profile.AvatarGender);

  rpgStageTitle.textContent = stageLabel;
  rpgLevelText.textContent = profile.Level;
  rpgXpText.textContent = `${profile.CurrentXP} / ${profile.XPToNextLevel}`;

  const pct = Math.min(100, Math.round((profile.CurrentXP / profile.XPToNextLevel) * 100));
  rpgXpBar.style.width = '0%';
  setTimeout(() => { rpgXpBar.style.width = `${pct}%`; }, 100);

  rpgLargeAvatar.src = `./assets/sprites/${spriteFile}`;
  rpgLargeAvatar.onerror = () => { rpgLargeAvatar.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${profile.EvolutionStage}`; };

  // Render Achievements
  achievementsGrid.innerHTML = '';
  GamificationService.ALL_ACHIEVEMENTS.forEach(def => {
    const isUnlocked = profile.UnlockedAchievements.some(a => a.Id === def.Id);
    const progress = GamificationService.getAchievementProgress(def, profile);
    const progressPct = progress.max > 0 ? Math.min(Math.round((progress.current / progress.max) * 100), 100) : 0;

    // Secret achievement handling
    const isSecret = def.IsSecret && !isUnlocked;
    const displayName = isSecret ? def.Name : (isUnlocked && def.RevealedName ? def.RevealedName : def.Name);
    const displayDesc = isSecret ? def.Description : (isUnlocked && def.RevealedDescription ? def.RevealedDescription : def.Description);
    const iconName = isSecret ? def.Icon : (isUnlocked && def.RevealedIcon ? def.RevealedIcon : def.Icon);
    const iconColor = isUnlocked
      ? (def.RevealedIconColor || def.IconColor || 'text-yellow-400')
      : 'text-slate-600';

    // Locked/Unlocked styling
    const cardClass = isUnlocked
      ? "border-purple-500/40 bg-purple-500/10"
      : "border-slate-700/50 bg-slate-800/30";
    const iconWrapperClass = isUnlocked
      ? "bg-slate-900/80 border-purple-500/30"
      : "bg-slate-900/50 border-slate-700/30 grayscale opacity-40";
    const titleClass = isUnlocked ? "text-white" : "text-slate-500";
    const descClass = isUnlocked ? "text-slate-400" : "text-slate-600";
    const dateHtml = isUnlocked ? `<span class="text-[9px] text-primary font-bold">✓ Concluída</span>` : '';

    // Progress bar (show for non-unlocked achievements with valid tracking)
    const showProgress = !isUnlocked && def.MaxProgress > 1 && def.TrackKey;
    const progressBarHtml = showProgress ? `
      <div class="mt-1.5 flex items-center gap-2">
        <div class="flex-1 h-1.5 bg-slate-700/40 rounded-full overflow-hidden">
          <div class="h-full bg-slate-500/40 rounded-full transition-all duration-700" style="width: ${progressPct}%"></div>
        </div>
        <span class="text-[9px] text-slate-600 font-medium shrink-0">${progress.current}/${progress.max}</span>
      </div>` : '';

    achievementsGrid.innerHTML += `
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

  // Inject Help + Logout Buttons if they don't exist
  if (!document.getElementById('rpg-logout-btn')) {
    const buttonsWrapper = document.createElement('div');
    buttonsWrapper.className = "mt-4 pt-4 border-t border-slate-700 space-y-3";
    buttonsWrapper.innerHTML = `
          <button id="rpg-help-btn" class="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
              <span class="material-symbols-outlined">help</span> Dúvidas
          </button>
          <button id="rpg-logout-btn" class="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
              <span class="material-symbols-outlined">logout</span> Sair da Conta
          </button>
      `;
    achievementsGrid.parentElement.appendChild(buttonsWrapper);

    // Help button opens guide modal
    document.getElementById('rpg-help-btn').addEventListener('click', () => {
      rpgModal.classList.add('hidden');
      document.getElementById('help-modal').classList.remove('hidden');
    });

    document.getElementById('rpg-logout-btn').addEventListener('click', async () => {
      try {
        document.getElementById('rpg-logout-btn').innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Saindo...';
        await AuthService.signOut();
        window.location.replace(import.meta.env.BASE_URL + "login.html");
      } catch (err) {
        alert("Erro ao sair da conta: " + err.message);
      }
    });
  }

  rpgModal.classList.remove('hidden');
}

// Track daily login for streak and anniversary achievements (Moved to initTemporalNav)

const closeRpgModal = () => rpgModal.classList.add('hidden');
closeRpgBtn.addEventListener('click', closeRpgModal);
rpgOverlay.addEventListener('click', closeRpgModal);
// avatarControl listener already registered at top of file (L748), no duplicate needed

// Help Modal close handlers
const helpModal = document.getElementById('help-modal');
document.getElementById('close-help-btn').addEventListener('click', () => helpModal.classList.add('hidden'));
document.getElementById('help-overlay').addEventListener('click', () => helpModal.classList.add('hidden'));

// Execute UI refresh on load
updateAvatarUI();

// --- Onboarding Flow (First-Time Users) ---
const onboardingModal = document.getElementById('onboarding-modal');
const onbStep1 = document.getElementById('onb-step-1');
const onbStep2 = document.getElementById('onb-step-2');
const onbDot1 = document.getElementById('onb-dot-1');
const onbDot2 = document.getElementById('onb-dot-2');
const onbNameInput = document.getElementById('onb-name');
const onbAvatarChosen = document.getElementById('onb-avatar-chosen');
const patrimonioReminder = document.getElementById('patrimonio-reminder');

let onboardingAvatarGender = null;

function isOnboardingCompleted() {
  return localStorage.getItem('onboardingCompleted') === 'true';
}

function markOnboardingCompleted() {
  localStorage.setItem('onboardingCompleted', 'true');
}

function isPatrimonioCalibrated() {
  return localStorage.getItem('patrimonioCalibrated') === 'true';
}

function markPatrimonioCalibrated() {
  localStorage.setItem('patrimonioCalibrated', 'true');
}

// Show onboarding if first time AND user has no avatar set
const existingProfile = GamificationService.getProfile();
if (!isOnboardingCompleted() && !existingProfile.AvatarGender) {
  onboardingModal.classList.remove('hidden');
} else if (!isOnboardingCompleted() && existingProfile.AvatarGender) {
  // Existing user who already has avatar: skip onboarding silently
  markOnboardingCompleted();
}

// Avatar selection in onboarding
document.getElementById('onb-avatar-male').addEventListener('click', () => {
  onboardingAvatarGender = 'male';
  onbAvatarChosen.classList.remove('hidden');
  document.getElementById('onb-avatar-male').querySelector('div').classList.add('border-primary', 'ring-2', 'ring-primary/50');
  document.getElementById('onb-avatar-female').querySelector('div').classList.remove('border-primary', 'ring-2', 'ring-primary/50');
});

document.getElementById('onb-avatar-female').addEventListener('click', () => {
  onboardingAvatarGender = 'female';
  onbAvatarChosen.classList.remove('hidden');
  document.getElementById('onb-avatar-female').querySelector('div').classList.add('border-primary', 'ring-2', 'ring-primary/50');
  document.getElementById('onb-avatar-male').querySelector('div').classList.remove('border-primary', 'ring-2', 'ring-primary/50');
});

// Step 1 → Step 2
document.getElementById('onb-next-1').addEventListener('click', () => {
  const name = onbNameInput.value.trim();
  if (!name) {
    showNotification('Por favor, digite seu nome.', 'error');
    return;
  }
  if (!onboardingAvatarGender) {
    showNotification('Escolha um avatar para continuar.', 'error');
    return;
  }

  // Save name and avatar
  const userDisplayNameEl = document.getElementById('user-display-name');
  if (userDisplayNameEl) userDisplayNameEl.textContent = name;
  localStorage.setItem('userDisplayName', name);
  GamificationService.setAvatarGender(onboardingAvatarGender);
  updateAvatarUI();

  // Transition to step 2
  onbStep1.classList.add('hidden');
  onbStep2.classList.remove('hidden');
  onbDot1.classList.replace('bg-primary', 'bg-slate-600');
  onbDot2.classList.replace('bg-slate-600', 'bg-primary');
});

// Finish onboarding
document.getElementById('onb-finish').addEventListener('click', () => {
  markOnboardingCompleted();
  onboardingModal.classList.add('hidden');
  showNotification('Bem-vindo! Adicione suas primeiras transações 🎉', 'success');
});

// Patrimônio reminder: show after first transaction if not yet calibrated
function checkPatrimonioReminder() {
  if (!isOnboardingCompleted()) return;
  if (isPatrimonioCalibrated()) return;

  // Check if user has at least 1 transaction
  if (transactions && transactions.length > 0) {
    patrimonioReminder.classList.remove('hidden');
  }
}

// Dismiss reminder
document.getElementById('dismiss-patrimonio-reminder').addEventListener('click', () => {
  markPatrimonioCalibrated();
  patrimonioReminder.classList.add('hidden');
});


// --- UI Logic: Context Menu ---
function openContextMenu(t) {
  selectedTransaction = t;

  ctxTitle.textContent = t.description;

  const isIncome = t.type === 'Income';
  const sign = isIncome ? '+' : '-';
  const formatCurrency = (num) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  ctxAmount.textContent = `${sign}${formatCurrency(Math.abs(t.amount))}`;
  ctxAmount.className = `text-sm font-medium ${isIncome ? 'text-accent-green' : 'text-accent-red'}`;

  let firstChar = (t.category || "").split(' ')[0] || "";
  let isEmoji = /[\u1000-\uFFFF]/.test(firstChar);
  ctxIcon.innerHTML = isEmoji ? `<span style="font-size: 24px;">${firstChar}</span>` : `<span class="material-symbols-outlined text-slate-400">receipt_long</span>`;

  contextMenuModal.classList.remove('hidden');
  setTimeout(() => contextSheet.classList.remove('translate-y-full'), 10);
}

function closeContextMenu() {
  contextSheet.classList.add('translate-y-full');
  setTimeout(() => {
    contextMenuModal.classList.add('hidden');
    selectedTransaction = null;
  }, 300);
}

ctxCancelBtn.addEventListener('click', closeContextMenu);
contextOverlay.addEventListener('click', closeContextMenu);

ctxDeleteBtn.addEventListener('click', async () => {
  if (!selectedTransaction) return;

  const originalDeleteButtonText = ctxDeleteBtn.textContent;
  ctxDeleteBtn.textContent = 'Apagando...';
  ctxDeleteBtn.disabled = true;

  try {
    if (selectedTransaction.installment_group_id) {
      const isRecurringTransaction = selectedTransaction.is_recurring;
      const groupedTransactionTypeLabel = isRecurringTransaction ? 'Recorrente' : 'Parcelada';

      const shouldDeleteFutureTransactions = window.confirm(`Esta transação é ${groupedTransactionTypeLabel}.\n\nDeseja excluir também TODAS as cobranças (desta série) deste mês em diante?\n\n[OK] = Sim, excluir esta e as futuras.\n[Cancelar] = Apenas esta.`);

      if (shouldDeleteFutureTransactions) {
        const groupedTransactions = await TransactionService.getTransactionsByInstallmentGroup(selectedTransaction.installment_group_id);
        const groupedTransactionsToDelete = selectGroupedTransactionsForDeletion(groupedTransactions, selectedTransaction);

        if (groupedTransactionsToDelete.length === 0) {
          console.warn('Nenhuma transação futura foi encontrada para a série selecionada.', {
            installmentGroupId: selectedTransaction.installment_group_id,
            selectedTransactionId: selectedTransaction.id
          });
          await TransactionService.deleteTransaction(selectedTransaction.id);
        } else {
          await TransactionService.deleteTransactions(groupedTransactionsToDelete.map((groupedTransaction) => groupedTransaction.id));
        }
      } else {
        await TransactionService.deleteTransaction(selectedTransaction.id);
      }
    } else {
      await TransactionService.deleteTransaction(selectedTransaction.id);
    }

    closeContextMenu();
    await loadData();
    showNotification('Despesa apagada com sucesso.', 'success');
  } catch (error) {
    console.error('Falha ao apagar a transação parcelada/recorrente:', error);
    showNotification('Não foi possível apagar a despesa. Verifique sua conexão e tente novamente.', 'error');
  } finally {
    ctxDeleteBtn.textContent = originalDeleteButtonText;
    ctxDeleteBtn.disabled = false;
  }
});

// Edit function implementation
ctxEditBtn.addEventListener('click', () => {
  if (!selectedTransaction) return;
  editTransactionId = selectedTransaction.id;

  // Select Type
  const typeValue = selectedTransaction.type === 'Income' ? 'Income' : 'Expense';
  const typeRadio = document.querySelector(`input[name="type"][value="${typeValue}"]`);
  typeRadio.checked = true;
  typeRadio.dispatchEvent(new Event('change'));

  document.getElementById('tx-amount').value = selectedTransaction.amount;
  document.getElementById('tx-description').value = selectedTransaction.description;

  const originalDate = new Date(selectedTransaction.date);
  originalDate.setMinutes(originalDate.getMinutes() - originalDate.getTimezoneOffset());
  document.getElementById('tx-date').valueAsDate = originalDate;

  // Clear any existing custom dynamically injected options
  document.querySelectorAll('.custom-injected-option').forEach(el => el.remove());

  const fullCat = selectedTransaction.category || "General";
  let firstChar = fullCat.split(' ')[0] || "";
  let isEmoji = /[\u1000-\uFFFF]/.test(firstChar);

  if (isEmoji) {
    document.getElementById('tx-emoji-display').textContent = firstChar;
    const catName = fullCat.substring(firstChar.length).trim();

    const select = document.getElementById('tx-category');
    let optionFound = Array.from(select.options).some(opt => opt.value === catName);

    if (optionFound) {
      select.value = catName;
      document.getElementById('tx-custom-category-container').classList.add('hidden');
    } else {
      // Append it dynamically for a smooth UX
      const newOption = document.createElement('option');
      newOption.value = catName;
      newOption.textContent = catName;
      newOption.className = 'custom-injected-option';

      const newOptIndex = select.querySelector('option[value="New"]');
      select.insertBefore(newOption, newOptIndex);

      select.value = catName;
      document.getElementById('tx-custom-category-container').classList.add('hidden');
    }
  } else {
    document.getElementById('tx-emoji-display').textContent = '🏷️';

    const select = document.getElementById('tx-category');
    let optionFound = Array.from(select.options).some(opt => opt.value === fullCat);

    if (optionFound) {
      select.value = fullCat;
      document.getElementById('tx-custom-category-container').classList.add('hidden');
    } else {
      const newOption = document.createElement('option');
      newOption.value = fullCat;
      newOption.textContent = fullCat;
      newOption.className = 'custom-injected-option';

      const newOptIndex = select.querySelector('option[value="New"]');
      select.insertBefore(newOption, newOptIndex);

      select.value = fullCat;
      document.getElementById('tx-custom-category-container').classList.add('hidden');
    }
  }

  document.getElementById('tx-card').value = selectedTransaction.credit_card_name || "";
  document.getElementById('tx-install-total').value = selectedTransaction.total_installments || 1;
  document.getElementById('tx-recurring').checked = selectedTransaction.is_recurring || false;

  document.querySelector('#modal-content h3').textContent = 'Editar Transação';
  document.querySelector('#transaction-form button[type="submit"]').textContent = 'Salvar Alterações';

  closeContextMenu();
  modal.classList.remove('hidden');
  setTimeout(() => {
    modalContent.classList.remove('translate-y-full');
  }, 10);
});

// --- Emoji & Category Logic ---
const emojiBtn = document.getElementById('tx-emoji-btn');
const emojiDisplay = document.getElementById('tx-emoji-display');
const emojiPicker = document.getElementById('emoji-picker');
const emojiList = document.getElementById('emoji-list');
const categorySelect = document.getElementById('tx-category');
const customCategoryContainer = document.getElementById('tx-custom-category-container');
const customCategoryInput = document.getElementById('tx-custom-category');

const defaultEmojis = [
  '🍔', '🍕', '🍣', '🛒', '🛍️', '🎁', '🚌', '🚗', '✈️', '🏠', '🏢', '💡', '💧', '🔥',
  '🏥', '💊', '🦷', '🎮', '🎬', '🎵', '⚽', '🏋️', '👕', '👗', '📚', '✏️', '💼', '💻',
  '💸', '💰', '💳', '📈', '🏷️', '🐶', '🐱', '🛠️', '❓'
];
const categoryToEmoji = {
  'General': '🏷️',
  'Food': '🍔',
  'Transport': '🚌',
  'Home': '🏠',
  'Salary': '💰'
};

// Populate picker
defaultEmojis.forEach(emoji => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'hover:bg-slate-700 rounded p-1 transition';
  btn.textContent = emoji;
  btn.addEventListener('click', () => {
    emojiDisplay.textContent = emoji;
    emojiPicker.classList.add('hidden');
  });
  emojiList.appendChild(btn);
});

emojiBtn.addEventListener('click', () => {
  emojiPicker.classList.toggle('hidden');
});

// --- Savings Emoji Picker Logic ---
const savingsIconInput = document.getElementById('savings-icon');
const savingsEmojiPicker = document.getElementById('savings-emoji-picker');
const savingsEmojiList = document.getElementById('savings-emoji-list');

if (savingsEmojiList) {
  defaultEmojis.forEach(emoji => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hover:bg-slate-700 rounded p-1 transition';
    btn.textContent = emoji;
    btn.addEventListener('click', () => {
      savingsIconInput.value = emoji;
      savingsEmojiPicker.classList.add('hidden');
    });
    savingsEmojiList.appendChild(btn);
  });
}

if (savingsIconInput) {
  savingsIconInput.addEventListener('click', () => {
    savingsEmojiPicker.classList.toggle('hidden');
  });
}

// Close picker on outside click
document.addEventListener('click', (e) => {
  if (emojiBtn && emojiPicker && !emojiBtn.contains(e.target) && !emojiPicker.contains(e.target)) {
    emojiPicker.classList.add('hidden');
  }
  if (savingsIconInput && savingsEmojiPicker && !savingsIconInput.contains(e.target) && !savingsEmojiPicker.contains(e.target)) {
    savingsEmojiPicker.classList.add('hidden');
  }
});

categorySelect.addEventListener('change', (e) => {
  const val = e.target.value;
  if (val === 'New') {
    customCategoryContainer.classList.remove('hidden');
    customCategoryInput.required = true;
    emojiDisplay.textContent = '❓'; // Empty/Question mark for new
  } else {
    customCategoryContainer.classList.add('hidden');
    customCategoryInput.required = false;
    customCategoryInput.value = '';
    if (categoryToEmoji[val]) {
      emojiDisplay.textContent = categoryToEmoji[val];
    }
  }
});


// --- Business Logic ---
async function loadData() {
  listEl.innerHTML = '<div class="text-center text-slate-400 py-8">Carregando...</div>';
  emptyEl.style.display = 'none';

  try {
    const pendingDeletedIds = TrashService.getDeletedIds();
    if (pendingDeletedIds.length > 0) {
      await TransactionService.deleteTransactions(pendingDeletedIds);
      TrashService.clearTrash();
    }

    if (currentSearchQuery.length > 0) {
      transactions = await TransactionService.searchTransactions(currentSearchQuery);
    } else {
      const selectedMonth = parseInt(filterMonthEl.value);
      const selectedYear = parseInt(filterYearEl.value);
      transactions = await TransactionService.getTransactions(selectedYear, selectedMonth);
    }

    updateUI();
    // Check if we are in Dashboard mode
    if (currentTab === 'Dashboard') {
      renderDashboard();
    }
    // Check if patrimônio reminder should be shown (first-time calibration)
    checkPatrimonioReminder();
  } catch (e) {
    console.error("Failed to load transactions", e);
    listEl.innerHTML = '<div class="text-center text-red-400 py-8">Erro ao carregar dados.</div>';
  }
}

async function renderDashboard() {
  await renderDashboardSection({
    transactions,
    budgetService: BudgetService,
    transactionService: TransactionService,
    parseBrazilianCurrency,
    markPatrimonioCalibrated,
    patrimonioReminder,
    renderDashboard,
    renderSavingsGoals,
    dashCategories,
    dashCreditCards,
    dashForecast,
    dashInsights,
    dashNetworth,
    dashNetworthTrend,
    filterMonthEl,
    filterYearEl,
    getElementById: (elementId) => document.getElementById(elementId),
  });
}

function updateUI() {
  renderTransactionList({
    appElements: transactionListElements,
    transactions,
    currentTab,
    currentCardFilter,
    currentQuickFilter,
    currentSort,
    currentSearchQuery,
    budgetService: BudgetService,
    openContextMenu,
  });

  if (!filterCardEl.value) {
    currentCardFilter = 'All';
  } else {
    currentCardFilter = filterCardEl.value;
  }
}

// Form Submission
initTransactionForm({
  formElement: form,
  getElementById: (elementId) => document.getElementById(elementId),
  parseBrazilianCurrency,
  showNotification,
  transactionService: TransactionService,
  loadData,
  closeModal,
  getEditTransactionId: () => editTransactionId,
});

// Neural Border Animation -> ./modules/NeuralBorderAnimation.js
// initNeuralBorder() is imported and called from DOMContentLoaded


// --- UI Logic: Savings Goals ---
let currentSavingsId = null;

function renderSavingsGoals() {
  const goals = SavingsService.getGoals();
  const total = SavingsService.getTotalSaved();

  savingsTotal.textContent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);

  if (goals.length === 0) {
    savingsList.innerHTML = '<div class="text-center text-slate-500 text-xs py-4 w-full">Nenhuma caixinha criada.</div>';
    return;
  }

  savingsList.innerHTML = '';
  goals.forEach(goal => {
    const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

    const card = document.createElement('div');
    card.className = 'flex-shrink-0 w-44 bg-slate-800/50 rounded-xl p-3 border border-slate-700 cursor-pointer hover:bg-slate-800 transition group';
    card.onclick = () => openSavingsModal(goal.id);

    card.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <span class="text-xl">${goal.icon}</span>
                <span class="text-[10px] font-bold text-slate-400 group-hover:text-primary transition">${pct}%</span>
            </div>
            <h5 class="text-xs font-bold text-slate-300 truncate mb-1">${goal.name}</h5>
            <p class="text-[10px] text-slate-500 mb-2">Faltam R$ ${remaining.toFixed(2)}</p>
            <div class="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                <div class="h-full bg-primary rounded-full transition-all duration-1000" style="width: ${pct}%"></div>
            </div>
        `;
    savingsList.appendChild(card);
  });
}

function openSavingsModal(id = null) {
  currentSavingsId = id;
  savingsManageFunds.classList.add('hidden');
  savingsDeleteBtn.classList.add('hidden');

  if (id) {
    const goal = SavingsService.getGoalById(id);
    if (goal) {
      savingsId.value = goal.id;
      savingsName.value = goal.name;
      savingsTarget.value = goal.targetAmount;
      savingsIcon.value = goal.icon;

      savingsManageFunds.classList.remove('hidden');
      savingsDeleteBtn.classList.remove('hidden');
      document.getElementById('savings-modal-title').innerHTML = `<span class="material-symbols-outlined text-primary">savings</span> Editar Caixinha`;
    }
  } else {
    savingsForm.reset();
    savingsId.value = '';
    savingsIcon.value = '🎯';
    document.getElementById('savings-modal-title').innerHTML = `<span class="material-symbols-outlined text-primary">savings</span> Nova Caixinha`;
  }

  savingsModal.classList.remove('hidden');
  setTimeout(() => {
    savingsModalContent.classList.remove('scale-95');
  }, 10);
}

function closeSavingsModalFunc() {
  savingsModalContent.classList.add('scale-95');
  setTimeout(() => {
    savingsModal.classList.add('hidden');
  }, 300);
}

closeSavingsBtn.addEventListener('click', closeSavingsModalFunc);
savingsModal.addEventListener('click', (e) => {
  if (e.target === savingsModal) closeSavingsModalFunc();
});

addSavingsBtn.addEventListener('click', () => openSavingsModal());

savingsForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = savingsId.value;
  const name = savingsName.value.trim();
  const target = parseBrazilianCurrency(savingsTarget.value);
  const icon = savingsIcon.value.trim() || '🎯';

  if (id) {
    SavingsService.updateGoal(id, { name, targetAmount: target, icon });
  } else {
    SavingsService.addGoal(name, target, icon);
  }

  closeSavingsModalFunc();
  renderDashboard();
});

savingsAddFundBtn.addEventListener('click', () => {
  if (!currentSavingsId) return;
  const amt = parseBrazilianCurrency(savingsFundAmount.value);
  if (isNaN(amt) || amt <= 0) return showNotification("Valor inválido", "error");
  SavingsService.addFunds(currentSavingsId, amt);
  savingsFundAmount.value = '';
  GamificationService.onTransactionLogged(); // Hook XP
  updateAvatarUI();
  renderDashboard();
  closeSavingsModalFunc();
});

savingsWithdrawFundBtn.addEventListener('click', () => {
  if (!currentSavingsId) return;
  const amt = parseBrazilianCurrency(savingsFundAmount.value);
  if (isNaN(amt) || amt <= 0) return showNotification("Valor inválido", "error");
  SavingsService.withdrawFunds(currentSavingsId, amt);
  savingsFundAmount.value = '';
  renderDashboard();
  closeSavingsModalFunc();
});

savingsDeleteBtn.addEventListener('click', () => {
  if (currentSavingsId && confirm('Tem certeza que deseja excluir esta caixinha? O saldo voltará para o patrimônio livre.')) {
    SavingsService.deleteGoal(currentSavingsId);
    closeSavingsModalFunc();
    renderDashboard();
  }
});

// Pull-to-Refresh -> ./modules/PullToRefresh.js
initPullToRefresh();
