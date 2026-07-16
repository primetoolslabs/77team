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


# Versão 6.4 — Áreas restritas

As páginas abaixo agora são exclusivas do Proprietário e da Staff:

- WorldBoss;
- Purgatório;
- Eventos.

A proteção foi aplicada em três níveis:

1. os botões ficam ocultos para membros e visitantes;
2. a navegação bloqueia tentativas de abertura por atalhos;
3. o Firestore permite ler e alterar `attendance` somente para Proprietário e Staff.

## Importante

Publique o novo arquivo `firestore.rules`.


# Versão 6.5 — Informações do personagem

Na aba **Meu Perfil**, cada usuário pode preencher:

- Nickname, usando o mesmo nome do perfil;
- Classe;
- Power;
- Level;
- Codex;
- Mandalla;
- Chi 1;
- Chi 2;
- Chi 3;
- Postura do Sapo;
- Constituição;
- Treino Ermo.

Também foi criada a aba **Personagens**, disponível somente para Proprietário
e Staff, com uma tabela contendo os dados de todos os usuários.

Os dados são salvos no documento `users/{UID}`, no campo `character`.

## Importante

Publique o novo arquivo `firestore.rules`.


# Versão 7.0 — Player Center

A aba **Meu Perfil** foi redesenhada no estilo MMORPG:

- cartão de identidade do jogador;
- avatar grande;
- classe, clã, Power, Level e ranking;
- barra de progresso;
- medalhas;
- cards de desempenho;
- resumo completo do personagem;
- linha do tempo;
- configurações de nickname, avatar e senha;
- editor dos dados do personagem.

O menu lateral foi reorganizado em grupos:

- Principal;
- Eventos;
- Gestão;
- Administração.

Também foram refinados:

- espaçamento;
- altura dos botões;
- alinhamento dos ícones;
- tamanho da logo;
- separação visual das áreas.

Firebase, Firestore, regras, permissões, PDF e demais funções foram preservados.


# Versão 7.1 — Central de Personagens

A aba Personagens agora possui:

- resumo geral;
- total de personagens;
- maior Power;
- maior Level;
- classe mais usada;
- filtros por classe, cargo e clã;
- ordenação por Power, Level, Codex e nickname;
- visualização em cartões;
- visualização em tabela;
- painel lateral de detalhes;
- PDF geral;
- PDF individual.

Os PDFs são gerados pela impressão nativa do navegador.
Escolha **Salvar como PDF** na tela de impressão.

Firebase, Firestore e regras foram preservados.


# Versão 7.2 — Central de Histórico

A aba Histórico agora possui:

- indicadores de total, hoje, semana e mês;
- filtros por nickname, período, cargo, clã, tipo e status;
- visualização em timeline;
- visualização em tabela;
- gráficos de participação por tipo;
- Top 5 membros mais ativos;
- painel lateral de detalhes;
- PDF geral;
- PDF filtrado;
- PDF individual;
- exportação CSV compatível com Excel.

Firebase, Firestore e regras foram preservados.


# Versão 9.0 — Enterprise Edition

A v9.0 consolida as atualizações anteriores e adiciona:

- Central Administrativa por categorias;
- identidade, equipe e contatos;
- matriz visual de permissões;
- horários, pontuação e regras de presença;
- configuração de eventos;
- classes e limites de personagens;
- notificações e campo opcional de webhook do Discord;
- temas, densidade, animações e neon;
- backup completo em JSON;
- restauração por mesclagem;
- painel de saúde do sistema;
- metas da equipe com progresso automático;
- histórico de versões e tela Sobre.

## Backup

O backup JSON contém documentos carregados pelo painel e configurações.
Ele não exporta senhas nem contas do Firebase Authentication.

## Firestore

As regras da versão 7.2 continuam compatíveis. Não é obrigatório republicá-las.


# Versão 9.1 — Correção da Central de Configurações

Correções realizadas:

- menu interno das Configurações movido para `ui.js`;
- troca independente entre todas as categorias;
- somente o painel selecionado fica visível;
- botão ativo destacado;
- busca das categorias funcionando;
- categoria selecionada preservada durante a sessão;
- rolagem retorna ao topo ao trocar de categoria;
- atributos de acessibilidade adicionados;
- navegação continua funcionando mesmo se outra função do `main.js` falhar.

