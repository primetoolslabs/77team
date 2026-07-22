# V22.7.0 Stable — Perfil e Personagem

## Correções

- Reestruturada a regra `users/{uid}` para permitir autoedição segura.
- Usuário autenticado pode salvar o próprio perfil e personagem.
- A regra usa uma lista explícita de campos pessoais permitidos.
- Campos administrativos continuam bloqueados por não integrarem a lista.
- Mantidas aprovações, alterações de cargos e exclusões conforme a hierarquia.
- Atualizadas mensagens e identificação da versão.

## Publicação obrigatória

Publique `firestore.rules` no projeto Firebase `team-f78cd`.
