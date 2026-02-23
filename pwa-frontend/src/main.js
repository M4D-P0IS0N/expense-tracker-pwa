import './style.css';
import { TransactionService } from './services/TransactionService.js';
import { BudgetService } from './services/BudgetService.js';
import { TrashService } from './services/TrashService.js';
import { NotebookService } from './services/NotebookService.js';
import { GamificationService } from './services/GamificationService.js';
import { SavingsService } from './services/SavingsService.js';
import { AuthService } from './services/AuthService.js';

// --- State ---
let transactions = [];

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

// --- Temporal Nav Logic ---
async function initTemporalNav() {
  const currentDate = new Date();

  // Populate Years dynamically
  const years = await TransactionService.getAvailableYears();
  filterYearEl.innerHTML = '';
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    filterYearEl.appendChild(option);
  });

  // Set default logic to Current Month and Year
  filterMonthEl.value = (currentDate.getMonth() + 1).toString();
  filterYearEl.value = currentDate.getFullYear().toString();

  // Attach auto-fetch events
  filterMonthEl.addEventListener('change', loadData);
  filterYearEl.addEventListener('change', loadData);

  // Initial load
  await loadData();
}

// --- Search & Filters Logic ---
let currentSearchQuery = '';
let currentQuickFilter = null; // 'Today', 'Week', 'Fixed', 'Install'
let currentCardFilter = 'All';

function initFilters() {
  // Global Search Debounce
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    currentSearchQuery = e.target.value.trim();

    // Visual feedback for ignoring temporal nav
    if (currentSearchQuery.length > 0) {
      filterMonthEl.parentElement.classList.add('opacity-50', 'pointer-events-none');
    } else {
      filterMonthEl.parentElement.classList.remove('opacity-50', 'pointer-events-none');
    }

    searchTimeout = setTimeout(() => {
      loadData();
    }, 400); // 400ms debounce
  });

  // Card Filter
  filterCardEl.addEventListener('change', (e) => {
    currentCardFilter = e.target.value;
    updateUI();
  });

  // Quick Filters (Chips)
  filterChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      const filterType = e.target.getAttribute('data-filter');

      // Toggle off if already selected
      if (currentQuickFilter === filterType) {
        currentQuickFilter = null;
        e.target.classList.remove('bg-primary/20', 'text-white', 'border-primary');
        e.target.classList.add('bg-slate-800/50', 'text-slate-400', 'border-slate-700');
      } else {
        // Reset all chips visual state
        filterChips.forEach(c => {
          c.classList.remove('bg-primary/20', 'text-white', 'border-primary');
          c.classList.add('bg-slate-800/50', 'text-slate-400', 'border-slate-700');
        });

        // Select this one
        currentQuickFilter = filterType;
        e.target.classList.remove('bg-slate-800/50', 'text-slate-400', 'border-slate-700');
        e.target.classList.add('bg-primary/20', 'text-white', 'border-primary');
      }

      updateUI();
    });
  });
}

// --- UI Logic: Tabs ---
let currentTab = 'All';

function setActiveTab(tabId, type) {
  currentTab = type;

  // Reset all tabs
  const inactiveClass = 'text-slate-400 hover:text-white hover:bg-slate-700/50'.split(' ');
  const activeClass = 'text-white bg-slate-700 shadow-sm'.split(' ');

  [tabAll, tabIncome, tabExpense, tabDashboard].forEach(tab => {
    tab.classList.remove(...activeClass);
    tab.classList.add(...inactiveClass);
  });

  // Set Active Tab
  const activeTab = document.getElementById(tabId);
  activeTab.classList.remove(...inactiveClass);
  activeTab.classList.add(...activeClass);

  if (type === 'Dashboard') {
    listEl.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    emptyEl.style.display = 'none'; // Ensure main empty state is hidden
    renderDashboard();
  } else {
    listEl.classList.remove('hidden');
    dashboardView.classList.add('hidden');
    updateUI();
  }
}

tabAll.addEventListener('click', () => setActiveTab('tab-all', 'All'));
tabIncome.addEventListener('click', () => setActiveTab('tab-income', 'Income'));
tabExpense.addEventListener('click', () => setActiveTab('tab-expense', 'Expense'));
tabDashboard.addEventListener('click', () => setActiveTab('tab-dashboard', 'Dashboard'));

let editTransactionId = null;

// --- UI Logic: Modal & Interactions ---
addBtn.addEventListener('click', () => {
  form.reset();
  editTransactionId = null;
  document.querySelector('#modal-content h3').textContent = 'Nova Transação';
  document.querySelector('#transaction-form button[type="submit"]').textContent = 'Salvar Transação';
  document.getElementById('tx-date').valueAsDate = new Date();
  modal.classList.remove('hidden');
  setTimeout(() => {
    modalContent.classList.remove('translate-y-full');
  }, 10);
});

