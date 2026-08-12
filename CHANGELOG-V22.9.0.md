# 77 TEAM Manager V22.9.0 Hotfix

## Cargos e Permissões

- Matriz revisada para refletir a hierarquia que o Firestore realmente aceita.
- Acesso HOME tornou-se obrigatório para todos os cargos, evitando bloqueio total acidental.
- DEV continua obrigatório e imutável em todas as permissões.
- Permissões operacionais de Membro incompatíveis com as regras ficam travadas.
- Ações rápidas para marcar ou limpar permissões por cargo e por grupo.
- Busca por área, ação e chave técnica preservada.
- Indicadores por cargo e aviso visual de alterações pendentes.
- O botão Salvar só é habilitado quando há alterações.
- Alterações não salvas não são descartadas por snapshots em tempo real.
- Restauração do padrão exige confirmação e só é publicada depois de Salvar.
- Toda publicação da matriz gera registro de auditoria.

## Compatibilidade e segurança

- Firestore continua sendo a autoridade final para permissões.
- Configurações e Auditoria agora respeitam `settings_view` e `audit_view` também na navegação.
- Backups completos V22.8.5 até V22.9.0, schema 3, são aceitos.
- Firebase App Check permanece removido; não é necessário habilitar enforcement.
