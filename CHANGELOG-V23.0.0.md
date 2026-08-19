# V23.0.0 — Fresh Firebase

- Firebase antigo removido da configuração.
- Novo `firebase-config.js` com placeholders para um projeto Firebase novo.
- Regras do Firestore reconstruídas com hierarquia DEV → Liderança → Staff → Membro.
- Staff pode aprovar/rejeitar solicitações de Membro diretamente.
- Aprovação reescrita em batch único (`users` + `members` + `nicknameClaims`).
- Login de conta aprovada depende somente de `status: approved` e `active: true`.
- Regras de Storage reconstruídas.
- Cache/PWA atualizado para V23.0.0.
- Guia `NOVO-FIREBASE-V23.md` incluído.
