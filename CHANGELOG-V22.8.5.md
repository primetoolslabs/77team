# 77 TEAM Manager V22.8.5 🟠 Hotfix — Consolidação

## Correções

- Matriz configurável integrada às ações críticas da interface e regras Firestore.
- Atendimento e Chat Privado agora respeitam `support_manage`.
- Configurações respeitam `settings_edit`; personalização do login respeita `login_customize`; Auditoria respeita `audit_view`.
- Ações de exclusão de presença respeitam `presence_delete`.
- Backup de presença atualizado para schema 2 com subcoleções, evitando crescimento excessivo do documento principal.
- Restauração e exportação carregam backups novos e mantêm compatibilidade com backups legados.
- Reset Global registra um `resetJob` com etapas e estado de falha/conclusão para recuperação operacional.
- Manifesto PWA e identificação interna atualizados para V22.8.5.
- Projeto preparado para npm e Firebase CLI sem alterar o funcionamento estático existente.
- Terceira auditoria aplicada: proteção contra HTML armazenado nas telas dinâmicas.
- Backup completo separa configurações públicas e privadas e preserva timestamps do Firestore.
- Restauração ampliada para as coleções operacionais, com marcação de origem e regras protegidas para o DEV.
- Webhook do Discord permanece exclusivamente em `settings/private`, inclusive após restauração.
- Cache dos arquivos JavaScript corrigido para V22.8.5 e Service Worker registrado com App Shell.
- Identificações antigas de versão removidas das telas principais.
- Leitura de membros e eventos passa a exigir conta ativa.

## Quinta auditoria

- Removido o modo Visitante e suas opções de configuração.
- Corrigidas as rotas restantes de HTML/XSS em Personagens, Histórico, Staff, XP, relatórios e atributos dinâmicos.
- Backup completo atualizado para schema 3, incluindo subcoleções `attendance` e `rt` de cada backup semanal.
- Backup passa a incluir todas as leituras de notificações e registros de reset disponíveis ao DEV.
- Restauração validada por projeto Firebase, versão, schema, estrutura, IDs, limites e chaves seguras.
- Criado `restoreJobs` com progresso, conclusão e registro de falha por coleção.
- Primeiro DEV protegido por e-mail previamente autorizado em `system/bootstrap`, removido após a ativação.
- DEV, Liderança e Staff podem alterar o clã do jogador, com sincronização entre `members` e `users`.
- Cache interno atualizado para a revisão `22.8.5-a5`.

## Compatibilidade

- Base oficial e layout preservados.
- Firebase Authentication, Firestore e Storage mantidos.
- Backups V22.8.4 e anteriores permanecem legíveis.
