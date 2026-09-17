---
name: auto-git-push
description: Valida, versiona e publica automaticamente alterações autorizadas neste projeto.
---

Leia `AGENTS.md` na raiz e siga seu fluxo de publicação automática.
Antes de alterações amplas, preserve e confira tag ou backup dos arquivos afetados.
Depois de implementar: testes pertinentes e `npm test`, incremento do cache do service worker,
`npm run build`, revisão do diff, staging com caminhos explícitos, commit e `git push origin main`.
Envie também a tag de recuperação. Confira o workflow GitHub Pages e a versão publicada.
Não publique testes/build com falha, não use staging indiscriminado e não afirme sucesso sem evidência.
