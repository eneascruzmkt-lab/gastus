# Devendo (Dívidas Comigo Mesmo) - Spec de Design

## Visão Geral

Nova funcionalidade do Gastus para registrar quando o usuário tira dinheiro de uma reserva própria (poupança, caixinha, etc.) e quer se lembrar de repor o valor. Funciona como uma dívida consigo mesmo, com pagamentos parciais até quitar.

## Novo Tipo de Gasto

**SELF_DEBT** - adicionado ao enum `ExpenseType` do Prisma.

### Campos ao cadastrar
- Nome (ex: "Poupança", "Caixinha do Nubank")
- Valor total que deve (`totalValue`)
- Categoria
- Observação opcional (`note`, campo novo nullable no model Expense)

### Comportamento
- Sem dia de vencimento fixo (campo `dueDay` não é usado, pode ser 0 ou null)
- Aceita pagamentos parciais: cada reposição registra o valor reposto na tabela Payment
- Saldo restante = totalValue - soma dos pagamentos
- Quando saldo chega a zero, `active` é marcado como `false` automaticamente
- Sem limite de quantas reposições pode fazer

## Alterações no Schema

### Expense (model existente)
- Adicionar campo `note String? @map("note")` (observação opcional)
- Adicionar valor `SELF_DEBT` ao enum `ExpenseType`

### Payment (sem alterações)
- Já suporta valor variável por pagamento, serve pra pagamentos parciais

## Navegação

Nova aba "Devendo" no menu lateral, posicionada entre "Fixos Pontuais" e "Categorias".

## Página "Devendo"

- Lista de dívidas ativas com: nome, valor original, valor já reposto, saldo restante, barra de progresso
- Botão "Repor" por dívida: abre modal pedindo o valor a repor (Input number)
  - Validação: valor não pode ser maior que o saldo restante
  - Ao repor, cria Payment com o valor informado e referenceMonth do mês atual
  - Se saldo restante chegar a zero, marca expense como `active: false`
- Dívidas quitadas aparecem embaixo com badge "Quitado"
- Botão "Nova dívida" abre modal com: nome, valor total, categoria, observação (opcional)
  - Submit: POST /api/gastos com type: "SELF_DEBT", dueDay: 0

## Dashboard

- No resumo do mês, exibir linha separada: "Devendo a mim: R$ X" com o total de saldo devedor de todas as dívidas ativas
- Dívidas SELF_DEBT NÃO entram no "Total do mês" nem nos vencimentos (são separadas)

## API

### Rotas existentes que já funcionam
- `GET /api/gastos?type=SELF_DEBT` - listar dívidas
- `POST /api/gastos` - criar dívida (com type: "SELF_DEBT")
- `DELETE /api/gastos/[id]` - excluir dívida

### Rota de pagamento parcial
- `POST /api/pagamentos` já existe e aceita valor variável
- Precisa de ajuste: quando type é SELF_DEBT, não decrementar remainingInstallments (não tem parcelas), apenas registrar o pagamento. Se soma dos pagamentos >= totalValue, marcar como inactive.

## Notificações
- SELF_DEBT não gera notificações via Ntfy (sem vencimento)

## CSV
- Exportar inclui dívidas com tipo "DEVENDO"
- Importar aceita tipo "DEVENDO" mapeando para SELF_DEBT
