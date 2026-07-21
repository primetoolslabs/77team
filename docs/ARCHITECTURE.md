# Arquitetura V30.0 Foundation

A V30 inicia uma migração segura, mantendo `js/main.js`, `js/ui.js` e `css/style.css` como camada legada compatível.

## Camadas novas
- `css/foundation/`: tokens, layout, tema e responsividade.
- `js/core/`: configuração, permissões e eventos.
- `js/components/`: componentes reutilizáveis.
- `js/modules/`: destino da migração progressiva dos módulos.

## Regra de migração
Cada tela deve ser migrada individualmente e validada antes de remover qualquer função do legado.
