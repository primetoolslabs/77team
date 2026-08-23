# Firebase Deploy — 22.9.33-firebasedeploy1

Esta versão mantém o `firestore.rules` corrigido e adiciona publicação pela Firebase CLI.

## Windows
- `PUBLICAR-FIRESTORE-RULES.bat` publica somente as regras.
- `PUBLICAR-TUDO.bat` publica regras + Hosting.
- `DIAGNOSTICAR-FIREBASE.bat` mostra Node, Firebase CLI, login, projetos e projeto ativo.

## Importante
Erro HTTP 503 é uma resposta do serviço remoto do Firebase.
Nenhum arquivo local consegue impedir uma indisponibilidade do servidor.
O objetivo desta versão é evitar depender do editor web do Console e publicar pela CLI oficial.

## Firebase
- Publicar `firestore.rules`.
- Depois publicar o Hosting.
- Não precisa publicar `storage.rules`.
