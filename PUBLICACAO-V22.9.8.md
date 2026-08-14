# Publicação da V22.9.8

Execute os comandos na pasta descompactada, usando o projeto Firebase correto:

```bash
firebase use team-f78cd
firebase deploy --only firestore:rules,hosting
```

Depois da publicação:

1. Recarregue o sistema com `Ctrl+Shift+R` para atualizar o cache do PWA.
2. Entre com um usuário que possua membro vinculado pelo mesmo UID.
3. Altere o nickname em **Minha conta** e confirme a mudança em **Firestore → members** e na HOME.
4. Confirme medalhas, pontos, Top 5, eventos mensais e cards recentes.

O arquivo `firestore.rules` fica na raiz do projeto e já está referenciado por `firebase.json`.
