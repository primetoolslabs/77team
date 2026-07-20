# 77 TEAM Manager — V22.0 🟢 Stable

Versão de estabilização baseada na V21.3, preservando os módulos e a estrutura visual existentes.

## Principais alterações

- Proteção contra duas tentativas simultâneas no formulário de login.
- O login é acionado somente pelo evento `submit` do formulário.
- Bloqueio local de cinco minutos após `auth/quota-exceeded` ou `auth/too-many-requests`, evitando novas chamadas desnecessárias.
- Mensagens específicas para credencial inválida, conta desativada, falha de rede, excesso de tentativas e cota do Firebase.
- Registro local das últimas tentativas, sem armazenar senhas.
- Nova página **Avançado > Diagnóstico de login**.
- Relatório copiável com estado da sessão, perfil, manutenção e códigos de erro.
- Atualização dos identificadores de cache para V22.0.

## Estrutura esperada para usuários

Cada conta criada no Firebase Authentication deve possuir um documento em:

```text
users/{uid}
```

Campos recomendados:

```js
{
  name: "Nome",
  email: "usuario@email.com",
  role: "member", // dev, leadership, staff ou member
  active: true,
  status: "approved",
  firstLogin: false,
  profileCompleted: true
}
```

## Limitação importante

Aplicações web clientes não podem listar todos os usuários do Firebase Authentication. A sincronização completa entre Authentication e Firestore exige um backend protegido usando o Firebase Admin SDK. O diagnóstico desta versão analisa a sessão atual, os perfis carregados pelo painel e as tentativas feitas no navegador.

## Publicação

Publique todos os arquivos, incluindo `firestore.rules`, `storage.rules`, `service-worker.js`, `css`, `js` e `assets`.
