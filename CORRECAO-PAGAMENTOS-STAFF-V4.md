# Correção Pagamentos Staff V4

O frontend já confirmava:
- cargo Staff
- page_pagamentos = true
- access_staff = true
- payments_manage = true

A regra anterior ainda validava o conteúdo do documento no mesmo `allow create`.
Qualquer diferença de tipo/campo era devolvida pelo Firestore como `permission-denied`,
parecendo um erro de cargo.

Agora `/payments/{id}` usa `active() && permission('payments_manage')` como única
autorização de criação. A validação do formulário permanece no `main.js`.

Assim, Cargos e Permissões é a fonte de autorização:
- `page_pagamentos`: abre/oculta a aba no cliente.
- `payments_manage`: autoriza leitura/criação no Firestore.
