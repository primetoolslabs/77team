# 77 TEAM Manager V22.9.1 🟠 Hotfix

## AVANÇADO

- Verificação de atualização passou a consultar o `manifest.json` publicado sem usar cache.
- Repositório público do GitHub pode ser configurado e consultado sem token.
- Status do GitHub mostra repositório, última execução pública e última release.
- Backup da aba AVANÇADO agora valida formato, projeto Firebase, versão, schema, coleções, subcoleções e resumo.
- Restauração da aba AVANÇADO usa `restoreJob`, snapshots persistentes e rollback automático.
- Diagnóstico Firebase realiza leitura real do Firestore e mede o tempo de resposta.
- Status de serviços usa os resultados dos diagnósticos, o estado do Auth, PWA e GitHub.
- Sessões são registradas por navegador/dispositivo com heartbeat e último sinal.
- Formulário de manutenção não perde alterações durante snapshots em tempo real.
- Personalização do login não perde alterações e remove uploads órfãos quando a gravação falha.
- Aviso ao sair da página cobre permissões, manutenção e personalização ainda não salvas.
- Cache PWA atualizado para V22.9.1.

## Segurança

- Nova coleção `sessions` aceita escrita somente da própria conta e leitura somente pelo DEV.
- GitHub funciona apenas para dados públicos e nenhum token é guardado no navegador.
- Firebase App Check permanece removido.
