# V22.9.33 — Modo administrativo + Personagens

## Novo modelo

### Usuários com login
Somente:
- DEV
- Liderança
- Staff

Membros/jogadores comuns não usam mais conta de login.

### Jogadores
A aba **Personagens** passa a ser o cadastro oficial dos jogadores.
O cadastro cria apenas um registro de jogador interno, sem Firebase Authentication.

A antiga coleção `members` é mantida internamente como base técnica dos personagens.
Ela não representa mais "usuários com login". Mantê-la evita quebrar os IDs históricos usados por presença.

## Presenças
O fluxo de registro de presença foi preservado:
- mesmo modal;
- mesmo membro/personagem selecionado;
- WorldBoss, Purgatório e Eventos;
- status;
- observação;
- responsável;
- RT Presença;
- Histórico;
- backups.

Novas presenças continuam gravando `memberId` e `userId` compatíveis com os registros anteriores.

## Histórico antigo
Não é apagado.
A resolução de presença usa inclusive personagens inativos para que registros antigos continuem aparecendo.

## Migração
Ao DEV entrar e carregar `users` + `members`, personagens antigos salvos em `users/{uid}.character`
são copiados para o registro de jogador correspondente em `members`.
Nenhuma presença antiga é excluída.

## Interface removida
- Cadastro público de membro.
- Menu HOME > Membros.
- Menu STAFF > Solicitações.

As telas antigas permanecem somente como compatibilidade técnica e não ficam acessíveis pela navegação.

## Firebase
ESTA VERSÃO ALTERA `firestore.rules`.

Após publicar os arquivos do site, publique também:
- `firestore.rules`

Não é necessário alterar `storage.rules` nesta mudança.
