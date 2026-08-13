# V22.9.11 Hotfix — HOME

## Exclusividade definitiva de nickname

- `users` guarda a chave da reserva ativa em `nicknameClaimKey`.
- A alteração do nickname exige, na mesma transação, usuário, membro, nova reserva e remoção da reserva anterior.
- As regras usam `getAfter()` para validar o estado final da transação.
- Uma reserva isolada não pode ser criada por um usuário comum.
- A reserva anterior é desativada atomicamente e só o DEV pode excluir documentos de reserva.
- A aprovação de uma conta cria o membro e a reserva na mesma transação.
- A migração do DEV cria reservas ausentes e remove reservas antigas ou inválidas.

## Backup e restauração

- A validação cruza cada reserva com UID, usuário, membro, nickname e chave normalizada.
- Um usuário não pode possuir mais de uma reserva no backup.
- Backups V22.9.11 exigem reserva para todos os usuários ativos não técnicos.
- Backups V22.8.5 até V22.9.10 continuam compatíveis e recebem reservas pela migração após a restauração.

## Compatibilidade

- Layout e módulos anteriores preservados.
- Firebase App Check continua ausente.
