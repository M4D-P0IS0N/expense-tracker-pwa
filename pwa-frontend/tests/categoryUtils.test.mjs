import { describe, it } from "node:test";
import assert from "node:assert";
import { normalizeCategory, FIXED_CATEGORY_EMOJIS } from "../src/utils/categoryUtils.js";

describe("Category Utils Normalization", () => {
  it("should map legacy categories with different emojis to fixed emoji", () => {
    const res1 = normalizeCategory("Comida 🍔");
    assert.strictEqual(res1.name, "Comida");
    assert.strictEqual(res1.emoji, "🍕");
    assert.strictEqual(res1.full, "🍕 Comida");

    const res2 = normalizeCategory("🍕 Comida");
    assert.strictEqual(res2.name, "Comida");
    assert.strictEqual(res2.emoji, "🍕");
    assert.strictEqual(res2.full, "🍕 Comida");

    const res3 = normalizeCategory("Comida");
    assert.strictEqual(res3.name, "Comida");
    assert.strictEqual(res3.emoji, "🍕");
    assert.strictEqual(res3.full, "🍕 Comida");
  });

  it("should correctly handle 'Bem estar/Casa' with 🆙 symbol and leading emojis", () => {
    const inputs = [
      "Bem estar/Casa",
      "🆙 Bem estar/Casa",
      "Bem estar/Casa 🆙",
      "🏷️ 🆙 Bem estar/Casa",
      "🏷️ Bem estar/Casa"
    ];

    inputs.forEach(input => {
      const res = normalizeCategory(input);
      assert.strictEqual(res.name, "Bem estar/Casa");
      assert.strictEqual(res.emoji, "🆙");
      assert.strictEqual(res.full, "🆙 Bem estar/Casa");
    });
  });

  it("should normalize all 15 fixed categories correctly", () => {
    const testCases = [
      { input: "Aleatoriedades", expectedEmoji: "🪤" },
      { input: "Bem estar/Casa", expectedEmoji: "🆙" },
      { input: "Carro", expectedEmoji: "🚗" },
      { input: "Comida", expectedEmoji: "🍕" },
      { input: "Contas de casa", expectedEmoji: "🏠" },
      { input: "Eletrônicos", expectedEmoji: "💻" },
      { input: "Emergência", expectedEmoji: "🚨" },
      { input: "Estudos", expectedEmoji: "📝" },
      { input: "Farmácia", expectedEmoji: "💊" },
      { input: "Mercado", expectedEmoji: "🛒" },
      { input: "Médico", expectedEmoji: "🩺" },
      { input: "Peçanha", expectedEmoji: "🐶" },
      { input: "Presente", expectedEmoji: "🎁" },
      { input: "Salário", expectedEmoji: "💰" },
      { input: "Streaming", expectedEmoji: "🎞️" },
    ];

    testCases.forEach(({ input, expectedEmoji }) => {
      const res = normalizeCategory(input);
      assert.strictEqual(res.name, input);
      assert.strictEqual(res.emoji, expectedEmoji);
      assert.strictEqual(res.full, `${expectedEmoji} ${input}`);
    });
  });

  it("should map English/legacy aliases correctly", () => {
    assert.strictEqual(normalizeCategory("Food").name, "Comida");
    assert.strictEqual(normalizeCategory("Salary").name, "Salário");
    assert.strictEqual(normalizeCategory("Home").name, "Contas de casa");
    assert.strictEqual(normalizeCategory("Transport").name, "Carro");
    assert.strictEqual(normalizeCategory("General").name, "Geral");
  });

  it("should preserve custom emoji for unknown category", () => {
    const res = normalizeCategory("Viagem ✈️");
    assert.strictEqual(res.name, "Viagem");
    assert.strictEqual(res.emoji, "✈️");
    assert.strictEqual(res.full, "✈️ Viagem");
  });
});
