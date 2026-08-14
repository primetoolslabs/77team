# Publicação da V22.9.20

Valide antes de publicar:

```bash
node tests/audit.mjs
```

Publique todos os componentes:

```bash
firebase deploy --only hosting,firestore:rules,firestore:indexes,storage
```

Depois da publicação, recarregue duas vezes ou use **Avançado → Limpeza de cache** para remover do navegador a tela de login anterior.
