# Publicação da V22.9.22

```bash
node tests/audit.mjs
firebase deploy --only hosting,firestore:rules,firestore:indexes,storage
```

Publique o `firestore.rules` junto com o Hosting para permitir o novo campo `quantity`.
