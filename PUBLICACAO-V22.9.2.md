# Publicação da V22.9.2

Publique o Hosting e as regras desta versão:

```bash
firebase deploy --only firestore:rules,storage,hosting
```

Pelo Console Firebase:

1. Publique `firestore.rules` em **Firestore Database → Regras**.
2. Publique `storage.rules` em **Storage → Rules**.
3. Publique todos os arquivos no Firebase Hosting.
4. Mantenha o App Check em **Monitorando** ou **Não aplicado**.
5. Recarregue o sistema com `Ctrl + Shift + R`.

O novo `firestore.rules` é necessário para o Diário Administrativo da Liderança.
