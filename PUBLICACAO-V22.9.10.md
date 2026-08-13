# Publicação da V22.9.10

Na pasta descompactada, execute:

```bash
firebase use team-f78cd
firebase deploy --only firestore:rules,hosting
```

A publicação do `firestore.rules` é obrigatória para ativar a validação verificável dos nicknames e permitir a restauração controlada de `nicknameClaims` pelo DEV.

Depois da publicação, use `Ctrl+Shift+R` para substituir o cache da V22.9.9.
