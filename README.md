# 🧩 Organization Microservice

The Organization Microservice is a core microservice within a SaaS commerce platform responsible for managing organizations, their domains, user-organization memberships, and role-based access control. It operates as a RabbitMQ-based microservice that handles both synchronous RPC calls and asynchronous event-driven communication with other services.

**Key Responsibilities:**
- Organization lifecycle management (create, update, delete)
- Organization domain management (CNAME validation, multi-domain support)
- User-organization membership and role assignment
- Authorization and role-based access control
- Trial subscription creation for new organizations
- Real-time authorization refresh events

---

## 🏗️ Architecture

The microservice follows a **layered modular architecture** with clear separation of concerns:

```
src/
├── config/          → Configuration and environment management
├── organization/    → Organization domain (entities, services, DTOs, patterns)
├── organization_domains/  → Organization domains management
├── user_organization/     → User-organization relationships and roles
├── redis/           → Redis module for caching and events
├── common/          → Shared utilities and helpers
└── app.module.ts    → Root module and bootstrap
```

### Architecture Diagram

```mermaid
graph TB
    RabbitMQ["🐰 RabbitMQ<br/>Message Broker"]
    
    subgraph OrgMS["Organization Microservice"]
        Controller["Controllers<br/>MessagePattern & EventPattern"]
        Service["Services<br/>Business Logic"]
        Database["Database Layer<br/>TypeORM"]
        Redis["Redis Cache"]
    end
    
    Database --> PostgreSQL[("📊 PostgreSQL<br/>Data Store")]
    Redis --> RedisServer[("⚡ Redis Server<br/>Cache & Events")]
    RabbitMQ --> Controller
    Service --> RabbitMQ
    Controller --> Service
    Service --> Database
    Service --> Redis
    
    PayerMS["💳 Payments MS"]
    PayerMS -.->|"subscription.create_trial"| RabbitMQ
    
    AuthzMS["🔐 Authorization MS"]
    AuthzMS -.->|"userOrganization.user_authz_refresh"| RabbitMQ
```

### Design Patterns

**1. Message Patterns (RPC)**
- Services handle synchronous RPC calls via `@MessagePattern`
- Request-response communication with other microservices
- Example: `organization.create`, `userOrganization.findAllOrganizationsByUser`

**2. Event Patterns (Async)**
- Services listen to async events via `@EventPattern`
- Event-driven communication for loosely coupled integration
- Example: `organization.update_event`, `userOrganization.user_authz_refresh`

**3. RPC Exception Handling**
- Centralized error handling via `RpcExceptionHelper`
- Consistent error responses with HTTP status codes
- Handles database constraints (duplicates, not found, etc.)

**4. Data Access Layer**
- Repository pattern using TypeORM
- Soft delete support for non-destructive removal
- Automatic entity loading and relationship management

---

## ⚙️ Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Runtime** | Node.js | 20.x (Alpine) | Server runtime |
| **Framework** | NestJS | ^11.0.1 | Web framework for microservices |
| **Database** | PostgreSQL | 14+ | Primary data store |
| **Async/Messaging** | RabbitMQ | 3.x | Message broker for inter-service communication |
| **ORM** | TypeORM | ^0.3.28 | Database abstraction and query builder |
| **Caching** | Redis | 6.x+ | In-memory cache and event storage |
| **Validation** | class-validator | ^0.14.3 | DTO validation |
| **Type Safety** | Zod | ^4.2.1 | Environment variable validation |
| **Configuration** | @nestjs/config | ^4.0.2 | Environment management |
| **Dev Tools** | TypeScript, ESLint, Prettier | Latest | Code quality and formatting |
| **Testing** | Jest, Supertest | ^29.x | Unit and E2E testing |

---

## 📁 Project Structure

