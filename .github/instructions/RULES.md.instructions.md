---
description: Diretrizes gerais do projeto abrangendo atitude do agente, padrões técnicos, fluxo de trabalho seguro, testes, segurança e prevenção de desastres.
applyTo: '**/*'
---

Estas são as diretrizes do projeto e regras de codificação que a IA deve seguir rigorosamente ao gerar código, responder perguntas ou revisar alterações:

# 📜 LIVRO DE REGRAS: DIRETRIZES DO PROJETO

## 🧠 1. ATITUDE E RACIOCÍNIO (Anti-Alucinação)
- **Não seja um "Yes Man":** Se minha ideia for tecnicamente ruim, arriscada ou puder ser feita de forma mais simples, me questione antes de codar.
- **Primeiro Explore, Depois Execute:** Antes de criar um novo arquivo ou função, use suas ferramentas de busca para ver se já existe algo semelhante no projeto. REUTILIZE antes de criar.
- **Zero Suposições:** Se faltar informação sobre como um dado chega ou para onde ele vai, PERGUNTE. Não invente caminhos.
- **Pense em Voz Alta:** Antes de cada grande bloco de código, escreva uma frase explicando: "Vou seguir o caminho X porque ele evita o erro Y".

## 🛠️ 2. PADRÕES TÉCNICOS (Obrigatórios)
- **Código Autodocumentado:** Use nomes de variáveis longos e descritivos em inglês (ex: `userAuthenticationStatus` em vez de `auth`). Não use comentários óbvios.
- **Arquivos Pequenos:** Se um arquivo passar de 250-300 linhas, sugira dividi-lo. Arquivos grandes confundem sua própria memória de agente.
- **Segurança Máxima:** NUNCA escreva chaves de API, senhas ou segredos no código. Se precisar de uma configuração, use arquivos `.env`.
- **Tratamento de Erros:** Todo código deve prever o "e se der errado?". Adicione `try/catch` e logs claros que um leigo consiga ler no console.

## 🚀 3. FLUXO DE TRABALHO (Vibe Coding Seguro)
- **Verificação de Logs:** Após implementar qualquer mudança, verifique se há erros no terminal ou no console do navegador. Se houver, corrija IMEDIATAMENTE antes de prosseguir.
- **Commits Atômicos:** A cada funcionalidade terminada e testada, sugira um comando de commit Git (ex: `feat: adiciona botão de login`). Isso é o nosso "Save Game".
- **Mudança Mínima Necessária:** Não reescreva um arquivo inteiro se apenas duas linhas precisam mudar. Isso evita que você quebre funções que já estavam funcionando.

## 🧪 4. QUALIDADE E TESTES
- **Caminho Crítico:** Se eu pedir uma lógica de pagamento, login ou banco de dados, você DEVE sugerir e criar um teste automatizado simples para essa função.
- **Interface (UI):** Priorize acessibilidade e responsividade. Se o design estiver "quebrando" em telas menores, avise-me.

## 🔴 5. O QUE NÃO FAZER (Linhas Vermelhas)
- NÃO remova funcionalidades existentes sem me consultar.
- NÃO ignore erros de tipagem (TypeScript) ou avisos de "lint".
- NÃO finalize uma tarefa sem confirmar: "Testei e está funcionando conforme o esperado".

## 🧪 6. PROTOCOLO DE VERIFICAÇÃO DE VOO (Testes Reais)
- **Proibido "Código Cego":** Após implementar uma funcionalidade visual ou lógica, você DEVE simular ou solicitar que eu execute o passo a passo de teste. 
- **Verificação de Runtime:** Sempre pergunte: "O servidor está rodando sem erros no terminal?". Se houver erros de compilação, NÃO avance para a próxima tarefa.
- **Teste de Clique (Interatividade):** Para qualquer elemento de interface (botões, formulários, menus), você deve garantir que:
    1. O elemento é clicável/interagível.
    2. Ele executa a ação esperada.
    3. Ele exibe um feedback visual (carregamento, sucesso ou erro).
- **Validação do Executável/Build:** Antes de considerar o projeto pronto para "entrega", execute ou peça para eu executar o comando de build (ex: `npm run build` ou `pyinstaller`). Garanta que o arquivo final gerado abre e funciona fora do ambiente de desenvolvimento.

## 🔍 7. DIAGNÓSTICO DE SAÚDE DO ARQUIVO
- **Auto-Execução de Testes:** Se o projeto tiver uma suíte de testes (`npm test`, `pytest`), você é OBRIGADO a rodá-la após qualquer alteração e reportar se algo quebrou.
- **Checagem de Dependências:** Ao adicionar uma nova biblioteca, verifique se ela foi instalada corretamente e se não há conflitos de versão que impeçam o executável de rodar.

## 🛡️ 8. PROTOCOLO DE SEGURANÇA E SOBREVIVÊNCIA
- **Proteção do .env:** Antes de pedir para eu colocar senhas em um .env, certifique-se de que o `.gitignore` está configurado para ignorá-lo.
- **Sanitização de Dados:** Trate todo input de usuário como uma ameaça. Limpe e valide os dados antes de salvá-los no banco ou exibi-los na tela.
- **Logs Censurados:** Nunca exiba senhas, tokens ou dados pessoais de usuários no `console.log` ou logs de erro.
- **O "Botão de Pânico":** Se a alteração for arriscada, diga-me como reverter o código (rollback do Git) antes mesmo de eu testar.
- **Transparência no Terminal:** Nunca me mande executar um comando no terminal sem me explicar em linguagem simples o que ele vai instalar ou modificar na minha máquina.
- **RLS Obrigatório no Supabase:** Toda tabela em schema exposto pela API (`public`, por padrão) DEVE nascer com `ENABLE ROW LEVEL SECURITY` e policies explícitas de `SELECT/INSERT/UPDATE/DELETE`. Não basta criar a tabela.
- **Dono do Registro Definido:** Toda tabela multiusuário no banco DEVE ter coluna de ownership (`user_id` ou equivalente) ligada ao `auth.users(id)`. Se o app consultar `auth.uid()`, a policy deve usar esse mesmo vínculo.
- **Schema e Migração Andam Juntos:** Ao criar ou alterar tabela no Supabase, atualize o schema versionado e a migração correspondente no repositório. Nunca deixe a segurança “só no painel”.

## 🛑 9. PREVENÇÃO CONTRA DESASTRES (ROLLBACK E BACKUP)
- **Obrigatório Salvar o Jogo ("Save Point"):** ANTES de executar qualquer script de build (`python build.py`, `npm run build`), processo em lote de "Find & Replace" ou deleção de arquivos, você DEVE exigir que eu faça um Commit no Git (ex: `git add . && git commit -m "backup antes do script"`) ou crie uma cópia ZIP da pasta. Nunca execute uma alteração destrutiva sem rede de segurança.
- **Auditoria de Scripts Antigos:** É terminantemente PROIBIDO executar cegamente scripts ou construtores de código legados deixados no projeto sem antes inspecionar o código deles. Eles podem buscar dados de pastas vazias/antigas e sobrescrever nosso trabalho recém-feito.
- **Aviso Categórico de Sobrescrição:** O Agente nunca pode ocultar o fato de que um arquivo será completamente substituído. Se um arquivo "crucial" for ser manipulado de forma bruta (overwrite local), pare e peça confirmação.
