import test from 'node:test';
import assert from 'node:assert/strict';

import {
    buildPropagationPayload,
    isGroupedTransaction,
    shouldPropagateToTransaction
} from '../src/utils/transactionPropagation.js';

test('isGroupedTransaction should correctly identify grouped transactions', () => {
    assert.equal(isGroupedTransaction(null), false);
    assert.equal(isGroupedTransaction({ id: 'tx-1', total_installments: 1, is_recurring: false }), false);
    assert.equal(isGroupedTransaction({ id: 'tx-2', total_installments: 3, is_recurring: false }), true);
    assert.equal(isGroupedTransaction({ id: 'tx-3', total_installments: 1, is_recurring: true }), true);
    assert.equal(isGroupedTransaction({ id: 'tx-4', installment_group_id: 'grp-1' }), true);
});

test('buildPropagationPayload should include description and type for expense', () => {
    const updatedTx = {
        description: 'Netflix Premium',
        amount: 55.9,
        type: 'Expense',
        category: '🎞️ Streaming',
        credit_card_name: 'Nubank',
        is_split_by_2: true,
        is_third_party: false
    };

    const payload = buildPropagationPayload(updatedTx);

    assert.deepEqual(payload, {
        description: 'Netflix Premium',
        amount: 55.9,
        type: 'Expense',
        category: '🎞️ Streaming',
        credit_card_name: 'Nubank',
        is_split_by_2: true,
        is_third_party: false
    });
});

test('buildPropagationPayload should force split and third_party flags to false when type is Income', () => {
    const updatedTx = {
        description: 'Salário Atualizado',
        amount: 5000,
        type: 'Income',
        category: '💰 Renda',
        credit_card_name: null,
        is_split_by_2: true,
        is_third_party: true
    };

    const payload = buildPropagationPayload(updatedTx);

    assert.equal(payload.description, 'Salário Atualizado');
    assert.equal(payload.type, 'Income');
    assert.equal(payload.is_split_by_2, false);
    assert.equal(payload.is_third_party, false);
});

test('shouldPropagateToTransaction should propagate by installment_number when available', () => {
    const referenceTx = {
        id: 'tx-2',
        installment_group_id: 'grp-1',
        installment_number: 2,
        total_installments: 5,
        date: '2026-02-10T12:00:00.000Z'
    };

    assert.equal(shouldPropagateToTransaction({
        id: 'tx-1',
        installment_group_id: 'grp-1',
        installment_number: 1,
        date: '2026-01-10T12:00:00.000Z'
    }, referenceTx), false);

    assert.equal(shouldPropagateToTransaction({
        id: 'tx-2',
        installment_group_id: 'grp-1',
        installment_number: 2,
        date: '2026-02-10T12:00:00.000Z'
    }, referenceTx), false);

    assert.equal(shouldPropagateToTransaction({
        id: 'tx-3',
        installment_group_id: 'grp-1',
        installment_number: 3,
        date: '2026-03-10T12:00:00.000Z'
    }, referenceTx), true);
});

test('shouldPropagateToTransaction should propagate by date for recurring transactions', () => {
    const referenceTx = {
        id: 'rec-mar',
        installment_group_id: 'grp-rec',
        is_recurring: true,
        date: '2026-03-15T12:00:00.000Z'
    };

    assert.equal(shouldPropagateToTransaction({
        id: 'rec-feb',
        installment_group_id: 'grp-rec',
        is_recurring: true,
        date: '2026-02-15T12:00:00.000Z'
    }, referenceTx), false);

    assert.equal(shouldPropagateToTransaction({
        id: 'rec-apr',
        installment_group_id: 'grp-rec',
        is_recurring: true,
        date: '2026-04-15T12:00:00.000Z'
    }, referenceTx), true);
});