```
src/
│
├── main.ts                          # Application bootstrap and RabbitMQ setup
├── app.module.ts                    # Root module configuration
│
├── config/
│   ├── envs.ts                      # .env validation and parsing (Zod)
│   ├── index.ts                     # Configuration exports
│   ├── services.ts                  # Service client names
│   └── transports/
│       └── rabbitmq.module.ts       # RabbitMQ transport configuration
│
├── common/
│   └── helpers/
│       └── rpc-exception.helper.ts  # Centralized RPC exception handling
│
├── redis/
│   ├── redis.module.ts              # Redis module setup
│   └── providers/
│       └── redis.provider.ts        # Redis client provider
│
├── organization/                    # Organization Domain Module
│   ├── organization.controller.ts   # RPC/Event handlers
│   ├── organization.service.ts      # Business logic
│   ├── organization.module.ts       # Module configuration
│   ├── entities/
│   │   └── organization.entity.ts   # Organization entity (TypeORM)
│   ├── dto/
│   │   ├── create-organization.dto.ts      # Create validation DTO
│   │   └── update-organization.dto.ts      # Update validation DTO
│   └── patterns/
│       ├── organization_patterns.ts # RPC message patterns
│       └── suscription_patterns.ts  # Subscription event patterns
│
├── organization_domains/            # Organization Domains Module
│   ├── organization_domains.controller.ts  # RPC handlers
│   ├── organization_domains.service.ts     # Domain management logic
│   ├── organization_domains.module.ts      # Module configuration
│   ├── entities/
│   │   └── organization_domain.entity.ts   # Domain entity
│   ├── dto/
│   │   ├── create-organization_domain.dto.ts
│   │   ├── update-organization_domain.dto.ts
│   │   └── response-organization-domain.dto.ts
│   └── patterns/
│       └── organization_domain_patterns.ts # Domain message patterns
│
└── user_organization/               # User-Organization Module
    ├── user_organization.controller.ts    # RPC/Event handlers
    ├── user_organization.service.ts       # User membership logic
    ├── user_organization.module.ts        # Module configuration
    ├── entities/
    │   └── user_organization.entity.ts    # User-Org relationship entity
    ├── dto/
    │   ├── create-user_organization.dto.ts
    │   ├── update-user_organization.dto.ts
    │   ├── find-all-user_organization.dto.ts
    │   └── user_authz_refresh_event.dto.ts
    ├── enums/
    │   ├── organization-roles.enum.ts      # Role definitions
    │   └── user_authz_refresh_reason.enum.ts
    └── patterns/
        └── user_organization_patterns.ts  # User-Org message patterns
```

### Key Folders

| Folder | Purpose |
|--------|---------|
| `config/` | Environment variables, RabbitMQ/Redis transport configuration |
| `organization/` | Core organization management (CRUD operations) |
| `organization_domains/` | Multi-domain support for organizations |
| `user_organization/` | User-organization membership and role assignments |
| `redis/` | Caching, message queues, real-time data |
| `common/helpers/` | Shared utilities, error handling, exception helpers |

---

## 🔌 Environment Variables

