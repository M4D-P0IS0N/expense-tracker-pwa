---
name: auto-git-push
description: Executa automaticamente build, incremento de versão do service worker, commit git e git push origin main logo após terminar e testar qualquer nova funcionalidade.
---

# Workflow de Commit e Push Automático

Sempre que uma nova funcionalidade ou correção for finalizada e validada:
1. Executar os testes automatizados (npm test).
2. Incrementar a versão de cache em pwa-frontend/public/sw.js.
3. Executar o build de produção (npm run build).
4. Adicionar os arquivos (git add .) e commitar (git commit -m "...").
5. Executar git push origin main automaticamente sem aguardar solicitação do usuário.
