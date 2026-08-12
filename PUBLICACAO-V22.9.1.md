# Publicação da V22.9.1

Publique obrigatoriamente o site e as regras novas:

```bash
firebase deploy --only firestore:rules,storage,hosting
```

Ou pelo Console Firebase:

1. Publique `firestore.rules` em **Firestore Database → Regras**.
2. Publique `storage.rules` em **Storage → Rules**.
3. Envie todos os arquivos do site para o Hosting.
4. Mantenha o App Check em **Monitorando** ou **Não aplicado**.
5. Recarregue o site com `Ctrl + Shift + R`.
6. Entre novamente para registrar a primeira sessão da V22.9.1.
7. Em **AVANÇADO → Status do Firebase**, execute o diagnóstico.

Sem o novo `firestore.rules`, a lista de sessões apresentará erro de permissão.
