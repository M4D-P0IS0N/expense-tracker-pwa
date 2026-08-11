// --- Export & Backup Manager ---
// Handles CSV, PDF, JSON Export, Retrospective Report, and Full Backup Restoration.

import { exportRetrospectivePdfReport } from "./RetrospectivePdfGenerator.js";
import { getEffectiveTransactionAmount, shouldApplySplitByTwo, shouldIgnoreThirdParty } from "../utils/splitTransactionAmount.js";
import { normalizeCategory } from "../utils/categoryUtils.js";

export function initExportManager(options) {
    const {
        exportPdfBtn,
        exportCsvBtn,
        exportJsonBtn,
        exportRetrospectiveBtn,
        exportFullCsvBtn,
        importBackupBtn,
        importFileInput,
        getTransactions,
        TransactionService,
        gamificationService,
        updateAvatarUI,
        supabase,
        showNotification,
        reloadData,
        getIsSplitByTwoEnabled,
        isSplitByTwoEnabled
    } = options;

    const notifyExportSuccess = () => {
        if (gamificationService && typeof gamificationService.onDataExported === "function") {
            gamificationService.onDataExported();
        }
        if (updateAvatarUI && typeof updateAvatarUI === "function") {
            updateAvatarUI();
        }
    };

    if (exportRetrospectiveBtn) {
        exportRetrospectiveBtn.addEventListener("click", () => {
            const isSplitByTwo = typeof getIsSplitByTwoEnabled === "function" ? getIsSplitByTwoEnabled() : Boolean(isSplitByTwoEnabled);
            exportRetrospectivePdfReport({ TransactionService, getTransactions, showNotification, isSplitByTwoEnabled: isSplitByTwo });
            notifyExportSuccess();
        });
    }

    if (exportPdfBtn) {
        exportPdfBtn.addEventListener("click", () => {
            const transactions = getTransactions ? getTransactions() : [];
            if (!transactions || transactions.length === 0) {
                if (showNotification) showNotification("Nenhuma transação carregada para exportar.", "warning");
                else alert("Nenhuma transação carregada para exportar.");
                return;
            }

            const isSplitByTwo = typeof getIsSplitByTwoEnabled === "function" ? getIsSplitByTwoEnabled() : Boolean(isSplitByTwoEnabled);

            const month = document.getElementById("filter-month") ? document.getElementById("filter-month").value : "01";
            const year = document.getElementById("filter-year") ? document.getElementById("filter-year").value : new Date().getFullYear();

            let totalIncome = 0;
            let totalExpense = 0;

            const expensesByCategory = {};
            const expensesByCard = {};

            const rowsHtml = transactions.map(t => {
                const effectiveAmount = getEffectiveTransactionAmount(t, isSplitByTwo);
                const isHalved = shouldApplySplitByTwo(t, isSplitByTwo);
                const isIgnoredThirdParty = shouldIgnoreThirdParty(t, isSplitByTwo);

                if (t.type === "Income") {
                    totalIncome += effectiveAmount;
                } else if (t.type === "Expense") {
                    totalExpense += effectiveAmount;

                    const categoryName = normalizeCategory(t.category).full;
                    expensesByCategory[categoryName] = (expensesByCategory[categoryName] || 0) + effectiveAmount;

                    const cardName = t.credit_card_name || "Sem Cartão";
                    expensesByCard[cardName] = (expensesByCard[cardName] || 0) + effectiveAmount;
                }

                const isIncome = t.type === "Income";
                const color = isIncome ? "green" : (isIgnoredThirdParty ? "#64748b" : "red");

                const dateObj = new Date(t.date);
                dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
                const dateStr = dateObj.toLocaleDateString("pt-BR");

                const detailsList = [];
                if (t.total_installments > 1) detailsList.push("Parc: " + t.installment_number + "/" + t.total_installments);
                if (t.credit_card_name) detailsList.push("Cartão: " + t.credit_card_name);
                
                if (isHalved) {
                    const origStr = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(t.amount);
                    detailsList.push(`½ Div. por 2 (Orig: ${origStr})`);
                }

                if (isIgnoredThirdParty) {
                    const origStr = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(t.amount);
                    detailsList.push(`👤 Terceiro desconsiderado (Orig: ${origStr})`);
                } else if (t.is_third_party) {
                    detailsList.push("👤 Terceiros");
                }

                const amountStr = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(effectiveAmount);
                const textStyle = isIgnoredThirdParty ? "text-decoration: line-through; color: #64748b;" : "";

                return '<tr style="' + (isIgnoredThirdParty ? 'opacity: 0.65; background-color: #f8fafc;' : '') + '">' +
          '<td>' + dateStr + '</td>' +
          '<td style="color:' + color + '; font-weight:bold;' + textStyle + '">' + (isIncome ? "Receita" : "Despesa") + '</td>' +
          '<td style="' + textStyle + '">' + (t.description || "") + '</td>' +
          '<td style="' + textStyle + '">' + normalizeCategory(t.category).full + '</td>' +
          '<td style="color:' + color + '; font-weight:bold;' + textStyle + '">' + amountStr + '</td>' +
          '<td>' + detailsList.join(" | ") + '</td>' +
        '</tr>';
            }).join("");

            const balance = totalIncome - totalExpense;
            const hasExpenses = totalExpense > 0;
            const formatCur = (val) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

            function renderDoughnutToDataUrl(labels, values) {
                const canvas = document.createElement("canvas");
                const legendItemHeight = 20;
                const legendHeaderPadding = 16;
                const legendHeight = labels.length * legendItemHeight + legendHeaderPadding;

                const chartDiameter = 180;
                const canvasWidth = 400;
                const canvasHeight = chartDiameter + legendHeight;

                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                const ctx = canvas.getContext("2d");

                const chartCenterX = canvasWidth / 2;
                const chartCenterY = chartDiameter / 2 + 10;
                const outerRadius = chartDiameter / 2 - 10;
                const innerRadius = outerRadius * 0.55;

                const total = values.reduce((sum, val) => sum + val, 0);

                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);

                if (total <= 0) return canvas.toDataURL("image/png");

                const chartColorPalette = [
                    "#6366f1", "#ec4899", "#8b5cf6", "#10b981", "#f59e0b",
                    "#3b82f6", "#ef4444", "#14b8a6", "#84cc16", "#a855f7"
                ];

                let currentAngle = -0.5 * Math.PI;

                values.forEach((val, segmentIndex) => {
                    const sliceAngle = (val / total) * 2 * Math.PI;
                    ctx.beginPath();
                    ctx.arc(chartCenterX, chartCenterY, outerRadius, currentAngle, currentAngle + sliceAngle);
                    ctx.arc(chartCenterX, chartCenterY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
                    ctx.closePath();
                    ctx.fillStyle = chartColorPalette[segmentIndex % chartColorPalette.length];
                    ctx.fill();
                    ctx.strokeStyle = "#ffffff";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    currentAngle += sliceAngle;
                });

                ctx.textBaseline = "middle";
                const legendLeftPadding = 24;
                const legendStartY = chartDiameter + legendHeaderPadding;

                labels.forEach((label, legendIndex) => {
                    const itemY = legendStartY + legendIndex * legendItemHeight;
                    const percentage = ((values[legendIndex] / total) * 100).toFixed(1);
                    const segmentColor = chartColorPalette[legendIndex % chartColorPalette.length];

                    ctx.beginPath();
                    ctx.arc(legendLeftPadding + 6, itemY + 9, 6, 0, 2 * Math.PI);
                    ctx.fillStyle = segmentColor;
                    ctx.fill();

                    const formattedValue = formatCur(values[legendIndex]);
                    ctx.fillStyle = "#333333";
                    ctx.font = "12px Segoe UI, system-ui, sans-serif";
                    ctx.fillText(label + " (" + percentage + "%) - " + formattedValue, legendLeftPadding + 18, itemY + 9);
                });

                return canvas.toDataURL("image/png");
            }

            let categoryChartDataUrl = "";
            let cardChartDataUrl = "";

            function sortedEntriesDescending(dataObject) {
                const sortedPairs = Object.entries(dataObject).sort((a, b) => b[1] - a[1]);
                return { labels: sortedPairs.map(p => p[0]), values: sortedPairs.map(p => p[1]) };
            }

            if (hasExpenses) {
                const sortedCategoryData = sortedEntriesDescending(expensesByCategory);
                categoryChartDataUrl = renderDoughnutToDataUrl(
                    sortedCategoryData.labels,
                    sortedCategoryData.values
                );

                delete expensesByCard["Sem Cartão"];

                if (Object.keys(expensesByCard).length > 0) {
                    const sortedCardData = sortedEntriesDescending(expensesByCard);
                    cardChartDataUrl = renderDoughnutToDataUrl(
                        sortedCardData.labels,
                        sortedCardData.values
                    );
                }
            }

            const hasCardChartData = cardChartDataUrl !== "";

            const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório - App de Custos</title>' +
      '<style>body { font-family: "Segoe UI", system-ui, sans-serif; padding: 20px; color: #1a1a2e; } .container { max-width: 850px; margin: 0 auto; padding: 24px; } .summary-cards { display: flex; gap: 16px; margin-bottom: 24px; } .card { border: 1px solid #e0e0e0; padding: 16px; border-radius: 8px; flex: 1; text-align: center; background: #fafafa; } .card h3 { margin: 0 0 8px 0; color: #666; font-size: 14px; } .card p { margin: 0; font-weight: 700; font-size: 22px; } .charts-section { display: flex; gap: 24px; margin: 28px 0; page-break-inside: avoid; } .chart-box { flex: 1; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; background: #fafafa; text-align: center; } .chart-box h3 { margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #333; } .chart-box img { width: 100%; height: auto; display: block; margin: 0 auto; } table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; } th, td { border: 1px solid #e0e0e0; padding: 8px 10px; text-align: left; } th { background-color: #f5f5f5; font-weight: 600; color: #444; } tr:nth-child(even) { background-color: #fafafa; } @media print { .no-print { display: none; } body { padding: 0; } } </style></head><body onload="window.print()"><div class="container">' +
      '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;"><h1 style="margin:0; font-size: 24px; color: #1a1a2e;">Relatório: ' + String(month).padStart(2, "0") + '/' + year + '</h1><button class="no-print" onclick="window.print()" style="padding:10px 20px; font-size:14px; cursor:pointer; border:1px solid #ccc; border-radius:6px; background:#f5f5f5;">🖨️ Imprimir / Salvar PDF</button></div>' +
      '<div class="summary-cards"><div class="card"><h3>Receitas</h3><p style="color:#16a34a;">' + formatCur(totalIncome) + '</p></div><div class="card"><h3>Despesas</h3><p style="color:#dc2626;">' + formatCur(totalExpense) + '</p></div><div class="card"><h3>Balanço</h3><p style="color:' + (balance >= 0 ? "#16a34a" : "#dc2626") + ';">' + formatCur(balance) + '</p></div></div>' +
      (hasExpenses ? ('<div class="charts-section"><div class="chart-box"><h3>Despesas por Categoria</h3><img src="' + categoryChartDataUrl + '" alt="Gráfico de despesas por categoria"></div>' + (hasCardChartData ? ('<div class="chart-box"><h3>Despesas por Cartão</h3><img src="' + cardChartDataUrl + '" alt="Gráfico de despesas por cartão"></div>') : "") + '</div>') : "") +
      '<h2 style="font-size: 18px; color: #333; margin-top: 28px;">Transações</h2><table><thead><tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Detalhes</th></tr></thead><tbody>' + rowsHtml + '</tbody></table><p style="margin-top:40px; font-size:11px; color:#aaa;"><i>Gerado automaticamente por App de Custos PWA</i></p></div></body></html>';

            const blob = new Blob([html], { type: "text/html;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
            notifyExportSuccess();
        });
    }

    if (exportCsvBtn) {
        exportCsvBtn.addEventListener("click", () => {
            const transactions = getTransactions ? getTransactions() : [];
            if (!transactions || transactions.length === 0) {
                if (showNotification) showNotification("Nenhuma transação carregada para exportar.", "warning");
                else alert("Nenhuma transação carregada para exportar.");
                return;
            }

            const headers = ["Data", "Tipo", "Categoria", "Descrição", "Valor (R$)", "Cartão", "Parcelas"];
            const rows = transactions.map(t => [
                t.date,
                t.type,
                t.category || "",
                t.description || "",
                t.amount,
                t.credit_card_name || "",
                t.total_installments > 1 ? (t.installment_number + "/" + t.total_installments) : "1/1"
            ]);

            const csvContent = [
                headers.join(","),
                ...rows.map(r => r.map(field => '"' + String(field).replace(/"/g, '""') + '"').join(","))
            ].join("\n");

            const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", "extrato_app_custos_" + (new Date()).toISOString().slice(0, 10) + ".csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            notifyExportSuccess();
        });
    }

    if (exportJsonBtn) {
        exportJsonBtn.addEventListener("click", async () => {
            await exportFullJsonBackup({ TransactionService, supabase, showNotification });
            notifyExportSuccess();
        });
    }

    if (exportFullCsvBtn) {
        exportFullCsvBtn.addEventListener("click", async () => {
            await exportFullCsv({ TransactionService, showNotification });
            notifyExportSuccess();
        });
    }

    if (importBackupBtn && importFileInput) {
        importBackupBtn.addEventListener("click", () => {
            importFileInput.value = "";
            importFileInput.click();
        });

        importFileInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (file) {
                const confirmed = confirm("Deseja restaurar o backup? Os dados importados serão vinculados à sua conta atual.");
                if (confirmed) {
                    await importBackup(file, { TransactionService, supabase, showNotification, reloadData });
                }
            }
        });
    }
}

export async function exportFullJsonBackup({ TransactionService, supabase, showNotification }) {
    try {
        if (!TransactionService) throw new Error("TransactionService não configurado.");
        const transactions = await TransactionService.getAllTransactions();

        let userProfile = null;
        let savingsGoals = [];
        let achievements = [];

        if (supabase) {
            const sessionRes = await supabase.auth.getSession();
            const userId = sessionRes?.data?.session?.user?.id;

            if (userId) {
                const { data: prof } = await supabase.from("user_profiles").select("*").eq("id", userId).single();
                if (prof) userProfile = prof;

                const { data: sg } = await supabase.from("savings_goals").select("*").eq("user_id", userId);
                if (sg) savingsGoals = sg;

                const { data: ach } = await supabase.from("achievements").select("*").eq("user_id", userId);
                if (ach) achievements = ach;
            }
        }

        const localStorageData = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key.startsWith("@appdecustos") ||
                key.includes("onboarding") ||
                key.includes("patrimonio") ||
                key.includes("baseNetWorth") ||
                key.includes("userDisplayName") ||
                key.includes("splitByTwoEnabled")
            )) {
                localStorageData[key] = localStorage.getItem(key);
            }
        }

        const backupPayload = {
            version: "1.0",
            exportedAt: new Date().toISOString(),
            appName: "App de Custos PWA",
            data: {
                transactions,
                userProfile,
                savingsGoals,
                achievements,
                localStorageData
            }
        };

        const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const dateStr = new Date().toISOString().split("T")[0];
        a.href = url;
        a.download = "backup_app_custos_" + dateStr + ".json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (showNotification) showNotification("Backup completo exportado com sucesso (JSON)!", "success");
    } catch (err) {
        console.error("Erro ao exportar backup JSON:", err);
        if (showNotification) showNotification("Erro ao exportar backup JSON.", "error");
    }
}

