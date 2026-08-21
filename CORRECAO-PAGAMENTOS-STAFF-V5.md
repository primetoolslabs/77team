# Pagamentos Staff V5

Correção estrutural: a coleção payments não usa mais o resolvedor genérico para autorizar Staff.
A regra lê diretamente settings/app.rolePermissions.payments_manage e compara com o cargo real do perfil.

Também foi reescrita a função permission(key) para testar explicitamente dev/leadership/staff/member, reduzindo divergências em outras abas.
