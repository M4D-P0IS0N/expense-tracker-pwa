function formatAbsoluteCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(value));
}

function escapeHtml(unsafeText) {
  return String(unsafeText)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatTooltipDate(dateString) {
  if (!dateString) return '--/--/----';

  const transactionDate = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(transactionDate.getTime())) return '--/--/----';

  return transactionDate.toLocaleDateString('pt-BR');
}

function buildCategoryTooltipMarkup(categoryTransactions) {
  return categoryTransactions
    .map((transaction) => {
      const descriptionLabel = transaction.description?.trim() || 'Sem descrição';
      const installmentLabel = transaction.total_installments > 1
        ? ` <span class="text-[9px] font-bold text-slate-400">#${transaction.installment_number}/${transaction.total_installments}</span>`
        : '';

      return `
        <div class="flex items-start justify-between gap-3 border-b border-slate-700/70 pb-2 last:border-b-0 last:pb-0">
          <div class="min-w-0">
            <p class="truncate text-[11px] font-semibold text-white">${escapeHtml(descriptionLabel)}${installmentLabel}</p>
            <p class="text-[10px] text-slate-400">${formatTooltipDate(transaction.date)}</p>
          </div>
          <p class="shrink-0 text-[11px] font-bold text-accent-red">${formatAbsoluteCurrency(Number(transaction.amount))}</p>
        </div>
      `;
    })
    .join('');
}

function renderCategoryBreakdown({ dashCategories, expenses, totalExpense, budgetService }) {
  const categoryTotals = {};
  expenses.forEach((transaction) => {
    const categoryName = transaction.category || 'General';
    categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + Number(transaction.amount);
  });

  const sortedCategories = Object.entries(categoryTotals).sort((categoryA, categoryB) => categoryB[1] - categoryA[1]);
  dashCategories.innerHTML = '';

  if (sortedCategories.length === 0) {
    dashCategories.innerHTML = '<div class="text-center text-slate-500 text-xs py-4">Nenhuma despesa no período.</div>';
    return;
  }

  sortedCategories.forEach(([categoryName, amount], categoryIndex) => {
    const categoryTransactions = expenses
      .filter((transaction) => (transaction.category || 'General') === categoryName)
      .sort((transactionA, transactionB) => Number(transactionB.amount) - Number(transactionA.amount));
    const progressPercent = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
    const firstCategoryToken = categoryName.split(' ')[0] || '';
    const hasEmojiCategory = /[\u1000-\uFFFF]/.test(firstCategoryToken);
    const iconLabel = hasEmojiCategory ? firstCategoryToken : '🏷️';
    const normalizedCategoryName = hasEmojiCategory ? categoryName.substring(firstCategoryToken.length).trim() : categoryName;

    const configuredBudget = budgetService.getBudget(normalizedCategoryName);
    let budgetWarning = '';
    let barColor = 'bg-primary';

    if (configuredBudget > 0) {
      const budgetPercent = amount / configuredBudget;
      if (budgetPercent >= 1.0) {
        budgetWarning = '<span class="text-[10px] text-accent-red border border-accent-red/30 px-1 rounded-sm ml-2 font-bold uppercase hidden sm:inline-block">🚨 Estourou!</span>';
        barColor = 'bg-accent-red drop-shadow-[0_0_5px_rgba(250,101,56,0.6)]';
      } else if (budgetPercent >= 0.8) {
        budgetWarning = `<span class="text-[10px] text-yellow-400 border border-yellow-400/30 px-1 rounded-sm ml-2 font-bold uppercase hidden sm:inline-block">⚠️ ${Math.round(budgetPercent * 100)}%</span>`;
        barColor = 'bg-yellow-500';
      }
    }

    const categoryTooltipMarkup = buildCategoryTooltipMarkup(categoryTransactions);
    const accessibilityLabel = escapeHtml(`Ver detalhes da categoria ${normalizedCategoryName}`);
    const shouldRenderTooltipAbove = categoryIndex >= Math.max(sortedCategories.length - 2, 1);
    const tooltipPositionClass = shouldRenderTooltipAbove
      ? 'bottom-full mb-2 origin-bottom'
      : 'top-full mt-2 origin-top';

    dashCategories.innerHTML += `
      <div class="group relative mb-3">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-bold text-slate-300 flex items-center">${iconLabel} ${normalizedCategoryName} ${budgetWarning}</span>
          <span class="text-xs font-bold text-white">R$ ${amount.toFixed(2)} <span class="text-slate-500 font-normal">(${progressPercent}%)</span></span>
        </div>
        <button type="button" tabindex="0" aria-label="${accessibilityLabel}" class="relative z-10 block w-full cursor-help rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70">
          <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full ${barColor} rounded-full transition-all duration-1000" style="width: ${progressPercent}%"></div>
          </div>
        </button>
        <div class="invisible absolute left-0 ${tooltipPositionClass} z-30 w-[min(22rem,calc(100vw-3rem))] max-w-sm rounded-2xl border border-slate-700 bg-slate-900/95 p-3 opacity-0 shadow-2xl transition-all duration-150 group-hover:visible group-hover:scale-100 group-hover:opacity-100 group-focus-within:visible group-focus-within:scale-100 group-focus-within:opacity-100 pointer-events-auto scale-95">
          <div class="mb-2 flex items-center justify-between gap-3">
            <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Composição da categoria</p>
            <p class="text-[11px] font-bold text-white">${formatAbsoluteCurrency(amount)}</p>
          </div>
          <div class="mb-2 flex items-center justify-between gap-3">
            <p class="truncate text-xs font-semibold text-slate-200">${iconLabel} ${normalizedCategoryName}</p>
            <p class="text-[10px] text-slate-400">${categoryTransactions.length} item(ns)</p>
          </div>
          <div class="max-h-52 space-y-2 overflow-y-auto pr-1">
            ${categoryTooltipMarkup}
          </div>
        </div>
      </div>
    `;
  });
}