Não houve alteração nas regras do Firestore.


# Versão 10.0 — Staff Command Center

A aba Staff foi transformada em uma central operacional com:

- indicadores da equipe;
- cartões dos integrantes da Staff;
- perfil lateral individual;
- central de pendências;
- agenda administrativa;
- metas coletivas;
- atividade administrativa agregada;
- diário administrativo;
- central de avisos;
- ferramentas rápidas;
- PDF da equipe Staff;
- exportação CSV compatível com Excel;
- backup rápido.

Não existe ranking entre integrantes da Staff.

Firebase, Firestore, permissões, histórico, personagens, metas,
configurações e demais funções foram preservados.


## Correção estrutural da v10.0

Foram restauradas as páginas que apareciam no menu, mas estavam ausentes
no HTML herdado da versão anterior:

- Meu Perfil;
- Metas;
- Estatísticas;
- Calendário.

Isso evita botões sem resposta no menu lateral.


# Versão 10.1 — Sistema de Level e XP

Cada membro agora possui:

- XP automático;
- XP manual;
- XP total;
- Level;
- título;
- progresso até o próximo Level.

## XP automático

Os valores são carregados de **Configurações → Presenças**:

- presença comum;
- participação em evento;
- ausência.

A progressão padrão usa:

- Level 1 → 2: 500 XP;
- cada próximo Level exige mais 250 XP que o anterior.

## Títulos

- Level 1–4: Recruta;
- Level 5–9: Combatente;
- Level 10–19: Veterano;
- Level 20–29: Elite;
- Level 30–49: Mestre;
- Level 50+: Lenda da 77 TEAM.

## Ajustes manuais

Proprietário e Staff podem conceder ou remover XP na aba Staff.
Todo ajuste exige motivo e é registrado na coleção `xpLogs`.

## Importante

Publique o novo arquivo `firestore.rules`.


# Versão 10.2 — Meu Perfil restaurado

A aba **Meu Perfil** foi restaurada exatamente ao layout usado na v10.0.

O sistema de Level e XP continua ativo em:

- Membros;
- Staff;
- histórico de ajustes;
- cálculo automático por presenças e eventos.

Foram removidos apenas os elementos extras de Level/XP que haviam sido adicionados
diretamente ao layout do Meu Perfil na v10.1.

As regras do Firestore continuam sendo as mesmas da v10.1.


# Versão 10.3 — Meu Perfil da v7.0

A aba Meu Perfil foi restaurada diretamente do projeto v7.0 enviado,
mantendo as funcionalidades atuais da v10.2:

- Level e XP;
- Staff Command Center;
- Personagens;
- Histórico;
- Configurações;
- Metas;
- PDFs e exportações.

As regras do Firestore continuam sendo as mesmas da v10.1.


# Versão 11.0 — Estabilidade

- removidos controladores antigos e incompatíveis;
- Staff disponível para Proprietário e Staff;
- tabela Membros corrigida com Level, Título e XP;
- histórico individual consultado por `userId`;
- novos registros recebem `userId`;
- migração automática de históricos antigos;
- membros acessam somente o próprio histórico;
- Staff e Proprietário continuam acessando todos.

Publique o novo `firestore.rules` e entre uma vez como Proprietário ou Staff
para executar a migração dos históricos antigos.


# Versão 12.1 — Dashboard isolado

Esta versão foi reconstruída diretamente sobre a V11 estável.

Somente a aba **Visão Geral** recebeu o design Enterprise da V12.

Foram preservados integralmente da V11:

- Meu Perfil;
- Membros;
- Histórico;
- Ranking;
- WorldBoss;
- Purgatório;
- Eventos;
- Personagens;
- Metas;
- Estatísticas;
- Calendário;
- Solicitações;
- Staff Command Center;
- Configurações;
- Auditoria;
- Level e XP;
- PDFs;
- exportações;
- Firebase;
- permissões;
- migração de históricos.

Nenhuma função original do `main.js` da V11 foi removida ou reescrita.
