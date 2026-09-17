import { AuthService } from './services/AuthService.js';
import { supabase } from './services/supabaseClient.js';
import { setStorageAccount, migrateLegacyStorage } from './services/accountStorage.js';

async function start() {
  const session = await AuthService.getSession();
  const userId = session?.user?.id;
  if (!userId) {
    location.replace(import.meta.env.BASE_URL + 'login.html');
    return;
  }
  setStorageAccount(userId);
  migrateLegacyStorage(userId, () => confirm(
    'Existem dados locais de uma versão antiga sem identificação da conta. Eles pertencem a você? OK: associar à conta atual. Cancelar: manter guardados sem usar.'
  ));
  supabase.auth.onAuthStateChange((_event, nextSession) => {
    if (nextSession?.user?.id !== userId) {
      setStorageAccount(null);
      document.body.replaceChildren();
      location.replace(import.meta.env.BASE_URL + 'login.html');
    }
  });
  await import('./main.js');
}

start().catch(error => {
  console.error('Falha ao iniciar aplicativo:', error);
  document.body.textContent = 'Não foi possível iniciar o aplicativo. Verifique a conexão e recarregue a página.';
});
