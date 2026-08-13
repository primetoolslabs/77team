# V22.9.15 — auditoria completa

- Links externos e metadados de suporte/chat validados contra XSS e falsificação.
- Finalização de atendimento e chat feita em lote atômico.
- Índice composto de suporte incluído em `firestore.indexes.json`.
- Login lembrado corrigido.
- Backups semanais ganham estado de conclusão; backups parciais ficam indisponíveis.
- Restauração semanal controlada por `restoreJob`, snapshots e rollback.
- Restauração completa autoritativa para coleções, campos e subcoleções.
- Reset semanal tenta rollback automático e registra seu resultado.
- Exportações CSV protegidas contra fórmulas.
- Criação do primeiro DEV limpa perfil órfão se a posse não puder ser concluída.
- Rótulos técnicos, HTML inválido e referências legadas corrigidos.
- Persistência PWA, emuladores e auditoria estática documentados.

O Firebase App Check continua removido.
