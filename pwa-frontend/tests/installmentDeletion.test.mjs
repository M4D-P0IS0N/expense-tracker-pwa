import test from 'node:test';
import assert from 'node:assert/strict';

import {
    selectGroupedTransactionsForDeletion,
    shouldDeleteGroupedTransaction
} from '../src/utils/installmentDeletion.js';

test('should delete the selected installment and the next installments in the same group', () => {
    const selectedTransaction = {
        id: 'tx-2',
        installment_group_id: 'group-1',
        total_installments: 6,
        installment_number: 2,
        date: '2026-03-10T12:00:00.000Z'
    };

    const groupedTransactions = [
        { id: 'tx-1', installment_group_id: 'group-1', total_installments: 6, installment_number: 1, date: '2026-02-10T12:00:00.000Z' },
        { id: 'tx-2', installment_group_id: 'group-1', total_installments: 6, installment_number: 2, date: '2026-03-10T12:00:00.000Z' },
        { id: 'tx-3', installment_group_id: 'group-1', total_installments: 6, installment_number: 3, date: '2026-04-10T12:00:00.000Z' },
        { id: 'tx-4', installment_group_id: 'group-1', total_installments: 6, installment_number: 4, date: '2026-05-10T12:00:00.000Z' }
    ];

    const groupedTransactionsToDelete = selectGroupedTransactionsForDeletion(groupedTransactions, selectedTransaction);

    assert.deepEqual(groupedTransactionsToDelete.map((transaction) => transaction.id), ['tx-2', 'tx-3', 'tx-4']);
});

test('should use date comparison for recurring transactions that share the same group id', () => {
    const selectedTransaction = {
        id: 'rec-2',
        installment_group_id: 'group-recurring',
        total_installments: 1,
        installment_number: 1,
        date: '2026-03-05T12:00:00.000Z',
        is_recurring: true
    };

    assert.equal(shouldDeleteGroupedTransaction({
        id: 'rec-1',
        installment_group_id: 'group-recurring',
        total_installments: 1,
        installment_number: 1,
        date: '2026-02-05T12:00:00.000Z',
        is_recurring: true
    }, selectedTransaction), false);

    assert.equal(shouldDeleteGroupedTransaction({
        id: 'rec-3',
        installment_group_id: 'group-recurring',
        total_installments: 1,
        installment_number: 1,
        date: '2026-04-05T12:00:00.000Z',
        is_recurring: true
    }, selectedTransaction), true);
});
