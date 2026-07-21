# 🏢 Organization Microservice (`organization-ms`)

A NestJS microservice responsible for managing organizations, custom domains, memberships, and role assignments in a multi-tenant ecosystem.

The service communicates exclusively through RabbitMQ and provides the foundation for organization ownership, permissions, and tenant resolution across the platform.

---

# 📋 Table of Contents

* Overview
* Architecture
* Features
* Tech Stack
* Getting Started
* Environment Variables
* RabbitMQ Patterns
* Domain Management
* Membership Management
* Database Entities
* Dependencies
* Caching Strategy
* Development Notes

---

# 🚀 Overview

`organization-ms` manages:

* Organization creation and lifecycle
* Custom domain registration
* User memberships
* Organization roles
* Authorization cache generation
* Customer anonymization events
* Multi-tenant organization resolution

The service acts as the central source of truth for organization ownership and user access across the platform.

---

# 🏗️ Architecture

```text
                   ┌──────────────────┐
                   │   Client Gateway │
                   └────────┬─────────┘
                            │ RabbitMQ
                            ▼

┌─────────────────────────────────────────────┐
│              organization-ms               │
├─────────────────────────────────────────────┤
│ Organizations                               │
│ Domains                                     │
│ Memberships                                 │
│ Roles                                       │
│ Authorization Cache                         │
└──────┬───────────────┬───────────────┬──────┘
       │               │               │
       ▼               ▼               ▼
 PostgreSQL         Redis          RabbitMQ
```

---

# ✨ Features

* Organization management
* Custom domain support
* Membership management
* Role assignment
* Multi-tenant architecture
* Authorization cache generation
* RabbitMQ event-driven communication
* Soft delete support
* Customer anonymization support
* Redis-backed permission caching

---

# 🛠 Tech Stack

| Category               | Technology      |
| ---------------------- | --------------- |
| Framework              | NestJS 11       |
| Language               | TypeScript 5    |
| Database               | PostgreSQL      |
| ORM                    | TypeORM         |
| Messaging              | RabbitMQ        |
| Cache                  | Redis           |
| Validation             | class-validator |
| Environment Validation | Zod             |
| Testing                | Jest            |

---

# ⚙️ Getting Started

## Prerequisites

* Node.js 20+
* PostgreSQL
* RabbitMQ
* Redis

---

## Installation

```bash
npm install

cp .env.example .env

npm run start:dev
```

---

## Available Scripts

```bash
npm run build

npm run start
npm run start:dev
npm run start:debug
npm run start:prod

npm run lint
npm run format

npm test
npm run test:watch
npm run test:cov
npm run test:e2e
```

---

# 🌍 Environment Variables

| Variable                      | Required | Description                |
| ----------------------------- | -------- | -------------------------- |
| NODE_ENV                      | ✅        | Environment                |
| PORT                          | ✅        | Service port               |
| DB_HOST                       | ✅        | PostgreSQL host            |
| DB_PORT                       | ✅        | PostgreSQL port            |
| POSTGRES_USER                 | ✅        | Database user              |
| POSTGRES_PASSWORD             | ✅        | Database password          |
| POSTGRES_DB                   | ✅        | Database name              |
| RABBITMQ_URL                  | ✅        | RabbitMQ connection string |
| RABBITMQ_QUEUE                | ✅        | Main queue                 |
| RMQ_EVENTS_QUEUE_AUTHZ        | ✅        | Authorization events queue |
| RMQ_EVENTS_QUEUE_ORGANIZATION | ✅        | Organization events queue  |
| REDIS_HOST                    | ✅        | Redis host                 |
| REDIS_PORT                    | ✅        | Redis port                 |
| REDIS_PASS                    | ✅        | Redis password             |

---

# 📨 RabbitMQ Patterns

## Organizations

| Pattern                   | Description              |
| ------------------------- | ------------------------ |
| organization.create       | Create organization      |
| organization.find_one     | Get organization         |
| organization.update       | Update organization      |
| organization.update_event | Update via event         |
| organization.stripe.clear | Remove Stripe account    |
| organization.delete       | Soft delete organization |

---

## Organization Domains

| Pattern                     | Description     |
| --------------------------- | --------------- |
| organizationDomain.create   | Register domain |
| organizationDomain.find_all | List domains    |
| organizationDomain.find_one | Resolve domain  |
| organizationDomain.update   | Update domain   |
| organizationDomain.delete   | Delete domain   |

