# Arquitetura — V31.1 Interface Reconstruction

## Estratégia

A V31 inicia uma migração progressiva. A lógica existente permanece em funcionamento e novos recursos são adicionados em camadas independentes.

```text
Interface atual
      ↓
Next App Shell
      ↓
Componentes e módulos
      ↓
Serviços existentes
      ↓
Firebase
```

## Camadas

### Core

Configurações, eventos e permissões centralizadas em `js/core`.

### Next App Shell

`js/next/app-shell.js` controla recursos globais de experiência:

- tema;
- busca rápida;
- menu de perfil;
- navegação mobile;
- identificação da versão.

### Interface

O novo CSS está isolado em `css/next`, permitindo migrar cada tela sem apagar estilos anteriores.

## Próximas migrações

1. Navigation Experience.
2. Character Center.
3. Attendance 2.0.
4. Communication Center.
5. Analytics e Administration.
