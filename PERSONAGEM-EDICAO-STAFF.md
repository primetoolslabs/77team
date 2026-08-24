# Personagem — edição por Staff

Staff com `character_edit` pode editar Nickname, Cargo do clã, Clã, Classe e todos os atributos do personagem.

O cargo do personagem continua com `accessRole: member`, então isso não concede login administrativo.

É obrigatório publicar `firestore.rules` para a nova permissão funcionar. Enquanto Firebase Rules retornar HTTP 503, a interface pode ser publicada, mas a permissão nova só valerá após o deploy das Rules.
