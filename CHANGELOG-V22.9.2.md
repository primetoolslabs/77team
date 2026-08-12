# 77 TEAM Manager V22.9.2 🟠 Hotfix

## ADMINISTRAÇÃO

- Staff reconhece os cargos atuais DEV, Liderança e Staff por `resolveAccessRole`.
- Cards, relatórios PDF/CSV e detalhes usam os nomes atuais dos cargos.
- Diário Administrativo pode ser gravado por DEV e Liderança com regra limitada no Firestore.
- Formulários de aviso e XP respeitam as permissões configuráveis.
- Matriz antiga de Configurações foi removida; existe apenas a matriz oficial em AVANÇADO.
- Horários configurados passam a controlar Presença, ações em massa e finalização.
- Regra de observação obrigatória para ausência passou a ser aplicada.
- Ativação e limite mensal de eventos passaram a ser aplicados.
- Classes e limites de personagem passam a ser validados antes da gravação.
- Permissões de nickname, avatar e senha passam a bloquear os respectivos formulários.
- Tempo de sessão encerra contas após o período configurado sem atividade.
- Registro opcional de auditoria é aplicado, preservando obrigatoriamente eventos críticos.
- Configurações não salvas deixam de ser substituídas por snapshots em tempo real.
- Backup Central oferece restauração somente ao DEV, de acordo com as regras publicadas.
- Auditoria ganhou busca e exportação CSV.
- Cache PWA e identificação do sistema atualizados para V22.9.2.

## Segurança

- Matriz de permissões duplicada removida.
- Restauração semanal não promete à Liderança uma operação bloqueada pelo servidor.
- App Check continua ausente.
