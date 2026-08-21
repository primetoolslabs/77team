# Correção Permissões Projeto/Firebase v2

## Regra central

- `page_*` controla somente se a aba pode ser aberta/visualizada no cliente.
- Permissões de ação (`payments_manage`, `support_manage`, `notifications_send`, `presence_finalize`, `audit_view` etc.) controlam as operações reais no Firestore/Storage.
- A matriz continua salva em `settings/app.rolePermissions` e é lida em tempo real pelo projeto e pelas regras.

## Correções

- Pagamentos: Firestore não depende mais de `page_pagamentos` para registrar/consultar; usa `payments_manage` + `access_staff`.
- RT Presença: backend usa `presence_finalize`; a aba usa `page_rt_presenca`.
- Notificações: backend usa `notifications_send`; a aba usa `page_notificacoes`.
- Atendimento/Chat: backend/Storage usam `support_manage`; as abas usam `page_atendimento`/`page_chat`.
- Auditoria: backend usa `audit_view`; a aba usa `page_auditoria`.
- Storage segue a mesma separação para anexos e personalização de login.
- Diagnóstico de pagamento mostra cargo e permissões efetivas se o Firestore ainda negar.

Essa separação remove conflitos de dupla autorização entre navegação e ação.
