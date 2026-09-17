import { accountStorage, setStorageAccount } from '../src/services/accountStorage.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { exportFullJsonBackup, importBackup } from '../src/modules/ExportManager.js';

function createLocalStorageMock() {
    const store = new Map();
    return {
        getItem: (key) => store.has(key) ? store.get(key) : null,
        setItem: (key, val) => store.set(key, String(val)),
        removeItem: (key) => store.delete(key),
        clear: () => store.clear(),
        key: (i) => Array.from(store.keys())[i] || null,
        get length() { return store.size; }
    };
}

globalThis.localStorage = createLocalStorageMock();
setStorageAccount('user-123');
if (typeof globalThis.document === 'undefined') {
    globalThis.document = {
        createElement: () => ({
            setAttribute: () => {},
            click: () => {},
            appendChild: () => {},
            removeChild: () => {}
        }),
        body: {
            appendChild: () => {},
            removeChild: () => {}
        }
    };
}
if (typeof globalThis.URL === 'undefined') {
    globalThis.URL = {
        createObjectURL: () => 'blob:mock',
        revokeObjectURL: () => {}
    };
}

test('importBackup should parse valid backup JSON and call bulkUpsertTransactions', async () => {
    localStorage.clear();
    accountStorage.setItem('userDisplayName', 'Usuario Teste');

    const fakeTransactions = [
        { id: '11111111-1111-4111-8111-111111111111', date: '2026-09-01', description: 'Mercado', amount: 150, type: 'Expense' },
        { id: '22222222-2222-4222-8222-222222222222', date: '2026-09-02', description: 'Salário', amount: 3000, type: 'Income' }
    ];

    const fakeBackup = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        appName: 'App de Custos PWA',
        data: {
            transactions: fakeTransactions,
            userProfile: { level: 5, current_xp: 200 },
            savingsGoals: [],
            achievements: [],
            localStorageData: {
                userDisplayName: 'Usuario Teste Backup'
            }
        }
    };

    let upsertedTransactions = [];
    const mockTransactionService = {
        bulkUpsertTransactions: async (list) => {
            upsertedTransactions = list;
            return list.length;
        }
    };

    const mockSupabase = {
        auth: {
            getSession: async () => ({ data: { session: { user: { id: 'user-123' } } } })
        },
        from: () => ({
            upsert: async () => ({ data: [], error: null }),
            select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) })
        })
    };

    const mockFile = {
        text: async () => JSON.stringify(fakeBackup)
    };

    let notificationMessage = '';
    const mockShowNotification = (msg) => { notificationMessage = msg; };

    await importBackup(mockFile, {
        TransactionService: mockTransactionService,
        supabase: mockSupabase,
        showNotification: mockShowNotification
    });

    assert.equal(upsertedTransactions.length, 2);
    assert.equal(upsertedTransactions[0].description, 'Mercado');
    assert.equal(accountStorage.getItem('userDisplayName'), 'Usuario Teste Backup');
    assert.match(notificationMessage, /Backup restaurado com sucesso/);
});

test('importBackup should throw error on invalid JSON payload', async () => {
    const invalidFile = {
        text: async () => 'conteudo-invalido'
    };

    let notificationError = '';
    await importBackup(invalidFile, {
        TransactionService: {},
        supabase: {},
        showNotification: (msg, type) => { if (type === 'error') notificationError = msg; }
    });

    assert.match(notificationError, /Arquivo inválido/);
});
