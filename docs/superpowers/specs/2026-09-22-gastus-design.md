# Gastus - Spec de Design

## Visão Geral

Gastus é um app web para controle de gastos fixos, parcelas e assinaturas recorrentes. Cada usuário cria sua conta e gerencia seus próprios gastos, com dashboard focado no mês atual e notificações via Ntfy.

**Timezone:** UTC-3 (Brasília). Todas as datas e horários no app seguem esse fuso.

## Tecnologias

- **Framework:** Next.js (App Router) - full-stack
- **Banco de dados:** Neon (PostgreSQL, plano grátis)
- **ORM:** Prisma
- **Autenticação:** NextAuth.js com CredentialsProvider (email + senha, sessão via JWT)
- **Hash de senha:** bcryptjs
- **Estilo:** Tailwind CSS (paleta Veridian #40826D)
- **Gráficos:** Recharts
- **Notificações:** Ntfy (push)
- **Deploy:** Railway
- **Repositório:** GitHub

## Tipos de Gasto

### Parcela
- Campos: nome, valor total, nº de parcelas, valor da parcela, data da 1ª parcela, categoria
- Ações:
  - **Adiantar:** pagar X parcelas de uma vez. Se as parcelas restantes forem igual ou menor que X, a compra é finalizada. Se forem mais que X, as parcelas pagas são registradas e o nº de parcelas restantes diminui em X. O valor da parcela não muda
  - **Adiar (pular parcela):** a parcela do mês é empurrada pro próximo mês. O número total de parcelas continua o mesmo, apenas o calendário é deslocado em 1 mês. Sem limite de quantas vezes pode adiar

### Recorrente
- Campos: nome, valor mensal, dia do vencimento, categoria
- Sem data de fim (ativo até ser cancelado)
- Ação: cancelar

### Fixo Pontual
- Campos: nome, valor, mês de vencimento, dia de vencimento (escolhido pelo usuário), se repete todo ano, categoria
- Exemplo: IPVA, matrícula
- Se `repeteTodoAno = true`: aparece todo ano no mesmo mês/dia
- Se `repeteTodoAno = false`: aparece uma única vez. Após ser pago, fica inativo (visível apenas no histórico)

## Categorias

- Categorias pré-definidas (seed global, sem userId): Casa, Saúde, Lazer, Transporte, Educação, Alimentação, Outros
- Usuário pode criar, editar e excluir categorias personalizadas
- Excluir categoria que está em uso: move os gastos vinculados para "Outros"

## Status de Vencimento

O status é **computado** (não armazenado no banco), derivado da data de vencimento e da tabela Pagamento:

- **Pendente:** data de vencimento ainda não chegou E não existe pagamento registrado para aquele mês
- **Pago:** existe pagamento registrado para aquele mês
- **Atrasado:** data de vencimento já passou (dia seguinte, considerando UTC-3) E não existe pagamento registrado

Um item atrasado pode ser marcado como pago a qualquer momento.

## Dashboard (tela principal)

Foco no mês atual:
- **Resumo do mês:** valor total a pagar, quantos vencimentos, quanto já foi pago
- **Lista de vencimentos do mês:** ordenada por data, com nome, valor, data de vencimento, categoria e status (pago/pendente/atrasado)
- **Botão de marcar como pago** direto na lista
- **Filtro por categoria**
- **Gráfico de evolução:** projeção futura mostrando mês a mês como os gastos fixos vão diminuindo conforme cada parcela acaba, até a última parcela ser finalizada (sem limite de meses, acompanha todas as parcelas ativas)
- **Alerta de "liberdade":** aparece apenas no mês seguinte ao término de uma parcela, mostrando quanto de valor mensal foi liberado (sensação de alívio naquele mês)

## Navegação

Menu lateral na **direita** com:
- Dashboard
- Parcelas
- Recorrentes
- Fixos Pontuais
- Categorias
- Configurações

No celular: menu colapsa em ícone.

## Autenticação

- **Cadastro:** nome, email, senha
- **Login:** email + senha
- **Sem recuperação de senha** (sem envio de email)
- Cada usuário só vê seus próprios gastos
- Sessão via JWT, mantida por 30 dias

## Notificações (Ntfy)

- Cada usuário configura seu **tópico Ntfy** nas configurações
- Notificação enviada X dias antes do vencimento (configurável pelo usuário, padrão 3 dias)
- Conteúdo: nome do gasto, valor e data de vencimento
- Job diário roda às 8h (UTC-3) via cron do Railway, chamando API Route interna (`/api/cron/notificacoes`) protegida por header `Authorization: Bearer <CRON_SECRET>`
- Se o tópico Ntfy estiver inválido ou o serviço fora, a notificação falha silenciosamente (sem impacto no app)

## Funcionalidades Extras

### Importar/Exportar Dados
- **Exportar:** baixar todos os gastos em CSV (colunas: tipo, nome, valor, categoria, data de vencimento, status, parcelas restantes)
- **Importar:** upload de CSV no mesmo formato. Dados importados são adicionados (não substituem). Linhas com formato inválido são ignoradas e reportadas ao usuário

### Modo Escuro
- Alternância entre tema claro e escuro
- Paleta Veridian mantida em ambos os modos
- Preferência salva nas configurações do usuário

## Schema do Banco (Prisma)

Nomes de colunas em ASCII (sem acentos). Mapeamento via `@map` quando necessário.

### User
- id (cuid), name, email (único), password (hash bcryptjs), ntfyTopic (opcional), notifyDaysBefore (Int, padrão 3), darkMode (Boolean, padrão false), createdAt

### Category
- id (cuid), name, userId (FK, nullable - null = pré-definida), predefined (Boolean)

### Expense
- id (cuid), userId (FK), categoryId (FK), type (enum: INSTALLMENT | RECURRING | ONE_TIME), name, totalValue, installmentValue, totalInstallments, remainingInstallments, startDate, dueDay (Int), dueMonth (Int, nullable), repeatsYearly (Boolean, padrão false), active (Boolean, padrão true), createdAt

### Payment
- id (cuid), expenseId (FK), value, paymentDate, referenceMonth (String, formato "2026-09")

## Design Visual

- Cor predominante: Veridian (#40826D)
- Botões: fundo escuro + texto branco
- Cards uniformes, sem desproporção
- Textos com no mínimo 70% de opacidade
- Sem travessões em textos
- Sem emojis
