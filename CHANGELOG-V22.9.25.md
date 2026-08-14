# V22.9.25 🟠 Hotfix — histórico de pagamentos em PDF

- A quantidade aceita somente números inteiros entre 1 e 99.000.000.
- A quantidade permanece gravada no Firestore e aparece formatada no histórico.
- O botão **Baixar semana em PDF** gera o relatório da semana selecionada.
- O botão **Baixar mês em PDF** gera o relatório do mês selecionado.
- Os PDFs incluem data/hora, nickname, pagamento, quantidade e responsável.
- Períodos sem registros são informados sem gerar arquivo vazio.
