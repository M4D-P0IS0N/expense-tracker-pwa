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
import { initProfileOnboardingManager } from './modules/ProfileOnboardingManager.js';
import { initSavingsFlow } from './modules/SavingsFlowManager.js';
import { initTransactionModal } from './modules/TransactionModalManager.js';
import { renderTransactionList } from './modules/TransactionListRenderer.js';
import { initTransactionForm } from './modules/TransactionFormManager.js';
import { selectGroupedTransactionsForDeletion } from './utils/installmentDeletion.js';
import { parseBrazilianCurrency } from './utils/currencyParser.js';
import { showNotification } from './ui/notificationToast.js';

// --- State ---
let transactions = [];
let currentSearchQuery = '';
let currentQuickFilter = null;
let currentCardFilter = 'All';
let currentSort = 'date-desc';
let currentTab = 'All';
let isSplitByTwoEnabled = false;

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
const filterSplitByTwoEl = document.getElementById('filter-split-by-two');
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
const notesMonthBadge = document.getElementById('notes-month-badge');
const notesHistoryList = document.getElementById('notes-history-list');
const notesHistoryCount = document.getElementById('notes-history-count');

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
const helpModal = document.getElementById('help-modal');
const closeHelpBtn = document.getElementById('close-help-btn');
const helpOverlay = document.getElementById('help-overlay');
const onboardingModal = document.getElementById('onboarding-modal');
const onbStep1 = document.getElementById('onb-step-1');
const onbStep2 = document.getElementById('onb-step-2');
const onbDot1 = document.getElementById('onb-dot-1');
const onbDot2 = document.getElementById('onb-dot-2');
const onbNameInput = document.getElementById('onb-name');
const onbAvatarChosen = document.getElementById('onb-avatar-chosen');
const onbAvatarMale = document.getElementById('onb-avatar-male');
const onbAvatarFemale = document.getElementById('onb-avatar-female');
const onbNext1 = document.getElementById('onb-next-1');
const onbFinish = document.getElementById('onb-finish');
const patrimonioReminder = document.getElementById('patrimonio-reminder');
const dismissPatrimonioReminder = document.getElementById('dismiss-patrimonio-reminder');
const userDisplayNameEl = document.getElementById('user-display-name');
let renderSavingsGoals = () => {};
let updateAvatarUI = () => {};
let checkPatrimonioReminder = () => {};
let markPatrimonioCalibrated = () => {};

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
const txSplitByTwoInput = document.getElementById('tx-split-by-two');
const txThirdPartyInput = document.getElementById('tx-third-party');
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
    filterSplitByTwoEl,
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
  setSplitByTwoEnabled: (value) => { isSplitByTwoEnabled = value; },
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
    filterMonthEl,
    filterYearEl,
    notesMonthBadge,
    notesHistoryList,
    notesHistoryCount,
  },
});

// --- UI Logic: Exports (delegated to ExportManager module) ---
initExportManager(exportPdfBtn, exportCsvBtn, () => transactions);


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
    isSplitByTwoEnabled,
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
    isSplitByTwoEnabled,
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
    splitByTwoInput: txSplitByTwoInput,
    thirdPartyInput: txThirdPartyInput,
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

const profileOnboardingManager = initProfileOnboardingManager({
  gamificationService: GamificationService,
  authService: AuthService,
  showNotification,
  getTransactions: () => transactions,
  elements: {
    avatarControl,
    avatarImg,
    avatarLevelBadge,
    avatarStageName,
    avatarPlaceholder: document.getElementById('avatar-placeholder'),
    rpgModal,
    rpgOverlay,
    closeRpgBtn,
    rpgLargeAvatar,
    rpgStageTitle,
    rpgLevelText,
    rpgXpText,
    rpgXpBar,
    achievementsGrid,
    helpModal,
    closeHelpBtn,
    helpOverlay,
    onboardingModal,
    onbStep1,
    onbStep2,
    onbDot1,
    onbDot2,
    onbNameInput,
    onbAvatarChosen,
    onbAvatarMale,
    onbAvatarFemale,
    onbNext1,
    onbFinish,
    userDisplayNameEl,
    patrimonioReminder,
    dismissPatrimonioReminder,
  },
});

updateAvatarUI = profileOnboardingManager.updateAvatarUI;
checkPatrimonioReminder = profileOnboardingManager.checkPatrimonioReminder;
markPatrimonioCalibrated = profileOnboardingManager.markPatrimonioCalibrated;

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

