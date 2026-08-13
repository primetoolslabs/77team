# Publicação da V22.9.5

As novas regras são obrigatórias para sincronizar XP e Level com segurança:

```bash
firebase deploy --only firestore:rules,storage,hosting
```

Depois da publicação:

1. Entre uma vez como DEV para sincronizar a progressão existente dos membros.
2. Atualize o navegador com `Ctrl + Shift + R`.
