# Publicação da V22.9.9

Na pasta descompactada, execute:

```bash
firebase use team-f78cd
firebase deploy --only firestore:rules,hosting
```

O novo `firestore.rules` é obrigatório porque inclui a coleção `nicknameClaims` e a proteção atualizada do membro vinculado.

Após publicar, recarregue o navegador com `Ctrl+Shift+R` para substituir o cache da V22.9.8.