closeBtn.addEventListener('click', closeModal);
modalContent.parentElement.addEventListener('click', (e) => {
  if (e.target === modalContent.parentElement) closeModal();
});

function closeModal() {
  modalContent.classList.add('translate-y-full');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 300);
}

// Custom Category toggling
document.getElementById('tx-category').addEventListener('change', (e) => {
  const customDiv = document.getElementById('tx-custom-category-container');
  const val = e.target.value;

  if (val === 'New') {
    customDiv.classList.remove('hidden');
    document.getElementById('tx-emoji-display').textContent = '🏷️';
  } else {
    customDiv.classList.add('hidden');
    // Predict emoji from historical transactions
    if (typeof transactions !== 'undefined' && transactions.length > 0) {
      const foundTx = transactions.find(t => (t.category || '').includes(val));
      if (foundTx) {
        let firstChar = (foundTx.category || "").split(' ')[0] || "";
        if (/[\u1000-\uFFFF]/.test(firstChar)) {
          document.getElementById('tx-emoji-display').textContent = firstChar;
          return;
        }
      }
    }
    // Fallback if not found in history
    document.getElementById('tx-emoji-display').textContent = '🏷️';
  }
});

// Type radio buttons styling
typeRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    document.querySelectorAll('label.flex-1').forEach(label => {
      // Clear all active states (Income and Expense)
      label.classList.remove('border-green-500', 'bg-green-500/10', 'text-green-400');
      label.classList.remove('border-red-500', 'bg-red-500/10', 'text-red-400');

      // Set to inactive state
      label.classList.add('border-transparent', 'bg-slate-800', 'text-slate-400');
    });

    const activeLabel = radio.parentElement;
    // Remove inactive state from selected
    activeLabel.classList.remove('border-transparent', 'bg-slate-800', 'text-slate-400');

    if (radio.value === 'Income') {
      activeLabel.classList.add('border-green-500', 'bg-green-500/10', 'text-green-400');
    } else {
      activeLabel.classList.add('border-red-500', 'bg-red-500/10', 'text-red-400');
    }
  });
});

