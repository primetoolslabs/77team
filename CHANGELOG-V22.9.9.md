# V22.9.9 Hotfix — HOME

## Correções

- Ranking do Meu Perfil alinhado ao XP usado pela Visão Geral e pelo Top 5.
- Histórico resolve nickname, cargo e clã atuais pelo UID do membro.
- Atividade recente mostra o nickname atual do membro vinculado.
- Indicadores, tendências, gráfico semanal e taxa geral ignoram membros inativos, DEV oculto e registros órfãos.
- Eventos de hoje incluem somente presenças válidas de membros ativos.
- Opções dos filtros do Histórico recebem escape contra injeção de HTML/XSS.
- Nicknames passam a ser reservados em transação no Firestore, bloqueando gravações simultâneas duplicadas.
- Vínculo legado por nome só é aceito quando existe exatamente uma correspondência.
- Regra de alteração do próprio membro não aceita colisão de ID com `userId` de outra conta.

## Compatibilidade

- Layout e módulos anteriores preservados.
- Backups completos V22.8.5 até V22.9.9 continuam aceitos.
- Firebase App Check continua ausente.

