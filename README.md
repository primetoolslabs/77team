# 77 TEAM Manager — V22.5 Stable

## Purple Edition

- Base funcional preservada da V21.2.4 Stable.
- Tela de login reconstruída com identidade roxa, prata e dourada.
- Logo oficial integrada ao topo do painel.
- Fundo de fantasia em tela cheia.
- Botão principal roxo com efeito de brilho.
- Login, Firebase, visitante, cadastro, permissões e módulos mantidos.
- Layout responsivo para desktop e celular.

---

Correção visual da tela de login para aproximá-la do modelo aprovado.

- Fundo em tela cheia baseado no conceito aprovado.
- Painel central redimensionado e reposicionado.
- Logo integrada ao topo do painel.
- Espaçamentos, proporções e rodapé corrigidos.
- Autenticação, Firebase, visitante, cadastro, permissões e módulos preservados da V21.2.4 Stable.


## V22.4 — Login com logo integrada

- Remove a logo lateral da tela de acesso.
- Substitui a logo pequena do topo pela identidade completa 77 TEAM Manager.
- Centraliza todo o login em uma única coluna responsiva.
- Mantém intactos Firebase, autenticação, permissões, cadastro e acesso como visitante.

# 77 TEAM Manager V22.3 — Visual Identity

Base funcional: **V21.2.4 Stable**.

## Alterações
- Nova identidade visual oficial com logo 77 TEAM Manager em roxo, prata e dourado.
- Logo aplicada na tela de login sem alterar a autenticação.
- Paleta roxa integrada aos campos, botões e efeitos de foco.
- Layout responsivo preservado.
- Firebase, permissões, módulos e funcionalidades da base original mantidos.

---

# 77 TEAM Manager — V21.2 🟢 Stable

- Modo manutenção informativo em **Avançado**.
- Todos continuam com acesso normal.
- Aviso configurável no login e dentro do painel.
- Título, mensagem, imagem por URL e previsão de término.
- Configuração salva no Firestore em `settings/app.maintenance`.

---

## V21.0.1 — Ajuste global de layout

- Removido o contorno externo do menu interno em todas as páginas.
- Eliminada a barra de rolagem horizontal causada pelo deslocamento lateral.
- Conteúdo ajustado automaticamente à largura útil da tela.
- Tabelas largas continuam com rolagem apenas dentro do próprio componente.
- Mantida a navegação responsiva em desktop, tablet e celular.

# 77 TEAM Manager — V21.0.1 🟢 Stable

## Novidades da V21.0.1

- Navegação principal simplificada em HOME, STAFF, ADMINISTRAÇÃO e AVANÇADO.
- Menu interno persistente em todas as categorias, seguindo o padrão de Configurações.
- Menu principal permanece visível durante a navegação.
- Breadcrumb automático para indicar a categoria e a página atual.
- Sobre permanece fixo acima do botão Sair.
- Permissões e funcionalidades da V20.9 foram preservadas.

---

# 77 TEAM Manager V21.0.1 🟢 Stable


## Novidades da V21.0.1

- A antiga categoria **GESTÃO** foi substituída por **STAFF**.
- Presenças e Consultar Registros foram movidos para o Hub STAFF.
- Ao clicar em STAFF, abre uma página central no estilo da aba Configurações.
- Menu interno com Presenças, Personagens, Solicitações, Notificações, Atendimento, Chat Privado, Consultar Registro e Meta.
- Cards responsivos e clicáveis para acesso rápido aos módulos.
- Acesso restrito a DEV, Liderança e Staff.
- Toda a lógica anterior e as páginas originais foram preservadas.

## Novidades da V20.8

- Nova aba **📁 Registros**, disponível para DEV, Liderança e Staff.
- Consulta **Geral** e **Individual** de presenças.
- Filtros por membro, período, evento, horário, status, clã e responsável.
- Exportação em **PDF/impressão**, **Excel (.xls)** e **CSV**.
- Indicadores de presentes, justificados e ausentes conforme os filtros.
- A aba **📅 Presenças** permanece como o único local para registrar e editar marcações.
- Os registros são consultados diretamente da coleção existente `attendance`, sem duplicação de dados.

