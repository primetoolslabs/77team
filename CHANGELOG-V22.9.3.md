# 77 TEAM Manager V22.9.3 🟠 Hotfix

## STAFF

- Menu interno oculta módulos sem a permissão específica do cargo.
- Acesso direto a páginas restritas é bloqueado e redirecionado com mensagem.
- Personagens exige `character_view`.
- Solicitações exige ao menos aprovação ou rejeição e mostra somente os botões permitidos.
- Notificações exige `notifications_send`.
- Atendimento e Chat Privado exigem `support_manage`.
- Metas ganhou a permissão configurável `goals_manage`.
- DEV, Liderança e Staff autorizados podem criar e remover metas.
- Firestore valida `requests_approve` também para Liderança.
- Uploads de Atendimento e Chat são removidos quando a mensagem falha no Firestore.
- Cargo do remetente usa a função atual e normalizada de acesso.
- Chats finalizados podem ser excluídos definitivamente pelo DEV, incluindo anexos.
- Presenças e Consultar Registros permanecem funcionais e preservados.
- Cache PWA e identificação atualizados para V22.9.3.

## Segurança

- Interface e Firestore tomam a mesma decisão para Solicitações e Metas.
- Nenhum token ou App Check foi introduzido.
