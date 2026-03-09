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
