# Architecture & Communication Flow

## Project Hierarchy - Middleware (saas_API_agent)

```
saas_API_agent/
│
├── src/                                    # Source code
│   ├── main.ts                            # Application entry point
│   ├── app.module.ts                      # Root module - imports all feature modules
│   │
│   ├── common/                            # Shared utilities
│   │   ├── filters/
│   │   │   └── all-exceptions.filter.ts   # Global error handler
│   │   └── interceptors/
│   │       ├── logging.interceptor.ts     # Logs all requests/responses
│   │       └── transform.interceptor.ts   # Standardizes API responses
│   │
│   └── modules/                           # Feature modules
│       │
│       ├── auth/                          # JWT Authentication Module
│       │   ├── auth.module.ts            # Auth module definition
│       │   ├── auth.service.ts           # JWT validation logic
│       │   ├── auth.controller.ts        # Auth endpoints (/auth/me, /auth/verify)
│       │   ├── decorators/
│       │   │   ├── public.decorator.ts   # @Public() - skip JWT check
│       │   │   └── roles.decorator.ts    # @Roles() - role-based access
│       │   ├── guards/
│       │   │   └── jwt-auth.guard.ts     # Validates JWT on every request
│       │   ├── strategies/
│       │   │   └── jwt.strategy.ts       # Passport JWT strategy
│       │   ├── interfaces/
│       │   │   └── jwt-payload.interface.ts  # JWT token structure
│       │   └── dto/
│       │       └── register.dto.ts       # DTOs for auth (legacy)
│       │
│       ├── test-execution/               # Test Execution Module
│       │   ├── test-execution.module.ts  # Module definition + Bull queue setup
│       │   ├── test-execution.service.ts # Business logic - manages test runs
│       │   ├── test-execution.controller.ts  # REST endpoints
│       │   ├── test-execution.processor.ts   # Bull queue worker - processes jobs
│       │   ├── dto/
│       │   │   └── create-test-run.dto.ts    # Request validation
│       │   └── enums/
│       │       └── test-run-status.enum.ts   # QUEUED, RUNNING, COMPLETED, etc.
│       │
│       ├── agent-communication/          # Web Agent Communication Module
│       │   ├── agent-communication.module.ts     # Module + HTTP client
│       │   ├── agent-communication.service.ts    # HTTP client to web agent
│       │   ├── agent-communication.controller.ts # Agent status endpoints
│       │   └── dto/
│       │       ├── agent-request.dto.ts          # Request/response DTOs
│       │       └── index.ts
│       │
│       └── health/                       # Health Check Module
│           ├── health.module.ts          # Health module definition
│           └── health.controller.ts      # /health, /readiness, /liveness
│
├── logs/                                  # Application logs
│   ├── error.log                         # Error logs only
│   └── combined.log                      # All logs
│
├── k8s/                                   # Kubernetes deployment configs
│   ├── deployment.yaml                   # Pod deployment
│   ├── hpa.yaml                          # Horizontal Pod Autoscaler
│   └── ingress.yaml                      # Ingress + TLS
│
├── .env                                   # Environment variables
├── .gitignore                            # Git ignore rules
├── package.json                          # Dependencies & scripts
├── tsconfig.json                         # TypeScript configuration
├── nest-cli.json                         # NestJS CLI config
├── docker-compose.yml                    # Multi-container setup
├── Dockerfile                            # Container image definition
│
└── Documentation/
    ├── README.md                         # Project overview
    ├── QUICKSTART.md                     # Quick start guide
    ├── AUTHENTICATION_GUIDE.md           # JWT authentication details
    ├── WEB_AGENT_INTEGRATION.md          # Web agent integration guide
    ├── WEB_AGENT_SETUP_COMPLETE.md       # Setup summary
    ├── PROMPT_FOR_WEB_AGENT.md           # Prompt for web agent project
    ├── SETUP_SUMMARY.md                  # Initial setup summary
    ├── web-agent-api-example.ts          # Reference implementation
    ├── test-connection.ps1               # Test web agent connection
    ├── test-full-integration.ps1         # End-to-end integration test
    ├── test-agent-connection.ps1         # Agent connection test
    └── debug-token.ps1                   # JWT token debugging
```

---

## Folder Purpose Breakdown

### `/src` - Application Source Code

