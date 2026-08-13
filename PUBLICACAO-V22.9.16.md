# Publicação da V22.9.16

Execute primeiro:

```bash
node tests/audit.mjs
```

Depois publique Hosting, regras, índices e Storage:

```bash
firebase deploy --only hosting,firestore:rules,firestore:indexes,storage
```

O backup completo protege os dados do Firestore. Contas do Authentication, senhas e arquivos do Storage seguem os mecanismos próprios do Firebase e não são inseridos no JSON.

O App Check não é utilizado nesta versão.