export async function exportFullCsv({ TransactionService, showNotification }) {
    try {
        if (!TransactionService) throw new Error("TransactionService não configurado.");
        const transactions = await TransactionService.getAllTransactions();
        if (!transactions || transactions.length === 0) {
            if (showNotification) showNotification("Nenhuma transação encontrada para exportar.", "warning");
            return;
        }

        const headers = ["ID", "Data", "Tipo", "Categoria", "Descrição", "Valor (R$)", "Cartão", "Parcela", "Total Parcelas", "Recorrente", "DivididoPor2", "Terceiro", "GrupoID"];
        const rows = transactions.map(t => [
            t.id || "",
            t.date || "",
            t.type || "",
            t.category || "",
            t.description || "",
            t.amount || 0,
            t.credit_card_name || "",
            t.installment_number || 1,
            t.total_installments || 1,
            t.is_recurring ? "Sim" : "Não",
            t.is_split_by_2 ? "Sim" : "Não",
            t.is_third_party ? "Sim" : "Não",
            t.installment_group_id || ""
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.map(field => '"' + String(field).replace(/"/g, '""') + '"').join(","))
        ].join("\n");

        const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const dateStr = new Date().toISOString().split("T")[0];
        link.setAttribute("href", url);
        link.setAttribute("download", "extrato_completo_app_custos_" + dateStr + ".csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        if (showNotification) showNotification("CSV completo de todo o histórico exportado!", "success");
    } catch (err) {
        console.error("Erro ao exportar CSV completo:", err);
        if (showNotification) showNotification("Erro ao exportar CSV completo.", "error");
    }
}

export async function importBackup(file, { TransactionService, supabase, showNotification, reloadData }) {
    if (!file) return;

    try {
        const text = await file.text();
        let backupObj;
        try {
            backupObj = JSON.parse(text);
        } catch (e) {
            throw new Error("Arquivo inválido. Deve ser um arquivo JSON formatado.");
        }

        if (!backupObj || !backupObj.data) {
            throw new Error("Formato de backup não reconhecido.");
        }

        const { transactions, userProfile, savingsGoals, achievements, localStorageData } = backupObj.data;

        let userId = null;
        if (supabase) {
            const sessionRes = await supabase.auth.getSession();
            userId = sessionRes?.data?.session?.user?.id;
        }

        let restoredTxCount = 0;

        if (Array.isArray(transactions) && transactions.length > 0 && TransactionService) {
            restoredTxCount = await TransactionService.bulkUpsertTransactions(transactions);
        }

        if (userProfile && userId && supabase) {
            const profileToUpsert = { ...userProfile, id: userId, last_sync: new Date().toISOString() };
            await supabase.from("user_profiles").upsert(profileToUpsert, { onConflict: "id" });
        }

        if (Array.isArray(savingsGoals) && savingsGoals.length > 0 && userId && supabase) {
            const goalsToUpsert = savingsGoals.map(g => ({ ...g, user_id: userId }));
            await supabase.from("savings_goals").upsert(goalsToUpsert, { onConflict: "id" });
        }

        if (Array.isArray(achievements) && achievements.length > 0 && userId && supabase) {
            const achToUpsert = achievements.map(a => ({ ...a, user_id: userId }));
            await supabase.from("achievements").upsert(achToUpsert, { onConflict: "id" });
        }

        if (localStorageData && typeof localStorageData === "object") {
            Object.keys(localStorageData).forEach(key => {
                if (localStorageData[key] !== null && localStorageData[key] !== undefined) {
                    localStorage.setItem(key, localStorageData[key]);
                }
            });
        }

        if (showNotification) showNotification("Backup restaurado com sucesso! " + restoredTxCount + " transações importadas.", "success");

        if (reloadData && typeof reloadData === "function") {
            await reloadData();
        }
    } catch (err) {
        console.error("Erro ao importar backup:", err);
        if (showNotification) showNotification("Erro na restauração: " + err.message, "error");
    }
}
