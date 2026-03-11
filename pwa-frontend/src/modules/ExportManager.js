// --- Export Manager ---
// Handles CSV and PDF export of transactions.
// Receives DOM button references and a getter function for the current transactions array.

export function initExportManager(exportPdfBtn, exportCsvBtn, getTransactions) {

    exportPdfBtn.addEventListener('click', () => {
        const transactions = getTransactions();
        if (!transactions || transactions.length === 0) return alert("Nenhuma transação carregada para exportar.");

        const month = document.getElementById('filter-month').value;
        const year = document.getElementById('filter-year').value;

        let totalIncome = 0;
        let totalExpense = 0;

        // Aggregate expenses by category and by card
        const expensesByCategory = {};
        const expensesByCard = {};

        const rowsHtml = transactions.map(t => {
            if (t.type === 'Income') totalIncome += Number(t.amount);
            if (t.type === 'Expense') {
                totalExpense += Number(t.amount);

                const categoryName = t.category || 'Sem Categoria';
                expensesByCategory[categoryName] = (expensesByCategory[categoryName] || 0) + Number(t.amount);

                const cardName = t.credit_card_name || 'Sem Cartão';
                expensesByCard[cardName] = (expensesByCard[cardName] || 0) + Number(t.amount);
            }

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

        const hasExpenses = totalExpense > 0;

        // --- Render doughnut charts as base64 images using native Canvas 2D ---
        const chartColorPalette = [
            '#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6',
            '#8b5cf6', '#ec4899', '#14b8a6', '#ef4444', '#06b6d4',
            '#84cc16', '#a855f7', '#f97316', '#22d3ee', '#e11d48',
            '#059669', '#7c3aed', '#d946ef', '#0ea5e9', '#ca8a04'
        ];

        function renderDoughnutToDataUrl(labels, values) {
            const total = values.reduce((sum, v) => sum + v, 0);
            if (total === 0 || labels.length === 0) return '';

            const devicePixelRatio = window.devicePixelRatio || 1;
            const canvasLogicalWidth = 380;
            const outerRadius = 90;
            const innerRadius = 55;
            const chartCenterX = canvasLogicalWidth / 2;
            const chartTopPadding = 16;
            const chartCenterY = chartTopPadding + outerRadius;

            // Legend layout — single column for clarity
            const legendTopPadding = 20;
            const legendStartY = chartCenterY + outerRadius + legendTopPadding;
            const legendItemHeight = 20;
            const legendRows = labels.length;
            const legendHeight = legendRows * legendItemHeight;

            const canvasLogicalHeight = legendStartY + legendHeight + 12;

            const canvas = document.createElement('canvas');
            canvas.width = canvasLogicalWidth * devicePixelRatio;
            canvas.height = canvasLogicalHeight * devicePixelRatio;
            const ctx = canvas.getContext('2d');
            ctx.scale(devicePixelRatio, devicePixelRatio);

            // Transparent background
            ctx.clearRect(0, 0, canvasLogicalWidth, canvasLogicalHeight);

            // Draw doughnut segments
            let currentAngle = -Math.PI / 2;
            values.forEach((value, segmentIndex) => {
                const sliceAngle = (value / total) * 2 * Math.PI;
                ctx.beginPath();
                ctx.arc(chartCenterX, chartCenterY, outerRadius, currentAngle, currentAngle + sliceAngle);
                ctx.arc(chartCenterX, chartCenterY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
                ctx.closePath();
                ctx.fillStyle = chartColorPalette[segmentIndex % chartColorPalette.length];
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
                currentAngle += sliceAngle;
            });

            // Draw legend items (single column, left-aligned)
            ctx.textBaseline = 'middle';
            const legendLeftPadding = 24;

            labels.forEach((label, legendIndex) => {
                const itemY = legendStartY + legendIndex * legendItemHeight;
                const percentage = ((values[legendIndex] / total) * 100).toFixed(1);
                const segmentColor = chartColorPalette[legendIndex % chartColorPalette.length];

                // Colored circle
                ctx.beginPath();
                ctx.arc(legendLeftPadding + 6, itemY + 9, 6, 0, 2 * Math.PI);
                ctx.fillStyle = segmentColor;
                ctx.fill();

                // Label text
                ctx.fillStyle = '#333333';
                ctx.font = '12px Segoe UI, system-ui, sans-serif';
                ctx.fillText(`${label} (${percentage}%)`, legendLeftPadding + 18, itemY + 9);
            });

            return canvas.toDataURL('image/png');
        }

        let categoryChartDataUrl = '';
        let cardChartDataUrl = '';

        if (hasExpenses) {
            categoryChartDataUrl = renderDoughnutToDataUrl(
                Object.keys(expensesByCategory),
                Object.values(expensesByCategory)
            );
            cardChartDataUrl = renderDoughnutToDataUrl(
                Object.keys(expensesByCard),
                Object.values(expensesByCard)
            );
        }

        const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Relatório - App de Custos</title>
      <style>
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; padding: 20px; background: #fff; color: #1a1a2e; }
        .container { max-width: 850px; margin: 0 auto; background: white; padding: 24px; }
        .summary-cards { display: flex; gap: 16px; margin-bottom: 24px; }
        .card { border: 1px solid #e0e0e0; padding: 16px; border-radius: 8px; flex: 1; text-align: center; background: #fafafa; }
        .card h3 { margin: 0 0 8px 0; font-weight: 500; color: #666; font-size: 14px; }
        .card p { margin: 0; font-weight: 700; font-size: 22px; }
        .charts-section { display: flex; gap: 24px; margin: 28px 0; page-break-inside: avoid; }
        .chart-box { flex: 1; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; background: #fafafa; text-align: center; }
        .chart-box h3 { margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #333; }
        .chart-box img { width: 100%; height: auto; display: block; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
        th, td { border: 1px solid #e0e0e0; padding: 8px 10px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: 600; color: #444; }
        tr:nth-child(even) { background-color: #fafafa; }
        @media print {
          .no-print { display: none; }
          body { padding: 0; }
          .charts-section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body onload="window.print()">
      <div class="container">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
          <h1 style="margin:0; font-size: 24px; color: #1a1a2e;">Relatório: ${month.padStart(2, '0')}/${year}</h1>
          <button class="no-print" onclick="window.print()" style="padding:10px 20px; font-size:14px; cursor:pointer; border:1px solid #ccc; border-radius:6px; background:#f5f5f5;">🖨️ Imprimir / Salvar PDF</button>
        </div>

        <div class="summary-cards">
          <div class="card">
            <h3>Receitas</h3>
            <p style="color:#16a34a;">${formatCur(totalIncome)}</p>
          </div>
          <div class="card">
            <h3>Despesas</h3>
            <p style="color:#dc2626;">${formatCur(totalExpense)}</p>
          </div>
          <div class="card">
            <h3>Balanço</h3>
            <p style="color:${balance >= 0 ? '#16a34a' : '#dc2626'};">${formatCur(balance)}</p>
          </div>
        </div>

        ${hasExpenses ? `
        <div class="charts-section">
          <div class="chart-box">
            <h3>Despesas por Categoria</h3>
            <img src="${categoryChartDataUrl}" alt="Gráfico de despesas por categoria">
          </div>
          <div class="chart-box">
            <h3>Despesas por Cartão</h3>
            <img src="${cardChartDataUrl}" alt="Gráfico de despesas por cartão">
          </div>
        </div>
        ` : ''}

        <h2 style="font-size: 18px; color: #333; margin-top: 28px;">Transações</h2>
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

        <p style="margin-top:40px; font-size:11px; color:#aaa;"><i>Gerado automaticamente por App de Custos PWA</i></p>
      </div>
    </body>
    </html>
  `;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    });

    exportCsvBtn.addEventListener('click', () => {
        const transactions = getTransactions();
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
}
