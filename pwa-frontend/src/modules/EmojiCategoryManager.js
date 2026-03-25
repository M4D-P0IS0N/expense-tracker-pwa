const DEFAULT_EMOJIS = [
  '🍔', '🍕', '🍣', '🛒', '🛍️', '🎁', '🚌', '🚗', '✈️', '🏠', '🏢', '💡', '💧', '🔥',
  '🏥', '💊', '🦷', '🎮', '🎬', '🎵', '⚽', '🏋️', '👕', '👗', '📚', '✏️', '💼', '💻',
  '💸', '💰', '💳', '📈', '🏷️', '🐶', '🐱', '🛠️', '❓'
];

const CATEGORY_TO_EMOJI = {
  General: '🏷️',
  Food: '🍔',
  Transport: '🚌',
  Home: '🏠',
  Salary: '💰',
};

export function initEmojiCategoryManager({ getElementById }) {
  const emojiButton = getElementById('tx-emoji-btn');
  const emojiDisplay = getElementById('tx-emoji-display');
  const emojiPicker = getElementById('emoji-picker');
  const emojiList = getElementById('emoji-list');
  const categorySelect = getElementById('tx-category');
  const customCategoryContainer = getElementById('tx-custom-category-container');
  const customCategoryInput = getElementById('tx-custom-category');
  const savingsIconInput = getElementById('savings-icon');
  const savingsEmojiPicker = getElementById('savings-emoji-picker');
  const savingsEmojiList = getElementById('savings-emoji-list');

  DEFAULT_EMOJIS.forEach((emoji) => {
    const transactionEmojiButton = document.createElement('button');
    transactionEmojiButton.type = 'button';
    transactionEmojiButton.className = 'hover:bg-slate-700 rounded p-1 transition';
    transactionEmojiButton.textContent = emoji;
    transactionEmojiButton.addEventListener('click', () => {
      emojiDisplay.textContent = emoji;
      emojiPicker.classList.add('hidden');
    });
    emojiList.appendChild(transactionEmojiButton);
  });

  emojiButton.addEventListener('click', () => {
    emojiPicker.classList.toggle('hidden');
  });

  if (savingsEmojiList) {
    DEFAULT_EMOJIS.forEach((emoji) => {
      const savingsEmojiButton = document.createElement('button');
      savingsEmojiButton.type = 'button';
      savingsEmojiButton.className = 'hover:bg-slate-700 rounded p-1 transition';
      savingsEmojiButton.textContent = emoji;
      savingsEmojiButton.addEventListener('click', () => {
        savingsIconInput.value = emoji;
        savingsEmojiPicker.classList.add('hidden');
      });
      savingsEmojiList.appendChild(savingsEmojiButton);
    });
  }

  if (savingsIconInput) {
    savingsIconInput.addEventListener('click', () => {
      savingsEmojiPicker.classList.toggle('hidden');
    });
  }

  document.addEventListener('click', (event) => {
    if (emojiButton && emojiPicker && !emojiButton.contains(event.target) && !emojiPicker.contains(event.target)) {
      emojiPicker.classList.add('hidden');
    }

    if (savingsIconInput && savingsEmojiPicker && !savingsIconInput.contains(event.target) && !savingsEmojiPicker.contains(event.target)) {
      savingsEmojiPicker.classList.add('hidden');
    }
  });

  categorySelect.addEventListener('change', (event) => {
    const selectedCategoryValue = event.target.value;

    if (selectedCategoryValue === 'New') {
      customCategoryContainer.classList.remove('hidden');
      customCategoryInput.required = true;
      emojiDisplay.textContent = '❓';
      return;
    }

    customCategoryContainer.classList.add('hidden');
    customCategoryInput.required = false;
    customCategoryInput.value = '';

    if (CATEGORY_TO_EMOJI[selectedCategoryValue]) {
      emojiDisplay.textContent = CATEGORY_TO_EMOJI[selectedCategoryValue];
    }
  });
}
