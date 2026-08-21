# Firestore Rules V6

A V5 introduziu uma função de leitura de matriz com expressões mais complexas.
Para recuperar a compatibilidade de publicação:

- `permission(key)` voltou à implementação da V4, que já era publicável.
- Somente Pagamentos usa `paymentsMatrixPermission()`.
- A função de Pagamentos lê diretamente:
  `settings/app.rolePermissions.payments_manage.<cargo>`
- Não há encadeamento de `Map.get()` na função específica de Pagamentos.

Regra de criação/leitura em `/payments/{id}`:
`allow read, create: if paymentsMatrixPermission();`
