# V22.9.12 Hotfix — HOME e restauração

## Correções

- O usuário passa a guardar `memberDocumentId`; regras e reservas exigem o mesmo vínculo.
- Contas não DEV não podem criar reserva de nickname com `memberId` vazio.
- Alteração de nickname atualiza usuário, membro e reserva na mesma transação.
- Usuário afetado por nickname legado duplicado pode escolher um nickname livre.
- A migração só é concluída quando não há conflitos e informa pendências ao DEV.
- A restauração exclui reservas residuais ausentes do backup com snapshot para rollback.
- Uma restauração concluída reinicia automaticamente a reconciliação de nicknames.
- Backups V22.9.12 validam usuário ativo, `memberDocumentId`, membro e reserva.

## Segurança

- O Firebase App Check continua removido.
- `restoreJob` preserva rollback de documentos restaurados e reservas removidas.
