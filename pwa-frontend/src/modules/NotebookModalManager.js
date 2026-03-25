export function initNotebookModal({
  appElements,
  getElementById,
  notebookService,
}) {
  function closeNotesModal() {
    appElements.notesModal.classList.add('hidden');
  }

  appElements.notesBtn.addEventListener('click', () => {
    appElements.notesTextarea.value = notebookService.getNotes();

    const notebookMeta = notebookService.getMeta();
    const metaContainer = getElementById('notes-meta-container');
    const dateElement = getElementById('notes-date');
    const diffBox = getElementById('notes-diff-box');

    if (notebookMeta) {
      metaContainer.classList.remove('hidden');
      const lastEditedDate = new Date(notebookMeta.lastEdited);
      dateElement.textContent = lastEditedDate.toLocaleString('pt-BR');

      diffBox.innerHTML = '';
      if (notebookMeta.added.length === 0 && notebookMeta.removed.length === 0) {
        diffBox.innerHTML = '<span class="text-slate-500 italic">Nenhuma alteração de linha significativa detectada na última edição.</span>';
      } else {
        notebookMeta.added.forEach((line) => {
          diffBox.innerHTML += `<div class="text-accent-green backdrop-blur-sm bg-accent-green/10 px-1.5 py-0.5 rounded truncate">+ ${line}</div>`;
        });
        notebookMeta.removed.forEach((line) => {
          diffBox.innerHTML += `<div class="text-accent-red backdrop-blur-sm bg-accent-red/10 px-1.5 py-0.5 rounded truncate line-through opacity-75">- ${line}</div>`;
        });
      }
    } else {
      metaContainer.classList.add('hidden');
    }

    appElements.notesModal.classList.remove('hidden');
  });

  appElements.closeNotesBtn.addEventListener('click', closeNotesModal);
  appElements.notesOverlay.addEventListener('click', closeNotesModal);
  appElements.saveNotesBtn.addEventListener('click', () => {
    notebookService.saveNotes(appElements.notesTextarea.value);

    const originalSaveButtonHtml = appElements.saveNotesBtn.innerHTML;
    appElements.saveNotesBtn.innerHTML = 'Salvo!';
    appElements.saveNotesBtn.classList.add('bg-accent-green/20', 'text-accent-green', 'border-accent-green');
    appElements.saveNotesBtn.classList.remove('bg-primary/20', 'text-primary', 'border-primary');

    setTimeout(() => {
      appElements.saveNotesBtn.innerHTML = originalSaveButtonHtml;
      appElements.saveNotesBtn.classList.remove('bg-accent-green/20', 'text-accent-green', 'border-accent-green');
      appElements.saveNotesBtn.classList.add('bg-primary/20', 'text-primary', 'border-primary');
    }, 2000);
  });

  return { closeNotesModal };
}
