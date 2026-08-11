# V22.6.6 Hotfix — Salvamento do Personagem

## Correção principal

- Corrigida a regra do Firestore que impedia membros de salvar o próprio personagem.
- O próprio usuário pode alterar somente `character`, `characterUpdatedAt`, `characterUpdatedBy` e `updatedAt`.
- Campos administrativos, cargos, status, ativação, UID e permissões continuam protegidos.
- Compatibilidade preservada para perfis antigos que não possuem todos os campos atuais.
- Fluxos de perfil, personagens, matriz de permissões e personalização do login foram preservados.

## Publicação obrigatória

Publique o arquivo `firestore.rules` desta versão no Firebase para aplicar a correção.
