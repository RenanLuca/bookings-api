# Bookings Backend API

Sistema de gerenciamento de agendamentos para salas com controle de permissões, autenticação JWT e suporte completo a timezones.

## 📋 Índice

- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Módulos Principais](#-módulos-principais)
- [Timezone e Horários](#-timezone-e-horários)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Endpoints da API](#-endpoints-da-api)
- [Considerações de Segurança](#-considerações-de-segurança)

## 🚀 Tecnologias

- **Node.js** com **TypeScript**
- **Express** - Framework web
- **Sequelize** - ORM para MySQL
- **MySQL** - Banco de dados
- **JWT** - Autenticação
- **bcryptjs** - Hash de senhas
- **date-fns-tz** - Manipulação de timezones
- **express-validator** - Validação de dados
- **Vitest** - Testes automatizados

## 🏗️ Arquitetura

O projeto segue uma arquitetura em camadas com separação clara de responsabilidades:

```
src/
├── config/          # Configurações (DB, env)
├── models/          # Modelos Sequelize
├── modules/         # Módulos de negócio
│   ├── auth/        # Autenticação e autorização
│   ├── appointments/# Gerenciamento de agendamentos
│   ├── rooms/       # Gerenciamento de salas
│   ├── customers/   # Gerenciamento de clientes
│   ├── logs/        # Logs de atividades
│   └── permissions/ # Controle de permissões
├── shared/          # Utilitários compartilhados
│   ├── errors/      # Classes de erro customizadas
│   ├── http/        # Helpers HTTP (auth, response)
│   ├── utils/       # Utilitários (datetime)
│   └── validators/  # Validadores compartilhados
└── server.ts        # Ponto de entrada
```

### Padrão de Módulos

Cada módulo segue a estrutura:
- **Controller** - Recebe requisições HTTP
- **Service** - Lógica de negócio
- **Repository** - Acesso a dados
- **Validators** - Validação de entrada
- **DTO** - Tipos de dados
- **Routes** - Definição de rotas
- **Factory** - Injeção de dependências

## 📦 Módulos Principais

### 🔐 Auth (Autenticação)

Gerencia autenticação de usuários com JWT.

**Funcionalidades:**
- Login com email/senha (admin ou customer)
- Logout com invalidação de token
- Check-email para verificar existência de usuário
- Múltiplos tokens simultâneos por usuário
- Expiração automática de tokens

**Endpoints:**
- `POST /auth/check-email` - Verifica se email existe
- `POST /auth/login` - Autentica usuário
- `POST /auth/logout` - Invalida token atual

### 📅 Appointments (Agendamentos)

Gerencia agendamentos de salas com validação de conflitos e horários.

**Funcionalidades:**
- Criação de agendamentos com validação de:
  - Conflitos de horário (respeita `slotDurationMinutes`)
  - Horário dentro do expediente da sala
  - Data não pode ser no passado
- Listagem com filtros (data, sala, cliente)
- Aceitação/cancelamento de agendamentos
- Controle de status (PENDING, ACCEPTED, CANCELED)
- Conversão automática de timezone

**Endpoints:**
- `POST /appointments` - Criar agendamento
- `GET /appointments/me` - Listar meus agendamentos
- `GET /appointments` - Listar todos (admin)
- `PATCH /appointments/:id/accept` - Aceitar agendamento (admin)
- `PATCH /appointments/:id/cancel` - Cancelar agendamento

### 🏢 Rooms (Salas)

Gerencia salas disponíveis para agendamento.

**Funcionalidades:**
- CRUD completo de salas
- Configuração de horário de funcionamento (`startTime`, `endTime`)
- Duração de slots (`slotDurationMinutes`)
- Soft delete (exclusão lógica)
- Validação de horários

**Endpoints:**
- `POST /rooms` - Criar sala (admin)
- `GET /rooms` - Listar salas
- `GET /rooms/:id` - Buscar sala por ID
- `PATCH /rooms/:id` - Atualizar sala (admin)
- `DELETE /rooms/:id` - Remover sala (admin)

### 👥 Customers (Clientes)

Gerencia cadastro e perfil de clientes.

**Funcionalidades:**
- Registro de novos clientes
- Atualização de perfil
- Gerenciamento de permissões por módulo
- Endereço completo (CEP, rua, número, etc.)

**Endpoints:**
- `POST /customers/register` - Registrar novo cliente
- `GET /customers/me` - Buscar meu perfil
- `PATCH /customers/me` - Atualizar meu perfil
- `GET /customers` - Listar clientes (admin)
- `PATCH /customers/:id/permissions` - Atualizar permissões (admin)

### 📊 Logs (Atividades)

Registra todas as ações importantes do sistema.

**Funcionalidades:**
- Log automático de ações (criar, atualizar, deletar)
- Filtros por módulo, tipo de atividade, usuário
- Paginação e ordenação
- Rastreabilidade completa

**Endpoints:**
- `GET /logs` - Listar logs (admin)

### 🔒 Permissions (Permissões)

Controla acesso a módulos por cliente.

**Módulos disponíveis:**
- `APPOINTMENTS` - Acesso a agendamentos
- `LOGS` - Acesso a logs de atividades
- (Extensível para outros módulos)

## ⏰ Timezone e Horários

O sistema utiliza uma abordagem híbrida para lidar com timezones:

### Timezone da Aplicação

```typescript
const APP_TIMEZONE = "America/Sao_Paulo"; // UTC-3
```

### Regras de Armazenamento

#### 1. Agendamentos (`scheduledAt`)

**Armazenamento:** UTC no banco de dados  
**Conversão:** Automática pelo backend

```typescript
// Frontend envia (timezone local)
"2026-01-24T10:00:00"

// Backend converte e salva em UTC
"2026-01-24T13:00:00.000Z"

// Backend retorna em UTC
"2026-01-24T13:00:00.000Z"
```

**Funções de conversão:**
- `toUtcFromAppTz(input)` - Converte de São Paulo para UTC
- `toAppTzFromUtc(input)` - Converte de UTC para São Paulo

#### 2. Horários de Sala (`startTime`, `endTime`)

**Armazenamento:** TIME (HH:MM:SS) sem timezone  
**Interpretação:** Sempre no timezone da aplicação (America/Sao_Paulo)

```typescript
// Exemplo de sala
{
  startTime: "08:00:00",  // 8h da manhã em São Paulo
  endTime: "18:00:00",    // 6h da tarde em São Paulo
  slotDurationMinutes: 60 // Slots de 1 hora
}
```

**Justificativa:**
- Horários de sala são conceitos "locais" (a sala sempre abre às 8h local)
- Simplicidade para horários recorrentes
- Não há necessidade de conversão de timezone

### Validação de Horários

Quando um agendamento é criado, o sistema:

1. Converte `scheduledAt` (UTC) para timezone da aplicação
2. Extrai apenas a hora (HH:MM:SS)
3. Compara com `startTime` e `endTime` da sala
4. Valida se está dentro do expediente

```typescript
// Exemplo de validação
const scheduledSeconds = getScheduledSecondsInAppTimezone(scheduledAt);
const startSeconds = getTimeSecondsFromRoomTime(room.startTime);
const endSeconds = getTimeSecondsFromRoomTime(room.endTime);

return scheduledSeconds >= startSeconds && scheduledSeconds <= endSeconds;
```

### Detecção de Conflitos

O sistema valida conflitos considerando o `slotDurationMinutes`:

```typescript
// Exemplo: Sala com slots de 60 minutos
// Agendamento existente: 10:00
// Tentativa de agendamento: 10:30 ❌ CONFLITO

// Lógica de overlap
const newEnd = new Date(scheduledAt);
newEnd.setMinutes(newEnd.getMinutes() + room.slotDurationMinutes);

const existingEnd = new Date(existing.scheduledAt);
existingEnd.setMinutes(existingEnd.getMinutes() + room.slotDurationMinutes);

const hasOverlap = scheduledAt < existingEnd && newEnd > existing.scheduledAt;
```

## 🔧 Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd bookings-backend

# Instale as dependências
npm install

# Configure o banco de dados MySQL
# Certifique-se de que o MySQL está rodando
```

## ⚙️ Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
NODE_ENV=development
PORT=3000

DB_NAME=bookings_db
DB_USER=root
DB_PASS=sua_senha
DB_HOST=localhost
DB_PORT=3306

JWT_SECRET=seu_secret_super_seguro
JWT_EXPIRES_IN=1d
```

### Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `NODE_ENV` | Ambiente (development/test/production) | development |
| `PORT` | Porta do servidor | 3000 |
| `DB_NAME` | Nome do banco de dados | bookings_db |
| `DB_USER` | Usuário do MySQL | root |
| `DB_PASS` | Senha do MySQL | - |
| `DB_HOST` | Host do MySQL | localhost |
| `DB_PORT` | Porta do MySQL | 3306 |
| `JWT_SECRET` | Secret para JWT | **obrigatório** |
| `JWT_EXPIRES_IN` | Tempo de expiração do token | 1d |

## 📜 Scripts Disponíveis

```bash
# Desenvolvimento (watch mode)
npm run dev

# Build para produção
npm run build

# Executar produção
npm start

# Testes
npm test              # Executar todos os testes
npm run test:watch    # Modo watch
npm run test:coverage # Com cobertura
```

## 🌐 Endpoints da API

### Autenticação

| Método | Endpoint | Autenticação | Descrição |
|--------|----------|--------------|-----------|
| POST | `/auth/check-email` | Não | Verifica se email existe |
| POST | `/auth/login` | Não | Autentica usuário |
| POST | `/auth/logout` | Sim | Invalida token |

### Agendamentos

| Método | Endpoint | Autenticação | Permissão | Descrição |
|--------|----------|--------------|-----------|-----------|
| POST | `/appointments` | Sim | Customer | Criar agendamento |
| GET | `/appointments/me` | Sim | Customer | Listar meus agendamentos |
| GET | `/appointments` | Sim | Admin | Listar todos agendamentos |
| PATCH | `/appointments/:id/accept` | Sim | Admin | Aceitar agendamento |
| PATCH | `/appointments/:id/cancel` | Sim | Customer/Admin | Cancelar agendamento |

### Salas

| Método | Endpoint | Autenticação | Permissão | Descrição |
|--------|----------|--------------|-----------|-----------|
| POST | `/rooms` | Sim | Admin | Criar sala |
| GET | `/rooms` | Não | - | Listar salas |
| GET | `/rooms/:id` | Não | - | Buscar sala |
| PATCH | `/rooms/:id` | Sim | Admin | Atualizar sala |
| DELETE | `/rooms/:id` | Sim | Admin | Remover sala |

### Clientes

| Método | Endpoint | Autenticação | Permissão | Descrição |
|--------|----------|--------------|-----------|-----------|
| POST | `/customers/register` | Não | - | Registrar cliente |
| GET | `/customers/me` | Sim | Customer | Buscar meu perfil |
| PATCH | `/customers/me` | Sim | Customer | Atualizar perfil |
| GET | `/customers` | Sim | Admin | Listar clientes |
| PATCH | `/customers/:id/permissions` | Sim | Admin | Atualizar permissões |

### Logs

| Método | Endpoint | Autenticação | Permissão | Descrição |
|--------|----------|--------------|-----------|-----------|
| GET | `/logs` | Sim | Admin | Listar logs de atividades |

## 🔒 Considerações de Segurança

### ⚠️ Endpoint Check-Email

O endpoint `POST /auth/check-email` foi implementado para fins de **teste e experiência do usuário** no frontend, permitindo verificar se um email já está cadastrado antes do registro.

**IMPORTANTE:** Este endpoint representa uma **falha de segurança** em produção, pois permite:

- **Enumeração de usuários**: Atacantes podem mapear emails válidos no sistema
- **Vazamento de informação**: Revela quais emails estão cadastrados
- **Ataques direcionados**: Facilita phishing e engenharia social

**Recomendações para produção:**

1. **Remover o endpoint** completamente
2. **Alternativa segura**: Retornar mensagens genéricas
   ```
   ❌ "Email já cadastrado"
   ✅ "Se o email existir, você receberá instruções"
   ```
3. **Rate limiting**: Limitar tentativas por IP
4. **CAPTCHA**: Adicionar proteção contra automação

### Outras Boas Práticas Implementadas

✅ **Senhas hasheadas** com bcryptjs  
✅ **JWT com expiração** configurável  
✅ **Invalidação de tokens** no logout  
✅ **Soft delete** para preservar histórico  
✅ **Validação de entrada** com express-validator  
✅ **Logs de auditoria** para rastreabilidade  
✅ **Separação de roles** (Admin/Customer)  
✅ **Controle de permissões** por módulo

## 📝 Modelos de Dados

### User
- `id`, `name`, `email`, `passwordHash`
- `role`: ADMIN | CUSTOMER
- `status`: ACTIVE | INACTIVE

### Customer
- `id`, `userId`, endereço completo
- Relacionamento 1:1 com User

### Room
- `id`, `name`, `startTime`, `endTime`, `slotDurationMinutes`

### Appointment
- `id`, `roomId`, `customerId`, `scheduledAt`
- `status`: PENDING | ACCEPTED | CANCELED

### CustomerModulePermission
- `customerId`, `module`, `canView`

### ActivityLog
- `userId`, `module`, `activityType`, `description`

### AuthToken
- `userId`, `token`, `expiresAt`

## 🧪 Testes

O projeto possui cobertura de testes automatizados com Vitest:

- Testes de integração para todos os endpoints
- Validação de timezone e conversões
- Testes de conflito de agendamentos
- Testes de permissões e autenticação
- Testes de validação de dados

```bash
npm test
```

## 📄 Licença

ISC
