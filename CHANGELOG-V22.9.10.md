# V22.9.10 Hotfix — HOME

## Correções concluídas

- A primeira troca de nickname não tenta mais excluir uma reserva inexistente.
- A transação lê as reservas antiga e nova antes de qualquer gravação.
- A reserva antiga só é removida quando existe e pertence ao usuário autenticado.
- A chave da reserva passa a ser o próprio nickname normalizado em minúsculas.
- O Firestore confere que `name.trim().lower()` corresponde ao ID da reserva.
- Nicknames com `/`, `.` ou `..` são recusados antes da gravação.
- `nicknameClaims` passa a ser exportada, validada e restaurada pelo backup completo.
- Backups anteriores, sem `nicknameClaims`, continuam aceitos.
- Reservas antigas no formato hexadecimal são ignoradas na nova exportação.
- O gráfico “Top membros ativos” ignora membros inativos e registros órfãos.

## Segurança e compatibilidade

- O Firebase App Check continua ausente.
- Backups completos V22.8.5 até V22.9.10 são aceitos.
- Layout, permissões e módulos existentes foram preservados.

