# 77 TEAM Oficial 2.0

Versão nova e limpa conectada ao Firebase `team-f78cd`.

## Antes de publicar

1. No Firebase Authentication, ative E-mail/Senha.
2. No Firestore, apague o documento antigo `system/owner`.
3. Se quiser começar realmente do zero, apague também:
   - users
   - members
   - attendance
   - audit
4. Publique o arquivo `firestore.rules`.
5. Envie todos os arquivos ao GitHub Pages.
6. Abra o site imediatamente.
7. A tela **Configurar sistema** aparecerá automaticamente.
8. Crie o proprietário usando `primetoolslabs@gmail.com`.

## Estrutura

- `index.html`
- `css/style.css`
- `js/firebase-config.js`
- `js/ui.js`
- `js/main.js`
- `firestore.rules`
- `manifest.json`
- `service-worker.js`