---

# 77 TEAM Manager — V20.6

## Novidades da V20.4

- Assistente de primeiro acesso para novos usuários.
- Redirecionamento automático para **Meu Perfil → Dados da conta**.
- Bloqueio temporário das demais áreas até concluir o perfil.
- Progresso visual e checklist de Nickname, Classe, Power, Level e Codex.
- Liberação automática do sistema após salvar os dados obrigatórios.
- Registro da conclusão na Auditoria.
- Usuários antigos sem os novos campos permanecem liberados.

> Publique também o arquivo `firestore.rules` atualizado.

---


## Atualização do chat privado

- Botão **Finalizar chat** disponível para DEV, Liderança e Staff.
- Chats finalizados são movidos para a aba **Finalizados**.
- Conversas finalizadas ficam somente para consulta dos responsáveis.
- O usuário deixa de ver a conversa finalizada e pode iniciar um novo chat.
- Cada novo chat recebe um identificador próprio.
- Imagens continuam aceitas em PNG, JPG e WEBP, com limite de 5 MB.
- Todas as funcionalidades anteriores foram preservadas.

## Publicação obrigatória

Publique também `firestore.rules` e `storage.rules` no Firebase.

# 77 TEAM Manager V20.2

## Principais correções

- DEV, Liderança e Staff podem aprovar e rejeitar solicitações.
- DEV pode atribuir os cargos DEV, Liderança, Staff e cargos comuns.
- Liderança pode atribuir Staff e cargos comuns.
- Staff pode atribuir somente cargos comuns.
- Alterações de cargo e decisões de solicitações são registradas na auditoria.
- Regras do Firestore revisadas para validar a hierarquia no servidor.
- Compatibilidade preservada com os cargos legados `owner` e `lideranca`.

## Publicação obrigatória

Depois de enviar os arquivos do site, publique também o arquivo `firestore.rules` no Firebase Console. Sem essa etapa, Staff e Liderança poderão receber erro de permissão ao aprovar solicitações.

# 77 TEAM Manager — Versão 16.1

Base oficial: **V16.0**  
Compilação: **17/07/2026**

## Revisão da V16.1

- Correção de referências visuais antigas de versão (9.1, 15.2 e 16.0).
- Central de atualizações revisada com base estável e data de compilação.
- Backup JSON passa a identificar a V16.1 e a base V16.0.
- Manifesto e parâmetros de cache atualizados.
- Varredura de sintaxe JavaScript, IDs HTML, referências locais e integridade do pacote.
- Nenhuma alteração intencional na configuração do Firebase ou nas regras de negócio principais.

---

# 77 TEAM Manager V15.2 — Revisão de estabilidade

Esta versão revisa a V15.0 e corrige o sistema de notificações, segurança de leitura individual, validações e cache de versão.

## Publicação obrigatória

Publique **todos os arquivos do projeto** e substitua também as regras do Firestore pelo arquivo `firestore.rules` desta versão. Depois, atualize o navegador com `Ctrl + F5`.

## Verificações executadas

- Sintaxe dos arquivos JavaScript.
- Referências de arquivos locais.
- IDs duplicados no HTML.
- Permissões de Liderança, Staff e Membro.
- Fluxo das notificações para todos e individual.
- Isolamento das leituras de notificações por usuário.
- Validação de campos e proteção básica contra HTML inserido nas notificações.

## V15.0
- Corrige a exibição da logo oficial na sidebar.
- Isola a tela de login para impedir conteúdo do painel abaixo.
- Ajusta o login para telas menores.

## V14.3.1
- Corrige a exibição da logo na sidebar usando arquivo JPG com nome versionado para evitar cache.

# 77 TEAM Manager V14.3

## Novidade visual
- Logo 77 TEAM com cobra adicionada de forma compacta no topo da barra lateral.
- No menu recolhido, permanece apenas o símbolo da equipe.
- Tipografia maior da V14.2.1 preservada.
- Nenhuma alteração na lógica do Firebase, permissões ou funcionalidades.

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
8. Crie o liderança usando `primetoolslabs@gmail.com`.

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
- liderança, Staff, membros e visitantes;
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

