import test from 'node:test';
import assert from 'node:assert/strict';
import { MonthPreferencesService } from '../src/services/MonthPreferencesService.js';

function createLocalStorageMock() {
    const store = new Map();
    return {
        getItem: (key) => store.has(key) ? store.get(key) : null,
        setItem: (key, val) => store.set(key, String(val)),
        removeItem: (key) => store.delete(key),
        clear: () => store.clear(),
        key: (i) => Array.from(store.keys())[i],
        get length() { return store.size; }
    };
}

globalThis.localStorage = createLocalStorageMock();

test('MonthPreferencesService should generate consistent storage keys', () => {
    assert.equal(MonthPreferencesService.getStorageKey(2026, 8), 'split_by_two_2026_8');
    assert.equal(MonthPreferencesService.getStorageKey('2026', '08'), 'split_by_two_2026_8');
});

test('MonthPreferencesService should read and write split_by_two preferences in cache', async () => {
    localStorage.clear();

    await MonthPreferencesService.setSplitByTwo(2026, 8, true);
    await MonthPreferencesService.setSplitByTwo(2026, 9, false);

    assert.equal(MonthPreferencesService.getSplitByTwoFromCache(2026, 8), true);
    assert.equal(MonthPreferencesService.getSplitByTwoFromCache(2026, 9), false);
    assert.equal(MonthPreferencesService.getSplitByTwoFromCache(2026, 10), false);
});

test('MonthPreferencesService getSplitByTwo should fallback to local cache seamlessly', async () => {
    localStorage.clear();
    localStorage.setItem('split_by_two_2026_11', 'true');

    const result = await MonthPreferencesService.getSplitByTwo(2026, 11);
    assert.equal(result, true);
});
