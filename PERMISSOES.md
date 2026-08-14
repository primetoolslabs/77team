# Matriz de permissões — V22.8.5

| Permissão | DEV | Liderança | Staff | Membro |
|---|:---:|:---:|:---:|:---:|
| Aceitar solicitações | ✅ | ✅ | ✅ | ❌ |
| Rejeitar solicitações | ✅ | ✅ | ✅ | ❌ |
| Alterar cargos | ✅ | ✅ | ❌ | ❌ |
| Excluir membros | ✅ | ✅ | ✅ | ❌ |
| Editar membros | ✅ | ✅ | ✅ | ❌ |
| Alterar clã dos jogadores | ✅ | ✅ | ✅ | ❌ |
| Registrar presença | ✅ | ✅ | ✅ | ❌ |
| Editar presença | ✅ | ✅ | ✅ | ❌ |
| Excluir presença individual | ✅ | ❌ | ❌ | ❌ |
| Finalizar RT | ✅ | ✅ | ✅ | ❌ |
| Resetar ciclo semanal | ✅ | ✅ | ❌ | ❌ |
| Administração | ✅ | ✅ | ❌ | ❌ |
| Avançado | ✅ | ❌ | ❌ | ❌ |

A matriz configurável em Avançado pode restringir permissões individuais. O DEV permanece com acesso total para evitar bloqueio administrativo do sistema.


## Consolidação V22.8.5

- A matriz configurável passa a ser consultada também nas operações críticas de atendimento/chat, configurações, auditoria, presença e personalização do login.
- DEV continua sempre com acesso total e não pode ser bloqueado pela matriz.
- Firestore reforça as mesmas permissões nas operações administrativas suportadas.
