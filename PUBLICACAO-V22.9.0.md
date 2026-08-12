# Publicação da V22.9.0

1. Extraia o ZIP e publique a pasta inteira no Firebase Hosting.
2. No Firebase Console, abra **Firestore Database → Regras**.
3. Substitua o conteúdo pelo arquivo `firestore.rules` desta versão e clique em **Publicar**.
4. Em **Storage → Rules**, publique também `storage.rules`.
5. Não ative a aplicação obrigatória do App Check para Firestore ou Storage.
6. Recarregue o site com `Ctrl + Shift + R` para trocar o cache PWA para V22.9.0.
7. Entre como DEV e abra **Avançado → Cargos e Permissões**.
8. Ajuste a matriz e clique em **Salvar permissões**.

Via Firebase CLI, dentro da pasta extraída:

```bash
firebase deploy --only firestore:rules,storage,hosting
```
