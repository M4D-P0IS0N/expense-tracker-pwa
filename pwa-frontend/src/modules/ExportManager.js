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

        // Prepare chart data as JSON strings for embedding in the HTML
        const categoryLabelsJson = JSON.stringify(Object.keys(expensesByCategory));
        const categoryValuesJson = JSON.stringify(Object.values(expensesByCategory));
        const cardLabelsJson = JSON.stringify(Object.keys(expensesByCard));
        const cardValuesJson = JSON.stringify(Object.values(expensesByCard));

        const hasExpenses = totalExpense > 0;

        const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Relatório - App de Custos</title>
      <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"><\/script>
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
        .chart-box canvas { max-width: 280px; max-height: 280px; margin: 0 auto; display: block; }
        .chart-box img { max-width: 280px; max-height: 280px; margin: 0 auto; display: block; }
        .no-data-msg { color: #999; font-style: italic; padding: 40px 0; }
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
    <body>
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
            <canvas id="chartCategory" width="280" height="280"></canvas>
          </div>
          <div class="chart-box">
            <h3>Despesas por Cartão</h3>
            <canvas id="chartCard" width="280" height="280"></canvas>
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

      ${hasExpenses ? `
      <script>
        // Curated color palette for chart segments
        const chartColorPalette = [
          '#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6',
          '#8b5cf6', '#ec4899', '#14b8a6', '#ef4444', '#06b6d4',
          '#84cc16', '#a855f7', '#f97316', '#22d3ee', '#e11d48',
          '#059669', '#7c3aed', '#d946ef', '#0ea5e9', '#ca8a04'
        ];

        function assignColors(count) {
          return Array.from({ length: count }, (_, i) => chartColorPalette[i % chartColorPalette.length]);
        }

        const categoryLabels = ${categoryLabelsJson};
        const categoryValues = ${categoryValuesJson};
        const cardLabels = ${cardLabelsJson};
        const cardValues = ${cardValuesJson};

        const formatBRL = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

        function buildDoughnutChart(canvasId, labels, values) {
          const ctx = document.getElementById(canvasId);
          if (!ctx || labels.length === 0) return null;

          const colors = assignColors(labels.length);

          return new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: labels,
              datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverOffset: 6
              }]
            },
            options: {
              responsive: false,
              animation: { duration: 0 },
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    font: { size: 11 },
                    padding: 10,
                    usePointStyle: true,
                    pointStyleWidth: 10,
                    generateLabels: function(chart) {
                      const dataset = chart.data.datasets[0];
                      const total = dataset.data.reduce((sum, v) => sum + v, 0);
                      return chart.data.labels.map((label, i) => {
                        const value = dataset.data[i];
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                        return {
                          text: label + ' (' + percentage + '%)',
                          fillStyle: dataset.backgroundColor[i],
                          strokeStyle: '#fff',
                          lineWidth: 1,
                          index: i
                        };
                      });
                    }
                  }
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return context.label + ': ' + formatBRL(context.parsed);
                    }
                  }
                }
              }
            }
          });
        }

        // Render charts, then convert canvases to static images for reliable PDF printing
        function renderAndFreeze() {
          const chartCat = buildDoughnutChart('chartCategory', categoryLabels, categoryValues);
          const chartCrd = buildDoughnutChart('chartCard', cardLabels, cardValues);

          // Small delay to ensure Chart.js finishes rendering the canvas pixels
          setTimeout(() => {
            ['chartCategory', 'chartCard'].forEach(id => {
              const canvas = document.getElementById(id);
              if (!canvas) return;
              try {
                const imageDataUrl = canvas.toDataURL('image/png');
                const img = document.createElement('img');
                img.src = imageDataUrl;
                img.style.maxWidth = '280px';
                img.style.maxHeight = '280px';
                img.style.display = 'block';
                img.style.margin = '0 auto';
                canvas.parentNode.replaceChild(img, canvas);
              } catch (err) {
                console.warn('Could not freeze chart ' + id + ' to image:', err);
              }
            });

            // Trigger print after charts are frozen as images
            window.print();
          }, 600);
        }

        window.addEventListener('load', renderAndFreeze);
      <\/script>
      ` : `
      <script>
        window.addEventListener('load', () => window.print());
      <\/script>
      `}
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