As páginas abaixo agora são exclusivas do Liderança e da Staff:

- WorldBoss;
- Purgatório;
- Eventos.

A proteção foi aplicada em três níveis:

1. os botões ficam ocultos para membros e visitantes;
2. a navegação bloqueia tentativas de abertura por atalhos;
3. o Firestore permite ler e alterar `attendance` somente para Liderança e Staff.

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

Também foi criada a aba **Personagens**, disponível somente para Liderança
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

Liderança e Staff podem conceder ou remover XP na aba Staff.
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
- Staff disponível para Liderança e Staff;
- tabela Membros corrigida com Level, Título e XP;
- histórico individual consultado por `userId`;
- novos registros recebem `userId`;
- migração automática de históricos antigos;
- membros acessam somente o próprio histórico;
- Staff e Liderança continuam acessando todos.

Publique o novo `firestore.rules` e entre uma vez como Liderança ou Staff
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


# Versão 12.2 — Dashboard exclusivo

Correção aplicada:

- o Dashboard Enterprise aparece somente na aba Visão Geral;
- ao abrir qualquer outra aba, todos os componentes do Dashboard são ocultados;
- as demais páginas continuam usando o layout e as funções originais da V11;
- nenhuma função, regra do Firestore ou lógica do sistema foi alterada.

A causa era uma regra CSS com `display: grid` permanente na classe
`.dashboard-enterprise`, que anulava o comportamento de ocultação das páginas.


# Versão 12.3 — Staff sem conta duplicada

Alterações:

- ao aprovar uma solicitação com cargo Staff, a mesma conta recebe `role: staff`;
- não é criada uma segunda conta;
- o documento em `members` fica vinculado pelo mesmo `userId`;
- o Liderança pode promover e rebaixar contas vinculadas na aba Membros;
- Staff não pode promover outras pessoas para Staff;
- o cadastro manual impede a criação de Staff sem conta de login;
- cargos antigos vinculados são sincronizados automaticamente pelo Liderança.

Todas as demais funcionalidades da V12.2 foram preservadas.


# Versão 13.0 — Menu lateral premium

Novo menu recolhível, badges em tempo real, perfil com XP e layout responsivo. Toda a lógica da V12.3 foi preservada.


# V13.1 Final

Reconstruída sobre a V13.0 limpa.

- sidebar permanece à esquerda;
- conteúdo aparece imediatamente à direita;
- removida a imagem da logo;
- mantido 77 TEAM e PAINEL DE CONTROLE;
- removido o card do usuário;
- mantido somente o botão Sair;
- menu recolhido usa 66 px;
- nenhuma lógica principal foi alterada.


# V13.2 — Categorias e menu recolhido

- títulos das categorias maiores;
- separadores mais visíveis;
- itens do menu mais altos;
- ícones maiores;
- badges mais legíveis;
- modo recolhido com ícones centralizados;
- categorias recolhidas viram divisores discretos;
- marca reduzida no modo recolhido;
- botão Sair alinhado no modo recolhido;
- nenhuma função principal foi alterada.

# V14.1 — Menu por categorias e permissões

- HOME: disponível para todos.
- PRESENÇAS: disponível apenas para Liderança e Staff.
- GESTÃO: disponível apenas para Liderança e Staff.
- ADMINISTRAÇÃO: disponível exclusivamente para o Liderança.
- Categorias expansíveis, uma aberta por vez, com estado salvo no navegador.
- Barra de rolagem visualmente oculta e espaçamento vertical compacto.

# V14.2.1 — Melhor legibilidade do menu lateral

- Categorias do menu aumentadas para 14px.
- Opções internas aumentadas para 15px.
- Ícones e setas ampliados proporcionalmente.
- Espaçamento ajustado sem alterar Firebase, permissões ou navegação.


