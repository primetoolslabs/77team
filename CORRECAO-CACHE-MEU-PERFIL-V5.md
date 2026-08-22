# Meu Perfil V5 — correção definitiva de cache antigo

Diagnóstico:
A versão anterior gerou uma URL inválida no Service Worker:
`main.js?v=...-profilefix1-profilefix1`.

Isso podia fazer a instalação do novo Service Worker falhar e manter a versão antiga ativa.

Correções:
- Service Worker refeito.
- `index.html`, CSS e JS não ficam mais presos em cache do Service Worker.
- Cache antigo `77-team-manager-*` é limpo na primeira execução da V5.
- Todos os arquivos críticos usam a mesma versão `22.9.32-profilev5`.
- Firebase Hosting recebeu headers `no-cache` para index.html, CSS, JS e service-worker.js.
- Existe apenas uma seção `id="meu-perfil"` no HTML e ela contém a nova interface.

Firebase:
Não precisa publicar Firestore Rules nem Storage Rules.
É necessário publicar o site/Hosting desta versão, incluindo `firebase.json`.
