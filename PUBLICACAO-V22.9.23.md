# Publicação da V22.9.23

```bash
node tests/audit.mjs
firebase deploy --only hosting,firestore:rules,firestore:indexes,storage
```

Publique o novo `firestore.rules` para aplicar o limite de 99.000.000 no servidor.
