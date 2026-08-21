# Campo de Observação em Pagamentos

Foi adicionado um campo opcional `Observação` ao registro de pagamentos.

- Limite: 500 caracteres.
- Salvo no Firestore em `payments.observation`.
- Exibido no histórico.
- Incluído na busca.
- Incluído nos PDFs semanais/mensais.
- Registros antigos continuam compatíveis e aparecem com `—` quando não possuem observação.
- Nenhuma mudança foi feita na lógica de permissões.
