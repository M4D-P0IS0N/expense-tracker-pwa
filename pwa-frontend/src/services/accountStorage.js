const PREFIX = '@appdecustos/account/';
const LEGACY_OWNER = '@appdecustos/legacy_owner';
let activeUserId = null;
function rawKeys() { return Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).filter(Boolean); }

export function isRestorableKey(key) {
  return ['@appdecustos/budgets', '@appdecustos/savings_goals', '@appdecustos/user_profile',
    '@appdecustos/notebook_notes', '@appdecustos/notebook_meta', '@appdecustos/larissa_notes',
    '@appdecustos/larissa_meta', 'baseNetWorth', 'userDisplayName', 'onboardingCompleted',
    'patrimonioCalibrated', 'splitByTwoEnabled'].includes(key)
    || /^@appdecustos\/notebook_\d{4}_(?:[1-9]|1[0-2])$/.test(key)
    || /^split_by_two_\d{4}_(?:[1-9]|1[0-2])$/.test(key);
}

export function setStorageAccount(userId) { activeUserId = userId || null; }
export function getStorageAccount() { return activeUserId; }
export function assertStorageAccount(userId) {
  if (!userId || activeUserId !== userId) throw new Error('A conta mudou. Recarregue a página.');
}

export function storageForAccount(userId) {
  const prefix = PREFIX + encodeURIComponent(userId || '') + '/';
  const keys = () => userId ? rawKeys().filter(key => key.startsWith(prefix)) : [];
  return {
    getItem(key) { return userId ? localStorage.getItem(prefix + key) : null; },
    setItem(key, value) {
      if (!userId) throw new Error('Usuário não autenticado.');
      localStorage.setItem(prefix + key, value);
    },
    removeItem(key) { if (userId) localStorage.removeItem(prefix + key); },
    key(index) { return keys()[index]?.slice(prefix.length) ?? null; },
    get length() { return keys().length; },
  };
}

export const accountStorage = {
  getItem: key => storageForAccount(activeUserId).getItem(key),
  setItem: (key, value) => storageForAccount(activeUserId).setItem(key, value),
  removeItem: key => storageForAccount(activeUserId).removeItem(key),
  key: index => storageForAccount(activeUserId).key(index),
  get length() { return storageForAccount(activeUserId).length; },
};

// Old keys remain intact as a recovery copy. They have no recorded owner.
export function migrateLegacyStorage(userId, confirmOwnership) {
  if (localStorage.getItem(LEGACY_OWNER) || !userId) return;
  const keys = rawKeys().filter(isRestorableKey);
  if (!keys.length || !confirmOwnership()) return;
  const target = storageForAccount(userId);
  for (const key of keys) {
    if (target.getItem(key) === null) target.setItem(key, localStorage.getItem(key));
  }
  localStorage.setItem(LEGACY_OWNER, userId);
}
