# V22.9.22 🟠 Hotfix — quantidade e exclusão do histórico

- Campo obrigatório **Quantidade** abaixo do tipo de pagamento.
- Quantidade inteira validada entre 1 e 1.000.000.000.
- Nova coluna Quantidade no histórico.
- Botão individual **Excluir**, visível somente ao DEV.
- Botão **Apagar todo o histórico**, visível somente ao DEV.
- Todas as exclusões exigem confirmação e geram registro na Auditoria.
- Backups V22.9.22 exigem uma quantidade válida em todos os pagamentos.
- Backups anteriores continuam compatíveis com registros antigos sem quantidade.