#### **`main.ts`** - Entry Point
```typescript
// Purpose: Bootstrap the NestJS application
// - Configures Winston logger
// - Sets up Helmet security headers
// - Enables CORS
// - Configures ValidationPipe for DTO validation
// - Generates Swagger documentation
// - Starts server on port 3001
```

#### **`app.module.ts`** - Root Module
```typescript
// Purpose: Wire all modules together
// Imports:
// - AuthModule (JWT authentication)
// - TestExecutionModule (test management)
// - AgentCommunicationModule (web agent client)
// - HealthModule (health checks)
// - BullModule (Redis queue)
// - ThrottlerModule (rate limiting)
```

---

### 🔒 `/src/modules/auth` - Authentication Module

**Purpose**: Validate JWT tokens from SaaS platform

| File | Purpose |
|------|---------|
| `auth.service.ts` | Validates JWT tokens using shared `JWT_SECRET` |
| `auth.controller.ts` | **GET /auth/me** - Get user from token<br>**GET /auth/verify** - Validate token |
| `jwt-auth.guard.ts` | Global guard - checks JWT on every request |
| `jwt.strategy.ts` | Passport strategy - extracts & validates JWT |
| `jwt-payload.interface.ts` | Defines token structure (userId, email, orgSlug, etc.) |

**Key Point**: Does NOT manage users or issue tokens - only validates tokens from SaaS platform

---

### 🧪 `/src/modules/test-execution` - Test Execution Module

**Purpose**: Manage test run lifecycle & queue jobs

| File | Purpose |
|------|---------|
| `test-execution.service.ts` | **Business Logic**<br>- Create test runs<br>- Store in-memory (Map)<br>- Queue jobs to Bull<br>- Track status |
| `test-execution.controller.ts` | **REST API**<br>- POST /trigger - Start test<br>- GET /runs - List tests<br>- GET /runs/:id - Get details<br>- GET /runs/:id/results - Get results<br>- DELETE /runs/:id - Cancel test |
| `test-execution.processor.ts` | **Bull Queue Worker**<br>- Picks up queued jobs<br>- Calls agent service<br>- Updates test status<br>- Handles retries |
| `create-test-run.dto.ts` | Request validation (testCaseId, config) |
| `test-run-status.enum.ts` | Status values: QUEUED, RUNNING, COMPLETED, FAILED, CANCELLED |

**Flow**:
```
1. User → POST /trigger → Service (creates test run)
2. Service → Adds job to Bull queue
3. Processor → Picks up job
4. Processor → Calls agent-communication.service
5. Processor → Updates test run status
6. User → GET /runs/:id → Gets results
```

---

### 🤖 `/src/modules/agent-communication` - Web Agent Client Module

**Purpose**: HTTP client to communicate with web agent

| File | Purpose |
|------|---------|
| `agent-communication.service.ts` | **HTTP Client**<br>- `executeTest()` - POST /api/test/execute<br>- `getAgentStatus()` - GET /api/health<br>- `cancelTestExecution()` - POST /api/test/cancel<br>- `getTestResults()` - GET /api/test/results/:id<br>- Uses API key authentication |
| `agent-communication.controller.ts` | **REST API**<br>- GET /agent/status - Check agent health<br>- GET /agent/artifacts/:id - Get screenshots/videos |
| `agent-request.dto.ts` | Request/response DTOs for agent API |

**Configuration** (from `.env`):
```bash
AGENT_SERVICE_URL=http://localhost:4000
AGENT_SERVICE_API_KEY=1TrQK49cd2Msv+xmegnXFYkVG7XqnzWM+ApETkpv5Ko=
AGENT_SERVICE_TIMEOUT=300000  # 5 minutes
```

---

### ❤️ `/src/modules/health` - Health Check Module

**Purpose**: Kubernetes/Docker health monitoring

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | General health check |
| `GET /health/readiness` | Is app ready to receive traffic? |
| `GET /health/liveness` | Is app alive (not deadlocked)? |

---

### 🛠️ `/src/common` - Shared Utilities

| File | Purpose |
|------|---------|
| `all-exceptions.filter.ts` | Catches all errors, formats response, logs |
| `logging.interceptor.ts` | Logs every incoming request & response |
| `transform.interceptor.ts` | Standardizes response format |

---

## 🔄 Communication Flow