function renderCreditCardBreakdown({ dashCreditCards, expenses, totalExpense }) {
  const cardTotals = {};
  expenses.forEach((transaction) => {
    if (transaction.credit_card_name) {
      cardTotals[transaction.credit_card_name] = (cardTotals[transaction.credit_card_name] || 0) + Number(transaction.amount);
    }
  });

  const sortedCards = Object.entries(cardTotals).sort((cardA, cardB) => cardB[1] - cardA[1]);
  dashCreditCards.innerHTML = '';

  if (sortedCards.length === 0) {
    dashCreditCards.innerHTML = '<div class="text-center text-slate-500 text-xs py-4">Nenhuma despesa no crédito.</div>';
    return;
  }

  sortedCards.forEach(([cardName, amount]) => {
    const progressPercent = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
    dashCreditCards.innerHTML += `
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs font-bold text-slate-300 flex items-center"><span class="material-symbols-outlined text-[14px] text-slate-400 mr-1">credit_card</span> ${cardName}</span>
        <span class="text-xs font-bold text-white">R$ ${amount.toFixed(2)} <span class="text-slate-500 font-normal">(${progressPercent}%)</span></span>
      </div>
      <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-3">
        <div class="h-full bg-orange-500 rounded-full transition-all duration-1000" style="width: ${progressPercent}%"></div>
      </div>
    `;
  });
}

