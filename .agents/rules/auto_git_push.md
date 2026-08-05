# Regra de Push Automático após Commit

Sempre que você concluir uma tarefa, executar os testes e fizer o git commit:
1. Push Automático Imediato: Você DEVE executar git push origin main imediatamente no terminal, sem esperar o usuário pedir.
2. Build e Service Worker: Se arquivos visuais do PWA forem alterados, incremente o CACHE_NAME em pwa-frontend/public/sw.js e execute npm run build antes do push para garantir que o GitHub Pages/PWA online receba a versão mais recente.
3. Confirmação: Relate ao usuário que os arquivos foram enviados com sucesso para a nuvem.
