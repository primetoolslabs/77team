# Publicação da V22.9.17

Valide o pacote:

```bash
node tests/audit.mjs
```

Publique aplicação, regras, índices e Storage em conjunto:

```bash
firebase deploy --only hosting,firestore:rules,firestore:indexes,storage
```

Não publique somente o Hosting: as correções de restauração e rollback dependem do novo `firestore.rules`.

O App Check não é utilizado nesta versão.
