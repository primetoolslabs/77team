# 77 TEAM Manager V22.8.8 🟠 Hotfix

Correções da sétima auditoria:

- rollback de restauração persistido em `restoreJobs/{jobId}/rollback` e retomado após interrupção;
- schemas e autoria reforçados em presença, eventos, RT, backups semanais, reset, XP e auditoria;
- alteração de `members.userId` bloqueada para Liderança;
- permissão específica `xp_manage` para responsáveis;
- validação interna dos documentos, configurações e resumo do backup;
- auditoria limitada e imutável, exceto reversão de documentos restaurados;
- instalação PWA tolerante a falha externa;
- cabeçalhos de segurança adicionados ao Firebase Hosting;
- preparação do Firebase App Check por `APP_CHECK_SITE_KEY`;
- código legado do modo Visitante removido;
- UID de `system/owner` deixou de ser público;
- função duplicada de presença removida;
- referências históricas de visitante marcadas como descontinuadas.

## Publicação obrigatória

Publique Hosting, Firestore e Storage desta versão. Antes de ativar enforcement do App Check, configure a chave pública reCAPTCHA v3 em `js/firebase-config.js`.
