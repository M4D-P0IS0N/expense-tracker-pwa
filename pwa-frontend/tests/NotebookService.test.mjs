import test from 'node:test';
import assert from 'node:assert/strict';
import { NotebookService } from '../src/services/NotebookService.js';

function createLocalStorageMock() {
    const store = new Map();
    return {
        getItem: (key) => store.has(key) ? store.get(key) : null,
        setItem: (key, val) => store.set(key, String(val)),
        removeItem: (key) => store.delete(key),
        clear: () => store.clear()
    };
}

globalThis.localStorage = createLocalStorageMock();

test('NotebookService should store and retrieve notes individually per month and year', () => {
    localStorage.clear();

    NotebookService.saveNotes('Nota de Agosto', 2026, 8);
    NotebookService.saveNotes('Nota de Setembro', 2026, 9);

    assert.equal(NotebookService.getNotes(2026, 8), 'Nota de Agosto');
    assert.equal(NotebookService.getNotes(2026, 9), 'Nota de Setembro');
});

test('NotebookService should keep edit history with timestamps and diffs', () => {
    localStorage.clear();

    NotebookService.saveNotes('Linha 1\nLinha 2', 2026, 8);
    NotebookService.saveNotes('Linha 1\nLinha 3', 2026, 8);

    const history = NotebookService.getHistory(2026, 8);
    assert.equal(history.length, 2);

    const latestEdit = history[0];
    assert.deepEqual(latestEdit.added, ['Linha 3']);
    assert.deepEqual(latestEdit.removed, ['Linha 2']);
    assert.ok(latestEdit.timestamp);
});

test('NotebookService should migrate legacy global notes if available', () => {
    localStorage.clear();
    localStorage.setItem('@appdecustos/notebook_notes', 'Nota antiga global');

    const migrated = NotebookService.getNotes(2026, 8);
    assert.equal(migrated, 'Nota antiga global');

    const monthKey = NotebookService.getStorageKey(2026, 8);
    assert.ok(localStorage.getItem(monthKey));
});
