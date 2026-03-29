import './style.css';
import { TransactionService } from './services/TransactionService.js';
import { BudgetService } from './services/BudgetService.js';
import { TrashService } from './services/TrashService.js';
import { NotebookService } from './services/NotebookService.js';
import { GamificationService } from './services/GamificationService.js';
import { SavingsService } from './services/SavingsService.js';
import { AuthService } from './services/AuthService.js';
import { initContextMenuManager } from './modules/ContextMenuManager.js';
import { initNeuralBorder } from './modules/NeuralBorderAnimation.js';
import { initPullToRefresh } from './modules/PullToRefresh.js';
import { renderDashboardSection } from './modules/DashboardRenderer.js';
import { initBudgetNotebookManager } from './modules/BudgetNotebookManager.js';
import { initEmojiCategoryManager } from './modules/EmojiCategoryManager.js';
import { initExportManager } from './modules/ExportManager.js';
import { initNavigationFilters } from './modules/NavigationFiltersManager.js';
import { initSavingsFlow } from './modules/SavingsFlowManager.js';
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
const savingsModalTitle = document.getElementById('savings-modal-title');

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
const notesMetaContainer = document.getElementById('notes-meta-container');
const notesDate = document.getElementById('notes-date');
const notesDiffBox = document.getElementById('notes-diff-box');

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
let renderSavingsGoals = () => {};

const modal = document.getElementById('add-modal');
const modalContent = document.getElementById('modal-content');
const addBtn = document.getElementById('add-btn');
const closeBtn = document.getElementById('close-modal-btn');
const form = document.getElementById('transaction-form');

const typeRadios = document.querySelectorAll('input[name="type"]');
const toggleAdvancedBtn = document.getElementById('toggle-advanced-btn');
const advancedFields = document.getElementById('advanced-fields');
const txAmountInput = document.getElementById('tx-amount');
const txDescriptionInput = document.getElementById('tx-description');
const txDateInput = document.getElementById('tx-date');
const txCategorySelect = document.getElementById('tx-category');
const txEmojiDisplay = document.getElementById('tx-emoji-display');
const txCustomCategoryContainer = document.getElementById('tx-custom-category-container');
const txCardInput = document.getElementById('tx-card');
const txInstallTotalInput = document.getElementById('tx-install-total');
const txRecurringInput = document.getElementById('tx-recurring');
const modalTitleElement = document.querySelector('#modal-content h3');
const modalSubmitButton = document.querySelector('#transaction-form button[type="submit"]');
const emojiBtn = document.getElementById('tx-emoji-btn');
const emojiDisplay = document.getElementById('tx-emoji-display');
const emojiPicker = document.getElementById('emoji-picker');
const emojiList = document.getElementById('emoji-list');
const categorySelect = document.getElementById('tx-category');
const customCategoryContainer = document.getElementById('tx-custom-category-container');
const customCategoryInput = document.getElementById('tx-custom-category');
const savingsEmojiPicker = document.getElementById('savings-emoji-picker');
const savingsEmojiList = document.getElementById('savings-emoji-list');

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

initBudgetNotebookManager({
  budgetService: BudgetService,
  notebookService: NotebookService,
  parseBrazilianCurrency,
  renderDashboard,
  updateUI,
  getTransactions: () => transactions,
  getCurrentTab: () => currentTab,
  elements: {
    configBudgetsBtn,
    budgetModal,
    budgetOverlay,
    closeBudgetBtn,
    saveBudgetsBtn,
    budgetListEl,
    notesBtn,
    notesModal,
    notesOverlay,
    closeNotesBtn,
    saveNotesBtn,
    notesTextarea,
    notesMetaContainer,
    notesDate,
    notesDiffBox,
  },
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
    openContextMenu: contextMenuManager.openContextMenu,
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

const contextMenuManager = initContextMenuManager({
  transactionService: TransactionService,
  selectGroupedTransactionsForDeletion,
  showNotification,
  loadData,
  setEditTransactionId: (value) => {
    editTransactionId = value;
  },
  openTransactionModal: () => {
    modal.classList.remove('hidden');
    setTimeout(() => {
      modalContent.classList.remove('translate-y-full');
    }, 10);
  },
  elements: {
    contextMenuModal,
    contextOverlay,
    contextSheet,
    ctxIcon,
    ctxTitle,
    ctxAmount,
    ctxEditBtn,
    ctxDeleteBtn,
    ctxCancelBtn,
    typeRadios,
    amountInput: txAmountInput,
    descriptionInput: txDescriptionInput,
    dateInput: txDateInput,
    categorySelect: txCategorySelect,
    emojiDisplay: txEmojiDisplay,
    customCategoryContainer: txCustomCategoryContainer,
    cardInput: txCardInput,
    installmentTotalInput: txInstallTotalInput,
    recurringInput: txRecurringInput,
    modalTitleElement,
    modalSubmitButton,
  },
});

initEmojiCategoryManager({
  elements: {
    emojiBtn,
    emojiDisplay,
    emojiPicker,
    emojiList,
    categorySelect,
    customCategoryContainer,
    customCategoryInput,
    savingsIconInput: savingsIcon,
    savingsEmojiPicker,
    savingsEmojiList,
  },
});

const savingsFlow = initSavingsFlow({
  savingsService: SavingsService,
  gamificationService: GamificationService,
  parseBrazilianCurrency,
  showNotification,
  renderDashboard,
  updateAvatarUI,
  elements: {
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
  },
});

renderSavingsGoals = savingsFlow.renderSavingsGoals;

// Neural Border Animation -> ./modules/NeuralBorderAnimation.js
// initNeuralBorder() is imported and called from DOMContentLoaded


// Pull-to-Refresh -> ./modules/PullToRefresh.js
initPullToRefresh();
