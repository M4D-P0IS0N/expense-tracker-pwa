// --- Retrospective PDF Generator Module ---
// Generates a year-to-date comparative analysis PDF report from January up to the current month,
// taking into account whether split-by-two (dividir por 2) was active in each respective month.

import { getEffectiveTransactionAmount } from "../utils/splitTransactionAmount.js";

function formatCurrency(val) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val || 0);
}

/**
 * Renders a grouped bar chart (Income vs Expense per month) onto an HTML5 2D Canvas
 * and returns a PNG DataURL.
 */
function renderMonthlyBarChart(monthlyStats) {
    const canvas = document.createElement("canvas");
    const canvasWidth = 620;
    const canvasHeight = 240;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const paddingLeft = 55;
    const paddingRight = 20;
    const paddingTop = 35;
    const paddingBottom = 40;

    const plotWidth = canvasWidth - paddingLeft - paddingRight;
    const plotHeight = canvasHeight - paddingTop - paddingBottom;

    // Find max value for Y scaling
    let maxVal = 0;
    monthlyStats.forEach(s => {
        if (s.income > maxVal) maxVal = s.income;
        if (s.expense > maxVal) maxVal = s.expense;
    });
    if (maxVal <= 0) maxVal = 1000;
    maxVal = maxVal * 1.1;

    // Gridlines
    const gridRows = 4;
    ctx.strokeStyle = "#f0f0f0";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#777777";
    ctx.font = "10px Segoe UI, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let i = 0; i <= gridRows; i++) {
        const yVal = (maxVal / gridRows) * i;
        const yPos = paddingTop + plotHeight - (i / gridRows) * plotHeight;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, yPos);
        ctx.lineTo(canvasWidth - paddingRight, yPos);
        ctx.stroke();

        const formattedY = yVal >= 1000 ? (yVal / 1000).toFixed(1) + "k" : Math.round(yVal);
        ctx.fillText(formattedY, paddingLeft - 6, yPos);
    }

    // Legend
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(paddingLeft + 10, 15, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "#333333";
    ctx.font = "11px Segoe UI, system-ui, sans-serif";
    ctx.fillText("Receitas", paddingLeft + 20, 15);

    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(paddingLeft + 90, 15, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "#333333";
    ctx.fillText("Despesas", paddingLeft + 100, 15);

    // Draw Bars
    const numMonths = monthlyStats.length;
    const groupWidth = plotWidth / numMonths;
    const barGap = 4;
    const barWidth = Math.max(6, Math.min(22, (groupWidth - 16) / 2));

    monthlyStats.forEach((stat, idx) => {
        const groupCenterX = paddingLeft + idx * groupWidth + groupWidth / 2;
        const incomeBarX = groupCenterX - barWidth - barGap / 2;
        const expenseBarX = groupCenterX + barGap / 2;

        const incomeHeight = (stat.income / maxVal) * plotHeight;
        const expenseHeight = (stat.expense / maxVal) * plotHeight;

        if (incomeHeight > 0) {
            ctx.fillStyle = "#10b981";
            ctx.fillRect(incomeBarX, paddingTop + plotHeight - incomeHeight, barWidth, incomeHeight);
        }

        if (expenseHeight > 0) {
            ctx.fillStyle = "#ef4444";
            ctx.fillRect(expenseBarX, paddingTop + plotHeight - expenseHeight, barWidth, expenseHeight);
        }

        ctx.fillStyle = "#444444";
        ctx.font = "11px Segoe UI, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(stat.monthName, groupCenterX, paddingTop + plotHeight + 18);
    });

    return canvas.toDataURL("image/png");
}

/**
 * Renders a doughnut chart for category breakdown onto an HTML5 2D Canvas.
 */
function renderDoughnutChart(categoryData) {
    const sortedEntries = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);
    const labels = sortedEntries.map(e => e[0]);
    const values = sortedEntries.map(e => e[1]);
    const total = values.reduce((acc, v) => acc + v, 0);

    const canvas = document.createElement("canvas");
    const legendItemHeight = 18;
    const legendHeaderPadding = 12;
    const legendHeight = labels.length * legendItemHeight + legendHeaderPadding;
    const chartDiameter = 170;
    const canvasWidth = 320;
    const canvasHeight = chartDiameter + legendHeight;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    if (total <= 0) return canvas.toDataURL("image/png");

    const chartCenterX = canvasWidth / 2;
    const chartCenterY = chartDiameter / 2 + 8;
    const outerRadius = chartDiameter / 2 - 10;
    const innerRadius = outerRadius * 0.55;

    const palette = [
        "#6366f1", "#ec4899", "#8b5cf6", "#10b981", "#f59e0b",
        "#3b82f6", "#ef4444", "#14b8a6", "#84cc16", "#a855f7"
    ];

    let currentAngle = -0.5 * Math.PI;
    values.forEach((val, i) => {
        const sliceAngle = (val / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.arc(chartCenterX, chartCenterY, outerRadius, currentAngle, currentAngle + sliceAngle);
        ctx.arc(chartCenterX, chartCenterY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();
        ctx.fillStyle = palette[i % palette.length];
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
        currentAngle += sliceAngle;
    });

    const legendStartY = chartDiameter + legendHeaderPadding;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    labels.forEach((label, i) => {
        const itemY = legendStartY + i * legendItemHeight;
        const percentage = ((values[i] / total) * 100).toFixed(1);
        ctx.beginPath();
        ctx.arc(16, itemY + 6, 5, 0, 2 * Math.PI);
        ctx.fillStyle = palette[i % palette.length];
        ctx.fill();

        ctx.fillStyle = "#333333";
        ctx.font = "11px Segoe UI, system-ui, sans-serif";
        ctx.fillText(label + " (" + percentage + "%) - " + formatCurrency(values[i]), 28, itemY + 6);
    });

    return canvas.toDataURL("image/png");
}

export async function exportRetrospectivePdfReport({ TransactionService, getTransactions, showNotification, isSplitByTwoEnabled = false }) {
    try {
        if (showNotification) showNotification("Gerando Retrospectiva Anual...", "info");

        let allTransactions = [];
        if (TransactionService && typeof TransactionService.getAllTransactions === "function") {
            try {
                allTransactions = await TransactionService.getAllTransactions();
            } catch (err) {
                console.warn("Falha ao carregar transações via TransactionService, fallback local:", err);
            }
        }
        if (!allTransactions || allTransactions.length === 0) {
            allTransactions = getTransactions ? getTransactions() : [];
        }

        if (!allTransactions || allTransactions.length === 0) {
            if (showNotification) showNotification("Nenhuma transação encontrada para gerar a Retrospectiva.", "warning");
            else alert("Nenhuma transação encontrada para gerar a Retrospectiva.");
            return;
        }

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonthIndex = now.getMonth(); // 0-indexed (7 = Aug)
        const currentMonthNumber = currentMonthIndex + 1;

        const monthNames = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];
        const monthShortNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

        const endMonthName = monthNames[currentMonthIndex];

        // Filter transactions for currentYear from month 1 up to currentMonthNumber
        const yearTransactions = allTransactions.filter(t => {
            if (!t.date) return false;
            const d = new Date(t.date);
            d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
            const tYear = d.getFullYear();
            const tMonth = d.getMonth() + 1;
            return tYear === currentYear && tMonth <= currentMonthNumber;
        });

        // Initialize monthly stats array for Jan .. currentMonth
        const monthlyStats = Array.from({ length: currentMonthNumber }, (_, i) => ({
            monthNumber: i + 1,
            monthName: monthShortNames[i],
            fullMonthName: monthNames[i],
            income: 0,
            expense: 0,
            balance: 0,
            count: 0
        }));

        let totalYearIncome = 0;
        let totalYearExpense = 0;
        const categoryTotals = {};
        const cardTotals = {};
        const expenseItems = [];

        yearTransactions.forEach(t => {
            const amount = getEffectiveTransactionAmount(t, isSplitByTwoEnabled);
            const d = new Date(t.date);
            d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
            const mIdx = d.getMonth();

            if (mIdx >= 0 && mIdx < currentMonthNumber) {
                monthlyStats[mIdx].count++;
                if (t.type === "Income") {
                    monthlyStats[mIdx].income += amount;
                    totalYearIncome += amount;
                } else if (t.type === "Expense") {
                    monthlyStats[mIdx].expense += amount;
                    totalYearExpense += amount;

                    const cat = t.category || "Sem Categoria";
                    categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;

                    if (t.credit_card_name) {
                        cardTotals[t.credit_card_name] = (cardTotals[t.credit_card_name] || 0) + amount;
                    }

                    expenseItems.push(t);
                }
            }
        });

        monthlyStats.forEach(s => {
            s.balance = s.income - s.expense;
        });

        const totalYearBalance = totalYearIncome - totalYearExpense;
        const monthlyAvgExpense = totalYearExpense / currentMonthNumber;
        const savingsRate = totalYearIncome > 0
            ? Math.max(0, ((totalYearIncome - totalYearExpense) / totalYearIncome) * 100).toFixed(1)
            : "0.0";

        // Find Month with highest expense
        let highestExpenseMonth = monthlyStats[0];
        monthlyStats.forEach(s => {
            if (s.expense > highestExpenseMonth.expense) highestExpenseMonth = s;
        });

        // Top 5 expenses (using effective amount)
        expenseItems.sort((a, b) => getEffectiveTransactionAmount(b, isSplitByTwoEnabled) - getEffectiveTransactionAmount(a, isSplitByTwoEnabled));
        const topExpenses = expenseItems.slice(0, 5);

        // Generate Charts
        const barChartDataUrl = renderMonthlyBarChart(monthlyStats);
        const categoryChartDataUrl = renderDoughnutChart(categoryTotals);

        // Build HTML Table Rows for Monthly Breakdown
        const monthlyRowsHtml = monthlyStats.map(s => {
            const balColor = s.balance >= 0 ? "#16a34a" : "#dc2626";
            const monthSavingsPct = s.income > 0 ? (((s.income - s.expense) / s.income) * 100).toFixed(1) + "%" : "-";
            return `<tr>
                <td style="font-weight:600;">${s.fullMonthName}</td>
                <td style="color:#16a34a; font-weight:600;">${formatCurrency(s.income)}</td>
                <td style="color:#dc2626; font-weight:600;">${formatCurrency(s.expense)}</td>
                <td style="color:${balColor}; font-weight:700;">${formatCurrency(s.balance)}</td>
                <td>${monthSavingsPct}</td>
            </tr>`;
        }).join("");

        // Build HTML Table Rows for Top Expenses
        const topExpensesHtml = topExpenses.map(t => {
            const d = new Date(t.date);
            d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
            const dateStr = d.toLocaleDateString("pt-BR");
            const effectiveAmt = getEffectiveTransactionAmount(t, isSplitByTwoEnabled);
            return `<tr>
                <td>${dateStr}</td>
                <td style="font-weight:600;">${t.description || "Sem descrição"}</td>
                <td>${t.category || "Outros"}</td>
                <td style="color:#dc2626; font-weight:700;">${formatCurrency(effectiveAmt)}</td>
            </tr>`;
        }).join("");

        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Retrospectiva Anual ${currentYear} - App de Custos</title>
    <style>
        body { font-family: "Segoe UI", system-ui, sans-serif; padding: 20px; color: #1e293b; background: #ffffff; }
        .container { max-width: 880px; margin: 0 auto; padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
        .header-title h1 { margin: 0; font-size: 24px; color: #0f172a; }
        .header-title p { margin: 4px 0 0 0; font-size: 13px; color: #64748b; }
        .btn-print { padding: 10px 18px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; color: #334155; transition: all 0.2s; }
        .btn-print:hover { background: #e2e8f0; }

        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .kpi-card { border: 1px solid #e2e8f0; padding: 14px; border-radius: 10px; background: #f8fafc; text-align: center; }
        .kpi-card h4 { margin: 0 0 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .kpi-card .val { margin: 0; font-weight: 800; font-size: 18px; }

        .charts-row { display: flex; gap: 20px; margin-bottom: 28px; page-break-inside: avoid; }
        .chart-box { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; background: #ffffff; text-align: center; }
        .chart-box.bar-box { flex: 1.6; }
        .chart-box.doughnut-box { flex: 1; }
        .chart-box h3 { margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #334155; text-align: left; }
        .chart-box img { max-width: 100%; height: auto; display: block; margin: 0 auto; }

        .section-title { font-size: 16px; font-weight: 700; color: #0f172a; margin: 24px 0 12px 0; border-left: 4px solid #6366f1; padding-left: 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
        th, td { border: 1px solid #e2e8f0; padding: 9px 12px; text-align: left; }
        th { background-color: #f1f5f9; font-weight: 700; color: #475569; }
        tr:nth-child(even) { background-color: #f8fafc; }

        .insights-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; color: #166534; font-size: 13px; }
        .insights-card strong { color: #14532d; }

        .footer { margin-top: 36px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }

        @media print {
            .no-print { display: none !important; }
            body { padding: 0; background: #ffffff; }
            .container { max-width: 100%; }
        }
    </style>
</head>
<body onload="window.print()">
    <div class="container">
        <div class="header">
            <div class="header-title">
                <h1>📊 Retrospectiva Financeira ${currentYear}</h1>
                <p>Análise acumulada: Janeiro a ${endMonthName} de ${currentYear}</p>
            </div>
            <button class="btn-print no-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
        </div>

        <div class="kpi-grid">
            <div class="kpi-card">
                <h4>Receitas no Ano</h4>
                <p class="val" style="color:#16a34a;">${formatCurrency(totalYearIncome)}</p>
            </div>
            <div class="kpi-card">
                <h4>Despesas no Ano</h4>
                <p class="val" style="color:#dc2626;">${formatCurrency(totalYearExpense)}</p>
            </div>
            <div class="kpi-card">
                <h4>Resultado Líquido</h4>
                <p class="val" style="color:${totalYearBalance >= 0 ? '#16a34a' : '#dc2626'};">${formatCurrency(totalYearBalance)}</p>
            </div>
            <div class="kpi-card">
                <h4>Taxa de Poupança</h4>
                <p class="val" style="color:#6366f1;">${savingsRate}%</p>
            </div>
        </div>

        <div class="insights-card">
            💡 <strong>Destaque do Ano:</strong> Média mensal de despesas em <strong>${formatCurrency(monthlyAvgExpense)}</strong>. 
            Mês com maior volume de gastos foi <strong>${highestExpenseMonth.fullMonthName}</strong> (${formatCurrency(highestExpenseMonth.expense)}).
        </div>

        <div class="charts-row">
            <div class="chart-box bar-box">
                <h3>Evolução Mensal (Receitas vs Despesas)</h3>
                <img src="${barChartDataUrl}" alt="Gráfico de Evolução Mensal">
            </div>
            <div class="chart-box doughnut-box">
                <h3>Gastos por Categoria</h3>
                <img src="${categoryChartDataUrl}" alt="Gráfico de Categorias">
            </div>
        </div>

        <h3 class="section-title">Detalhamento Comparativo Mês a Mês</h3>
        <table>
            <thead>
                <tr>
                    <th>Mês</th>
                    <th>Receitas</th>
                    <th>Despesas</th>
                    <th>Saldo do Mês</th>
                    <th>Taxa de Poupança</th>
                </tr>
            </thead>
            <tbody>
                ${monthlyRowsHtml}
            </tbody>
        </table>

        ${topExpenses.length > 0 ? `
        <h3 class="section-title">Maiores Despesas do Ano</h3>
        <table>
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Valor</th>
                </tr>
            </thead>
            <tbody>
                ${topExpensesHtml}
            </tbody>
        </table>
        ` : ''}

        <div class="footer">
            Relatório de Retrospectiva Anual gerado automaticamente em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })} • App de Custos PWA
        </div>
    </div>
</body>
</html>`;

        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");

        if (showNotification) showNotification("Retrospectiva Anual gerada com sucesso!", "success");
    } catch (err) {
        console.error("Erro ao gerar relatório de Retrospectiva:", err);
        if (showNotification) showNotification("Erro ao gerar Retrospectiva em PDF.", "error");
    }
}
