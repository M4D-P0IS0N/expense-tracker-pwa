export function initEmojiCategoryManager({ elements }) {
  const {
    emojiBtn,
    emojiDisplay,
    emojiPicker,
    emojiList,
    categorySelect,
    customCategoryContainer,
    customCategoryInput,
    savingsIconInput,
    savingsEmojiPicker,
    savingsEmojiList,
  } = elements;

  const defaultEmojis = [
    '🍔', '🍕', '🍣', '🛒', '🛍️', '🎁', '🚌', '🚗', '✈️', '🏠', '🏢', '💡', '💧', '🔥',
    '🏥', '💊', '🦷', '🎮', '🎬', '🎵', '⚽', '🏋️', '👕', '👗', '📚', '✏️', '💼', '💻',
    '💸', '💰', '💳', '📈', '🏷️', '🐶', '🐱', '🛠️', '❓',
  ];

  const categoryToEmoji = {
    General: '🏷️',
    Food: '🍔',
    Transport: '🚌',
    Home: '🏠',
    Salary: '💰',
  };

  defaultEmojis.forEach((emojiCharacter) => {
    const emojiButton = document.createElement('button');
    emojiButton.type = 'button';
    emojiButton.className = 'hover:bg-slate-700 rounded p-1 transition';
    emojiButton.textContent = emojiCharacter;
    emojiButton.addEventListener('click', () => {
      emojiDisplay.textContent = emojiCharacter;
      emojiPicker.classList.add('hidden');
    });
    emojiList.appendChild(emojiButton);
  });

  emojiBtn.addEventListener('click', () => {
    emojiPicker.classList.toggle('hidden');
  });

  if (savingsEmojiList) {
    defaultEmojis.forEach((emojiCharacter) => {
      const emojiButton = document.createElement('button');
      emojiButton.type = 'button';
      emojiButton.className = 'hover:bg-slate-700 rounded p-1 transition';
      emojiButton.textContent = emojiCharacter;
      emojiButton.addEventListener('click', () => {
        savingsIconInput.value = emojiCharacter;
        savingsEmojiPicker.classList.add('hidden');
      });
      savingsEmojiList.appendChild(emojiButton);
    });
  }

  if (savingsIconInput) {
    savingsIconInput.addEventListener('click', () => {
      savingsEmojiPicker.classList.toggle('hidden');
    });
  }

  document.addEventListener('click', (event) => {
    if (emojiBtn && emojiPicker && !emojiBtn.contains(event.target) && !emojiPicker.contains(event.target)) {
      emojiPicker.classList.add('hidden');
    }
    if (savingsIconInput && savingsEmojiPicker && !savingsIconInput.contains(event.target) && !savingsEmojiPicker.contains(event.target)) {
      savingsEmojiPicker.classList.add('hidden');
    }
  });

  categorySelect.addEventListener('change', (event) => {
    const selectedValue = event.target.value;
    if (selectedValue === 'New') {
      customCategoryContainer.classList.remove('hidden');
      customCategoryInput.required = true;
      emojiDisplay.textContent = '❓';
      return;
    }

    customCategoryContainer.classList.add('hidden');
    customCategoryInput.required = false;
    customCategoryInput.value = '';

    if (categoryToEmoji[selectedValue]) {
      emojiDisplay.textContent = categoryToEmoji[selectedValue];
    }
  });
}