## Versão 16.0
- Novo cargo DEV (compatível com contas legadas `owner`).
- Novo cargo LIDERANÇA com os mesmos privilégios operacionais da Staff.
- Categoria AVANÇADO exclusiva do DEV.
- Central de atualizações, backup, logs, diagnósticos, sessões, manutenção, serviços, cache e estatísticas.
- Recursos que exigem segredos (deploy automático, GitHub Actions e restauração total) ficam preparados para conexão com backend seguro; nenhum token é armazenado no navegador.

## Atualização de cargos de membros aceitos — V16.1

Na tela **Membros**, contas DEV, Liderança e Staff agora podem alterar cargos de usuários já aprovados e vinculados, respeitando a hierarquia:

- **DEV:** DEV, Liderança, Staff, Membros, PT TIME, PT BOOST e PT CORE.
- **Liderança:** Staff e todos os cargos de membro.
- **Staff:** todos os cargos de membro.
- Não é permitido alterar o próprio cargo.
- Liderança não altera DEV ou outra Liderança.
- Staff não altera Staff, Liderança ou DEV.
- Cada mudança exige confirmação e gera registro na Auditoria.

É obrigatório publicar o arquivo `firestore.rules` desta versão para que as novas permissões funcionem no Firebase.


## V20.1 — Atendimento privado
- Botão e conversa de atendimento dentro de Meu Perfil.
- Nova área Gestão → Atendimento para DEV, Liderança e Staff.
- Mensagens em tempo real, links HTTPS e imagens de até 5 MB.
- Estados: Aberta, Em atendimento, Aguardando usuário e Resolvida.
- Histórico separado por usuário e registro de respostas/status na Auditoria.
- Publicar `firestore.rules` e `storage.rules` no Firebase.
- Todas as funcionalidades anteriores foram preservadas.


## V20.1.1 — Hotfix do Atendimento

- Atendimentos resolvidos são movidos para a aba **Finalizados**.
- O usuário não visualiza conversas finalizadas e pode abrir um novo protocolo.
- DEV, Liderança e Staff consultam o histórico finalizado em modo somente leitura.
- Somente DEV pode excluir definitivamente um atendimento finalizado.
- Novos anexos armazenam o caminho do Firebase Storage para exclusão pelo DEV.
- Correção da cor do texto, cursor e placeholder nos campos do chat.
- Enter envia a mensagem; Shift+Enter cria uma nova linha.
- Rolagem automática para a mensagem mais recente.

Após atualizar o site, publique também `firestore.rules` e `storage.rules`.


## V20.2 — Chat privado individual

- Adicionada a aba **Gestão → Chat privado** para DEV, Liderança e Staff.
- Responsáveis podem pesquisar qualquer usuário aprovado e iniciar uma conversa individual.
- Usuários visualizam e respondem pelo card **Conversas privadas** em Meu Perfil.
- Chat suporta texto, link HTTPS e imagens PNG/JPG/WEBP de até 5 MB.
- Corrigida a regra do Firebase Storage do Atendimento: o caminho real inclui o protocolo.
- Mensagens podem conter somente uma imagem, sem exigir texto.
- Mantidas todas as funcionalidades de Atendimento, Finalizados, permissões e auditoria.

Publique `firestore.rules` e `storage.rules` desta versão para habilitar as mensagens e anexos.


## V20.3 — Reformulação do Meu Perfil

- Menu interno com seções independentes: Resumo, Personagem, Dados da conta, Segurança, Histórico, Conversas e Atendimento.
- Mantém todos os formulários, IDs e funcionalidades anteriores.
- Guarda a última seção acessada no navegador.
- Layout responsivo para celular e computador.


## V20.3.1 — Edição de personagem pelos responsáveis

- Adicionado somente o botão **Editar** aos cards da aba Personagem.
- O botão aparece apenas para DEV, Liderança e Staff.
- Os responsáveis podem atualizar os mesmos dados já existentes na ficha do personagem.
- Nenhuma informação ou função anterior foi removida.
- Alterações ficam registradas na Auditoria.
- É necessário publicar o arquivo `firestore.rules` atualizado.


## V20.6 — Central de Presenças