toggleAdvancedBtn.addEventListener('click', () => {
  advancedFields.classList.toggle('hidden');
  const icon = document.getElementById('advanced-icon');
  icon.textContent = advancedFields.classList.contains('hidden') ? '▼' : '▲';
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
          <input type="number" step="0.01" value="${budgetAmount}" data-category="${cat}" placeholder="Ilimitado" class="budget-input w-full bg-slate-800 border border-slate-600 rounded-md text-white text-sm py-1.5 pl-7 pr-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none">
        </div>
      `;
    budgetListEl.appendChild(div);
  });

  budgetModal.classList.remove('hidden');
}

saveBudgetsBtn.addEventListener('click', () => {
  const inputs = document.querySelectorAll('.budget-input');
  inputs.forEach(input => {
    const val = parseFloat(input.value);
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

// --- UI Logic: Exports ---
exportPdfBtn.addEventListener('click', () => {
  if (!transactions || transactions.length === 0) return alert("Nenhuma transação carregada para exportar.");

  const month = document.getElementById('filter-month').value;
  const year = document.getElementById('filter-year').value;

  let totalIncome = 0;
  let totalExpense = 0;

  const rowsHtml = transactions.map(t => {
    if (t.type === 'Income') totalIncome += Number(t.amount);
    if (t.type === 'Expense') totalExpense += Number(t.amount);

    const isIncome = t.type === 'Income';
    const color = isIncome ? 'green' : 'red';

    // Correct timezone issues for date rendering in the report
    const dateObj = new Date(t.date);
    dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
    const dateStr = dateObj.toLocaleDateString('pt-BR');

    let details = '';
    if (t.total_installments > 1) details += `Parc: ${t.installment_number}/${t.total_installments} `;
    if (t.credit_card_name) details += `Cartão: ${t.credit_card_name}`;

    const amountStr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount);

    return `<tr>
      <td>${dateStr}</td>
      <td style="color:${color}; font-weight:bold;">${isIncome ? 'Receita' : 'Despesa'}</td>
      <td>${t.description || ''}</td>
      <td>${t.category || ''}</td>
      <td>${amountStr}</td>
      <td>${details}</td>
    </tr>`;
  }).join('');

  const balance = totalIncome - totalExpense;
  const formatCur = (num) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Relatório - App de Custos</title>
      <style>
        body { font-family: sans-serif; padding: 20px; background: #fff; color: #000; } 
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; } 
        .card { border: 1px solid #ddd; padding: 15px; margin: 10px 10px 10px 0; border-radius: 5px; flex: 1; text-align: center; } 
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; } 
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } 
        th { background-color: #f2f2f2; } 
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body onload="window.print()">
      <div class="container">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h1>Relatório: ${month.padStart(2, '0')}/${year}</h1>
          <button class="no-print" onclick="window.print()" style="padding:10px 20px; font-size:16px; cursor:pointer;">🖨️ Imprimir / Salvar PDF</button>
        </div>

        <div style="display: flex; gap: 20px;">
          <div class="card">
            <h3 style="margin:0 0 10px 0; font-weight:normal; color:#555;">Receitas</h3>
            <p style="color:green; font-weight:bold; font-size:20px; margin:0;">${formatCur(totalIncome)}</p>
          </div>
          <div class="card">
            <h3 style="margin:0 0 10px 0; font-weight:normal; color:#555;">Despesas</h3>
            <p style="color:red; font-weight:bold; font-size:20px; margin:0;">${formatCur(totalExpense)}</p>
          </div>
          <div class="card" style="margin-right: 0;">
            <h3 style="margin:0 0 10px 0; font-weight:normal; color:#555;">Balanço</h3>
            <p style="font-weight:bold; font-size:20px; margin:0;">${formatCur(balance)}</p>
          </div>
        </div>

        <h2>Transações</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Valor</th>
              <th>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        
        <p style="margin-top:40px; font-size:12px; color:#888;"><i>Gerado automaticamente por App de Custos PWA</i></p>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
});

exportCsvBtn.addEventListener('click', () => {
  if (!transactions || transactions.length === 0) return alert("Nenhuma transação carregada para exportar.");

  // Headers
  const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor (R$)', 'Cartão', 'Parcelas'];
  const rows = transactions.map(t => [
    t.date,
    t.type,
    t.category || '',
    t.description || '',
    t.amount,
    t.credit_card_name || '',
    t.total_installments > 1 ? `${t.installment_number}/${t.total_installments}` : '1/1'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  // Prefix UTF-8 BOM so Excel opens with correct encoding
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `extrato_app_custos_${(new Date()).toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// --- UI Logic: RPG Gamification ---

function updateAvatarUI() {
  const profile = GamificationService.getProfile();
  const stage = profile.EvolutionStage.toLowerCase();

  avatarLevelBadge.textContent = `Lvl ${profile.Level}`;
  avatarStageName.textContent = profile.EvolutionStage;

  // Attempt to load asset images 
  avatarImg.src = `./assets/sprites/${stage}.png`;

  // Bind to error to fallback
  avatarImg.onerror = () => { avatarImg.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${stage}`; };
}

avatarControl.addEventListener('click', openRpgModal);

function openRpgModal() {
  const profile = GamificationService.getProfile();
  const stage = profile.EvolutionStage.toLowerCase();

  rpgStageTitle.textContent = profile.EvolutionStage;
  rpgLevelText.textContent = profile.Level;
  rpgXpText.textContent = `${profile.CurrentXP} / ${profile.XPToNextLevel}`;

  const pct = Math.min(100, Math.round((profile.CurrentXP / profile.XPToNextLevel) * 100));
  rpgXpBar.style.width = '0%';
  setTimeout(() => { rpgXpBar.style.width = `${pct}%`; }, 100);

  rpgLargeAvatar.src = `./assets/sprites/${stage}.png`;
  rpgLargeAvatar.onerror = () => { rpgLargeAvatar.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${stage}`; };

  // Render Achievements
  achievementsGrid.innerHTML = '';
  GamificationService.ALL_ACHIEVEMENTS.forEach(def => {
    const isUnlocked = profile.UnlockedAchievements.some(a => a.Id === def.Id);

    // Locked/Unlocked styling
    const statusClass = isUnlocked ? "border-purple-500/40 bg-purple-500/10" : "border-slate-700 bg-slate-800/50 opacity-60 grayscale";
    const iconColor = isUnlocked ? "text-yellow-400" : "text-slate-500";
    const dateHtml = isUnlocked ? `<span class="text-[9px] text-primary">Desbloqueado</span>` : '';

    achievementsGrid.innerHTML += `
            <div class="flex items-start gap-4 p-3 rounded-xl border ${statusClass}">
               <div class="h-10 w-10 shrink-0 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700">
                  <span class="material-symbols-outlined ${iconColor}">emoji_events</span>
               </div>
               <div class="flex-1">
                  <div class="flex justify-between items-center mb-0.5">
                     <h5 class="text-sm font-bold text-white">${def.Name}</h5>
                     ${dateHtml}
                  </div>
                  <p class="text-xs text-slate-400">${def.Description}</p>
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

const closeRpgModal = () => rpgModal.classList.add('hidden');
closeRpgBtn.addEventListener('click', closeRpgModal);
rpgOverlay.addEventListener('click', closeRpgModal);
avatarControl.addEventListener('click', openRpgModal);

// Help Modal close handlers
const helpModal = document.getElementById('help-modal');
document.getElementById('close-help-btn').addEventListener('click', () => helpModal.classList.add('hidden'));
document.getElementById('help-overlay').addEventListener('click', () => helpModal.classList.add('hidden'));

// Execute UI refresh on load
updateAvatarUI();


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
  TrashService.moveToTrash(selectedTransaction.id);
  closeContextMenu();
  await loadData(); // Reload to apply filter
});

// Edit function implementation
ctxEditBtn.addEventListener('click', () => {
  if (!selectedTransaction) return;
  editTransactionId = selectedTransaction.id;

  // Select Type
  if (selectedTransaction.type === 'Income') {
    document.querySelector('input[name="type"][value="Income"]').click();
  } else {
    document.querySelector('input[name="type"][value="Expense"]').click();
  }

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

// Close picker on outside click
document.addEventListener('click', (e) => {
  if (!emojiBtn.contains(e.target) && !emojiPicker.contains(e.target)) {
    emojiPicker.classList.add('hidden');
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
    if (currentSearchQuery.length > 0) {
      transactions = await TransactionService.searchTransactions(currentSearchQuery);
    } else {
      const selectedMonth = parseInt(filterMonthEl.value);
      const selectedYear = parseInt(filterYearEl.value);
      transactions = await TransactionService.getTransactions(selectedYear, selectedMonth);
    }

    // Filter out Soft Deleted Transacitons (Virtual Recycle Bin)
    const deletedIds = TrashService.getDeletedIds();
    transactions = transactions.filter(t => !deletedIds.includes(t.id));

    // Check if we are in Dashboard mode
    if (currentTab === 'Dashboard') {
      renderDashboard();
    } else {
      updateUI();
    }
  } catch (e) {
    console.error("Failed to load transactions", e);
    listEl.innerHTML = '<div class="text-center text-red-400 py-8">Erro ao carregar dados.</div>';
  }
}

async function renderDashboard() {
  const formatCurrency = (num) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(num));

  // 1. Calculate Expenses by Category
  const expenses = transactions.filter(t => t.type === 'Expense');
  const totalExpense = expenses.reduce((acc, t) => acc + Number(t.amount), 0);
  const income = transactions.filter(t => t.type === 'Income').reduce((acc, t) => acc + Number(t.amount), 0);

  const catMap = {};
  expenses.forEach(t => {
    let cat = t.category || "General";
    catMap[cat] = (catMap[cat] || 0) + Number(t.amount);
  });

  const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  dashCategories.innerHTML = '';
  if (sortedCats.length === 0) {
    dashCategories.innerHTML = '<div class="text-center text-slate-500 text-xs py-4">Nenhuma despesa no período.</div>';
  } else {
    sortedCats.forEach(([cat, amount]) => {
      const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;

      let firstChar = cat.split(' ')[0] || "";
      let isEmoji = /[\u1000-\uFFFF]/.test(firstChar);

      const icon = isEmoji ? firstChar : '🏷️';
      const name = isEmoji ? cat.substring(firstChar.length).trim() : cat;

      // Budget Checks
      const budget = BudgetService.getBudget(name);
      let budgetWarning = '';
      let barColor = 'bg-primary';

      if (budget > 0) {
        const pctBudget = amount / budget;
        if (pctBudget >= 1.0) {
          budgetWarning = `<span class="text-[10px] text-accent-red border border-accent-red/30 px-1 rounded-sm ml-2 font-bold uppercase hidden sm:inline-block">🚨 Estourou!</span>`;
          barColor = 'bg-accent-red drop-shadow-[0_0_5px_rgba(250,101,56,0.6)]';
        } else if (pctBudget >= 0.8) {
          budgetWarning = `<span class="text-[10px] text-yellow-400 border border-yellow-400/30 px-1 rounded-sm ml-2 font-bold uppercase hidden sm:inline-block">⚠️ ${Math.round(pctBudget * 100)}%</span>`;
          barColor = 'bg-yellow-500';
        }
      }

      dashCategories.innerHTML += `
             <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-bold text-slate-300 flex items-center">${icon} ${name} ${budgetWarning}</span>
                <span class="text-xs font-bold text-white">R$ ${amount.toFixed(2)} <span class="text-slate-500 font-normal">(${pct}%)</span></span>
             </div>
             <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-3">
                <div class="h-full ${barColor} rounded-full transition-all duration-1000" style="width: ${pct}%"></div>
             </div>
          `;
    });
  }

  // 1.5 Calculate Expenses by Credit Card
  const cardMap = {};
  expenses.forEach(t => {
    if (t.credit_card_name) {
      cardMap[t.credit_card_name] = (cardMap[t.credit_card_name] || 0) + Number(t.amount);
    }
  });

  const sortedCards = Object.entries(cardMap).sort((a, b) => b[1] - a[1]);

  dashCreditCards.innerHTML = '';
  if (sortedCards.length === 0) {
    dashCreditCards.innerHTML = '<div class="text-center text-slate-500 text-xs py-4">Nenhuma despesa no crédito.</div>';
  } else {
    sortedCards.forEach(([cardName, amount]) => {
      const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
      dashCreditCards.innerHTML += `
             <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-bold text-slate-300 flex items-center"><span class="material-symbols-outlined text-[14px] text-slate-400 mr-1">credit_card</span> ${cardName}</span>
                <span class="text-xs font-bold text-white">R$ ${amount.toFixed(2)} <span class="text-slate-500 font-normal">(${pct}%)</span></span>
             </div>
             <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-3">
                <div class="h-full bg-orange-500 rounded-full transition-all duration-1000" style="width: ${pct}%"></div>
             </div>
          `;
    });
  }

  // 2. Forecast
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const currentDay = today.getDate();

  const selectedMonth = parseInt(filterMonthEl.value);
  const selectedYear = parseInt(filterYearEl.value);
  let forecast = totalExpense;

  if (selectedMonth === (today.getMonth() + 1) && selectedYear === today.getFullYear()) {
    forecast = (totalExpense / currentDay) * daysInMonth;
  }

  dashForecast.textContent = '- ' + formatCurrency(forecast);
  if (forecast > income && income > 0) {
    dashForecast.classList.replace('text-white', 'text-accent-red');
  } else {
    dashForecast.classList.replace('text-accent-red', 'text-white');
  }

  // 3. Smart Insights
  let insights = "";
  if (income === 0 && totalExpense === 0) {
    insights = "Nenhuma movimentação neste mês. Que tal registrar ou planejar suas despesas?";
  } else if (income === 0) {
    insights = "Atenção: Você tem despesas registradas, mas nenhuma receita neste mês. Acompanhe de perto as suas reservas financeiras.";
  } else {
    const spentPct = (totalExpense / income) * 100;
    if (spentPct < 50) {
      insights = `Excelente! Você gastou apenas ${spentPct.toFixed(1)}% da sua receita. Uma ótima janela para poupar, investir, ou focar em projetos de longo prazo.`;
    } else if (spentPct < 80) {
      insights = `Tudo caminhando. O grau de consumo está em ${spentPct.toFixed(1)}%. Mantenha esse ritmo seguro até a virada do mês.`;
    } else if (spentPct <= 100) {
      insights = `⚠️ Risco Amarelo. Você já consumiu ${spentPct.toFixed(1)}% do orçamento. Trave saídas desnecessárias para não fechar no déficit.`;
    } else {
      insights = `🚨 Cuidado! O volume gasto excedeu sua receita em ${Math.abs(100 - spentPct).toFixed(1)}%. Repense as parcelas e os passivos de lazer rapidamente.`;
    }
  }
  dashInsights.textContent = insights;

  // 4. Net Worth (Patrimônio Global)
  dashNetworth.textContent = "Calculando...";

  // Make the Net Worth card interactive to set the base line
  dashNetworth.parentElement.classList.add('cursor-pointer', 'hover:bg-slate-700/50', 'transition-colors');
  dashNetworth.parentElement.setAttribute('title', 'Clique para editar o Patrimônio Base');
  dashNetworth.parentElement.onclick = () => {
    const currentBase = localStorage.getItem('baseNetWorth') || '0';
    const newBase = prompt("Digite o valor atual do seu Patrimônio Base (Ex: 1550.00):", currentBase);
    if (newBase !== null && !isNaN(parseFloat(newBase))) {
      localStorage.setItem('baseNetWorth', parseFloat(newBase).toString());
      renderDashboard(); // Re-render to show updated totals
    }
  };

  const netWorth = await TransactionService.getNetWorth();

  // Subtract Savings Targets from NetWorth to isolate "Free" Patrimony
  const totalSaved = SavingsService.getTotalSaved();
  const freeNetWorth = netWorth - totalSaved;

  dashNetworth.textContent = (freeNetWorth >= 0 ? '+' : '-') + ' ' + formatCurrency(freeNetWorth);

  if (freeNetWorth >= 0) {
    dashNetworth.classList.replace('text-accent-red', 'text-white');
    dashNetworthTrend.textContent = '📈 Saldos Positivos';
    dashNetworthTrend.classList.replace('text-accent-red', 'text-accent-green');
  } else {
    dashNetworth.classList.add('text-accent-red');
    dashNetworthTrend.textContent = '📉 Saldos Negativos';
    dashNetworthTrend.classList.replace('text-accent-green', 'text-accent-red');
  }

  // 5. Render Savings Goals
  renderSavingsGoals();
}

function updateUI() {
  // Calculate Totals
  const amounts = transactions.map(t => t.type === 'Income' ? Number(t.amount) : -Number(t.amount));

  const total = amounts.reduce((acc, item) => acc + item, 0).toFixed(2);
  const income = amounts.filter(item => item > 0).reduce((acc, item) => acc + item, 0).toFixed(2);
  const expense = (amounts.filter(item => item < 0).reduce((acc, item) => acc + item, 0) * -1).toFixed(2);

  // Format Currency
  const formatCurrency = (num) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);

  balanceEl.textContent = formatCurrency(total);
  incomeEl.textContent = formatCurrency(income);
  expenseEl.textContent = formatCurrency(expense);

  // Render List
  listEl.innerHTML = '';

  // Process unique cards for filter dropdown
  const uniqueCards = [...new Set(transactions.map(t => t.credit_card_name).filter(Boolean))];
  const oldCardVal = filterCardEl.value;
  filterCardEl.innerHTML = '<option value="All">💳 Todos (Cartões)</option>';
  uniqueCards.forEach(card => {
    const opt = document.createElement('option');
    opt.value = card;
    opt.textContent = `💳 ${card} `;
    filterCardEl.appendChild(opt);
  });
  if (uniqueCards.includes(oldCardVal)) {
    filterCardEl.value = oldCardVal;
    currentCardFilter = oldCardVal;
  } else {
    currentCardFilter = 'All';
  }

  // Filter Transactions by Tab, Quick Filter, and Card
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const filteredTransactions = transactions.filter(t => {
    // 1. Tab Filter
    if (currentTab !== 'All' && t.type !== currentTab) return false;

    // 2. Card Filter
    if (currentCardFilter !== 'All' && t.credit_card_name !== currentCardFilter) return false;

    // 3. Quick Filter
    if (currentQuickFilter) {
      const txDate = new Date(t.date);
      txDate.setHours(0, 0, 0, 0);

      switch (currentQuickFilter) {
        case 'Today':
          if (txDate.getTime() !== today.getTime()) return false;
          break;
        case 'Week':
          if (txDate < weekAgo || txDate > today) return false;
          break;
        case 'Fixed':
          if (!t.is_recurring) return false;
          break;
        case 'Install':
          if (!t.total_installments || t.total_installments <= 1) return false;
          break;
      }
    }

    return true;
  });

  if (filteredTransactions.length === 0) {
    emptyEl.style.display = 'block';
    listEl.appendChild(emptyEl);
    return;
  }

  emptyEl.style.display = 'none';

  // Pre-calculate category sums for Budget checking
  const expenses = transactions.filter(t => t.type === 'Expense');
  const catMap = {};
  expenses.forEach(t => {
    let cat = t.category || "General";
    const name = cat.replace(/[\u1000-\uFFFF]/, '').trim() || cat;
    catMap[name] = (catMap[name] || 0) + Number(t.amount);
  });

  filteredTransactions.forEach(t => {
    const isIncome = t.type === 'Income';
    const sign = isIncome ? '+' : '-';

    const txDate = new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

    // Define aesthetic variables based on type
    const amountColor = isIncome ? 'text-accent-green' : 'text-accent-red drop-shadow-[0_0_8px_rgba(250,101,56,0.8)]'; // Neon Red for expenses
    const iconBg = isIncome ? 'bg-accent-green/10 border-accent-green/20 text-accent-green' : 'bg-red-500/10 border-red-500/20 text-red-400';
    const iconSymbol = isIncome ? 'account_balance' : 'shopping_bag';

    // Parse Emoji from Category Field
    let catStr = t.category || "General";
    let firstChar = catStr.split(' ')[0] || "";
    // Weak test for emoji, checking if not standard alphabetical
    let isEmoji = /[\u1000-\uFFFF]/.test(firstChar);

    let subCategory = isEmoji ? catStr.substring(firstChar.length).trim() : catStr;
    let iconHtml = isEmoji
      ? `<span style="font-size: 24px;">${firstChar}</span>`
      : `<span class="material-symbols-outlined" style="font-size: 24px; font-variation-settings: 'FILL' 1;">${iconSymbol}</span>`;

    let subText = `${subCategory} • ${txDate}`;

    // Extra tags (Installments, Card, Budget)
    let tagsHtml = '';

    if (!isIncome) {
      const budget = BudgetService.getBudget(subCategory);
      if (budget > 0) {
        const monthSum = catMap[subCategory] || 0;
        if (monthSum >= budget) {
          tagsHtml += `<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/20 mr-1 shadow-glow-red">Orçamento Estourado</span>`;
        }
      }
    }

    if (t.credit_card_name) {
      tagsHtml += `<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 mr-1">${t.credit_card_name}</span>`;
    }

    if (t.total_installments > 1) {
      // Calculate End Month Tooltip logic
      const txDateObj = new Date(t.date);
      const remainingParcels = t.total_installments - t.installment_number;
      // Adds remaining months to current date
      txDateObj.setMonth(txDateObj.getMonth() + remainingParcels);

      const finishStr = txDateObj.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

      tagsHtml += `<span title="Finaliza em: ${finishStr.toUpperCase()}" class="text-[10px] cursor-help font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/20 hover:bg-purple-500/40 transition">Parc. ${t.installment_number}/${t.total_installments}</span>`;
    }

    const el = document.createElement('div');
    // Structure based on Stitch design pattern
    el.className = 'glass-card glass-card-hover rounded-xl p-3 flex items-center gap-4 transition-all duration-200';
    el.innerHTML = `
        <div class="h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}">
          ${iconHtml}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex justify-between items-center mb-0.5">
            <h4 class="text-white font-semibold truncate">${t.description}</h4>
            <span class="${amountColor} font-bold whitespace-nowrap">${sign}${formatCurrency(Math.abs(t.amount))}</span>
          </div>
          <div class="flex justify-between items-center">
            <p class="text-xs text-slate-400">${subText}</p>
            <div>${tagsHtml}</div>
          </div>
        </div>
      `;

    // Implement Long-Press Event for Context Menu
    let pressTimer;
    const cancelPress = () => clearTimeout(pressTimer);

    el.addEventListener('pointerdown', (e) => {
      // Only trigger on primary touch/click avoiding right clicks
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pressTimer = setTimeout(() => {
        // Avoid triggering if we navigated
        openContextMenu(t);
      }, 600);
    });

    el.addEventListener('pointerup', cancelPress);
    el.addEventListener('pointerleave', cancelPress);
    el.addEventListener('pointermove', cancelPress);
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (!selectedTransaction) openContextMenu(t);
    }); // Also hook native right click if desired

    listEl.appendChild(el);
  });
}

