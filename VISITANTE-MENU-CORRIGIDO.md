# Visitante — menu corrigido

No modo visitante ficam ocultos:
- STAFF
- ADMINISTRAÇÃO
- AVANÇADO
- respectivos submenus

A HOME pública continua disponível.

Correção feita em CSS e JavaScript para evitar que regras visuais com `display:grid !important`
voltem a exibir categorias marcadas como hidden.

Firebase:
Não precisa publicar Firestore Rules nem Storage Rules.
Publique apenas o Hosting/arquivos do site desta versão.
