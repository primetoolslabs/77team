# 77 TEAM Manager V22.8.6 🟠 Hotfix — Recuperação do DEV

## Correção principal

- Quando `system/owner` existe e o documento correspondente em `users/{UID}` está ausente, o sistema recria automaticamente o perfil no primeiro login autenticado do proprietário.
- A recuperação exige correspondência exata entre o UID autenticado e o UID salvo em `system/owner`.
- O perfil recuperado recebe `role: dev`, `accessRole: dev`, status aprovado, conta ativa e identificação PrimeTools Labs.
- Uma mensagem confirma que o documento passou a aparecer em Firestore → `users`.
- A recuperação é registrada na Auditoria do sistema.

## Compatibilidade

- Base V22.8.5 integralmente preservada.
- Backups schema 3 das versões V22.8.5 e V22.8.6 permanecem compatíveis.
- Regras do Firestore devem ser republicadas junto com os arquivos da versão.