### Architecture Overview

```
┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│   SaaS Platform     │   JWT   │   Middleware        │  API    │   Web Agent         │
│   (Port 3000)       │ ──────► │   (Port 3001)       │  Key ──►│   (Port 4000)       │
│                     │         │                     │         │                     │
│ - User Management   │         │ - JWT Validation    │         │ - Test Execution    │
│ - Test Cases DB     │         │ - Job Queue         │         │ - LangGraph Agent   │
│ - Issues JWT        │         │ - Redis             │         │ - Playwright        │
└─────────────────────┘         └─────────────────────┘         └─────────────────────┘
         │                                │                                │
         │                                │                                │
         ├── Prisma Database ─────────────┤                                │
         │   (PostgreSQL)                 │                                │
         │   - Users, Organizations       │                                │
         │   - Test Cases, Test Runs      │                                │
         │   - Results                    │                                │
         └────────────────────────────────┘                                │
                                          │                                │
                                          ├── Redis (Port 6379) ──────────┤
                                          │   - Bull Queue                 │
                                          │   - Job Storage                │
                                          └────────────────────────────────┘
```

---

## 🔀 Detailed Communication Flow

### 1️⃣ Authentication Flow (SaaS → Middleware)

```
┌──────────┐                                    ┌──────────────┐
│  User    │                                    │ SaaS Platform│
│ Browser  │                                    │  (Port 3000) │
└────┬─────┘                                    └──────┬───────┘
     │                                                  │
     │ 1. Login (email/password)                       │
     ├─────────────────────────────────────────────────►
     │                                                  │
     │ 2. JWT Token (in cookie: auth_token)            │
     │◄─────────────────────────────────────────────────┤
     │                                                  │
     │                                                  │
     │ 3. API Request with JWT                         │
     ├──────────────────────────────►┌────────────────┐│
     │                                │  Middleware    ││
     │                                │  (Port 3001)   ││
     │                                │                ││
     │                                │  jwt.strategy  ││
     │                                │  validates JWT ││
     │                                │  using         ││
     │                                │  JWT_SECRET    ││
     │                                └────────────────┘│
     │                                                  │
     │ 4. Response with user data                      │
     │◄─────────────────────────────────────────────────┤
     │                                                  │
```

**Key Files**:
- `auth.controller.ts` - Receives request
- `jwt-auth.guard.ts` - Intercepts every request
- `jwt.strategy.ts` - Validates token
- `jwt-payload.interface.ts` - Extracts user info (userId, email, orgSlug)

**Authentication Flow Code**:
```typescript
// 1. Request comes in
POST /api/v1/test-execution/trigger
Headers: { Authorization: "Bearer eyJhbGci..." }

// 2. JwtAuthGuard intercepts
→ jwt-auth.guard.ts

// 3. Passport validates
→ jwt.strategy.ts
  - Extracts token
  - Verifies signature with JWT_SECRET
  - Returns user payload

// 4. Request object enriched
req.user = {
  userId: "...",
  email: "...",
  firstName: "...",
  lastName: "...",
  orgSlug: "qa-team-1"
}

// 5. Controller accesses user
@Request() req → req.user.userId, req.user.orgSlug
```

---

### 2️⃣ Test Execution Flow (Middleware → Web Agent)