- Filtros por data, semana, horário/evento, clã e membro.
- Cards de resumo com presentes, atrasados, justificados, ausentes, pendentes e taxa.
- Novos estados: Presente, Atrasado, Justificado, Ausente e Pendente.
- Marcação em massa, limpeza e revisão com alerta de pendências.
- Salvamento automático com responsável, data e hora.
- Observações individuais por membro e atividade.
- Eventos organizados por dia da semana.
- Histórico rápido ao clicar no nome do membro.
- Compatibilidade com registros anteriores preservada.


## V20.6 — RT Presença
- Histórico existente preservado sem alterações.
- Nova aba Gestão → RT Presença.
- O botão “Finalizar Presença” cria uma fotografia completa do horário/evento selecionado.
- Registra membros, status, observações, responsável e data do fechamento.
- Filtros por tipo, data e busca.
- Visualização detalhada, exportação CSV e impressão.
- Exclusão definitiva somente para DEV, com Auditoria.
- Liderança e DEV podem atualizar registros pelas regras do Firestore.


## V20.7.1 🟢 Stable

- Novo painel flutuante horizontal para registro individual de presença.
- Status simplificados: Presente, Justificado e Ausente.
- Pesquisa e seleção de usuário por nickname.
- Seleção de evento, horário/atividade e data.
- Validação contra duplicidade por usuário + evento + data + horário.
- Salvamento automático na coleção `attendance` (Histórico) e em `rtPresence`.
- DEV, Liderança e Staff podem registrar, editar e finalizar RT.
- Exclusão de presença permanece exclusiva do DEV.


## V20.7.1 — Aba única de Presenças

- WorldBoss, Purgatório e Eventos foram consolidados em uma única aba **Presenças**.
- Somente essa aba permite registrar ou atualizar presenças.
- O RT Presença foi removido do menu lateral e continua sendo atualizado internamente.
- Histórico, Ranking, Estatísticas e Auditoria continuam recebendo os dados automaticamente.

## V21.2 🟢 Stable — Cargos, permissões e cores

- Cargos oficiais padronizados: **DEV**, **Liderança**, **Staff** e **Membro**.
- Compatibilidade automática com nomes antigos de cargos (owner, proprietário, liderança e variações).
- Matriz central de acesso:
  - DEV: HOME, STAFF, ADMINISTRAÇÃO e AVANÇADO.
  - Liderança: HOME, STAFF e ADMINISTRAÇÃO em modo compatível; Configurações e Auditoria somente leitura.
  - Staff: HOME e STAFF.
  - Membro: HOME.
- Cores globais: DEV vermelho, Liderança roxo, Staff amarelo e Membro azul.
- Nova tela **Avançado > Cargos e permissões**.
- Regras do Firestore revisadas para permitir leitura da Auditoria pela Liderança sem conceder alteração.


## V21.2.4 — Correção definitiva da alteração de cargos

- Corrigido o sincronizador que rebaixava automaticamente o cargo Liderança para Membro.
- O campo de acesso da conta em `users` passou a ser a fonte oficial das permissões.
- `members.role` continua representando apenas o cargo de jogo/grupo do membro.
- Alterações de cargo atualizam `role`, `accessRole` e `memberRole` de forma consistente.
- Cor, etiqueta, menus e permissões são atualizados imediatamente após salvar.
- Preservada a compatibilidade com contas antigas.


## V21.2.4 — correção visual definitiva de cargos
- A coluna Cargo agora exibe o cargo de acesso do sistema (DEV, Liderança ou Staff) quando existir.
- O cargo do clã continua separado em `memberRole`/`members.role`.
- Liderança passa a aparecer com destaque vermelho conforme solicitado.
- A mudança é refletida imediatamente após salvar, sem depender de recarregar a página.

## V22.2 — Login Clean Rebuild
- Base funcional: V21.2.4 Stable.
- Tela de login refeita com grid responsivo e sem coluna lateral, cards de versão ou ícones sociais.
- Logos limitadas por CSS para impedir sobreposição e distorção.
- IDs originais de autenticação, visitante, cadastro e manutenção preservados.
