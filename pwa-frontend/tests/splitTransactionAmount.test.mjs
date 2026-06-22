import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  getEffectiveTransactionAmount, 
  shouldApplySplitByTwo, 
  shouldIgnoreThirdParty 
} from '../src/utils/splitTransactionAmount.js';

test('should halve marked expenses only when split-by-two view is enabled and date is June 2026 or later', () => {
  const sharedExpenseTransaction = {
    amount: 100,
    type: 'Expense',
    is_split_by_2: true,
    date: '2026-06-15T12:00:00.000Z',
  };

  assert.equal(getEffectiveTransactionAmount(sharedExpenseTransaction, false), 100);
  assert.equal(getEffectiveTransactionAmount(sharedExpenseTransaction, true), 50);
  assert.equal(shouldApplySplitByTwo(sharedExpenseTransaction, true), true);
});

test('should not halve expenses with date before June 2026', () => {
  const pastExpenseTransaction = {
    amount: 100,
    type: 'Expense',
    is_split_by_2: true,
    date: '2026-05-31T23:59:59.000Z',
  };

  assert.equal(getEffectiveTransactionAmount(pastExpenseTransaction, false), 100);
  assert.equal(getEffectiveTransactionAmount(pastExpenseTransaction, true), 100);
  assert.equal(shouldApplySplitByTwo(pastExpenseTransaction, true), false);
});

test('should not halve expenses with missing date', () => {
  const datelessExpenseTransaction = {
    amount: 100,
    type: 'Expense',
    is_split_by_2: true,
  };

  assert.equal(getEffectiveTransactionAmount(datelessExpenseTransaction, true), 100);
  assert.equal(shouldApplySplitByTwo(datelessExpenseTransaction, true), false);
});

test('should keep income and unmarked expenses unchanged', () => {
  assert.equal(getEffectiveTransactionAmount({ amount: 100, type: 'Income', is_split_by_2: true, date: '2026-06-15' }, true), 100);
  assert.equal(getEffectiveTransactionAmount({ amount: 100, type: 'Expense', is_split_by_2: false, date: '2026-06-15' }, true), 100);
});

test('should ignore third party expense (return 0) when split-by-two view is enabled and date is June 2026 or later', () => {
  const thirdPartyExpenseTransaction = {
    amount: 100,
    type: 'Expense',
    is_third_party: true,
    date: '2026-06-15T12:00:00.000Z',
  };

  // Quando visualização de divisão estiver desativada: valor cheio (100)
  assert.equal(getEffectiveTransactionAmount(thirdPartyExpenseTransaction, false), 100);
  assert.equal(shouldIgnoreThirdParty(thirdPartyExpenseTransaction, false), false);

  // Quando visualização de divisão estiver ativa: valor zero (0)
  assert.equal(getEffectiveTransactionAmount(thirdPartyExpenseTransaction, true), 0);
  assert.equal(shouldIgnoreThirdParty(thirdPartyExpenseTransaction, true), true);
});

test('should not ignore third party expense if date is before June 2026', () => {
  const pastThirdPartyExpense = {
    amount: 100,
    type: 'Expense',
    is_third_party: true,
    date: '2026-05-31T23:59:59.000Z',
  };

  assert.equal(getEffectiveTransactionAmount(pastThirdPartyExpense, true), 100);
  assert.equal(shouldIgnoreThirdParty(pastThirdPartyExpense, true), false);
});
