import './style.css';
import { TransactionService } from './services/TransactionService.js';
import { BudgetService } from './services/BudgetService.js';
import { TrashService } from './services/TrashService.js';
import { NotebookService } from './services/NotebookService.js';
import { GamificationService } from './services/GamificationService.js';
import { SavingsService } from './services/SavingsService.js';
import { AuthService } from './services/AuthService.js';

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

  // Add "+" option to allow custom year entry
  const addYearOption = document.createElement('option');
  addYearOption.value = '__add_year__';
  addYearOption.textContent = '+ Ano';
  filterYearEl.appendChild(addYearOption);

  // Set default logic to Current Month and Year
  filterMonthEl.value = (currentDate.getMonth() + 1).toString();
  filterYearEl.value = currentDate.getFullYear().toString();

  // Attach auto-fetch events
  filterMonthEl.addEventListener('change', loadData);
  filterYearEl.addEventListener('change', () => {
    if (filterYearEl.value === '__add_year__') {
      const newYearStr = prompt('Digite o ano que deseja adicionar (ex: 2030):');
      if (newYearStr) {
        const newYear = parseInt(newYearStr);
        if (!isNaN(newYear) && newYear >= 2020 && newYear <= 2050) {
          // Check if already exists
          const existingValues = Array.from(filterYearEl.options).map(o => o.value);
          if (!existingValues.includes(String(newYear))) {
            const newOption = document.createElement('option');
            newOption.value = newYear;
            newOption.textContent = newYear;
            // Insert before the "+ Ano" option
            filterYearEl.insertBefore(newOption, addYearOption);
          }
          filterYearEl.value = String(newYear);
          loadData();
        } else {
          showNotification('Ano inválido. Use entre 2020 e 2050.', 'error');
          filterYearEl.value = currentDate.getFullYear().toString();
        }
      } else {
        filterYearEl.value = currentDate.getFullYear().toString();
      }
    } else {
      loadData();
    }
  });

  // Sync legacy stats to gamification profile
  await GamificationService.syncWithDatabase(TransactionService);
  GamificationService.trackDailyLogin();

  // Initial load
  await loadData();
}

