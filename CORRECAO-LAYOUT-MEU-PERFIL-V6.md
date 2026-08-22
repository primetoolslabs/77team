# Meu Perfil V6 — correção de layout

Causa encontrada:
O CSS de `.profile-game-tabs` havia sido removido durante a limpeza das versões antigas.
Por isso as abas eram exibidas verticalmente e empurravam o dashboard para baixo.

Correções:
- barra de abas horizontal e compacta;
- conteúdo ativo começa imediatamente abaixo das abas;
- breadcrumb interno duplicado ocultado;
- regras antigas de `.profile-menu` neutralizadas no Meu Perfil;
- controles permanecem clicáveis;
- layout responsivo preservado;
- cache atualizado para `22.9.32-profilev6`.

Firebase:
Não precisa publicar Firestore Rules nem Storage Rules.
Como `firebase.json` contém os headers de cache do Hosting, publique o Hosting completo desta versão.
