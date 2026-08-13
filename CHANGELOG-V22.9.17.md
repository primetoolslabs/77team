# V22.9.17 🟠 Hotfix — auditoria geral

- Regras de criação do DEV alinhadas à restauração e ao rollback de todas as coleções exportadas.
- Rollback pode recriar usuários, eventos, resets, notificações, mensagens, XP e auditoria.
- Auditoria pode ser restaurada e revertida sem depender de marcadores temporários.
- `rolePermissions`, segurança, manutenção, atualização e personalização do login ficam protegidos exclusivamente pelo DEV nas regras.
- E-mail do Firebase Authentication volta ao valor anterior se a sincronização com `users/{uid}` falhar.
- Alteração conjunta de e-mail e senha informa corretamente quando apenas o e-mail foi concluído.
- Webhook do Discord é salvo em `settings/private`, fora das configurações públicas e dos backups.
- Validação de backup aceita os avatares gerados pelo próprio sistema e rejeita avatares inválidos.
- Limite de importação ampliado para 200 MB para projetos com muitos avatares.
- Imagens, fundos, avisos e links passam por validação HTTPS/data-image compatível com a CSP.
- Teste estático passou a validar IDs obrigatórios, destinos do menu e contratos críticos das regras.

O Firebase App Check permanece removido.
