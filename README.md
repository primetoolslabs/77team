# 77 TEAM Oficial 2.0

Versão nova e limpa conectada ao Firebase `team-f78cd`.

## Antes de publicar

1. No Firebase Authentication, ative E-mail/Senha.
2. No Firestore, apague o documento antigo `system/owner`.
3. Se quiser começar realmente do zero, apague também:
   - users
   - members
   - attendance
   - audit
4. Publique o arquivo `firestore.rules`.
5. Envie todos os arquivos ao GitHub Pages.
6. Abra o site imediatamente.
7. A tela **Configurar sistema** aparecerá automaticamente.
8. Crie o proprietário usando `primetoolslabs@gmail.com`.

## Estrutura

- `index.html`
- `css/style.css`
- `js/firebase-config.js`
- `js/ui.js`
- `js/main.js`
- `firestore.rules`
- `manifest.json`
- `service-worker.js`


## Novo dashboard da Visão geral

A Visão geral agora contém:

- cards de membros, presenças do dia, eventos do mês e Top 1;
- presenças recentes;
- Top 5 do ranking;
- lista completa de membros;
- busca rápida;
- atalhos para histórico, ranking e novo membro.

Firebase, autenticação, regras, cadastros e presença foram preservados.


## Logo vertical

A logo foi atualizada para o formato vertical com:

- cobra;
- número 77;
- texto TEAM;
- texto 77 TEAM;
- subtítulo PAINEL DE CONTROLE.

Aplicada na tela de carregamento, login, configuração inicial,
menu lateral e ícones do aplicativo.

Nenhuma funcionalidade foi alterada.


## Menu lateral com ícones
Ícones adicionados sem alterar regras ou Firebase.


## Versão 3.1

Visual completo aplicado:

- fundo escuro;
- cabeçalho com boas-vindas;
- nome real do usuário;
- perfil e badge no topo;
- menu lateral neon;
- logo vertical;
- cards e tabelas no estilo do mockup;
- rodapé profissional;
- responsividade para celular.

Firebase, regras do Firestore, autenticação, permissões e presença foram preservados.


## Tabelas aprimoradas

O novo padrão visual foi aplicado em:

- WorldBoss;
- Purgatório;
- Eventos;
- Histórico;
- Ranking;
- Membros;
- Solicitações;
- Staff;
- Auditoria.

Inclui divisórias verticais e horizontais, linhas alternadas, hover,
cabeçalhos mais claros, borda neon, maior espaçamento e botões de presença
mais visíveis.

Nenhuma regra, consulta ou função do sistema foi alterada.


## Versão 4.0

Novos recursos:

- perfil lateral completo do membro;
- níveis automáticos;
- medalhas automáticas;
- central de notificações;
- estatísticas gerais e por membro;
- calendário de eventos;
- criação de eventos;
- painel administrativo de aparência e horários;
- configurações salvas no Firestore.

### Novas coleções

- `events`
- `notifications`
- `settings`

É obrigatório publicar o novo `firestore.rules`.
