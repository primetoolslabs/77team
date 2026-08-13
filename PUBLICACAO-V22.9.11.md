# Publicação da V22.9.11

Na pasta descompactada, execute:

```bash
firebase use team-f78cd
firebase deploy --only firestore:rules,hosting
```

A publicação do novo `firestore.rules` é obrigatória. Depois, entre uma vez com a conta DEV e aguarde alguns segundos para a migração automática das reservas existentes.

Use `Ctrl+Shift+R` para substituir o cache da V22.9.10.
