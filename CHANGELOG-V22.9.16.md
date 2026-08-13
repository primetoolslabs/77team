# V22.9.16 🟠 Hotfix

- Restaurada a função de formatação de datas usada por HOME, Perfil, Histórico, Metas e Agenda.
- Substituídas referências inexistentes `dev()` e `applyAccessControl()`.
- Primeiro DEV criado em uma instância Firebase isolada, eliminando a corrida com o listener principal.
- Cadastros incompletos removem a conta órfã do Firebase Authentication.
- Backup exige a conta DEV autenticada e valida pais, subcoleções, totais, conclusão e IDs duplicados.
- Backups incompletos não entram no backup completo do Firestore.
- Atendimento e Chat com mais de 400 mensagens passam por atualização controlada com rollback.
- Limpeza de snapshots de restaurações concluídas é retomada em novos acessos.
- Referências antigas a elementos inexistentes foram removidas.
- Auditoria estática passou a detectar funções críticas ausentes e regressões dos fluxos corrigidos.

O Firebase App Check permanece removido.
