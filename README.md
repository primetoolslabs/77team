# 77 TEAM 3.0 — Projeto completo

## O que está incluído

- Login do Proprietário, Staff e Membro
- Visitante sem cadastro, somente visualização
- Cadastro público sem seleção de clã
- Aprovação/rejeição de membros pela Staff
- Clã e cargo definidos na aprovação
- Presença WorldBoss
- Presença Purgatório
- Presença Eventos
- Histórico unificado
- Ranking
- Cadastro de membros
- Criação/desativação de Staff pelo Proprietário
- Auditoria
- Exportação em PDF
- PWA instalável
- Interface responsiva
- Navegação independente do Firebase
- Mensagens detalhadas de erro

## Compatibilidade

O sistema foi preparado para versões atuais de:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox
- Safari
- Opera
- Brave
- Samsung Internet
- Android e iPhone

Navegadores muito antigos sem suporte a módulos JavaScript não executam o Firebase moderno.

## Instalação no Firebase

### 1. Authentication

Ative **E-mail/Senha**.

### 2. Firestore

Crie o banco de dados.

### 3. Regras obrigatórias

Abra `firestore.rules`, copie todo o conteúdo e publique em:

**Firebase → Firestore Database → Regras**

As regras novas são obrigatórias para:

- cadastro público;
- aprovação dos membros;
- Staff;
- visitante;
- auditoria.

## Publicação no GitHub Pages

Envie para a raiz do repositório:

- `index.html`
- `firestore.rules`
- `manifest.json`
- `service-worker.js`
- pasta `css`
- pasta `js`
- pasta `icons`

Ative:

**Settings → Pages → Deploy from a branch → main → /(root)**

## Primeiro acesso

Se o proprietário já existe, use o login normal.

E-mail:

`pimentelsolution1@gmail.com`

O botão Primeiro acesso deve ser usado uma única vez.

## Atualização de uma versão antiga

1. Substitua todos os arquivos no GitHub.
2. Publique o novo `firestore.rules`.
3. Aguarde o GitHub Pages.
4. Abra em janela anônima.
5. Em instalações antigas, remova o aplicativo e instale novamente se necessário.

## Diagnóstico

Os erros Firebase aparecem com o código real, por exemplo:

- `permission-denied`
- `auth/invalid-credential`
- `auth/network-request-failed`
- `unavailable`

Isso facilita descobrir se o problema está nas regras, login ou conexão.


## Correção crítica da versão estável

- SDK Firebase corrigido para `12.15.0`, versão publicada no CDN oficial.
- Imports estáticos para evitar falha no carregamento do módulo.
- Service Worker e cache desativados temporariamente.
- Tela de diagnóstico aparece se o módulo não carregar em até 8 segundos.

Substitua todos os arquivos antigos no GitHub. Teste primeiro em janela anônima.


## Recuperação automática do proprietário
Ao entrar com o e-mail do proprietário, se users/UID estiver ausente, o sistema valida system/owner e recria o perfil owner automaticamente. Publique o novo firestore.rules.


## Administração de usuários

A nova aba **Administrar usuários** está disponível somente para o Proprietário.

Ações:

- Enviar recuperação de senha
- Bloquear usuário
- Desbloquear usuário
- Redefinir cadastro
- Remover perfil do Firestore

### Redefinir cadastro

Remove:

- documento em `members`
- presenças vinculadas ao usuário
- clã e cargo aprovados

E devolve o usuário para `status: pending`, aparecendo novamente em **Solicitações**.

### Remover perfil

Remove o documento `users/UID`, o membro e suas presenças.

Importante: uma aplicação Web comum não pode excluir com segurança a conta Authentication de outro usuário.
Para permitir o mesmo e-mail em um cadastro novo, exclua também a conta em:

**Firebase → Authentication → Usuários → Excluir usuário**

A exclusão automática de contas Authentication de terceiros exige Firebase Admin SDK/Cloud Functions.


## Correção do cadastro automático

O cadastro público agora usa a mesma instância Firebase para:

1. criar a conta no Authentication;
2. criar automaticamente `users/UID` no Firestore.

Antes, a conta era criada em uma instância secundária, mas o perfil era gravado pela
instância principal. Isso causava `permission-denied` e o usuário não aparecia em
**Solicitações**.

### Teste correto

1. Publique o `firestore.rules` deste pacote.
2. Exclua do Authentication a conta usada em testes anteriores.
3. Exclua qualquer perfil antigo com o mesmo UID no Firestore.
4. Cadastre o usuário novamente pelo botão **Criar conta de membro**.
5. O usuário deve aparecer automaticamente em **Solicitações**.


## Renovação visual

Esta edição modifica somente `css/style.css`.

Não foram alterados:

- Firebase
- regras do Firestore
- login e permissões
- cadastro e aprovação
- presenças
- histórico
- ranking
- navegação
- service worker
- JavaScript


## Cores dos cargos

Foram adicionadas badges visuais:

- Staff: amarelo
- Membros/Membro: azul ciano
- PT TIME: verde
- PT BOOST: marrom
- PT CORE: roxo

A alteração afeta somente a forma como os cargos aparecem nas tabelas.
Permissões e regras continuam iguais.


## Correção das cores dos cargos

As cores agora são aplicadas em:

- lista de membros;
- histórico;
- ranking;
- usuários Staff;
- administração de usuários;
- seletor de cargo no cadastro;
- seletor de cargo nas solicitações;
- identificação do usuário no topo.

O `index.html` recebeu parâmetros de versão para evitar cache antigo.


## Logo oficial integrada

Aplicada visualmente em:

- tela de carregamento;
- tela de login;
- menu lateral;
- ícones PWA de 192 px e 512 px.

Nenhum arquivo de lógica, Firebase, regras ou permissões foi alterado.


## Visual profissional eSports

Aplicado:

- tema preto e roxo neon;
- marca d'água da logo;
- fundo com raios discretos;
- cards em estilo vidro;
- botões roxos;
- tabelas e cabeçalhos personalizados;
- scrollbar roxa;
- login com identidade 77 TEAM;
- melhor adaptação para celular.

Arquivos de lógica, Firebase, autenticação, permissões e presença foram preservados.


## Novo Firebase oficial

Este pacote já está conectado ao novo projeto:

- `team-f78cd`
- `team-f78cd.firebaseapp.com`

Antes de usar, ative E-mail/Senha e publique o arquivo `firestore.rules`.
Consulte `CONFIGURAR_FIREBASE.md`.
