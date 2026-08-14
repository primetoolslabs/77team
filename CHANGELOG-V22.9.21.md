# V22.9.21 🟠 Hotfix — pagamentos

- Criada a página **STAFF → Pagamentos**.
- Formulário com nickname e os tipos Pedra Mística, Pedra Obscura, Aço Negro, Payout, Criação de Item e Adiantamento.
- Data, horário, UID e nickname do responsável são registrados automaticamente.
- Histórico em tempo real com busca e ordenação por data.
- Nova permissão configurável `payments_manage` para DEV, Liderança e Staff.
- Registros protegidos pelas regras do Firestore e imutáveis para responsáveis.
- Coleção `payments` incluída no backup completo, validação, restauração e rollback.

