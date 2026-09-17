# Regras do projeto

Este arquivo é a referência comum para Codex, Antigravity, Cursor e GitHub Copilot.
O pedido atual do usuário e as instruções da plataforma têm prioridade.

- Examine o Git, os scripts e os consumidores afetados antes de alterar. Preserve mudanças preexistentes e dados; não use reset destrutivo, force push ou limpeza sem autorização específica.
- Antes de mudanças amplas ou operações com risco de sobrescrita, crie e confira um ponto de recuperação: tag no commit limpo ou ZIP/backup dos arquivos afetados. Não inclua segredos. Um build conhecido que só gera `pwa-frontend/dist` não exige outro backup a cada execução.
- Faça mudanças proporcionais ao app de uso pessoal, sem comprometer autenticação, RLS, integridade financeira ou isolamento entre contas. Valide entradas e escape texto no contexto de exibição; nunca importe credenciais ou chaves arbitrárias do armazenamento do navegador.
- Não coloque segredos em fontes, logs ou backups de código. Confira `.gitignore` e arquivos rastreados antes de usar `.env`. No Vite, use acessos literais a `import.meta.env.VITE_*`; nunca inclua chaves de servidor no frontend.
- Toda tabela exposta pelo Supabase precisa de RLS e vínculo de propriedade. Versione migrações e mantenha o esquema de instalação coerente. Operações financeiras com múltiplas escritas devem ser atômicas quando necessário.
- Confira IDs reais do DOM e contratos antes de editar. Mantenha funções com responsabilidades claras; revise arquivos grandes sem dividi-los apenas pela contagem de linhas. Capture falhas onde há recuperação ou feedback útil, sem transformar erro em sucesso.
- Use intervalos mensais completos em UTC para timestamps do banco. Preserve as regras existentes de divisão por dois e despesas de terceiros.
- Preserve ambos os temas (padrão e schematic), teclado, foco visível e layout móvel. Resolva escolhas pequenas pelos padrões existentes; pergunte apenas se a resposta alterar materialmente comportamento, dados, custos ou escopo.
- Atualize o modal Dúvidas e README quando o comportamento mudar. Ao substituir sprites, revise propriedades específicas das imagens anteriores.
- Após alterações de código, rode `npm test` e `npm run build` em `pwa-frontend`, além de testes de regressão e execução pertinentes. Inspecione erros e informe com precisão o que foi ou não verificado.

## Publicação automática autorizada

Quando a alteração solicitada estiver implementada e validada, incremente `CACHE_NAME` em `pwa-frontend/public/sw.js`, gere o build, revise o diff e prepare commits coerentes com caminhos explícitos (`git add` sem `.` indiscriminado). Faça commit e `git push origin main` automaticamente, conforme a preferência permanente do usuário. Publique também a tag de recuperação criada para a alteração. Verifique o workflow de GitHub Pages e a versão publicada antes de afirmar que o site foi atualizado. Se algum passo falhar, corrija ou relate o impedimento; não declare sucesso obrigatório.

## Recuperação

Para desfazer código publicado, prefira um commit de reversão (`git revert <commit>`) seguido de testes, build e push. Tags `backup/*` identificam estados anteriores. ZIPs de código e Git não restauram dados do Supabase nem dados locais do navegador: exporte o JSON do app antes de restaurar/importar dados, e use backups do banco para alterações destrutivas de esquema/dados. Não faça rollback do banco automaticamente.
