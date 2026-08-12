# Publicação da V22.9.3

Publique obrigatoriamente as regras e o Hosting:

```bash
firebase deploy --only firestore:rules,storage,hosting
```

Pelo Console Firebase:

1. Publique `firestore.rules` em **Firestore Database → Regras**.
2. Publique `storage.rules` em **Storage → Rules**.
3. Publique todos os arquivos no Hosting.
4. Mantenha o App Check em **Monitorando** ou **Não aplicado**.
5. Recarregue com `Ctrl + Shift + R`.

Sem o novo `firestore.rules`, Liderança e Staff não conseguirão salvar Metas.