function renderFutureExpenses({ dashFutureExpenses, expenses, totalExpense }) {
  const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  const futureMonthsMap = {};

  expenses
    .filter((transaction) => transaction.total_installments > 1 && transaction.installment_number < transaction.total_installments)
    .forEach((transaction) => {
      const remainingInstallments = transaction.total_installments - transaction.installment_number;
      const transactionDate = new Date(transaction.date);

      for (let index = 1; index <= remainingInstallments; index += 1) {
        const futureMonth = transactionDate.getMonth() + index;
        const futureYear = transactionDate.getFullYear() + Math.floor(futureMonth / 12);
        const normalizedMonth = futureMonth % 12;
        const lookupKey = `${futureYear}-${String(normalizedMonth).padStart(2, '0')}`;

        if (!futureMonthsMap[lookupKey]) {
          futureMonthsMap[lookupKey] = { year: futureYear, month: normalizedMonth, total: 0 };
        }
        futureMonthsMap[lookupKey].total += Number(transaction.amount);
      }
    });

  const recurringTotal = expenses
    .filter((transaction) => transaction.is_recurring)
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const sortedFutureMonths = Object.values(futureMonthsMap).sort((monthA, monthB) => (
    monthA.year === monthB.year ? monthA.month - monthB.month : monthA.year - monthB.year
  ));
  sortedFutureMonths.forEach((monthEntry) => {
    monthEntry.total += recurringTotal;
  });

  dashFutureExpenses.innerHTML = '';
  if (sortedFutureMonths.length === 0) {
    dashFutureExpenses.innerHTML = '<div class="text-center text-slate-500 text-xs py-4">Nenhuma parcela ativa encontrada.</div>';
    return;
  }

  const highestFutureExpense = Math.max(...sortedFutureMonths.map((monthEntry) => monthEntry.total));
  sortedFutureMonths.forEach((monthEntry) => {
    const progressPercent = highestFutureExpense > 0 ? Math.round((monthEntry.total / highestFutureExpense) * 100) : 0;
    const label = `${monthNames[monthEntry.month]}/${monthEntry.year}`;
    const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthEntry.total);

    let barColor = 'bg-blue-500';
    if (monthEntry.total >= totalExpense * 0.8) barColor = 'bg-accent-red';
    else if (monthEntry.total >= totalExpense * 0.5) barColor = 'bg-yellow-500';
    else if (monthEntry.total >= totalExpense * 0.3) barColor = 'bg-blue-400';
    else barColor = 'bg-accent-green';

    dashFutureExpenses.innerHTML += `
      <div class="flex items-center gap-3">
        <span class="text-[10px] font-bold text-slate-400 w-16 shrink-0 text-right">${label}</span>
        <div class="flex-1 h-5 bg-slate-800 rounded-full overflow-hidden relative">
          <div class="h-full ${barColor} rounded-full transition-all duration-1000 flex items-center justify-end pr-2" style="width: ${Math.max(progressPercent, 8)}%">
            <span class="text-[9px] font-bold text-white drop-shadow-sm whitespace-nowrap">${formattedValue}</span>
          </div>
        </div>
      </div>
    `;
  });
}

function renderForecastSection({ dashForecast, dashDailyExpense, totalExpense, income, selectedMonth, selectedYear }) {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const currentDay = today.getDate();
  let forecast = totalExpense;

  dashDailyExpense.classList.add('hidden');
  if (selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear()) {
    forecast = (totalExpense / currentDay) * daysInMonth;
    const dailyAverage = totalExpense / currentDay;
    if (dailyAverage > 0) {
      dashDailyExpense.textContent = `Gasto diário de ${formatAbsoluteCurrency(dailyAverage)}`;
      dashDailyExpense.classList.remove('hidden');
    }
  }

  dashForecast.textContent = `- ${formatAbsoluteCurrency(forecast)}`;
  if (forecast > income && income > 0) {
    dashForecast.classList.replace('text-white', 'text-accent-red');
  } else {
    dashForecast.classList.replace('text-accent-red', 'text-white');
  }
}

function renderInsights({ dashInsights, totalExpense, income }) {
  let insightsText = '';

  if (income === 0 && totalExpense === 0) {
    insightsText = 'Nenhuma movimentação neste mês. Que tal registrar ou planejar suas despesas?';
  } else if (income === 0) {
    insightsText = 'Atenção: Você tem despesas registradas, mas nenhuma receita neste mês. Acompanhe de perto as suas reservas financeiras.';
  } else {
    const spentPercent = (totalExpense / income) * 100;
    if (spentPercent < 50) {
      insightsText = `Excelente! Você gastou apenas ${spentPercent.toFixed(1)}% da sua receita. Uma ótima janela para poupar, investir, ou focar em projetos de longo prazo.`;
    } else if (spentPercent < 80) {
      insightsText = `Tudo caminhando. O grau de consumo está em ${spentPercent.toFixed(1)}%. Mantenha esse ritmo seguro até a virada do mês.`;
    } else if (spentPercent <= 100) {
      insightsText = `⚠️ Risco Amarelo. Você já consumiu ${spentPercent.toFixed(1)}% do orçamento. Trave saídas desnecessárias para não fechar no déficit.`;
    } else {
      insightsText = `🚨 Cuidado! O volume gasto excedeu sua receita em ${Math.abs(100 - spentPercent).toFixed(1)}%. Repense as parcelas e os passivos de lazer rapidamente.`;
    }
  }

  dashInsights.textContent = insightsText;
}

