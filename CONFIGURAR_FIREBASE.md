# CONFIGURAÇÃO DO NOVO FIREBASE — 77 TEAM

Projeto conectado:

- Project ID: `team-f78cd`
- Auth Domain: `team-f78cd.firebaseapp.com`
- Proprietário autorizado: `pimentelsolution1@gmail.com`

## 1. Authentication

No Firebase:

1. Abra **Authentication**.
2. Clique em **Começar**.
3. Abra **Método de login**.
4. Selecione **E-mail/Senha**.
5. Ative somente **E-mail/Senha**.
6. Clique em **Salvar**.

## 2. Firestore Rules

1. Abra **Firestore Database → Regras**.
2. Apague as regras atuais.
3. Copie todo o conteúdo de `firestore.rules`.
4. Clique em **Publicar**.

## 3. Primeiro acesso

Depois de publicar o site:

1. Abra o sistema.
2. Clique em **Primeiro acesso**.
3. Use o e-mail:
   `pimentelsolution1@gmail.com`
4. Crie uma senha de no mínimo 6 caracteres.
5. Clique em **Criar proprietário**.

Esse processo cria automaticamente:

- conta no Authentication;
- `users/UID` com perfil owner;
- `system/owner`.

## 4. Teste completo

Faça nesta ordem:

1. Login do proprietário.
2. Cadastro manual de um membro.
3. Cadastro público de teste.
4. Aprovação pela aba Solicitações.
5. Criação de uma conta Staff.
6. Marcação de WorldBoss.
7. Marcação de Purgatório.
8. Marcação de Evento.
9. Conferência no Histórico e Ranking.
10. Teste de visitante sem login.

## 5. Publicação

Envie todos os arquivos do projeto ao GitHub Pages, mantendo as pastas:

- `assets/`
- `css/`
- `icons/`
- `js/`

Não envie somente o `index.html`.