// Form Submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Salvando...';
  submitBtn.disabled = true;

  try {
    const type = document.querySelector('input[name="type"]:checked').value;
    const catVal = document.getElementById('tx-category').value;
    const finalCategory = document.getElementById('tx-emoji-display').textContent + " " + (catVal === 'New' ? document.getElementById('tx-custom-category').value : catVal);

    const txDesc = document.getElementById('tx-description').value;
    const txAmount = document.getElementById('tx-amount').value;
    const txDateStr = document.getElementById('tx-date').value;
    const cardName = document.getElementById('tx-card').value || null;
    const installmentsStr = document.getElementById('tx-install-total').value;

    if (isNaN(parseFloat(txAmount)) || parseFloat(txAmount) <= 0) {
      alert('Por favor, insira um valor válido maior que zero.');
      return;
    }

    const txPayload = {
      description: txDesc,
      amount: parseFloat(txAmount),
      type: type,
      category: finalCategory,
      date: txDateStr,
      credit_card_name: cardName,
      total_installments: parseInt(installmentsStr) || 1
    };

    if (editTransactionId) {
      await TransactionService.updateTransaction(editTransactionId, txPayload);
    } else {
      await TransactionService.addTransaction(txPayload);
    }

    await loadData();
    closeModal();

  } catch (error) {
    alert("Erro ao salvar transação. Verifique se o Supabase está configurado corretamente.");
    console.error(error);
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

// --- Neural Border Canvas Animation ---
function initNeuralBorder() {
  const canvas = document.getElementById('neural-border-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;

  function resize() {
    width = canvas.parentElement.offsetWidth;
    height = canvas.parentElement.offsetHeight;
    canvas.width = width;
    canvas.height = height;
  }
  window.addEventListener('resize', resize);
  resize();

  // Nodes around the perimeter
  const colors = ['#00ff80', '#00f2ff', '#b300ff']; // Green, Cyan, Purple
  const nodes = [];
  for (let i = 0; i < 8; i++) {
    nodes.push({
      progress: i / 8 + (Math.random() * 0.05),
      speed: 0.001 + Math.random() * 0.0015,
      color: colors[i % colors.length]
    });
  }

  const sparkles = [];
  let time = 0;

  function hexToRgb(h) {
    return {
      r: parseInt(h.substring(1, 3), 16),
      g: parseInt(h.substring(3, 5), 16),
      b: parseInt(h.substring(5, 7), 16)
    };
  }

  function interpolateColor(c1, c2, factor) {
    const c1Rgb = hexToRgb(c1);
    const c2Rgb = hexToRgb(c2);
    const r = Math.round(c1Rgb.r + factor * (c2Rgb.r - c1Rgb.r));
    const g = Math.round(c1Rgb.g + factor * (c2Rgb.g - c1Rgb.g));
    const b = Math.round(c1Rgb.b + factor * (c2Rgb.b - c1Rgb.b));
    return `rgb(${r}, ${g}, ${b})`;
  }
  function getPoint(p) {
    p = p % 1;
    if (p < 0) p += 1;
    const total = width * 2 + height * 2;
    let d = p * total;
    if (d < width) return { x: d, y: 0, nx: 0, ny: 1 };
    d -= width;
    if (d < height) return { x: width, y: d, nx: -1, ny: 0 };
    d -= height;
    if (d < width) return { x: width - d, y: height, nx: 0, ny: -1 };
    d -= width;
    return { x: 0, y: height - d, nx: 1, ny: 0 };
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    time += 0.006; // Slowed down significantly for hypnotic effect

    nodes.forEach(n => { n.progress += n.speed * 0.15; }); // Slowed movement on perimeter
    nodes.sort((a, b) => (a.progress % 1) - (b.progress % 1));

    // Spawn random sparkles
    if (Math.random() < 0.15) {
      sparkles.push({
        progress: Math.random(),
        life: 1.0,
        decay: 0.01 + Math.random() * 0.02,
        color: colors[Math.floor(Math.random() * colors.length)],
        offset: (Math.random() - 0.5) * 4 // slight deviation from line
      });
    }

    ctx.lineWidth = 1.5;

    for (let i = 0; i < nodes.length; i++) {
      const n1 = nodes[i];
      const n2 = nodes[(i + 1) % nodes.length];

      let d1 = n1.progress % 1;
      let d2 = n2.progress % 1;
      if (d2 < d1) d2 += 1; // Wrap around for interpolation

      const dist1D = (d2 - d1) * (width * 2 + height * 2);
      const steps = Math.floor(dist1D / 5) || 1;

      let prevX, prevY;
      for (let j = 0; j <= steps; j++) {
        const prog = j / steps;
        const curr1D = d1 + (d2 - d1) * prog;
        const pt = getPoint(curr1D);

        // Sin wave amplitude only in the middle of the segment
        const amp = 4 * Math.sin(prog * Math.PI);
        const waveOffset = amp * Math.sin((j * 0.5) - time * 2);

        // Inset to prevent clipping/bleeding 
        const inset = 3;
        // Apply offset along normal vector
        const finalX = pt.x + pt.nx * waveOffset + pt.nx * inset;
        const finalY = pt.y + pt.ny * waveOffset + pt.ny * inset;

        if (j > 0) {
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(finalX, finalY);

          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          const color = interpolateColor(n1.color, n2.color, prog);
          ctx.strokeStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 10;
          ctx.stroke();
        }
        prevX = finalX;
        prevY = finalY;
      }
      ctx.shadowBlur = 0; // reset
    }

    // Draw sparkles
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const s = sparkles[i];
      s.life -= s.decay;
      if (s.life <= 0) {
        sparkles.splice(i, 1);
        continue;
      }

      const pt = getPoint(s.progress);
      const inset = 3;
      const sX = pt.x + pt.nx * (inset + s.offset);
      const sY = pt.y + pt.ny * (inset + s.offset);

      ctx.beginPath();
      ctx.arc(sX, sY, 1.0 + Math.random() * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 8;
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
    }

    requestAnimationFrame(draw);
  }
  draw();
}

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
  const name = savingsName.value;
  const target = parseFloat(savingsTarget.value);
  const icon = savingsIcon.value || '🎯';

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
  const amt = parseFloat(savingsFundAmount.value);
  if (amt > 0) {
    SavingsService.addFunds(currentSavingsId, amt);
    savingsFundAmount.value = '';
    GamificationService.onTransactionLogged(); // Hook XP
    updateAvatarUI();
    renderDashboard();
    closeSavingsModalFunc();
  }
});

savingsWithdrawFundBtn.addEventListener('click', () => {
  if (!currentSavingsId) return;
  const amt = parseFloat(savingsFundAmount.value);
  if (amt > 0) {
    SavingsService.withdrawFunds(currentSavingsId, amt);
    savingsFundAmount.value = '';
    renderDashboard();
    closeSavingsModalFunc();
  }
});

savingsDeleteBtn.addEventListener('click', () => {
  if (currentSavingsId && confirm('Tem certeza que deseja excluir esta caixinha? O saldo voltará para o patrimônio livre.')) {
    SavingsService.deleteGoal(currentSavingsId);
    closeSavingsModalFunc();
    renderDashboard();
  }
});

addSavingsBtn.addEventListener('click', () => {
  openSavingsModal();
});
