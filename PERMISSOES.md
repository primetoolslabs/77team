# Matriz de permissões — V22.5.3

| Cargo | Home | Área Staff | Administração | Avançado | Aprovar solicitações | Alterar cargos |
|---|---:|---:|---:|---:|---|---|
| DEV | Sim | Sim | Sim | Sim | DEV, Liderança, Staff e Membro | Todos, exceto proteção da própria exclusão |
| Liderança | Sim | Sim | Sim | Não | Staff e Membro | Staff e Membro |
| Staff | Sim | Sim | Não | Não | Membro | Somente cargos de membro |
| Membro | Sim | Não | Não | Não | Não | Não |
| Visitante | Visualização pública | Não | Não | Não | Não | Não |

## Campos oficiais

- `accessRole`: cargo de acesso ao sistema.
- `role`: mantido sincronizado por compatibilidade.
- `memberRole`: cargo interno do membro, como Membros, PT TIME, PT BOOST ou PT CORE.

As regras do Firestore validam o cargo efetivo e impedem que um usuário altere os próprios campos de permissão.
