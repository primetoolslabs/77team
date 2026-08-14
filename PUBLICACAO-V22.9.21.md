# Publicação da V22.9.21

```bash
node tests/audit.mjs
firebase deploy --only hosting,firestore:rules,firestore:indexes,storage
```

É obrigatório publicar o novo `firestore.rules`, pois o módulo utiliza a coleção `payments`.
