# 77 TEAM Manager V23.0.0 — Configuração do NOVO Firebase

Esta versão NÃO usa o Firebase antigo. Crie um projeto novo no Console Firebase e siga estes passos.

## 1. Criar o projeto
1. Firebase Console → Adicionar projeto.
2. Adicione um App Web.
3. Em Authentication → Sign-in method, ative **E-mail/senha**.
4. Crie o **Cloud Firestore** em modo de produção.
5. Ative o **Storage**.

## 2. Conectar o site
Copie a configuração Web do Firebase e substitua os valores de `js/firebase-config.js`.
O arquivo entregue contém somente placeholders e não aponta para `team-f78cd`.

## 3. Publicar as regras
Na pasta do projeto, usando Firebase CLI:

```bash
firebase login
firebase use --add
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## 4. Criar o primeiro DEV
No Firebase Authentication, crie manualmente o usuário DEV e copie o UID.
Depois, no Firestore, crie o documento `users/UID_DO_DEV` com estes campos:

```json
{
  "name": "Administrador",
  "email": "SEU_EMAIL",
  "role": "dev",
  "accessRole": "dev",
  "memberRole": "Membros",
  "clan": "",
  "active": true,
  "status": "approved",
  "firstLogin": false,
  "profileCompleted": true
}
```

## 5. Fluxo novo de cadastro e aprovação
- Novo usuário cria conta → `users/{uid}` nasce como `member`, `pending`, `active:false`.
- DEV/Liderança/Staff consegue listar as solicitações.
- Staff pode aprovar somente cargos de Membro.
- Liderança pode aprovar Staff ou Membro.
- DEV pode aprovar qualquer cargo.
- A aprovação grava `users`, `members` e `nicknameClaims` em um único batch.
- O usuário aprovado consegue entrar imediatamente porque o login depende apenas de `status: approved` e `active: true`.

## 6. Publicar o site
Depois de configurar o Firebase novo, publique o conteúdo da pasta. Se usar Firebase Hosting:

```bash
firebase deploy
```

## Importante
Não copie coleções, regras ou documentos `settings` do Firebase antigo antes de validar o fluxo novo. Primeiro teste com uma conta DEV, uma conta Staff e uma solicitação de Membro.
