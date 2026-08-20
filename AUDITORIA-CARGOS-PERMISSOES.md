# Auditoria — Cargos e Permissões

## Objetivo
Tornar `AVANÇADO → Cargos e Permissões` a matriz oficial e dinâmica de permissões do projeto, mantendo a lógica e a hierarquia existentes.

## Fonte oficial
A matriz é persistida em:

- Firestore: `settings/app.rolePermissions`

O cliente lê essa mesma matriz e o `firestore.rules` também consulta o mesmo documento. O DEV permanece com acesso total por segurança e `access_home` permanece como acesso mínimo obrigatório.

## Correções aplicadas

- Removido o bloqueio fixo que obrigava Staff a manter `requests_approve`, `members_delete` e `members_clan_change` ativos. Agora essas opções seguem a matriz salva pelo DEV.
- A aprovação de solicitações pelo Staff agora exige `requests_approve` também no Firestore.
- Exclusão de membros pelo Staff agora exige `members_delete` também no Firestore.
- Alteração de clã pelo Staff agora exige `members_clan_change` também no Firestore.
- `access_staff` passou a ser respeitado pelas regras das áreas STAFF e não apenas pela interface.
- `access_admin` passou a ser respeitado para leitura de auditoria e alterações administrativas permitidas.
- Listeners sensíveis (pagamentos, suporte, chat, notificações administrativas, XP, auditoria, RT e backups de presença) são reconstruídos automaticamente quando a matriz muda.
- O perfil do usuário autenticado agora é acompanhado em tempo real. Promoção/rebaixamento ou mudança de cargo passa a atualizar a interface e as permissões da sessão sem exigir novo login.
- A tela de STAFF e páginas internas passam a ser ocultadas conforme `canOpenPage()`; a página de Pagamentos não pode mais ser reexibida apenas por `access_staff` quando `payments_manage` estiver desativado.
- O formulário de cadastro/edição manual de membros é ocultado quando `members_edit` estiver desativado.
- O documento `settings/app` é tratado com fallback seguro nas regras caso ainda não exista.
- Cache atualizado para `22.9.32-permfix1`.

## Fluxo após a correção

1. DEV abre `Cargos e Permissões`.
2. Marca/desmarca permissões permitidas pela hierarquia.
3. Clica em `Salvar permissões`.
4. O sistema grava a matriz completa em `settings/app.rolePermissions`.
5. O listener de configurações recebe a mudança em tempo real em todas as sessões.
6. A interface recalcula menus, páginas, botões e formulários.
7. Listeners que dependem de permissão são cancelados/recriados conforme a nova matriz.
8. O Firestore autoriza ou recusa as operações consultando a mesma matriz.

## Validação executada

- `node --check js/main.js` — OK
- `node --check js/ui.js` — OK
- `node --check js/firebase-config.js` — OK
- `node --check js/pdf-generator.js` — OK
- `node tests/audit.mjs` — `Auditoria estática V22.9.32: OK`
- Balanceamento estrutural do `firestore.rules` — OK

## Publicação necessária

Como o `firestore.rules` foi alterado, publique novamente as regras do Firestore junto com os arquivos do site.
