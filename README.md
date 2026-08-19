# 77 TEAM Manager V24.0.0 Clean Core

Base reconstruída do zero para um Firebase novo.

## Incluído
- HOME pública
- Cadastro de solicitação
- Login por Firebase Authentication
- Bloqueio de conta pendente/inativa
- Hierarquia DEV / Liderança / Staff / Membro
- Aprovação e rejeição
- Staff aprova somente Membros
- Criação automática do documento em `members` ao aprovar
- Regras Firestore novas
- Tela clara quando o Firebase ainda não foi configurado

## Não incluído nesta base
Os módulos avançados da V22/V23 foram propositalmente deixados de fora para evitar importar a lógica problemática antiga. Eles devem ser recolocados depois de validar o fluxo de autenticação e aprovação.
