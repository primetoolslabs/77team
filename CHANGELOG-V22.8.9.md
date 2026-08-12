# 77 TEAM Manager V22.8.9 🟠 Hotfix — Sem App Check

- Firebase App Check removido integralmente do código do aplicativo.
- Removida a importação e inicialização do SDK `firebase-app-check`.
- Removida a chave `APP_CHECK_SITE_KEY` da configuração.
- Removido o módulo App Check do cache do Service Worker.
- Removidos domínios do reCAPTCHA da política de segurança.
- Guia de publicação atualizado para manter Firestore e Storage sem enforcement.
- Todas as 13 correções de segurança e recuperação da V22.8.8 foram preservadas.

## Publicação

```bash
firebase deploy --only hosting,firestore:rules,storage
```

No Firebase Console, o Cloud Firestore pode permanecer em **Monitorando**. Não ative enforcement do App Check.
