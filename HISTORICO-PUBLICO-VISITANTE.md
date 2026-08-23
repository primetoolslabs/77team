# Histórico público para Visitante

O Visitante agora pode abrir HOME > Histórico.

O histórico exibido é uma cópia sanitizada dentro de `public/home`, limitada aos 250 registros mais recentes não pendentes.

Campos públicos:
- data
- jogador
- cargo
- clã
- tipo
- horário/evento
- status

O Visitante:
- pode consultar e filtrar;
- não recebe acesso à coleção privada `attendance`;
- não pode registrar, editar ou excluir presença;
- não recebe os botões de exportação do Histórico.

Firebase:
Não é necessário alterar/publicar Firestore Rules ou Storage Rules.
Publique o Hosting. Depois, entre uma vez com Staff/Liderança/DEV para gerar o novo snapshot `public/home` versão 2.
