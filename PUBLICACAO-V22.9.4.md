# Publicação da V22.9.4

Publique o site e as regras atualizadas:

```bash
firebase deploy --only firestore:rules,storage,hosting
```

Depois da publicação, faça uma atualização completa no navegador com `Ctrl + Shift + R`.

O `firestore.rules` desta versão é obrigatório para liberar os indicadores gerais da HOME às contas aprovadas sem permitir alterações indevidas.
