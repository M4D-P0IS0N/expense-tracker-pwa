import test from 'node:test';
import assert from 'node:assert/strict';
import { getEffectiveTransactionAmount, shouldApplySplitByTwo, shouldIgnoreThirdParty } from '../src/utils/splitTransactionAmount.js';

test('PDF Export calculation logic: split-by-two and third party expenses', () => {
  const transactions = [
    {
      id: '1',
      description: 'Salário',
      type: 'Income',
      amount: 5000,
      date: '2026-06-10'
    },
    {
      id: '2',
      description: 'Supermercado Compartilhado',
      type: 'Expense',
      amount: 400,
      is_split_by_2: true,
      date: '2026-06-12'
    },
    {
      id: '3',
      description: 'Conta do Amigo',
      type: 'Expense',
      amount: 150,
      is_third_party: true,
      date: '2026-06-15'
    },
    {
      id: '4',
      description: 'Aluguel Pessoal',
      type: 'Expense',
      amount: 1000,
      date: '2026-06-05'
    }
  ];

  const isSplitByTwoEnabled = true;

  let totalIncome = 0;
  let totalExpense = 0;

  const processedRows = transactions.map(t => {
    const effectiveAmount = getEffectiveTransactionAmount(t, isSplitByTwoEnabled);
    const isHalved = shouldApplySplitByTwo(t, isSplitByTwoEnabled);
    const isIgnoredThirdParty = shouldIgnoreThirdParty(t, isSplitByTwoEnabled);

    if (t.type === 'Income') {
      totalIncome += effectiveAmount;
    } else if (t.type === 'Expense') {
      totalExpense += effectiveAmount;
    }

    return {
      description: t.description,
      effectiveAmount,
      isHalved,
      isIgnoredThirdParty
    };
  });

  // Salário: 5000
  assert.equal(processedRows[0].effectiveAmount, 5000);
  assert.equal(processedRows[0].isHalved, false);
  assert.equal(processedRows[0].isIgnoredThirdParty, false);

  // Supermercado: 400 / 2 = 200
  assert.equal(processedRows[1].effectiveAmount, 200);
  assert.equal(processedRows[1].isHalved, true);

  // Conta de Terceiro: 150 -> 0 (Ignorado no balanço do usuário)
  assert.equal(processedRows[2].effectiveAmount, 0);
  assert.equal(processedRows[2].isIgnoredThirdParty, true);

  // Aluguel Pessoal: 1000
  assert.equal(processedRows[3].effectiveAmount, 1000);

  // Totais:
  // Total Receita = 5000
  // Total Despesa = 200 + 0 + 1000 = 1200 (em vez dos 1550 não divididos)
  assert.equal(totalIncome, 5000);
  assert.equal(totalExpense, 1200);
  assert.equal(totalIncome - totalExpense, 3800);
});