// --- Search & Filters Logic ---
let currentSearchQuery = '';
let currentQuickFilter = null; // 'Today', 'Week', 'Fixed', 'Install'
let currentCardFilter = 'All';
let currentSort = 'date-desc';

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

  if (sortTransactionsEl) {
    sortTransactionsEl.addEventListener('change', (e) => {
      currentSort = e.target.value;
      updateUI();
    });
  }

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
avatarControl.addEventListener('click', openRpgModal);

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

  // 1.6 Future Expenses Projection (Installments)
  const dashFutureExpenses = document.getElementById('dash-future-expenses');
  const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const futureMonthsMap = {};

  // Gather all installment-based expenses
  const installmentExpenses = expenses.filter(t => t.total_installments > 1 && t.installment_number < t.total_installments);

  installmentExpenses.forEach(t => {
    const remainingParcels = t.total_installments - t.installment_number;
    const txDate = new Date(t.date);

    for (let i = 1; i <= remainingParcels; i++) {
      const futureMonth = txDate.getMonth() + i; // 0-indexed months offset
      const futureYear = txDate.getFullYear() + Math.floor(futureMonth / 12);
      const normalizedMonth = futureMonth % 12;
      const key = `${futureYear}-${String(normalizedMonth).padStart(2, '0')}`;

      if (!futureMonthsMap[key]) {
        futureMonthsMap[key] = { year: futureYear, month: normalizedMonth, total: 0 };
      }
      futureMonthsMap[key].total += Number(t.amount);
    }
  });

  // Also add recurring expenses to every future month (if any exist)
  const recurringExpenses = expenses.filter(t => t.is_recurring);
  const recurringTotal = recurringExpenses.reduce((sum, t) => sum + Number(t.amount), 0);

  // Sort by date and render
  const sortedFutureMonths = Object.values(futureMonthsMap).sort((a, b) => {
    return a.year === b.year ? a.month - b.month : a.year - b.year;
  });

  // Add recurring to each projected month
  sortedFutureMonths.forEach(m => { m.total += recurringTotal; });

  dashFutureExpenses.innerHTML = '';

  if (sortedFutureMonths.length === 0) {
    dashFutureExpenses.innerHTML = '<div class="text-center text-slate-500 text-xs py-4">Nenhuma parcela ativa encontrada.</div>';
  } else {
    const maxFutureExpense = Math.max(...sortedFutureMonths.map(m => m.total));

    sortedFutureMonths.forEach(m => {
      const pct = maxFutureExpense > 0 ? Math.round((m.total / maxFutureExpense) * 100) : 0;
      const label = `${monthNames[m.month]}/${m.year}`;
      const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(m.total);

      // Color coding: green for low, yellow for medium, red for high relative to current expenses
      let barColor = 'bg-blue-500';
      if (m.total >= totalExpense * 0.8) barColor = 'bg-accent-red';
      else if (m.total >= totalExpense * 0.5) barColor = 'bg-yellow-500';
      else if (m.total >= totalExpense * 0.3) barColor = 'bg-blue-400';
      else barColor = 'bg-accent-green';

      dashFutureExpenses.innerHTML += `
        <div class="flex items-center gap-3">
          <span class="text-[10px] font-bold text-slate-400 w-16 shrink-0 text-right">${label}</span>
          <div class="flex-1 h-5 bg-slate-800 rounded-full overflow-hidden relative">
            <div class="h-full ${barColor} rounded-full transition-all duration-1000 flex items-center justify-end pr-2" style="width: ${Math.max(pct, 8)}%">
              <span class="text-[9px] font-bold text-white drop-shadow-sm whitespace-nowrap">${formattedValue}</span>
            </div>
          </div>
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

  const dashDailyExpense = document.getElementById('dash-daily-expense');
  dashDailyExpense.classList.add('hidden');

  if (selectedMonth === (today.getMonth() + 1) && selectedYear === today.getFullYear()) {
    forecast = (totalExpense / currentDay) * daysInMonth;
    const dailyAvg = totalExpense / currentDay;
    if (dailyAvg > 0) {
      dashDailyExpense.textContent = `Gasto diário de ${formatCurrency(dailyAvg)}`;
      dashDailyExpense.classList.remove('hidden');
    }
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

  const netWorth = await TransactionService.getNetWorth(selectedYear, selectedMonth);

  // Make the Net Worth card interactive to set the base line
  dashNetworth.parentElement.classList.add('cursor-pointer', 'hover:bg-slate-700/50', 'transition-colors');
  dashNetworth.parentElement.setAttribute('title', 'Ajustar Saldo Real');
  dashNetworth.parentElement.onclick = async () => {
    dashNetworth.parentElement.style.pointerEvents = 'none'; // Prevent double clicking
    const currentBase = await TransactionService.getBaseNetWorth();
    const sumOfTransactions = netWorth - currentBase;

    const newTargetStr = prompt("Ajuste Mágico de Saldo\n\nDigite quanto de dinheiro você tem na conta bancária hoje (Ex: 2248,23):\nO aplicativo fará o cálculo retroativo para calibrar seu saldo dinamicamente na nuvem.", netWorth.toFixed(2).replace('.', ','));

    if (newTargetStr !== null) {
      const targetNetWorth = parseBrazilianCurrency(newTargetStr);
      if (!isNaN(targetNetWorth)) {
        const newBase = targetNetWorth - sumOfTransactions;

        // Visual loading state
        dashNetworthTrend.textContent = '☁️ Sincronizando...';
        dashNetworthTrend.classList.replace('text-accent-green', 'text-yellow-400');
        dashNetworthTrend.classList.replace('text-accent-red', 'text-yellow-400');

        try {
          await TransactionService.updateBaseNetWorth(newBase);
          // Mark patrimônio as calibrated (one-time onboarding)
          markPatrimonioCalibrated();
          patrimonioReminder.classList.add('hidden');
        } catch (e) {
          console.error("Failed to sync new base net worth", e);
          alert("Erro ao sincronizar saldo com a nuvem. Valor atualizado apenas localmente.");
        }

        renderDashboard(); // Re-render to show updated totals
      }
    }
    dashNetworth.parentElement.style.pointerEvents = 'auto';
  };  // User requested: Caixinhas should NOT be subtracted from the Net Worth.
  // Net Worth is now the absolute total up to the selected month, including savings.
  const freeNetWorth = netWorth;

  dashNetworth.textContent = (freeNetWorth >= 0 ? '+' : '-') + ' ' + formatCurrency(Math.abs(freeNetWorth));

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

  // Sort filtered transactions
  filteredTransactions.sort((a, b) => {
    if (currentSort === 'date-desc') {
      return new Date(b.date) - new Date(a.date);
    } else if (currentSort === 'date-asc') {
      return new Date(a.date) - new Date(b.date);
    } else if (currentSort === 'value-desc') {
      return b.amount - a.amount;
    } else if (currentSort === 'value-asc') {
      return a.amount - b.amount;
    } else if (currentSort === 'alpha-asc') {
      return (a.description || '').localeCompare(b.description || '');
    } else if (currentSort === 'alpha-desc') {
      return (b.description || '').localeCompare(a.description || '');
    }
    return 0; // fallback
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
      const basicText = `Parc. ${t.installment_number}/${t.total_installments}`;
      const finishText = `Fim: ${finishStr.toUpperCase()}`;

      tagsHtml += `<span title="Finaliza em: ${finishStr.toUpperCase()}" onclick="this.textContent = this.textContent === '${basicText}' ? '${finishText}' : '${basicText}'; event.stopPropagation();" class="text-[10px] cursor-help font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/20 hover:bg-purple-500/40 transition active:scale-95 inline-block">${basicText}</span>`;
    }

    const el = document.createElement('div');
    // Structure based on Stitch design pattern e evitando seleção de texto no iOS durante touch and hold
    el.className = 'glass-card glass-card-hover rounded-xl p-3 flex items-center gap-4 transition-all duration-200 select-none';
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
    const txAmountStr = document.getElementById('tx-amount').value;
    const parsedAmount = parseBrazilianCurrency(txAmountStr);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showNotification('Por favor, informe um valor válido acima de zero.', 'error');
      return;
    }

    const txDateStr = document.getElementById('tx-date').value;
    const cardName = document.getElementById('tx-card').value || null;
    const installmentsStr = document.getElementById('tx-install-total').value;
    const currentInstallmentStr = document.getElementById('tx-install-number').value;

    const txPayload = {
      description: txDesc,
      amount: parsedAmount,
      type: type,
      category: finalCategory,
      date: txDateStr,
      credit_card_name: cardName,
      total_installments: parseInt(installmentsStr) || 1,
      installment_number: parseInt(currentInstallmentStr) || 1,
      is_recurring: document.getElementById('tx-recurring').checked
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
      // ... (sparkle code remains identical to target, see full block) ...
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
  }

  // Throttle animation to ~30fps for better mobile performance
  let lastFrameTime = 0;
  function loop(timestamp) {
    requestAnimationFrame(loop);
    // Limit to 30 FPS -> ~33ms per frame
    if (timestamp - lastFrameTime < 33) return;
    lastFrameTime = timestamp;
    draw();
  }

  requestAnimationFrame(loop);
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

// --- Pull-to-Refresh (iOS PWA) ---
let pStart = { y: 0 };
let pCurrent = { y: 0 };
const ptrContainer = document.getElementById('ptr-indicator');
const ptrIcon = document.getElementById('ptr-icon');
const ptrText = document.getElementById('ptr-text');
const MAX_PULL = 150;
const TRIGGER_PULL = 80;
let isPulling = false;

document.addEventListener('touchstart', (e) => {
  // Use scrollY or scrollTop to be extremely safe about position 0
  const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

  if (scrollTop <= 5) {
    pStart.y = e.touches[0].clientY;
    isPulling = true;
    ptrContainer.style.transition = 'none';
  }
}, { passive: true });

document.addEventListener('touchmove', (e) => {
  if (!isPulling) return;
  pCurrent.y = e.touches[0].clientY;
  const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

  let pullDistance = pCurrent.y - pStart.y;

  // Only pull down when at the top
  if (pullDistance > 0 && scrollTop <= 5) {
    // CRITICAL for iOS Safari: Prevent native bouncing
    if (e.cancelable) {
      e.preventDefault();
    }

    let visualPull = pullDistance * 0.45;

    // Hard cap
    if (visualPull > MAX_PULL) visualPull = MAX_PULL + (visualPull - MAX_PULL) * 0.1;

    ptrContainer.style.transform = `translateY(${visualPull}px)`;
    ptrContainer.classList.remove('opacity-0', '-translate-y-full'); // Unhide fast

    if (visualPull >= TRIGGER_PULL) {
      ptrIcon.textContent = 'autorenew';
      ptrIcon.classList.add('animate-spin');
      ptrText.textContent = 'Solte para atualizar';
    } else {
      ptrIcon.textContent = 'arrow_downward';
      ptrIcon.classList.remove('animate-spin');
      ptrText.textContent = 'Puxe para atualizar';
    }
  }
}, { passive: false });

document.addEventListener('touchend', (e) => {
  if (!isPulling) return;
  isPulling = false;

  const pullDistance = pCurrent.y - pStart.y;
  let visualPull = pullDistance * 0.45;
  const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;

  ptrContainer.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.4s ease';

  if (visualPull >= TRIGGER_PULL && scrollTop <= 5) {
    ptrContainer.style.transform = `translateY(${TRIGGER_PULL - 20}px)`;
    ptrText.textContent = 'Atualizando...';

    setTimeout(() => {
      window.location.reload(true);
    }, 400);
  } else {
    // Snap back and hide completely
    ptrContainer.style.transform = `translateY(-150px)`;
    ptrContainer.classList.add('opacity-0');
    setTimeout(() => {
      ptrIcon.classList.remove('animate-spin');
      ptrIcon.textContent = 'arrow_downward';
      ptrContainer.classList.add('-translate-y-full');
    }, 400);
  }
});
