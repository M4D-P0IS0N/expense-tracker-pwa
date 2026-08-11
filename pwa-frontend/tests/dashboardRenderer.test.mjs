import { describe, it } from "node:test";
import assert from "node:assert";
import { normalizeCategory } from "../src/utils/categoryUtils.js";

describe("Dashboard Renderer Category Grouping", () => {
  it("should group expenses with different emojis under fixed category name", () => {
    const expenses = [
      { category: "Comida 🍔", amount: 50, type: "Expense" },
      { category: "🍕 Comida", amount: 100, type: "Expense" },
      { category: "Comida", amount: 30, type: "Expense" },
      { category: "Carro 🚗", amount: 200, type: "Expense" },
      { category: "🆙 Bem estar/Casa", amount: 80, type: "Expense" },
    ];

    const categoryTotals = {};
    const categoryMeta = {};

    expenses.forEach((transaction) => {
      const norm = normalizeCategory(transaction.category);
      const key = norm.name;
      categoryTotals[key] = (categoryTotals[key] || 0) + transaction.amount;
      if (!categoryMeta[key]) {
        categoryMeta[key] = norm;
      }
    });

    assert.strictEqual(categoryTotals["Comida"], 180);
    assert.strictEqual(categoryMeta["Comida"].emoji, "🍕");

    assert.strictEqual(categoryTotals["Carro"], 200);
    assert.strictEqual(categoryMeta["Carro"].emoji, "🚗");

    assert.strictEqual(categoryTotals["Bem estar/Casa"], 80);
    assert.strictEqual(categoryMeta["Bem estar/Casa"].emoji, "🆙");
  });
});
