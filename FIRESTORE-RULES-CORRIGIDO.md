# Firestore Rules — correção de publicação

A regra foi refeita a partir da última versão estável.

Mudanças mínimas:
1. `active()` aceita somente DEV, Liderança e Staff.
2. `members` permite ao Staff/Liderança/DEV salvar somente o bloco `character`.
3. Remoção de personagem é arquivamento (`active:false`) e preserva histórico.

Foram removidas as regras novas extensas de `playerRecord/loginEnabled` que aumentavam a complexidade do ruleset.

## Publicação
Nesta versão é necessário publicar:
- `firestore.rules`
- Hosting/site

Não precisa publicar `storage.rules`.
