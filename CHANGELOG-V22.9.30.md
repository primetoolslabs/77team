# V22.9.30 🟠 Hotfix — correção de clã pelo STAFF

- A atualização de `members` deixou de depender da atualização de `users`.
- O clã do jogador é alterado mesmo quando a sincronização da conta vinculada falha.
- A conta vinculada é sincronizada em uma segunda operação controlada.
- STAFF pode alterar somente o clã de jogadores do cargo Membro.
- Regras do Firestore possuem autorização direta e específica para STAFF.
- Todas as alterações e pendências de sincronização continuam registradas na Auditoria.
