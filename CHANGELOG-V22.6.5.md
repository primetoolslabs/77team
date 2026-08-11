# V22.6.5 Hotfix — Perfil e Personagem

## Correções críticas

- Corrigido o salvamento do próprio perfil para contas atuais e perfis legados.
- Corrigida a criação e edição das informações do próprio personagem.
- As regras agora tratam com segurança perfis antigos sem `active` ou `status`.
- O salvamento do personagem registra `characterUpdatedBy` e `updatedAt`.
- Mantida a proteção de `role`, `accessRole`, `memberRole`, UID, status e ativação.
- Adicionadas mensagens específicas quando as regras publicadas no Firebase estão desatualizadas.

## Publicação obrigatória

Após enviar os arquivos ao GitHub, publique o arquivo `firestore.rules` desta versão no Firebase.