All environment variables are validated using **Zod** schema at startup. If validation fails, the application will not start.

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `NODE_ENV` | `development`\|`production`\|`test` | ✅ | — | Runtime environment |
| `PORT` | `number` | ❌ | `3000` | Microservice port (HTTP/TCP) |
| `DB_HOST` | `string` | ✅ | — | PostgreSQL hostname |
| `DB_PORT` | `number` | ❌ | `5432` | PostgreSQL port |
| `POSTGRES_USER` | `string` | ✅ | — | PostgreSQL username |
| `POSTGRES_PASSWORD` | `string` | ✅ | — | PostgreSQL password |
| `POSTGRES_DB` | `string` | ✅ | — | PostgreSQL database name |
| `RABBITMQ_URL` | `string` | ✅ | — | RabbitMQ connection URL (amqp:// or amqps://) |
| `RABBITMQ_QUEUE` | `string` | ✅ | — | Main RPC queue name |
| `RMQ_EVENTS_QUEUE_AUTHZ` | `string` | ✅ | — | Authorization events queue name |
| `RMQ_EVENTS_QUEUE_ORGANIZATION` | `string` | ✅ | — | Organization events queue name |
| `REDIS_HOST` | `string` | ✅ | — | Redis hostname |
| `REDIS_PORT` | `number` | ❌ | `6379` | Redis port |

### Example `.env` File

```bash
NODE_ENV=development
PORT=3000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
POSTGRES_USER=org_user
POSTGRES_PASSWORD=org_password123
POSTGRES_DB=organization_db

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_QUEUE=organization.rpc
RMQ_EVENTS_QUEUE_AUTHZ=events.authz
RMQ_EVENTS_QUEUE_ORGANIZATION=events.organization

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 🚀 Installation & Running

### Prerequisites

- **Node.js**: 20.x or higher
- **PostgreSQL**: 12.x or higher
- **RabbitMQ**: 3.x or higher
- **Redis**: 6.x or higher
- **npm** or **yarn**: Package manager

### Installation Steps

1. **Clone and navigate to the project:**
   ```bash
   cd organization-ms
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   # Create .env file in the project root
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Build the application:**
   ```bash
   npm run build
   ```

### Running the Service

**Development Mode** (with hot-reload):
```bash
npm run start:dev
```

**Production Mode:**
```bash
npm run start:prod
```

**Debug Mode:**
```bash
npm run start:debug
```

### Docker Deployment

**Build Docker image:**
```bash
docker build -t organization-ms:latest .
```

**Run Docker container:**
```bash
docker run -d \
  --name organization-ms \
  -p 3000:4003 \
  -e NODE_ENV=production \
  -e DB_HOST=postgres \
  -e RABBITMQ_URL=amqp://rabbitmq:5672 \
  -e REDIS_HOST=redis \
  organization-ms:latest
```

**Using Docker Compose** (recommended for local development):
```bash
docker-compose up -d
```

### Verification

After starting the service, verify it's running:

```bash
# Check logs
npm run start:dev

# Expected output:
# [Nest] 12345 - 04/13/2026, 10:30:45 AM     LOG [NestFactory] Starting Nest application...
# [Nest] 12345 - 04/13/2026, 10:30:45 AM     LOG [Bootstrap] Microservice is starting...
# [Nest] 12345 - 04/13/2026, 10:30:45 AM     LOG [NestFactory] Nest application successfully started
```

---

## 📡 API Endpoints

This microservice communicates exclusively via **RabbitMQ message patterns** (no HTTP endpoints). All communication is asynchronous through message queues.

### Message Pattern Format

Messages are sent to RabbitMQ queues using the pattern-based routing:
- **RPC Pattern**: Request expects a response
- **Event Pattern**: Async event with no response expected

### Organization Messages

| Pattern | Type | Request Payload | Response | Description |
|---------|------|-----------------|----------|-------------|
| `organization.create` | RPC | `CreateOrganizationDto` | `Organization` | Create new organization |
| `organization.find_one` | RPC | `string (id)` | `Organization` | Fetch organization by ID |
| `organization.update` | RPC | `UpdateOrganizationDto` | `Organization` | Update organization details |
| `organization.update_event` | Event | `UpdateOrganizationDto` | — | Update organization (async) |
| `organization.delete` | RPC | `string (id)` | `{ message: string }` | Soft delete organization |

### Organization Domains Messages

| Pattern | Type | Request Payload | Response | Description |
|---------|------|-----------------|----------|-------------|
| `organizationDomain.create` | RPC | `CreateOrganizationDomainDto` | `OrganizationDomain` | Register new domain |
| `organizationDomain.find_all` | RPC | `string (orgId)` | `OrganizationDomain[]` | Get all domains for organization |
| `organizationDomain.find_one` | RPC | `{ domain: string }` | `OrganizationDomain` | Get domain by CNAME |
| `organizationDomain.update` | RPC | `UpdateOrganizationDomainDto` | `OrganizationDomain` | Update domain settings |
| `organizationDomain.delete` | RPC | `string (id)` | `{ message: string }` | Delete domain |

### User-Organization Messages

| Pattern | Type | Request Payload | Response | Description |
|---------|------|-----------------|----------|-------------|
| `userOrganization.create` | RPC | `CreateUserOrganizationDto` | `UserOrganization` | Add user to organization |
| `userOrganization.findAllOrganizationsByUser` | RPC | `string (userId)` | `Organization[]` | Get all orgs for user |
| `userOrganization.findAllUsersByOrganization` | RPC | `string (orgId)` | `UserOrganization[]` | Get all members in org |
| `userOrganization.update` | RPC | `UpdateUserOrganizationDto` | `UserOrganization` | Update user role/membership |
| `userOrganization.delete` | RPC | `string (id)` | `{ message: string }` | Remove user from org |
| `userOrganization.restore` | RPC | `string (id)` | `UserOrganization` | Restore soft-deleted membership |
| `userOrganization.user_authz_refresh` | Event | `UserAuthzRefreshDto` | — | Handle auth refresh events |

### DTO Specifications

#### CreateOrganizationDto
```typescript
{
  name: string;              // Length: 2-50 chars (required)
  address?: string;          // Length: 0-100 chars (optional)
  ownerId: string;           // UUID format (required)
  logoUrl?: string;          // Valid URL (optional)
  contactEmail?: string;     // Valid email (optional)
  contactPhone?: string;     // Phone string (optional)
}
```

#### CreateUserOrganizationDto
```typescript
{
  userId: string;            // UUID format (required)
  organizationId: string;    // UUID format (required)
  role: OrganizationRole;    // 'customer' | 'staff' (required)
}
```

#### CreateOrganizationDomainDto
```typescript
{
  organizationId: string;    // UUID format (required)
  domain: string;            // Max 255 chars (required)
  isPrimary?: boolean;       // Default false (optional)
  isActive?: boolean;        // Default true (optional)
}
```

### Client Example (TypeScript)

```typescript
import { ClientProxy, Transport } from '@nestjs/microservices';

// Create RabbitMQ client
const client = ClientProxy.create({
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://guest:guest@localhost:5672'],
    queue: 'organization.rpc',
  },
});

// Send RPC message
const org = await client.send('organization.create', {
  name: 'Acme Corp',
  ownerId: '550e8400-e29b-41d4-a716-446655440000',
}).toPromise();

// Send event (no response)
client.emit('userOrganization.user_authz_refresh', {
  userId: '550e8400-e29b-41d4-a716-446655440001',
  reason: 'role_change',
});
```

---

## 🔐 Security

### Authentication & Authorization

1. **Input Validation**
   - All DTOs use `class-validator` decorators
   - Automatic validation via `ValidationPipe` middleware
   - Whitelist mode enabled (rejects unknown properties)
   - Custom error formatting for validation failures

2. **RPC Exception Handling**
   - Centralized error handling via `RpcExceptionHelper`
   - Consistent HTTP status codes in exception responses
   - Sensitive error details are not exposed to clients
   - Database constraint violations (duplicates, FK violations) are caught

3. **Data Integrity**
   - Soft delete support (non-destructive removal with `DeleteDateColumn`)
   - Unique constraints on organization name per owner
   - Unique user-organization combination (no duplicate memberships)
   - Domain uniqueness per organization

4. **Enums & Type Safety**
   - Role-based access control via `OrganizationRole` enum
   - Two roles: `customer`, `staff`
   - Type-safe enum validation in DTOs

5. **Environment Security**
   - Database credentials passed via environment variables
   - RabbitMQ connection validation (must start with amqp:// or amqps://)
   - Zod schema validation prevents invalid configurations at startup

### Soft Delete Strategy

- Organizations, user memberships, and domains use soft delete
- Deleted records remain in database with `deletedAt` timestamp
- Queries exclude soft-deleted records by default
- Restore operations available for recovery

---

## 🧠 Core Logic

### Organization Management Flow

```
1. Create Organization
   ├─ Check if organization already exists (by name + owner)
   ├─ Create new organization record
   ├─ Create user-organization membership (owner as STAFF)
   └─ Emit subscription.create_trial event to Payments MS

2. Update Organization
   ├─ Verify organization exists
   ├─ Update fields (except ownerId)
   └─ Return updated record

3. Delete Organization (Soft Delete)
   └─ Set deletedAt timestamp (record retained in DB)
```

### User-Organization Membership Flow

```
1. Add User to Organization
   ├─ Verify organization exists
   ├─ Create user-organization record with role
   └─ Return membership record

2. Handle Authorization Refresh (Event)
   ├─ Receive user authz refresh event
   ├─ Update user permissions in cache
   └─ Notify dependent services

3. Update User Role
   ├─ Verify membership exists
   ├─ Update role (customer ↔ staff)
   └─ Return updated record

4. Remove User from Organization (Soft Delete)
   ├─ Verify membership exists
   ├─ Check if already deleted
   └─ Set deletedAt timestamp
```

### Organization Domain Flow

```
1. Register Domain
   ├─ Check domain uniqueness (case-insensitive)
   ├─ Verify organization exists
   ├─ Store normalized domain (lowercase)
   └─ Return domain record

2. Find Domain
   ├─ Normalize search query (lowercase, trim)
   └─ Return matching domain

3. Update Domain
   ├─ Verify domain exists
   ├─ Check new domain for duplicates
   ├─ Update with normalized domain
   └─ Return updated record

4. Delete Domain
   ├─ Ensure organization has backup domain
   ├─ Prevent deletion if only domain remains
   └─ Hard delete from database
```

### Error Handling

Errors are caught and transformed into RPC exceptions with standard format:

```typescript
{
  statusCode: number;     // HTTP status code (409, 404, 400, 500, etc.)
  message: string;        // User-friendly error message
}
```

Common error scenarios:
- **409 Conflict**: Duplicate entry exists
- **404 Not Found**: Resource not found
- **400 Bad Request**: Invalid input or business logic violation
- **500 Internal Server Error**: Unexpected database or system error

---

## 🔄 Integrations

### External Services

| Service | Pattern | Transport | Direction | Purpose |
|---------|---------|-----------|-----------|---------|
| **Payments Microservice** | `subscription.create_trial` | RabbitMQ Event | Emit | Create trial subscription on org creation |
| **Authorization Microservice** | `userOrganization.user_authz_refresh` | RabbitMQ Event | Consume | Update user permissions in real-time |

### Communication Flows

#### 1. New Organization Creation → Payments Service
```
User Service calls: organization.create
    ↓
Organization Service:
  ├─ Creates organization
  ├─ Creates owner membership (STAFF role)
  └─ Emits: subscription.create_trial
    ↓
Payments Service receives event
  ├─ Creates trial subscription
  └─ Updates billing records
```

#### 2. Authorization Refresh Event ← Authorization Service
```
Authorization Service detects role/permission change
    ↓
Emits: userOrganization.user_authz_refresh event
    ↓
Organization Service receives event
  ├─ Updates authorization cache (Redis)
  └─ Syncs with database if needed
```

### RabbitMQ Configuration

**Main RPC Queue:**
- Name: Configured via `RABBITMQ_QUEUE`
- Exchange: Direct routing
- Durable: Yes
- Pattern-based message routing

**Event Queues:**
- Authorization events: `RMQ_EVENTS_QUEUE_AUTHZ`
- Organization events: `RMQ_EVENTS_QUEUE_ORGANIZATION`
- Exchange: Topic-based (app.events)
- Durable: Yes

---

## 🧪 Testing

### Test Setup

The project uses **Jest** for testing with TypeScript support.

### Running Tests

**Run all tests:**
```bash
npm test
```

**Run tests in watch mode:**
```bash
npm run test:watch
```

**Generate coverage report:**
```bash
npm run test:cov
```

**Run E2E tests:**
```bash
npm run test:e2e
```

**Debug tests:**
```bash
npm run test:debug
```

### Test Configuration

Jest configuration (from `package.json`):
- **Root Directory**: `src/`
- **Test Pattern**: `*.spec.ts`
- **Transform**: TypeScript via `ts-jest`
- **Test Environment**: Node.js
- **Coverage Output**: `coverage/` directory

### Creating Tests

Test files should be created in the same directory as the code being tested with `.spec.ts` suffix:

```typescript
// Example: organization.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationService } from './organization.service';

describe('OrganizationService', () => {
  let service: OrganizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganizationService],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

---

## 📌 Additional Notes

### Development Best Practices

1. **Database Migrations**
   - Use TypeORM migrations for schema changes in production
   - Set `synchronize: false` in production
   - Use `synchronize: true` only in development

2. **Code Formatting**
   ```bash
   # Format code
   npm run format
   
   # Lint code
   npm run lint
   ```

3. **RabbitMQ Connection**
   - Ensure RabbitMQ is running before starting the service
   - Connection is established at bootstrap time
   - Service will fail to start if RabbitMQ is unreachable

4. **Redis Cache**
   - Redis is required for authorization state and caching
   - Service will fail to start if Redis is unreachable
   - Consider implementing connections retry logic in production

5. **Production Checklist**
   - [ ] Set `NODE_ENV=production`
   - [ ] Use strong `POSTGRES_PASSWORD`
   - [ ] Enable `synchronize: false` in TypeORM
   - [ ] Configure proper RabbitMQ security (AMQPS)
   - [ ] Set up Redis persistence
   - [ ] Configure monitoring and logging
   - [ ] Set up proper error tracking (e.g., Sentry)
   - [ ] Review and test all environment variables
   - [ ] Set up automated backups for PostgreSQL

### Logging

The service uses NestJS built-in Logger:

```typescript
import { Logger } from '@nestjs/common';

const logger = new Logger('ClassName');
logger.log('Message');
logger.error('Error message');
logger.warn('Warning');
logger.debug('Debug info');
```

Check logs for troubleshooting and monitoring.

### Performance Considerations

1. **Database Queries**
   - Indexes are created on frequently queried columns
   - Use `relations` parameter carefully to avoid N+1 queries

2. **Redis Caching**
   - User authorization data cached in Redis
   - Reduces database hits for repeated lookups

3. **RabbitMQ**
   - Durable queues prevent message loss
   - Consider implementing retry logic for failed messages

### Troubleshooting

**Service won't start:**
- Check all environment variables are set
- Verify PostgreSQL, RabbitMQ, and Redis are running and accessible
- Review logs for specific error messages

**Database connection failed:**
- Verify PostgreSQL URL and credentials
- Check firewall rules
- Ensure database exists

**RabbitMQ connection failed:**
- Verify RabbitMQ is running (`rabbitmq-server`)
- Check URL format (must start with amqp:// or amqps://)
- Verify credentials

**Missing or stale data:**
- For development, set `synchronize: true` to auto-create tables
- For production, run migrations manually
- Check Redis cache expiration

---

## 📊 Entity Relationships

```mermaid
erDiagram
    ORGANIZATION ||--o{ ORGANIZATION_DOMAIN : has
    ORGANIZATION ||--o{ USER_ORGANIZATION : contains
    ORGANIZATION {
        uuid id PK
        string name
        string address
        uuid ownerId
        string stripeAccountId
        string logoUrl
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt
    }
    
    ORGANIZATION_DOMAIN {
        uuid id PK
        uuid organizationId FK
        string domain
        boolean isPrimary
        boolean isActive
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt
    }
    
    USER_ORGANIZATION {
        uuid id PK
        uuid organizationId FK
        string userId
        enum role
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt
    }
```

---

## 📚 References

- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [TypeORM Documentation](https://typeorm.io/)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [Redis Documentation](https://redis.io/documentation)

---

**Last Updated:** April 2026  
**Microservice Status:** Active & Production-Ready  
**Version:** 0.0.1
