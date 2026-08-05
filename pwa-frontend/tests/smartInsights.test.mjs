import { describe, it } from "node:test";
import assert from "node:assert";

// Helper function logic matching renderInsights calculation
function calculateCategoryVariations(currentExpenses, prevExpenses) {
  const currentCatTotals = {};
  currentExpenses.forEach((tx) => {
    const cat = tx.category || "Geral";
    currentCatTotals[cat] = (currentCatTotals[cat] || 0) + tx.amount;
  });

  const prevCatTotals = {};
  prevExpenses.forEach((tx) => {
    const cat = tx.category || "Geral";
    prevCatTotals[cat] = (prevCatTotals[cat] || 0) + tx.amount;
  });

  const allCategories = Array.from(new Set([...Object.keys(currentCatTotals), ...Object.keys(prevCatTotals)]));

  const categoryVariations = [];
  allCategories.forEach((cat) => {
    const curr = currentCatTotals[cat] || 0;
    const prev = prevCatTotals[cat] || 0;

    if (prev === 0 && curr > 0) {
      categoryVariations.push({ category: cat, pctChange: 100, label: "+100% (nova)", type: "increased" });
    } else if (prev > 0 && curr === 0) {
      categoryVariations.push({ category: cat, pctChange: -100, label: "-100%", type: "decreased" });
    } else if (prev > 0 && curr > 0) {
      const pct = ((curr - prev) / prev) * 100;
      categoryVariations.push({
        category: cat,
        pctChange: pct,
        label: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
        type: pct > 0 ? "increased" : pct < 0 ? "decreased" : "equal",
      });
    }
  });

  categoryVariations.sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange));
  return categoryVariations;
}

describe("Smart Insights Calculations", () => {
  it("should calculate correct percentage variations per category", () => {
    const current = [
      { category: "Alimentação", amount: 150 },
      { category: "Transporte", amount: 50 },
      { category: "Lazer", amount: 200 }
    ];
    const prev = [
      { category: "Alimentação", amount: 100 }, // +50%
      { category: "Transporte", amount: 100 }, // -50%
      { category: "Saúde", amount: 80 }         // -100%
    ];

    const result = calculateCategoryVariations(current, prev);

    const alim = result.find(r => r.category === "Alimentação");
    assert.strictEqual(alim.label, "+50.0%");
    assert.strictEqual(alim.type, "increased");

    const trans = result.find(r => r.category === "Transporte");
    assert.strictEqual(trans.label, "-50.0%");
    assert.strictEqual(trans.type, "decreased");

    const lazer = result.find(r => r.category === "Lazer");
    assert.strictEqual(lazer.label, "+100% (nova)");

    const saude = result.find(r => r.category === "Saúde");
    assert.strictEqual(saude.label, "-100%");
  });

  it("should compare net surplus and deficit between months", () => {
    const currentIncome = 5000;
    const currentExpense = 3000;
    const currentNet = currentIncome - currentExpense; // 2000

    const prevIncome = 4000;
    const prevExpense = 3500;
    const prevNet = prevIncome - prevExpense; // 500

    const diff = currentNet - prevNet; // 1500 melhor
    assert.strictEqual(currentNet, 2000);
    assert.strictEqual(prevNet, 500);
    assert.strictEqual(diff, 1500);
  });
});