```
┌──────────┐    ┌──────────────┐    ┌──────────┐    ┌──────────────┐
│  User    │    │  Middleware  │    │  Redis   │    │  Web Agent   │
│          │    │  (Port 3001) │    │  Queue   │    │  (Port 4000) │
└────┬─────┘    └──────┬───────┘    └────┬─────┘    └──────┬───────┘
     │                 │                  │                 │
     │ 1. Trigger Test │                  │                 │
     ├────────────────►│                  │                 │
     │  POST /trigger  │                  │                 │
     │  + JWT token    │                  │                 │
     │                 │                  │                 │
     │                 │ 2. Create run    │                 │
     │                 │    (in memory)   │                 │
     │                 │                  │                 │
     │                 │ 3. Queue job     │                 │
     │                 ├─────────────────►│                 │
     │                 │  Bull.add(...)   │                 │
     │                 │                  │                 │
     │ 4. Response     │                  │                 │
     │◄────────────────┤                  │                 │
     │  { testRunId,   │                  │                 │
     │    status:      │                  │                 │
     │    "QUEUED" }   │                  │                 │
     │                 │                  │                 │
     │                 │  5. Worker picks │                 │
     │                 │     up job       │                 │
     │                 │◄─────────────────┤                 │
     │                 │  Processor       │                 │
     │                 │                  │                 │
     │                 │ 6. Update status │                 │
     │                 │    → RUNNING     │                 │
     │                 │                  │                 │
     │                 │ 7. Send test to agent             │
     │                 ├──────────────────────────────────►│
     │                 │  POST /api/test/execute           │
     │                 │  Headers: x-api-key               │
     │                 │  Body: {                          │
     │                 │    testRunId,                     │
     │                 │    testCase: {...},               │
     │                 │    config: {...}                  │
     │                 │  }                                │
     │                 │                                   │
     │                 │                  8. Execute test  │
     │                 │                     (LangGraph +  │
     │                 │                      Playwright)  │
     │                 │                                   │
     │                 │ 9. Results                        │
     │                 │◄──────────────────────────────────┤
     │                 │  { status: "passed",              │
     │                 │    results: {...},                │
     │                 │    duration: 15000 }              │
     │                 │                                   │
     │                 │ 10. Update status                 │
     │                 │     → COMPLETED                   │
     │                 │     + store results               │
     │                 │                                   │
     │ 11. Get results │                                   │
     ├────────────────►│                                   │
     │  GET /runs/:id  │                                   │
     │                 │                                   │
     │ 12. Response    │                                   │
     │◄────────────────┤                                   │
     │  { status,      │                                   │
     │    results }    │                                   │
     │                 │                                   │
```

**Key Files in Flow**:

1. **test-execution.controller.ts** - Receives trigger request
2. **test-execution.service.ts** - Creates test run, queues job
3. **Redis/Bull** - Stores job
4. **test-execution.processor.ts** - Worker picks up job
5. **agent-communication.service.ts** - Sends HTTP request to agent
6. **Web Agent API** - Executes test
7. **test-execution.processor.ts** - Receives results, updates status
8. **test-execution.service.ts** - Stores results
9. **test-execution.controller.ts** - Returns results to user

---

### 3️⃣ Agent Communication Details

**Middleware → Web Agent Request**:

```typescript
// File: agent-communication.service.ts
POST http://localhost:4000/api/test/execute
Headers: {
  'x-api-key': '1TrQK49cd2Msv+xmegnXFYkVG7XqnzWM+ApETkpv5Ko=',
  'Content-Type': 'application/json'
}
Body: {
  testRunId: "test-run-1706400000-xyz",
  testCaseId: "uuid",
  orgSlug: "qa-team-1",
  testCase: {
    id: "uuid",
    title: "Login Test",
    description: "Test login flow",
    steps: [
      { action: "navigate", target: "https://example.com", expectedResult: "..." }
    ],
    expectedResults: ["User logged in"]
  },
  config: {
    browserType: "chromium",
    headless: true,
    timeout: 30000,
    screenshots: true
  },
  metadata: {
    userId: "...",
    triggeredAt: "2026-01-28T10:00:00Z"
  }
}
```

**Web Agent → Middleware Response**:

```typescript
Response 200 OK:
{
  testRunId: "test-run-1706400000-xyz",
  testCaseId: "uuid",
  status: "passed",  // or "failed", "error"
  message: "Test executed successfully",
  results: {
    duration: 15000,  // milliseconds
    steps: [
      {
        step: 1,
        action: "navigate",
        status: "passed",
        screenshot: "base64...",
        timestamp: "2026-01-28T10:00:01Z"
      }
    ],
    screenshots: ["url1", "url2"],
    video: "url",
    logs: ["log1", "log2"]
  }
}
```

---

## 🔐 Security & Authentication

### JWT Authentication (SaaS → Middleware)

**Secret**: `JWT_SECRET=3408293faccc0774e8b189911373e0ee`

**Token Structure**:
```json
{
  "sub": "27acbc91-97b6-4d8f-8664-55cb29ad3d37",  // userId
  "email": "mouhsine.elmoudir@gmail.com",
  "firstName": "Mouhsine",
  "lastName": "EL MOUDIR",
  "avatarUrl": "https://...",
  "orgSlug": "qa-team-1-uh5mp2",
  "iat": 1738054382,  // issued at
  "exp": 1738659182   // expires (7 days)
}
```

