# Correção — Login após aprovação e aprovação pelo Staff

## Corrigido
- Staff volta a ter permissão estrutural para aprovar e rejeitar solicitações, mesmo que uma configuração antiga em `rolePermissions` tenha salvo esses itens como `false`.
- As regras do Firestore permitem a aprovação de contas de membro pelo Staff sem depender dessa configuração antiga.
- Ao aprovar, o registro em `members` é sincronizado com `active: true`, `accessRole` e `memberRole`.
- O login agora diferencia conta pendente, rejeitada, aprovada porém ainda inativa e conta sem liberação, facilitando identificar cadastros antigos inconsistentes.

## Publicação obrigatória
Depois de substituir os arquivos do site, publique também `firestore.rules`. Sem publicar as regras, o navegador continuará recebendo `permission-denied` do Firebase.
