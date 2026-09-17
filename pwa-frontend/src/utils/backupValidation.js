import { isRestorableKey } from '../services/accountStorage.js';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function requireValue(ok, label) { if (!ok) throw new Error('Backup inválido: ' + label); }
function object(value) { return value && typeof value === 'object' && !Array.isArray(value); }
function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
function string(value, max = 10000) { return typeof value === 'string' && value.length <= max; }
function history(value) {
  requireValue(Array.isArray(value) && value.length <= 500, 'histórico de notas');
  for (const item of value) {
    requireValue(object(item) && string(item.timestamp) && Number.isFinite(Date.parse(item.timestamp)), 'data do histórico');
    for (const field of ['added', 'removed']) requireValue(Array.isArray(item[field]) && item[field].every(line => string(line)), 'linhas do histórico');
  }
}
function localValue(key, raw) {
  requireValue(typeof raw === 'string' && raw.length <= 2000000, 'valor local');
  if (key === 'baseNetWorth') requireValue(raw.trim() !== '' && Number.isFinite(Number(raw)), key);
  else if (/^(onboardingCompleted|patrimonioCalibrated|splitByTwoEnabled|split_by_two_)/.test(key)) requireValue(['true', 'false'].includes(raw), key);
  else if (key === 'userDisplayName') requireValue(string(raw, 200), key);
  else if (key.endsWith('/budgets')) {
    const value = JSON.parse(raw);
    requireValue(object(value) && Object.values(value).every(n => finite(n) && n >= 0), key);
  } else if (key.endsWith('/savings_goals')) {
    const value = JSON.parse(raw);
    requireValue(Array.isArray(value) && value.length <= 10000, key);
    for (const goal of value) requireValue(object(goal) && string(goal.id) && string(goal.name) && string(goal.icon) && finite(goal.targetAmount) && goal.targetAmount > 0 && finite(goal.currentAmount) && goal.currentAmount >= 0, key);
  } else if (key.endsWith('/user_profile')) {
    const value = JSON.parse(raw);
    requireValue(object(value), key);
    for (const [field, entry] of Object.entries(value)) {
      if (field === 'UnlockedAchievements') {
        requireValue(Array.isArray(entry) && entry.length <= 1000 && entry.every(item =>
          string(item, 200) || (object(item) && string(item.Id, 200) && string(item.Name, 500)
            && string(item.Description, 2000) && string(item.UnlockedAt, 50))), field);
      } else if (field === 'usedCategories') requireValue(Array.isArray(entry) && entry.every(item => string(item, 200)), field);
      else if (['EvolutionStage', 'AvatarGender', 'lastLoginDate', 'firstLoginDate', 'lastUpdated', 'LastUpdated'].includes(field)) requireValue(entry === null || string(entry, 100), field);
      else requireValue(finite(entry) && entry >= 0 && entry <= 1e12, field);
    }
  } else if (/\/notebook_\d/.test(key)) {
    let value;
    try { value = JSON.parse(raw); } catch { return; } // Legacy plain text notes.
    if (object(value)) { requireValue(string(value.content, 1000000), key); history(value.history || []); }
  } else if (key.endsWith('_meta')) {
    const value = JSON.parse(raw);
    requireValue(object(value), key);
    for (const field of ['added', 'removed']) if (value[field]) requireValue(Array.isArray(value[field]) && value[field].every(line => string(line)), field);
  }
}

export function validateTransaction(tx) {
  requireValue(object(tx), 'transação');
  requireValue(string(tx.description, 2000) && tx.description.trim(), 'descrição');
  requireValue(finite(tx.amount) && tx.amount >= 0 && tx.amount <= 1e12, 'valor');
  requireValue(['Income', 'Expense'].includes(tx.type), 'tipo');
  requireValue(string(tx.date, 40) && /^\d{4}-\d{2}-\d{2}/.test(tx.date) && Number.isFinite(Date.parse(tx.date)), 'data');
  for (const field of ['category', 'credit_card_name']) if (tx[field] != null) requireValue(string(tx[field], 200), field);
  for (const field of ['id', 'installment_group_id']) if (tx[field] != null) requireValue(uuid.test(tx[field]), field);
  for (const field of ['is_recurring', 'is_split_by_2', 'is_third_party']) if (tx[field] != null) requireValue(typeof tx[field] === 'boolean', field);
  const total = tx.total_installments ?? 1;
  const current = tx.installment_number ?? 1;
  requireValue(Number.isInteger(total) && total >= 1 && total <= 600 && Number.isInteger(current) && current >= 1 && current <= total, 'parcelas');
}

export function validateBackup(backup) {
  requireValue(object(backup) && object(backup.data), 'formato');
  const data = backup.data;
  for (const key of ['transactions', 'savingsGoals', 'achievements', 'monthPreferences', 'notebookNotes']) {
    if (data[key] === undefined) continue;
    requireValue(Array.isArray(data[key]) && data[key].length <= 100000, key);
    for (const row of data[key]) requireValue(object(row), key);
  }
  for (const tx of data.transactions || []) validateTransaction(tx);
  for (const row of [...(data.monthPreferences || []), ...(data.notebookNotes || [])]) {
    requireValue(Number.isInteger(row.year) && row.year >= 1900 && row.year <= 9999 && Number.isInteger(row.month) && row.month >= 1 && row.month <= 12, 'mês/ano');
  }
  for (const row of data.monthPreferences || []) requireValue(typeof row.is_split_by_2 === 'boolean', 'preferência mensal');
  for (const row of data.notebookNotes || []) { requireValue(string(row.content, 1000000), 'nota'); history(row.history || []); }
  if (data.userProfile != null) {
    requireValue(object(data.userProfile), 'perfil');
    for (const field of ['level', 'current_xp', 'xp_to_next_level', 'base_net_worth']) {
      if (data.userProfile[field] != null) requireValue(finite(data.userProfile[field]), field);
    }
  }
  for (const row of data.savingsGoals || []) {
    requireValue(uuid.test(row.id) && string(row.name, 2000)
      && finite(row.target_amount) && row.target_amount >= 0
      && finite(row.current_amount) && row.current_amount >= 0, 'meta na nuvem');
  }
  for (const row of data.achievements || []) {
    requireValue(uuid.test(row.id) && string(row.name, 2000), 'conquista na nuvem');
    if (row.description != null) requireValue(string(row.description), 'descrição da conquista');
    if (row.is_unlocked != null) requireValue(typeof row.is_unlocked === 'boolean', 'estado da conquista');
  }
  if (data.localStorageData !== undefined) {
    requireValue(object(data.localStorageData), 'armazenamento local');
    for (const [key, value] of Object.entries(data.localStorageData)) {
      if (key === '@appdecustos/deleted_ids') {
        const ids = JSON.parse(value);
        requireValue(Array.isArray(ids) && ids.every(id => typeof id === 'string'), 'fila legada');
        continue; // Recognized legacy metadata, never replay deletions on restore.
      }
      requireValue(isRestorableKey(key), 'chave local não permitida: ' + key);
      localValue(key, value);
    }
  }
  // Prototype-related fields have no meaning in any supported backup format.
  const inspect = value => {
    if (value && typeof value === 'object') for (const [key, entry] of Object.entries(value)) {
      requireValue(!['__proto__', 'prototype', 'constructor'].includes(key), 'campo reservado');
      inspect(entry);
    }
  };
  inspect(data);
  return backup;
}
