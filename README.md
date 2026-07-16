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


# 77 TEAM Manager

Esta versão transforma o painel em uma plataforma com identidade própria:

- nome oficial: **77 TEAM Manager**;
- cabeçalho e login atualizados;
- identidade de produto no menu lateral;
- manifest e PWA renomeados;
- visual refinado para uso como sistema oficial da equipe.

## Funcionalidades preservadas

- Firebase Authentication;
- Firestore;
- proprietário, Staff, membros e visitantes;
- WorldBoss, Purgatório e Eventos;
- histórico e ranking;
- calendário, notificações e estatísticas;
- auditoria e configurações.

Os arquivos de Firebase, regras e lógica central foram preservados.


## Exportação do Histórico em PDF

A página Histórico agora possui:

- **Baixar PDF geral**: exporta todos os registros de presença.
- **Baixar PDF individual**: permite selecionar um membro e exportar somente o histórico dele.

Os PDFs incluem:

- data;
- tipo de atividade;
- horário ou evento;
- membro;
- clã;
- cargo;
- status de presença.

A geração ocorre no navegador e não cria novas coleções no Firebase.
Não é necessário alterar o `firestore.rules`.


## Correção do PDF

O gerador não depende mais de bibliotecas externas.

Ao clicar em **Gerar PDF geral** ou **Gerar PDF individual**:

1. abre uma página formatada para impressão;
2. o diálogo do navegador aparece automaticamente;
3. escolha **Salvar como PDF**;
4. selecione a pasta e salve.

Caso nada abra, permita pop-ups para o endereço do GitHub Pages.


# 77 TEAM Manager 5.0 estável

Correções:

- navegação protegida quando `pageTitle` não existe;
- cabeçalho e cartão do usuário não falham quando um elemento estiver ausente;
- exportação PDF usa impressão nativa;
- popup de impressão mais compatível;
- tratamento global de erros;
- Firebase, Firestore, regras e permissões preservados.

Para o PDF, permita pop-ups no GitHub Pages e escolha **Salvar como PDF**.


# 77 TEAM Manager 6.0

Esta versão é focada em UI/UX profissional.

Melhorias:

- sidebar mais compacta;
- logo reduzida;
- cabeçalho 15–20% menor;
- pesquisa global de membros;
- relógio em tempo real;
- cards com proporções melhores;
- animação de contadores;
- transições suaves entre páginas;
- tabelas mais limpas;
- espaçamento consistente;
- responsividade refinada.

Firebase, Firestore, regras, permissões, PDF, notificações,
calendário e demais funcionalidades foram preservados.


## Versão 6.1
Removido o texto Profissional e mantido apenas o selo discreto v6.0.


## Versão 6.2 — Meu Perfil
Cada usuário pode acompanhar progresso, alterar nickname, senha e avatar. Publique o novo firestore.rules.


## Versão 6.2.1 — correção do perfil

Corrigido o erro:

`ReferenceError: setValue is not defined`

A função segura `setValue()` foi adicionada ao `main.js`, permitindo preencher
o campo de nickname na aba Meu Perfil sem interromper a aplicação.

Não houve mudança nas regras do Firebase ou na lógica de permissões.


# Versão 6.3 — Perfil corrigido

Correções e melhorias:

- adicionado o helper seguro `on()`;
- corrigido o erro `ReferenceError: on is not defined`;
- avatar centralizado automaticamente;
- recorte quadrado automático;
- redimensionamento para 256×256;
- compressão da imagem;
- pré-visualização antes de salvar;
- suporte a JPG, PNG e WebP;
- limite de 8 MB no arquivo original.

As regras do Firestore são as mesmas da versão 6.2.
