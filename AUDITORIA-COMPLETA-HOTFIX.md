# Auditoria completa — 77 TEAM Manager V22.9.32 Hotfix

Data da revisão: 20/08/2026

## Escopo

Revisão estática e estrutural dos arquivos principais do projeto, preservando a lógica funcional existente. Foram verificados JavaScript, autenticação, criação de usuário, aprovação/rejeição, permissões, regras do Firestore, Storage, PWA/cache, referências de arquivos, IDs do HTML, manifesto, índices e testes internos.

## Correções aplicadas

1. **Teste interno com caminhos contendo espaço**
   - `tests/audit.mjs` usava `URL.pathname`, que convertia espaços em `%20` e fazia o `node --check` procurar um caminho inexistente.
   - Corrigido com `fileURLToPath()`.
   - A mensagem `Auditoria estática ... OK` foi movida para o final, para nunca aparecer antes das verificações de autenticação terminarem.

2. **Aprovação pela Liderança**
   - A interface possui a permissão própria `requests_approve`, mas a criação de `members/{uid}` durante a aprovação ainda podia depender de `members_edit`.
   - Foi criada uma autorização específica `leadershipCanApprovePendingMember()` nas regras.
   - A Liderança agora consegue concluir o mesmo fluxo já permitido pela interface: aprovar Membro ou Staff pendente, criar o registro do membro e reservar o nickname, sem precisar de uma permissão paralela de edição de membros.
   - A hierarquia não foi alterada.

3. **Cadastro novo endurecido no Firestore**
   - O cadastro continua criando exatamente o mesmo perfil `member / Membros / pending / inactive`.
   - As regras agora limitam o documento inicial aos campos esperados e impedem que uma chamada externa injete cargo administrativo ou campos extras durante o cadastro.
   - Não houve mudança no formulário nem no fluxo do usuário.

4. **Mensagem de versão desatualizada**
   - Uma mensagem ainda solicitava `firestore.rules da V22.9.30`.
   - Corrigida para V22.9.32.

5. **Cache/PWA**
   - Identificador alterado para `22.9.32-auditfix1` apenas para garantir que o navegador carregue o JavaScript revisado.
   - A estratégia de cache existente foi preservada.

## Itens validados sem necessidade de alteração

- Login somente com `active: true` e `status: approved`.
- Cadastro cria conta pendente e inativa.
- Firebase Auth secundário evita substituir a sessão principal durante cadastro.
- Exclusão compensatória do usuário Auth quando a criação inicial do perfil falha.
- Recuperação de senha.
- Reenvio seguro de solicitação rejeitada (`rejected -> pending`).
- Verificação de e-mail enviada quando disponível, sem alterar a compatibilidade do login atual.
- Staff continua restrito à aprovação de Membros.
- Liderança continua limitada a Staff e Membros.
- DEV mantém controle total.
- Reserva de nickname e bloqueio de duplicidade.
- Nenhum ID HTML duplicado encontrado.
- Nenhuma referência local de asset quebrada encontrada.
- Todas as chaves de permissões utilizadas no cliente e nas regras possuem definição correspondente.
- JSON de `firebase.json`, `manifest.json` e `firestore.indexes.json` válido.
- Sintaxe de `main.js`, `ui.js`, `firebase-config.js` e `pdf-generator.js` válida no Node.

## Resultado dos testes

- `node --check js/main.js`: OK
- `node --check js/ui.js`: OK
- `node --check js/firebase-config.js`: OK
- `node --check js/pdf-generator.js`: OK
- `node tests/audit.mjs`: **Auditoria estática V22.9.32: OK**
- JSON dos arquivos de configuração: OK
- IDs HTML duplicados: nenhum
- Assets locais referenciados e ausentes: nenhum

## Observação sobre Firebase

Esta auditoria valida código e coerência estrutural do projeto. O ambiente usado na revisão não possui o Firebase CLI instalado, portanto a publicação real das regras e testes contra o seu banco em produção não foram executados daqui. Após substituir os arquivos, publique `firestore.rules` e `storage.rules` no mesmo projeto Firebase configurado em `js/firebase-config.js`.
