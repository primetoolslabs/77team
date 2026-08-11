# 77 TEAM Manager V22.8.4 🟠 Hotfix — Auditoria & Segurança

Base: V22.8.3.

## Correções
- Corrigida a incompatibilidade do Reset Global para DEV e Liderança nas regras do Firestore.
- Staff não pode mais alterar cargos de membros aceitos nem excluir membros.
- Exclusão de membros limitada a DEV e Liderança, respeitando a matriz configurável.
- A matriz configurável passou a ser aplicada às operações críticas de solicitações, cargos, presença, personagens, notificações e auditoria.
- Regras do Firestore passaram a consultar a matriz de permissões salva em `settings/app.rolePermissions`.
- Restauração de presença preserva IDs originais e evita duplicação por IDs aleatórios.
- Backups novos preservam `originalId` de Presenças e RTs.
- `Administrador/admin` legado passa a ser interpretado como Liderança, e não como DEV.
- Storage usa `accessRole` com fallback para `role`, melhorando compatibilidade com contas atuais e legadas.
- Discord Webhook passa a ser salvo em `settings/private`, com leitura restrita ao DEV; o campo público é removido quando as configurações de notificações são salvas.
- Identificação interna atualizada para V22.8.4.

## Clãs oficiais
- 77 Team I
- 77 Team II
- 77 Team III
- Projeto X

## Observação de implantação
Publique `firestore.rules` e `storage.rules` desta versão junto com os arquivos do site.
