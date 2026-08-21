# Auditoria — Cargos e Permissões sincronizados

Esta revisão elimina divergências entre a interface e as regras do Firebase.

## Fonte única de verdade

A matriz persistida em `settings/app.rolePermissions` é usada pelo cliente, pelo Firestore e pelo Firebase Storage. Alterações salvas pelo DEV entram em vigor em tempo real no cliente e são avaliadas nas próximas operações do Firebase.

## Correções realizadas

- Removidos fallbacks conflitantes `permission(key, true/false)` das regras do Firestore.
- Criado fallback central `defaultPermission(key)` equivalente aos padrões da interface para instalações antigas/keys ainda não persistidas.
- `staffAccess()` e `adminAccess()` passaram a respeitar diretamente a matriz, sem uma segunda autorização paralela.
- Pagamentos passam a exigir exatamente: `access_staff`, `page_pagamentos` e `payments_manage`.
- RT Presença, Notificações, Atendimento, Chat, Auditoria e Storage passam a usar a mesma matriz.
- Eventos ganharam a permissão `events_manage` para criar/editar/excluir.
- Cada aba navegável ganhou uma permissão `page_*` correspondente na matriz. Assim a visibilidade de cada aba pode ser controlada individualmente dentro dos limites da hierarquia já existente.
- Firebase Storage passou a usar a mesma resolução de cargo legado do Firestore e a mesma matriz para Atendimento, Chat e Personalizar Login.
- Mensagens `permission-denied` deixaram de afirmar incorretamente que as regras não foram publicadas.
- Cache atualizado para `22.9.32-permissionsync1`.

## Segurança preservada

O DEV continua sendo a única conta que pode alterar a própria matriz de permissões e operações críticas explicitamente DEV-only continuam DEV-only. A matriz não cria uma rota para autoelevação de cargo.

## Validação

- `node --check js/main.js`: OK
- `node --check js/ui.js`: OK
- `node --check js/firebase-config.js`: OK
- `node --check js/pdf-generator.js`: OK
- `node tests/audit.mjs`: OK
- Todos os 34 destinos navegáveis possuem uma permissão de aba correspondente.
- `firebase.json`, `manifest.json` e `firestore.indexes.json`: JSON válido.
