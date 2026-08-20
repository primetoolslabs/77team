# Auditoria completa das abas — V22.9.32

## Objetivo
Revisar todas as páginas e abas internas sem alterar a lógica funcional do projeto, corrigindo apenas falhas de integração, navegação, permissões, Firebase/Storage e inconsistências de estado.

## Validações executadas
- 35 seções de página identificadas no HTML.
- 34 destinos navegáveis válidos; `staff-hub` permanece como hub interno e não precisa aparecer como aba própria.
- Nenhum destino de menu aponta para página inexistente.
- 271 controles interativos com ID revisados; nenhum ficou sem referência/handler.
- Abas internas de Configurações conferidas contra seus painéis correspondentes.
- Abas internas de Meu Perfil conferidas contra seus painéis correspondentes.
- 17 coleções Firestore usadas pelo cliente possuem bloco explícito no `firestore.rules`.
- JavaScript principal, UI, Firebase config e gerador de PDF passaram em `node --check`.
- `tests/audit.mjs` ampliado e aprovado.

## Correções aplicadas
1. **RT Presença integrado ao menu STAFF**
   - A página já existia e possuía lógica de leitura, finalização, CSV, impressão e exclusão controlada, mas não aparecia no menu operacional.
   - Adicionada à navegação unificada e ao hub STAFF.
   - Adicionada ao conjunto de páginas protegidas do STAFF.

2. **RT Presença mostra apenas finalizados**
   - Registros `open`, utilizados durante o lançamento da presença, não são mais exibidos como se fossem RTs finalizados.

3. **Firebase Storage alinhado à matriz dinâmica**
   - Atendimento e Chat agora exigem `access_staff + support_manage` para ações administrativas em anexos.
   - Personalização do Login exige `login_customize` no Storage, além de DEV.
   - O usuário continua podendo acessar os próprios anexos conforme a lógica existente.

4. **Cache atualizado**
   - Revisão: `22.9.32-tabsfix1`.
   - Evita reaproveitamento do `main.js` anterior após publicação.

5. **Auditoria automatizada ampliada**
   - Verifica destinos de abas.
   - Verifica correspondência de tabs/panels de Configurações e Meu Perfil.
   - Verifica handlers ligados a elementos existentes.
   - Verifica coleções usadas pelo cliente contra regras Firestore.
   - Verifica integração da matriz de permissões com Storage.
   - Verifica versão de cache/script.

## Observação de publicação
Como `firestore.rules` e `storage.rules` fazem parte do controle real de acesso, publique ambos junto dos arquivos web. O Firebase CLI não está instalado no ambiente de auditoria, portanto a validação realizada foi estrutural/estática e não substitui um teste conectado ao seu projeto Firebase publicado.
