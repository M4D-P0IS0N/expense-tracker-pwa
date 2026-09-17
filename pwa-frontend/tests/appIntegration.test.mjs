import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { AuthService } from '../src/services/AuthService.js';
import { TransactionService } from '../src/services/TransactionService.js';
import { MonthPreferencesService } from '../src/services/MonthPreferencesService.js';
import { NotebookService } from '../src/services/NotebookService.js';
import { GamificationService } from '../src/services/GamificationService.js';
import { accountStorage, setStorageAccount } from '../src/services/accountStorage.js';

test('main entry initializes and supports transaction form, calibration and both themes', async t => {
  const dom = new JSDOM(fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8'), { url: 'https://example.test/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.Event = dom.window.Event;
  globalThis.localStorage = dom.window.localStorage;
  globalThis.requestAnimationFrame = () => 0;
  globalThis.alert = message => { throw new Error(message); };
  t.mock.method(dom.window.HTMLCanvasElement.prototype, 'getContext', () => ({}));
  setStorageAccount('fixture');
  accountStorage.setItem('onboardingCompleted', 'true');
  accountStorage.setItem('patrimonioCalibrated', 'true');
  const profile = GamificationService.getProfile();
  profile.AvatarGender = 'male';
  GamificationService.saveProfile(profile);
  t.mock.method(AuthService, 'getSession', async () => ({ user: { id: 'fixture', email: 'fixture@example.test' } }));
  for (const [name, value] of Object.entries({ getAvailableYears: [2026], getTransactions: [], getTotalTransactionCount: 0, getFirstTransactionDate: null, getNetWorth: 1500, getBaseNetWorth: 500 })) {
    t.mock.method(TransactionService, name, async () => value);
  }
  t.mock.method(GamificationService, 'syncWithDatabase', async () => {});
  t.mock.method(MonthPreferencesService, 'getSplitByTwo', async () => false);
  t.mock.method(MonthPreferencesService, 'syncAllPreferences', async () => []);
  t.mock.method(NotebookService, 'syncAllNotes', async () => []);
  let savedTransaction;
  let savedBase;
  t.mock.method(TransactionService, 'addTransaction', async value => { savedTransaction = value; });
  t.mock.method(TransactionService, 'updateBaseNetWorth', async value => { savedBase = value; });
  // Run the actual entry and modules in a DOM. Only the bundler-owned CSS import is omitted.
  const entry = new URL('../src/main.js', import.meta.url);
  const source = fs.readFileSync(entry, 'utf8').replace("import './style.css';", '')
    .replace(/from '(\.\/[^']+)'/g, (_match, path) => `from '${new URL(path, entry).href}'`);
  await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const settle = () => new Promise(resolve => setImmediate(resolve));
  await settle();
  const id = name => document.getElementById(name);
  assert.equal(id('empty-state').style.display, 'block');
  for (const theme of ['schematic', 'default']) {
    document.querySelector(`[data-theme-opt="${theme}"]`).click();
    assert.equal(document.documentElement.dataset.theme, theme);
    id('add-btn').click();
    assert.equal(id('add-modal').classList.contains('hidden'), false);
    id('tx-description').value = 'Compra de teste';
    id('tx-amount').value = '1.000';
    id('tx-date').value = '2026-09-16';
    id('transaction-form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    await settle();
    assert.equal(savedTransaction.amount, 1000);
    assert.equal(id('transaction-form').querySelector('[type=submit]').disabled, false);
  }
  id('dash-networth-card').click();
  await settle();
  assert.equal(id('calibrate-networth-input').value, '1500,00');
  id('calibrate-networth-input').value = '2.500,50';
  id('save-calibrate-networth-btn').click();
  await settle();
  assert.equal(savedBase, 1500.5);
  assert.equal(id('calibrate-networth-modal').classList.contains('hidden'), true);
  dom.window.close();
});

test('default RPG arrays are not shared between accounts', () => {
  const dom = new JSDOM('', { url: 'https://example.test/' });
  globalThis.localStorage = dom.window.localStorage;
  setStorageAccount('a');
  const a = GamificationService.getProfile();
  GamificationService.tryUnlockAchievement(a, 'first_transaction');
  GamificationService.saveProfile(a);
  setStorageAccount('b');
  assert.equal(GamificationService.getProfile().UnlockedAchievements.length, 0);
  dom.window.close();
});
