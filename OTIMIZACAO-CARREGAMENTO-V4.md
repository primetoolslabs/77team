# Otimização de carregamento — Meu Perfil V4

## Correções
- Removido o MutationObserver que observava toda a árvore do Meu Perfil e reagia às próprias atualizações.
- A sincronização visual agora observa somente quatro campos-fonte.
- Escritas no DOM só acontecem quando o valor realmente mudou.
- Removidas três camadas visuais antigas do Meu Perfil que estavam sendo sobrescritas pela V4.
- Mantida a camada base necessária para formulários e abas funcionais.

## Não alterado
Firebase, Firestore, Storage, permissões, autenticação, cadastro, personagem e operações de dados.

## Firebase
Não é necessário publicar firestore.rules nem storage.rules.
