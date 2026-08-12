# Publicação da V22.8.9

## 1. Publicar o projeto

Na pasta do projeto, execute:

```bash
firebase deploy --only hosting,firestore:rules,storage
```

Os arquivos de regras ficam na raiz:

- `firestore.rules`
- `storage.rules`

## 2. App Check

Esta versão não utiliza App Check. No Firebase Console, mantenha Cloud Firestore e Storage apenas em **Monitorando** ou **Não aplicado**. Não habilite enforcement, pois o aplicativo não envia tokens do App Check.

Não coloque senha, chave privada, conta de serviço ou token administrativo nos arquivos do site.

## 3. Atualização do primeiro DEV

O botão **Configurar primeiro DEV** aparece no login, mas a criação somente será aceita quando:

- não existir `system/owner`;
- existir `system/bootstrap` com `allowedEmail` correto;
- o usuário autenticado usar exatamente esse e-mail.

Depois da criação, o bootstrap é removido. A senha do DEV não está incluída no pacote.
