# HOME — Presenças para todos

A HOME agora exibe uma tabela de Presenças para:
- Visitante
- Membro
- Staff
- Liderança
- DEV

Visitantes recebem os registros pelo snapshot sanitizado `public/home`.
A HOME pública publica até as 50 presenças mais recentes, sem liberar escrita nem acesso direto à coleção privada de presenças.

IMPORTANTE: esta alteração muda o conteúdo gravado em `public/home`, mas não exige alteração de Firestore Rules.
Publique o Hosting. Depois, entre uma vez com um perfil administrativo para o snapshot público ser atualizado com a nova lista.
