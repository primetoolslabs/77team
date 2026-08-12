# 77 TEAM Manager V22.8.7 — Sexta auditoria

- Alteração de clã grava sempre em `members` e somente sincroniza `users` por UID inequívoco.
- Restauração completa registra `restoreJobs`, captura o estado anterior e executa rollback automático se qualquer lote falhar.
- IDs importados aceitam apenas caracteres seguros e interpolações restantes em atributos HTML foram escapadas.
- Regras de `members` agora restringem criação, edição de clã, alteração de cargo e exclusão por campos, cargo e permissão.
- Service Worker armazena o shell e os módulos Firebase; Firestore usa persistência local para dados já sincronizados.
- Backups schema 3 das versões 22.8.5, 22.8.6 e 22.8.7 continuam compatíveis.
