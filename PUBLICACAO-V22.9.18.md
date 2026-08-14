# Publicação da V22.9.18

Valide o pacote:

```bash
node tests/audit.mjs
```

Publique aplicação, regras, índices e Storage em conjunto:

```bash
firebase deploy --only hosting,firestore:rules,firestore:indexes,storage
```

Não publique somente o Hosting. As permissões, restaurações e validações dependem do `firestore.rules` incluído no pacote.

O Firebase App Check não é utilizado nesta versão.
