# V22.9.5 Hotfix — HOME Final

## Nove correções concluídas

1. XP manual e Level foram sincronizados com o documento público e seguro do membro.
2. Atrasado passou a conceder o mesmo XP automático de uma presença.
3. Meu Perfil passou a usar exclusivamente a progressão por XP.
4. Evento e notificação são gravados em uma única operação atômica.
5. Atividade recente distingue Presente, Atrasado, Justificado, Ausente e Pendente.
6. Eventos com status Atrasado entram nos indicadores do Meu Perfil.
7. Todas as telas usam o mesmo critério de membro ativo.
8. Tipos WorldBoss e Purgatório são normalizados para exibir os ícones corretos.
9. Nomes de arquivos exportados usam a data local do navegador.

## Segurança

- A sincronização de progressão em `members` exige cargo responsável e a permissão `xp_manage`.
- Campos de progressão são validados e limitados nas regras do Firestore.
- Firebase App Check permanece removido.