**Validation**:
- Every request must have: `Authorization: Bearer <token>`
- `jwt-auth.guard.ts` validates on every route (except `@Public()` routes)
- `jwt.strategy.ts` verifies signature and expiration

---

### API Key Authentication (Middleware → Web Agent)

**Key**: `AGENT_SERVICE_API_KEY=1TrQK49cd2Msv+xmegnXFYkVG7XqnzWM+ApETkpv5Ko=`

**Usage**:
- Middleware includes: `x-api-key: <key>` in every request to web agent
- Web agent validates key before processing
- **No JWT used** between middleware and agent

---

## 📊 Data Storage

### Middleware (Current - In-Memory)

```typescript
// test-execution.service.ts
private testRuns = new Map<string, TestRun>();

// Stores:
// - Test run metadata
// - Status
// - Configuration
// - Results (from agent)
// - Timestamps

// Limitation: Lost on server restart
```

### Future - Database Integration

```
SaaS Platform Database (PostgreSQL)
└── Prisma Schema
    ├── User
    ├── Organization
    ├── TestCase
    ├── TestRun ← Middleware should store here
    └── TestResult ← Middleware should store here
```

**TODO**: Replace in-memory Map with Prisma client to store results in database

---

## 🚀 Deployment Architecture

### Local Development

```
Machine: localhost
├── Port 3000: SaaS Platform (Next.js)
├── Port 3001: Middleware (NestJS) ← This project
├── Port 4000: Web Agent (Express + LangGraph)
├── Port 6379: Redis (Bull Queue)
└── Port 5433: PostgreSQL (SaaS Database)
```

### Production (Kubernetes)

```
Kubernetes Cluster
├── saas-platform (deployment)
├── middleware (deployment) ← This project
│   ├── Pods: 3 replicas
│   ├── HPA: Auto-scale 2-10 pods
│   ├── Service: ClusterIP
│   └── Ingress: api.yourdomain.com
├── web-agent (deployment)
│   └── Service: ClusterIP (internal only)
├── redis (deployment)
│   └── Service: ClusterIP
└── postgresql (StatefulSet)
    └── PVC: Persistent storage
```

---

## 📦 Dependencies Summary

### Key Dependencies

| Package | Purpose |
|---------|---------|
| `@nestjs/core` | NestJS framework |
| `@nestjs/jwt` | JWT token handling |
| `@nestjs/passport` | Authentication middleware |
| `@nestjs/bull` | Redis queue integration |
| `@nestjs/axios` | HTTP client for agent communication |
| `bull` | Job queue library |
| `passport-jwt` | JWT authentication strategy |
| `class-validator` | DTO validation |
| `helmet` | Security headers |
| `winston` | Logging |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| `@nestjs/cli` | NestJS CLI tools |
| `typescript` | TypeScript compiler |
| `ts-loader` | Webpack TypeScript loader |
| `nodemon` | Auto-restart on changes |

---

## 🧪 Testing Files

| File | Purpose |
|------|---------|
| `test-connection.ps1` | Test middleware → web agent connection |
| `test-full-integration.ps1` | End-to-end integration test |
| `test-agent-connection.ps1` | Detailed agent connection test |
| `debug-token.ps1` | Extract and test JWT tokens |

---

## 📚 Summary

### What This Middleware Does:

1. **Validates JWT tokens** from SaaS platform
2. **Queues test execution jobs** in Redis/Bull
3. **Communicates with web agent** via HTTP + API key
4. **Manages test run lifecycle** (create, track, complete)
5. **Provides REST API** for SaaS platform to trigger tests
6. **Handles authentication** and authorization
7. **Logs and monitors** all operations

### What It Doesn't Do:

- ❌ Doesn't execute tests (that's the web agent's job)
- ❌ Doesn't manage users (that's the SaaS platform's job)
- ❌ Doesn't store to database yet (uses in-memory storage)
- ❌ Doesn't generate JWT tokens (receives them from SaaS)

### Communication Summary:

```
User → SaaS Platform → Middleware → Web Agent → Browser (Playwright)
                    ↑               ↑             ↓
                    JWT           API Key      Test Results
```

This middleware is the **bridge** between your SaaS platform and the test execution agent! 🌉
