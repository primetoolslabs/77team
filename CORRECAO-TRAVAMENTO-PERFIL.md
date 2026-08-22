# Correção de travamento — Meu Perfil

Versão: 22.9.32-profilefix1

Correções:
- removidos MutationObservers cosméticos do Meu Perfil;
- eliminado ID duplicado `profileTimeline`;
- CSS, ui.js e main.js agora usam a MESMA versão de cache;
- Service Worker atualizado para ativar a versão nova imediatamente;
- elementos decorativos não interceptam cliques;
- campos, botões e controles do Meu Perfil forçam pointer-events habilitado;
- `.hidden` de modais/drawers força display:none.

Firebase:
NÃO precisa publicar firestore.rules nem storage.rules.
Atualize somente os arquivos do site e recarregue a página.
