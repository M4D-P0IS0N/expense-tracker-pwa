export const FIXED_CATEGORY_EMOJIS = {
  'Aleatoriedades': '🪤',
  'Bem estar/Casa': '🆙',
  'Carro': '🚗',
  'Comida': '🍕',
  'Contas de casa': '🏠',
  'Eletrônicos': '💻',
  'Emergência': '🚨',
  'Estudos': '📝',
  'Farmácia': '💊',
  'Mercado': '🛒',
  'Médico': '🩺',
  'Peçanha': '🐶',
  'Presente': '🎁',
  'Salário': '💰',
  'Streaming': '🎞️',
  'Geral': '🏷️',
};

const CATEGORY_ALIASES = {
  'General': 'Geral',
  'Food': 'Comida',
  'Home': 'Contas de casa',
  'House': 'Contas de casa',
  'Transport': 'Carro',
  'Car': 'Carro',
  'Salary': 'Salário',
  'Saúde': 'Médico',
  'Wellbeing': 'Bem estar/Casa',
};

// Regex matching unicode emojis using ES2018 Unicode Property Escapes and variation selectors
const EMOJI_REGEX = /(?:[\u{FE00}-\u{FE0F}\u{200D}]|\p{Extended_Pictographic}|\p{Emoji_Component}|\p{Emoji_Presentation}|\p{Emoji})+/gu;

/**
 * Normalizes any category string into clean name, fixed emoji, and standard full label.
 * @param {string} rawCategory - e.g. "Comida 🍕", "Comida 🍔", "🍕 Comida", "Comida", "Food", "General", "🆙 Bem estar/Casa"
 * @param {string} [overrideEmoji] - Optional emoji selected by user
 * @returns {{ name: string, emoji: string, full: string }}
 */
export function normalizeCategory(rawCategory, overrideEmoji = null) {
  if (!rawCategory || typeof rawCategory !== 'string') {
    return { name: 'Geral', emoji: '🏷️', full: '🏷️ Geral' };
  }

  // 1. Extract emoji attached to the raw category if present
  const foundEmojis = rawCategory.match(EMOJI_REGEX) || [];
  const existingEmoji = foundEmojis[0] ? foundEmojis[0].trim() : null;

  // 2. Strip emojis and trim clean name
  let cleanName = rawCategory.replace(EMOJI_REGEX, '').trim();
  if (!cleanName) {
    cleanName = rawCategory.trim();
  }

  // 3. Map legacy/English aliases if matched
  if (CATEGORY_ALIASES[cleanName]) {
    cleanName = CATEGORY_ALIASES[cleanName];
  }

  // 4. Determine fixed emoji or fallback
  let finalEmoji = overrideEmoji;
  if (!finalEmoji) {
    if (FIXED_CATEGORY_EMOJIS[cleanName]) {
      finalEmoji = FIXED_CATEGORY_EMOJIS[cleanName];
    } else if (existingEmoji) {
      finalEmoji = existingEmoji;
    } else {
      finalEmoji = '🏷️';
    }
  }

  const full = `${finalEmoji} ${cleanName}`;
  return { name: cleanName, emoji: finalEmoji, full };
}