export async function renderDashboardSection({
  transactions,
  budgetService,
  transactionService,
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
  getElementById,
}) {
  const expenses = transactions.filter((transaction) => transaction.type === 'Expense');
  const totalExpense = expenses.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const income = transactions
    .filter((transaction) => transaction.type === 'Income')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  renderCategoryBreakdown({ dashCategories, expenses, totalExpense, budgetService });
  renderCreditCardBreakdown({ dashCreditCards, expenses, totalExpense });
  renderFutureExpenses({
    dashFutureExpenses: getElementById('dash-future-expenses'),
    expenses,
    totalExpense,
  });

  const selectedMonth = parseInt(filterMonthEl.value, 10);
  const selectedYear = parseInt(filterYearEl.value, 10);

  renderForecastSection({
    dashForecast,
    dashDailyExpense: getElementById('dash-daily-expense'),
    totalExpense,
    income,
    selectedMonth,
    selectedYear,
  });

  renderInsights({ dashInsights, totalExpense, income });

  dashNetworth.textContent = 'Calculando...';
  const netWorth = await transactionService.getNetWorth(selectedYear, selectedMonth);

  dashNetworth.parentElement.classList.add('cursor-pointer', 'hover:bg-slate-700/50', 'transition-colors');
  dashNetworth.parentElement.setAttribute('title', 'Ajustar Saldo Real');
  dashNetworth.parentElement.onclick = async () => {
    dashNetworth.parentElement.style.pointerEvents = 'none';
    const currentBase = await transactionService.getBaseNetWorth();
    const sumOfTransactions = netWorth - currentBase;

    const newTargetValue = prompt(
      'Ajuste Mágico de Saldo\n\nDigite quanto de dinheiro você tem na conta bancária hoje (Ex: 2248,23):\nO aplicativo fará o cálculo retroativo para calibrar seu saldo dinamicamente na nuvem.',
      netWorth.toFixed(2).replace('.', ',')
    );

    if (newTargetValue !== null) {
      const targetNetWorth = parseBrazilianCurrency(newTargetValue);
      if (!Number.isNaN(targetNetWorth)) {
        const newBase = targetNetWorth - sumOfTransactions;
        dashNetworthTrend.textContent = '☁️ Sincronizando...';
        dashNetworthTrend.classList.replace('text-accent-green', 'text-yellow-400');
        dashNetworthTrend.classList.replace('text-accent-red', 'text-yellow-400');

        try {
          await transactionService.updateBaseNetWorth(newBase);
          markPatrimonioCalibrated();
          patrimonioReminder.classList.add('hidden');
        } catch (error) {
          console.error('Failed to sync new base net worth', error);
          alert('Erro ao sincronizar saldo com a nuvem. Valor atualizado apenas localmente.');
        }

        renderDashboard();
      }
    }
    dashNetworth.parentElement.style.pointerEvents = 'auto';
  };

  dashNetworth.textContent = `${netWorth >= 0 ? '+' : '-'} ${formatAbsoluteCurrency(netWorth)}`;
  if (netWorth >= 0) {
    dashNetworth.classList.replace('text-accent-red', 'text-white');
    dashNetworthTrend.textContent = '📈 Saldos Positivos';
    dashNetworthTrend.classList.replace('text-accent-red', 'text-accent-green');
  } else {
    dashNetworth.classList.add('text-accent-red');
    dashNetworthTrend.textContent = '📉 Saldos Negativos';
    dashNetworthTrend.classList.replace('text-accent-green', 'text-accent-red');
  }

  renderSavingsGoals();
}
