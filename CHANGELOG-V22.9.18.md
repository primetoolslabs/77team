# V22.9.18 🟠 Hotfix — auditoria geral

- Corrigida a divergência entre as duas entradas de restauração completa.
- Administração e Avançado agora aceitam o mesmo limite seguro de 200 MB.
- Ambas as entradas utilizam a validação integral do backup e o fluxo persistente com `restoreJob`.
- Backups completos da V22.9.18 foram incluídos na lista de versões compatíveis.
- Backups semanais da V22.9.18 exigem status `completed` antes da restauração.
- Revalidados autenticação, primeiro DEV, permissões, HOME, STAFF, Administração, Avançado, XSS, PWA, regras, índices e Storage.
- Mantidos o layout, os recursos existentes e a ausência de Firebase App Check.

## Validação local

- Auditoria automatizada do projeto.
- Sintaxe JavaScript.
- HTML e JSON.
- Integridade estrutural das regras do Firestore.
- Integridade do pacote ZIP.

