# Correção Staff — Cadastro e Edição de Personagens

## Causa encontrada
A interface usava `character_edit`, mas o Firestore ainda exigia `members_edit`
para cadastrar um novo registro em `members`.

Na edição, `character_edit` permitia somente os atributos do personagem,
não Nickname/Cargo/Clã.

## Corrigido
Staff com `character_edit = true` pode:
- cadastrar novo Personagem;
- editar Nickname;
- editar Cargo do clã;
- editar Clã;
- editar Classe;
- editar todos os atributos do Personagem.

O cargo do Personagem continua com `accessRole = member`, portanto não concede
login administrativo ao jogador.

## Firebase
É necessário publicar `firestore.rules` desta versão.

Comando:
firebase deploy --only firestore:rules

Se o Firebase Rules ainda responder HTTP 503, a alteração de permissão ainda
não poderá entrar em vigor até o serviço voltar a responder.

Não é necessário publicar `storage.rules`.
