# 77 TEAM Manager V24 — Criar Firebase novo

## 1. Criar o projeto
1. Acesse o Firebase Console.
2. Crie um projeto novo, por exemplo `77-team-manager-v24`.
3. Crie um aplicativo Web.
4. Copie o objeto `firebaseConfig` para `js/firebase-config.js`.

## 2. Authentication
Em Authentication > Sign-in method, habilite **E-mail/Senha**.

## 3. Firestore
Crie o banco Firestore e publique o arquivo `firestore.rules` desta pasta.

Com Firebase CLI:
```bash
firebase login
firebase use --add
firebase deploy --only firestore:rules,hosting
```

## 4. Primeiro DEV
Como ainda não existe administrador, crie a primeira conta manualmente:

1. Firebase Console > Authentication > Users > Add user.
2. Copie o UID criado.
3. Firestore > coleção `users` > documento com o mesmo UID.
4. Crie os campos:

```text
name: "Seu nome"
email: "seu@email.com"
accessRole: "dev"
memberRole: "Membros"
requestedAccessRole: "dev"
status: "approved"
active: true
```

Depois faça login no site com o e-mail/senha desse usuário.

## 5. Teste obrigatório
1. Abra o site em janela anônima.
2. Solicite uma conta de Membro.
3. Entre como DEV e aprove.
4. Saia.
5. Entre com a nova conta aprovada.
6. Crie uma solicitação de Staff e aprove como DEV.
7. Entre como Staff e confirme que ele consegue aprovar somente solicitações de Membro.

Essa V24 não usa regras, coleções ou permissões do Firebase antigo.
