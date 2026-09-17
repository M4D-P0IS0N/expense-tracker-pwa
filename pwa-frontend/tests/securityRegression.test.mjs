import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { accountStorage, setStorageAccount, storageForAccount, migrateLegacyStorage } from '../src/services/accountStorage.js';
import { validateBackup } from '../src/utils/backupValidation.js';
import { renderTransactionList } from '../src/modules/TransactionListRenderer.js';
import { importBackup, exportFullJsonBackup, initExportManager } from '../src/modules/ExportManager.js';
import { parseBrazilianCurrency } from '../src/utils/currencyParser.js';
import { fetchAllRows } from '../src/utils/pagination.js';
import { csvField } from '../src/utils/escapeHtml.js';
import { TransactionService } from '../src/services/TransactionService.js';
import { AuthService } from '../src/services/AuthService.js';
import { supabase } from '../src/services/supabaseClient.js';
import { MonthPreferencesService } from '../src/services/MonthPreferencesService.js';
import { NotebookService } from '../src/services/NotebookService.js';
import { GamificationService } from '../src/services/GamificationService.js';

function setup() {
  const dom = new JSDOM(fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8'), { url: 'https://example.test/' });
  globalThis.document = dom.window.document;
  globalThis.window = dom.window;
  globalThis.localStorage = dom.window.localStorage;
  setStorageAccount('account-a');
  return dom;
}
const malicious = `<img src=x onerror="window.pwned=1">'\"`;
const tx = { id: '11111111-1111-4111-8111-111111111111', date: '2026-09-01', description: malicious, category: malicious, credit_card_name: malicious, amount: 50, type: 'Expense', total_installments: 3, installment_number: 1 };

test('transaction renderer treats descriptions, categories, cards and installment labels as text', () => {
  const dom = setup();
  const id = name => document.getElementById(name);
  let opened = 0;
  renderTransactionList({ appElements: { balanceEl: id('total-balance'), incomeEl: id('total-income'), expenseEl: id('total-expense'), listEl: id('transactions-list'), emptyEl: id('empty-state'), filterCardEl: id('filter-card') }, transactions: [{ ...tx, installment_number: malicious }], currentTab: 'All', currentCardFilter: 'All', currentSearchQuery: '', currentSort: 'date-desc', budgetService: { getBudget: () => 0 }, openContextMenu: () => opened++ });
  const list = id('transactions-list');
  assert.equal(list.querySelectorAll('img,script,[onclick],[onerror]').length, 0);
  assert.ok(list.textContent.includes(malicious));
  const toggle = list.querySelector('[data-installment-toggle]');
  toggle.click();
  assert.match(toggle.textContent, /^Fim:/);
  toggle.click();
  assert.ok(toggle.textContent.includes(malicious));
  list.querySelector('[role=button]').dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter' }));
  assert.equal(opened, 1);
});

test('classic inline scripts in both HTML entrypoints compile', () => {
  for (const file of ['index.html', 'login.html']) {
    const html = fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
    for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (!/type=["']module/.test(match[1])) assert.doesNotThrow(() => new vm.Script(match[2], { filename: file }));
    }
  }
});

test('account A/B/A caches are isolated; unknown legacy data requires adoption and never overwrites', () => {
  setup();
  localStorage.setItem('userDisplayName', 'legacy');
  accountStorage.setItem('userDisplayName', 'A');
  migrateLegacyStorage('account-a', () => false);
  setStorageAccount('account-b');
  assert.equal(accountStorage.getItem('userDisplayName'), null);
  accountStorage.setItem('userDisplayName', 'B');
  migrateLegacyStorage('account-b', () => true);
  assert.equal(accountStorage.getItem('userDisplayName'), 'B');
  assert.equal(localStorage.getItem('userDisplayName'), 'legacy');
  setStorageAccount('account-a');
  assert.equal(accountStorage.getItem('userDisplayName'), 'A');
  assert.equal(accountStorage.length, 1);
  setStorageAccount(null);
  assert.equal(accountStorage.getItem('userDisplayName'), null);
  assert.throws(() => accountStorage.setItem('userDisplayName', 'x'));
});

test('backup rejects session/owner/unknown keys and malformed transactions before writes', async () => {
  setup();
  for (const key of ['sb-project-auth-token', '@appdecustos/legacy_owner', '@appdecustos/account/other/baseNetWorth', 'unrelated']) {
    localStorage.setItem(key, 'original');
    let writes = 0;
    await importBackup({ text: async () => JSON.stringify({ data: { transactions: [tx], localStorageData: { [key]: 'attacker' } } }) }, { TransactionService: { bulkUpsertTransactions: async () => writes++ }, showNotification: () => {} });
    assert.equal(writes, 0);
    assert.equal(localStorage.getItem(key), 'original');
  }
  assert.throws(() => validateBackup({ data: { transactions: [{ ...tx, amount: '50bad' }] } }));
});

test('legacy local savings, profile, budgets and notebook remain valid backup content', () => {
  validateBackup({ data: { transactions: [tx], localStorageData: {
    '@appdecustos/savings_goals': JSON.stringify([{ id: 'local-goal', name: 'Casa', icon: '🎯', targetAmount: 1000, currentAmount: 10 }]),
    '@appdecustos/user_profile': JSON.stringify({ Level: 2, CurrentXP: 10, LastUpdated: new Date().toISOString(), UnlockedAchievements: ['first_transaction'] }),
    '@appdecustos/budgets': JSON.stringify({ Alimentação: 500 }),
    '@appdecustos/notebook_2026_9': 'Notas antigas',
  } } });
});

test('restore reports Supabase error and does not overwrite local state or signal success', async () => {
  setup();
  accountStorage.setItem('baseNetWorth', '10');
  const messages = [];
  await importBackup({ text: async () => JSON.stringify({ data: { userProfile: { level: 1 }, localStorageData: { baseNetWorth: '20' } } }) }, {
    supabase: { auth: { getSession: async () => ({ data: { session: { user: { id: 'account-a' } } } }) }, from: () => ({ upsert: async () => ({ error: { message: 'offline' } }) }) },
    showNotification: (message, type) => messages.push({ message, type }),
  });
  assert.equal(accountStorage.getItem('baseNetWorth'), '10');
  assert.equal(messages.at(-1).type, 'error');
});

test('pagination retains records beyond server page limit and never returns partial success', async () => {
  const rows = Array.from({ length: 1201 }, (_, id) => ({ id }));
  const result = await fetchAllRows(() => ({ range: async (a, b) => ({ data: rows.slice(a, b + 1) }) }));
  assert.equal(result.data.length, 1201);
  const failure = await fetchAllRows(() => ({ range: async (a, b) => a ? ({ error: 'offline' }) : ({ data: rows.slice(a,b+1) }) }));
  assert.equal(failure.data, null);
  assert.equal(failure.error, 'offline');
});

test('currency rejects malformed text and understands Brazilian thousands; CSV neutralizes formulas', () => {
  assert.equal(parseBrazilianCurrency('1.000'), 1000);
  assert.equal(parseBrazilianCurrency('R$ 1.000,50'), 1000.5);
  assert.ok(Number.isNaN(parseBrazilianCurrency('123abc')));
  assert.ok(Number.isNaN(parseBrazilianCurrency('1,2,3')));
  assert.equal(csvField('=HYPERLINK("bad")'), '"\'=HYPERLINK(""bad"")"');
  assert.equal(csvField(-20), '"-20"');
});

test('net worth keeps previous cache on cloud error and updates only after success', async t => {
  setup();
  t.mock.method(AuthService, 'getSession', async () => ({ user: { id: 'account-a' } }));
  let fail = true;
  t.mock.method(supabase, 'from', () => ({ upsert: async () => ({ error: fail ? new Error('offline') : null }) }));
  accountStorage.setItem('baseNetWorth', '10');
  await assert.rejects(TransactionService.updateBaseNetWorth(20));
  assert.equal(accountStorage.getItem('baseNetWorth'), '10');
  fail = false;
  await TransactionService.updateBaseNetWorth(20);
  assert.equal(accountStorage.getItem('baseNetWorth'), '20');
});

test('stale notebook response cannot write into another account', async t => {
  setup();
  t.mock.method(AuthService, 'getSession', async () => ({ user: { id: 'account-a' } }));
  let release;
  const response = new Promise(resolve => { release = resolve; });
  const query = { select: () => query, eq: () => query, maybeSingle: () => response };
  t.mock.method(supabase, 'from', () => query);
  const pending = NotebookService.fetchNotes(2026, 9);
  await new Promise(resolve => setImmediate(resolve));
  setStorageAccount('account-b');
  release({ data: { content: 'A private', history: [] } });
  await pending;
  assert.equal(accountStorage.getItem('@appdecustos/notebook_2026_9'), null);
});

test('monthly preference synchronization parses actual scoped YYYY_M keys', async t => {
  setup();
  t.mock.method(AuthService, 'getSession', async () => ({ user: { id: 'account-a' } }));
  const writes = [];
  t.mock.method(supabase, 'from', () => ({ select: () => ({ eq: async () => ({ data: [] }) }), upsert: async data => { writes.push(data); return {}; } }));
  accountStorage.setItem('split_by_two_2026_9', 'true');
  storageForAccount('account-b').setItem('split_by_two_2026_10', 'true');
  await MonthPreferencesService.syncAllPreferences();
  assert.equal(writes.length, 1);
  assert.equal(writes[0].year, 2026);
  assert.equal(writes[0].month, 9);
});

test('export/import round trip preserves earned achievements and ignores legacy deletion queues', async t => {
  setup();
  const profile = GamificationService.getProfile();
  GamificationService.tryUnlockAchievement(profile, 'first_transaction');
  GamificationService.saveProfile(profile);
  let exportedBlob;
  t.mock.method(URL, 'createObjectURL', blob => { exportedBlob = blob; return 'blob:fixture'; });
  t.mock.method(window.HTMLAnchorElement.prototype, 'click', () => {});
  const saved = await exportFullJsonBackup({ TransactionService: { getAllTransactions: async () => [] } });
  assert.equal(saved, true);
  const backup = JSON.parse(await exportedBlob.text());
  backup.data.localStorageData['@appdecustos/deleted_ids'] = JSON.stringify([tx.id]);
  validateBackup(backup);
  accountStorage.removeItem('@appdecustos/user_profile');
  let result;
  await importBackup({ text: async () => JSON.stringify(backup) }, {
    supabase: { auth: { getSession: async () => ({ data: { session: { user: { id: 'account-a' } } } }) } },
    showNotification: (_message, type) => { result = type; },
  });
  assert.equal(result, 'success');
  assert.equal(GamificationService.getProfile().UnlockedAchievements[0].Id, 'first_transaction');
  assert.equal(accountStorage.getItem('@appdecustos/deleted_ids'), null);
});
