# Publicação da V22.9.27

```bash
node tests/audit.mjs
firebase deploy --only hosting,firestore:rules,firestore:indexes,storage
```

Após publicar, recarregue o sistema para ativar o novo cache do PWA.
