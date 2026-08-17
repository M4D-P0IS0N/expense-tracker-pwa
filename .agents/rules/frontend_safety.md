# Regra de Integridade do Frontend, Vite e Consultas Temporais

Sempre que criar, editar ou refatorar código no frontend e serviços deste projeto:

## 1. Integridade de Seletores e Elementos DOM
- Nunca altere ou deduza nomes de IDs de elementos DOM (`document.getElementById`) sem verificar a declaração exata no `index.html`.
- Ao modificar seletores em `main.js` ou em módulos UI, valide se o elemento existe no HTML e se o seletor não retorna `null`.

## 2. Variáveis de Ambiente no Vite
- Em projetos empacotados com Vite, NUNCA utilize acesso dinâmico por índice (como `import.meta.env[key]`).
- O Vite faz substituição de texto estática apenas para acessos literais pontuais (`import.meta.env.VITE_NOME_DA_VARIAVEL`). Acessos dinâmicos viram `undefined` no build de produção.
- Para manter compatibilidade com testes Node.js, utilize operadores de encadeamento opcional e fallbacks (`import.meta.env?.VITE_... || process.env?.VITE_...`).

## 3. Consultas Temporais e Timezone em Banco de Dados
- Ao filtrar registros por mês/ano em bancos com timestamp UTC (como Supabase), gere os limites cobrindo o intervalo completo em UTC:
  - Início: `YYYY-MM-01T00:00:00.000Z`
  - Fim: `YYYY-MM-[ÚltimoDia]T23:59:59.999Z`
- Não utilize `new Date(ano, mes, dia).toISOString()` diretamente para o primeiro dia sem compensar o fuso local, pois fusos negativos (ex: UTC-3) deslocam o início para `03:00:00Z` e descartam transações do primeiro dia gravadas à meia-noite UTC.
