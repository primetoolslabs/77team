# Publicação da V22.9.15

Na pasta do projeto, publique Hosting, regras e índices:

```bash
firebase deploy --only hosting,firestore:rules,firestore:indexes,storage
```

Validação local sem NPM:

```bash
node tests/audit.mjs
```

Emuladores, se o Firebase CLI estiver instalado:

```bash
firebase emulators:start
```

O App Check não é usado por esta versão.
