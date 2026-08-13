# V22.9.8 Hotfix — HOME

## Correções concluídas

- O nickname salvo em **Minha conta** também atualiza o membro vinculado pelo UID, em uma única operação atômica.
- Nicknames duplicados são recusados sem diferenciar letras maiúsculas e minúsculas.
- Medalhas do perfil passam a usar o membro vinculado ao usuário autenticado.
- Pontos do perfil passam a exibir o XP real calculado pelo sistema de progressão.
- O Top 5 usa a mesma pontuação exibida e é ordenado pelo XP total.
- Eventos mensais incluem calendário e presenças de eventos, com deduplicação por data e tipo.
- Cards recentes resolvem o nome e o cargo atuais pelo UID, sem exibir dados antigos da presença.
- A tendência mensal do dashboard usa a contagem consolidada de eventos.
- As regras do Firestore permitem que o próprio usuário altere apenas o nome de seu membro vinculado.

## Segurança preservada

- Nenhum App Check foi adicionado.
- A alteração própria de membro fica limitada aos campos `name` e `updatedAt`.
- O nome precisa ter entre 2 e 120 caracteres.
- As demais alterações de membros continuam protegidas pelas permissões administrativas.

