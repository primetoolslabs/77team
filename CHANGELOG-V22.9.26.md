# V22.9.26 🟠 Hotfix — quantidades e PDF corrigidos

- O campo recebe valores em milhões: digitar 20 registra 20.000.000.
- Registros legados entre 1 e 99 passam a ser exibidos corretamente em milhões.
- A quantidade permanece gravada no Firestore e aparece formatada no histórico e no PDF.
- O botão **Baixar semana em PDF** gera o relatório da semana selecionada.
- O botão **Baixar mês em PDF** gera o relatório do mês selecionado.
- A impressão só começa depois que todo o conteúdo do PDF estiver renderizado.
- Os PDFs incluem data/hora, nickname, pagamento, quantidade e responsável.
- Períodos sem registros são informados sem gerar arquivo vazio.
