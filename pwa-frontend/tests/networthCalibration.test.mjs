import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBrazilianCurrency } from '../src/utils/currencyParser.js';

test('Net Worth Calibration Calculation Logic', async (t) => {
  await t.test('should calculate correct new base when adjusting positive balance', () => {
    const currentNetWorth = 1500;
    const currentBase = 500;
    const sumOfTransactions = currentNetWorth - currentBase; // 1000

    const targetInputStr = '2.500,50';
    const targetNetWorth = parseBrazilianCurrency(targetInputStr); // 2500.50

    const newBase = targetNetWorth - sumOfTransactions; // 2500.50 - 1000 = 1500.50
    assert.equal(newBase, 1500.50);

    // Verify recalculated net worth matches target
    const recalculatedNetWorth = newBase + sumOfTransactions;
    assert.equal(recalculatedNetWorth, 2500.50);
  });

  await t.test('should calculate correct new base when adjusting negative balance', () => {
    const currentNetWorth = -300;
    const currentBase = 0;
    const sumOfTransactions = currentNetWorth - currentBase; // -300

    const targetInputStr = '500,00';
    const targetNetWorth = parseBrazilianCurrency(targetInputStr); // 500

    const newBase = targetNetWorth - sumOfTransactions; // 500 - (-300) = 800
    assert.equal(newBase, 800);

    const recalculatedNetWorth = newBase + sumOfTransactions;
    assert.equal(recalculatedNetWorth, 500);
  });

  await t.test('should correctly parse diverse Brazilian currency formats', () => {
    assert.equal(parseBrazilianCurrency('1250,50'), 1250.50);
    assert.equal(parseBrazilianCurrency('1.250,50'), 1250.50);
    assert.equal(parseBrazilianCurrency('-150,00'), -150.00);
    assert.equal(parseBrazilianCurrency('0'), 0);
  });
});
