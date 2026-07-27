# 77 TEAM Manager V22.8.2 🟢 Stable

## Correções e melhorias

- Reset Global de Presença com confirmação digitando `RESET`.
- Backup automático obrigatório antes de qualquer limpeza.
- Backup passa a guardar Presenças e registros de RT Presença.
- Limpeza sincronizada das coleções `attendance` e `rtPresence`.
- Visão Geral, Consultar Registros, Ranking e Estatísticas são zerados automaticamente por utilizarem os dados ativos dessas coleções.
- Limpeza de filtros e cache local relacionado à presença.
- Auditoria registra responsável, semana, quantidade de presenças, RTs e identificador do backup.
- Central de Backup e demais módulos permanecem preservados.

## Permissões

- Criar backup: DEV, Liderança e Staff.
- Resetar presença: DEV e Liderança.
- Restaurar backup: DEV e Liderança.
- Excluir backup: somente DEV.

## Compatibilidade

- Base oficial V22.7.3 preservada.
- Firebase Authentication, Firestore e Storage mantidos.
- Nenhuma funcionalidade existente removida.