---

## User Organizations

| Pattern                                     | Description            |
| ------------------------------------------- | ---------------------- |
| userOrganization.create                     | Create membership      |
| userOrganization.findAllOrganizationsByUser | User organizations     |
| userOrganization.findAllUsersByOrganization | Organization users     |
| userOrganization.update                     | Update membership      |
| userOrganization.delete                     | Soft delete membership |
| userOrganization.restore                    | Restore membership     |

---

## Events

| Pattern                             | Description          |
| ----------------------------------- | -------------------- |
| userOrganization.user_authz_refresh | Refresh permissions  |
| customer.anonymized                 | Remove customer data |

---

# 🌐 Domain Management

Organizations can register one or more custom domains.

Examples:

```text
restaurant-a.com
restaurant-b.fr
app.myrestaurant.com
```

Domain capabilities:

* Domain registration
* Domain validation
* Domain lookup
* Domain updates
* Domain deletion
* Tenant resolution

The service normalizes domains to lowercase before storage.

---

# 👥 Membership Management

Organizations can have multiple users with different roles.

Typical roles:

```text
OWNER
STAFF
CUSTOMER
```

Membership features:

* Create memberships
* Update roles
* Soft delete memberships
* Restore memberships
* List organization members
* List user organizations

---

# 🔐 Authorization Cache

The service maintains a Redis cache containing the organizations accessible by each user.

Cache key:

```text
user:<userId>:orgs
```

Cached structure:

```json
[
  {
    "organizationId": "uuid",
    "role": "staff",
    "email": "user@email.com",
    "stripeAccountId": "acct_xxxxx"
  }
]
```

TTL:

```text
3600 seconds
```

Cache rebuilds automatically when:

* Memberships are created
* Memberships are updated
* Memberships are deleted
* Memberships are restored
* Authorization refresh events are received

---

# 🗄 Database Entities

## Organization

Represents a tenant organization.

Main fields:

* id
* name
* ownerId
* stripeAccountId
* logoUrl
* createdAt
* updatedAt
* deletedAt

Capabilities:

* Soft delete support
* Stripe Connect integration
* Multi-domain support

---

## OrganizationDomain

Represents a custom domain attached to an organization.

Main fields:

* id
* organizationId
* domain

Examples:

```text
restaurant.com
orders.restaurant.com
mybrand.fr
```

---

## UserOrganization

Represents a membership between a user and an organization.

Main fields:

* userId
* organizationId
* role
* createdAt
* updatedAt
* deletedAt

Capabilities:

* Soft delete support
* Role assignment
* Cache synchronization

---

# 🔗 External Dependencies

## PostgreSQL

Stores:

* Organizations
* Domains
* Memberships

---

## Redis

Used for:

* Authorization cache
* Membership cache invalidation

---

## RabbitMQ

Used for:

* RPC communication
* Event-driven communication
* Authorization refresh events
* Customer anonymization events

The service listens on multiple queues to process organization and authorization events.

---

# 🔄 Service Flow

```text
User Creates Organization
            │
            ▼
Organization Created
            │
            ▼
Owner Membership Created
            │
            ▼
Redis Cache Rebuilt
            │
            ▼
Authorization Updated
```

---

# 🏢 Multi-Tenant Resolution

Tenant resolution is performed through organization domains.

Example:

```text
pizza-paris.com
        │
        ▼
Organization Lookup
        │
        ▼
organizationId
```

This allows multiple organizations to share the same platform while maintaining complete data isolation.

---

# ⚠️ Development Notes

## Current Limitations

### Unused Patterns

The following patterns exist in constants but currently have no handlers:

* organization.find_all
* organization.restore

---

### Package Name Mismatch

Current repository contains:

```text
Folder:
organization-ms

Package Name:
membership-ms
```

This should be standardized.

---

### Environment Example

`.env.example` is missing:

```text
REDIS_PASS
```

but the application requires it at startup.

---

### Testing

The project includes Jest configuration and test scripts, but no active test files are currently present in the repository.

---

### RabbitMQ Client Registration

A payments event client is registered but currently unused by the application.

---

# 📈 Service Scope

This service acts as the organizational backbone of the platform.

Responsibilities include:

* Organization lifecycle management
* Domain ownership
* User memberships
* Role management
* Authorization caching
* Multi-tenant resolution

Every service that requires organization context ultimately depends on data managed by `organization-ms`.
