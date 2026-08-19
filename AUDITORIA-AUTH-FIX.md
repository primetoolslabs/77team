# Correções de autenticação — 77 TEAM Manager

Correções aplicadas sem remoção das funcionalidades existentes:

- Login exige `active === true` e `status === "approved"`.
- Conta `pending`, `rejected`, inativa ou com perfil incompleto não entra no sistema.
- Recuperação de senha adicionada com Firebase Authentication.
- Conta rejeitada pode reenviar a solicitação usando a mesma conta do Firebase Auth.
- O reenvio altera somente o estado `rejected -> pending`; não recria o usuário.
- E-mail de verificação é enviado em novos cadastros e reenvios quando possível, sem bloquear contas antigas.
- Novos cadastros e novas senhas exigem no mínimo 8 caracteres.
- Login continua aceitando credenciais antigas válidas, preservando compatibilidade.
- Cache do `main.js` alterado para `22.9.32-authfix1`.
- `firestore.rules` atualizado somente para permitir o reenvio seguro pelo próprio usuário rejeitado.
- Teste `tests/audit.mjs` atualizado para a lógica atual de permissões e autenticação.

## Testes executados

- `node --check js/main.js` — OK
- `node tests/audit.mjs` — `Auditoria estática V22.9.32: OK`
