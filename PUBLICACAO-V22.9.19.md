# Publicação da V22.9.19 Stable

Execute a validação antes da publicação:

```bash
node tests/audit.mjs
```

Publique todos os componentes juntos:

```bash
firebase deploy --only hosting,firestore:rules,firestore:indexes,storage
```

Depois da publicação, recarregue o sistema duas vezes ou use **Avançado → Limpeza de cache** para ativar o novo Service Worker.

O Firebase App Check não é utilizado nesta versão.
