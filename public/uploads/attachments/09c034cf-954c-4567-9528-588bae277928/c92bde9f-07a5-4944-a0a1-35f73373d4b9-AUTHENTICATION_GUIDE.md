# Authentication Integration Guide

## Overview

This middleware now validates JWT tokens from your **SaaS platform** (localhost:3000) instead of managing users locally. Users authenticate via your SaaS platform, and this middleware validates those tokens.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌────────────────┐
│   SaaS Platform │         │  This Middleware │         │ Agent Service  │
│  (localhost:3000)│────────>│  (localhost:3000)│────────>│ (localhost:4000)│
│                 │  JWT    │                  │  API Key│                │
│  - User login   │         │  - Validate JWT  │         │  - Execute tests│
│  - Issue tokens │         │  - Extract user  │         │  - Return results│
│  - Manage users │         │  - Extract org   │         │                │
└─────────────────┘         └──────────────────┘         └────────────────┘
```

## Token Flow

### 1. User authenticates on SaaS platform:
```
POST http://localhost:3000/api/auth/signin
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### 2. Token payload contains:
```typescript
{
  sub: "550e8400-e29b-41d4-a716-446655440000",  // User ID
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  avatarUrl: "https://...",
  orgSlug: "my-organization",  // Organization context
  iat: 1706400000,
  exp: 1707004800  // 7 days expiration
}
```

### 3. Client calls this middleware with the token:
```
GET http://localhost:3000/api/v1/test-execution
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Middleware validates token and extracts user:
```typescript
req.user = {
  userId: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  avatarUrl: "https://...",
  orgSlug: "my-organization"
}
```

## API Endpoints

### Authentication Endpoints

#### GET `/api/v1/auth/me`
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN_FROM_SAAS>
```

**Response:**
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "avatarUrl": "https://...",
  "orgSlug": "my-organization"
}
```

#### GET `/api/v1/auth/verify`
Verify if a JWT token is valid.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN_FROM_SAAS>
```

**Response:**
```json
{
  "valid": true,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "orgSlug": "my-organization"
}
```

## Configuration

### Environment Variables

**`.env` file:**
```env
# CRITICAL: Must match your SaaS platform JWT_SECRET exactly!
JWT_SECRET=3408293faccc0774e8b189911373e0ee

# SaaS Platform URL
SAAS_PLATFORM_URL=http://localhost:3000

# Other settings...
PORT=3000
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Testing with Postman/cURL

### 1. Get a token from your SaaS platform:

```bash
# Windows PowerShell
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/signin" -Method POST -ContentType "application/json" -Body '{"email":"user@example.com","password":"password123"}'
$token = $response.token
```

### 2. Use the token with this middleware:

```bash
# Get current user
curl -X GET http://localhost:3000/api/v1/auth/me `
  -H "Authorization: Bearer $token"

# Trigger a test run
curl -X POST http://localhost:3000/api/v1/test-execution/trigger `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"testCaseId":"test-case-123"}'
```

## Organization Context

The middleware automatically extracts organization context from the JWT token:

```typescript
// In your controllers
@Post('trigger')
async triggerTestRun(@Body() dto: CreateTestRunDto, @Request() req) {
  const userId = req.user.userId;
  const orgSlug = req.user.orgSlug;
  
  // Now you can filter/scope data by organization
  return this.service.triggerTestRun(dto, userId, orgSlug);
}
```

## Security Considerations

### ✅ What's Secured:
1. **Token Validation**: Uses the same JWT_SECRET as your SaaS platform
2. **Token Expiration**: Respects 7-day expiration from SaaS
3. **Organization Isolation**: Each request carries organization context
4. **Stateless**: No user sessions or database lookups needed

### ⚠️ Important Notes:

1. **JWT_SECRET must match**: This middleware MUST use the EXACT same `JWT_SECRET` as your SaaS platform
2. **No token refresh**: Tokens expire after 7 days; users must re-authenticate on SaaS platform
3. **No user storage**: This middleware doesn't store user data; it only validates tokens
4. **Organization in token**: If `orgSlug` is not in the token, consider extracting it from the request URL

## Code Examples

### Protected Endpoint Example:

```typescript
import { Controller, Get, Request } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('my-resource')
@ApiBearerAuth()  // Requires JWT token
export class MyController {
  
  @Get()
  async getResources(@Request() req) {
    // User info is automatically available
    const user = req.user;
    // {
    //   userId: "...",
    //   email: "...",
    //   firstName: "...",
    //   lastName: "...",
    //   avatarUrl: "...",
    //   orgSlug: "..."
    // }
    
    // Use organization for data scoping
    return this.service.findByOrganization(user.orgSlug);
  }
}
```

### Public Endpoint Example:

```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from '@/modules/auth/decorators/public.decorator';

@Controller('public')
export class PublicController {
  
  @Get('health')
  @Public()  // No authentication required
  async healthCheck() {
    return { status: 'ok' };
  }
}
```

## Troubleshooting

### Token Validation Fails

**Error:** `401 Unauthorized - Invalid or expired token`

**Solutions:**
1. Verify `JWT_SECRET` matches your SaaS platform exactly
2. Check token hasn't expired (7 days from issuance)
3. Ensure token is sent in `Authorization: Bearer <token>` header
4. Verify token was issued by your SaaS platform

### Organization Context Missing

**Error:** `orgSlug is undefined`

**Solution:**
The SaaS platform may not include `orgSlug` in all tokens. You can:
1. Update SaaS platform to include `orgSlug` in JWT payload
2. Extract organization from request URL: `/api/v1/:orgSlug/...`
3. Use a separate header for organization context

### Testing Locally

```bash
# 1. Start your SaaS platform
cd /path/to/saas-platform
npm run dev  # Runs on localhost:3000

# 2. Start this middleware (in another terminal)
cd /path/to/saas_API_agent
npm run start:dev  # Also runs on localhost:3000 (you may need to change port!)

# 3. Get token from SaaS and test middleware
curl http://localhost:3000/api/auth/signin -X POST ...
curl http://localhost:3001/api/v1/auth/me -H "Authorization: Bearer <token>"
```

## Integration Checklist

- [ ] `JWT_SECRET` in `.env` matches SaaS platform
- [ ] SaaS platform includes `orgSlug` in JWT token (optional but recommended)
- [ ] Middleware runs on different port or different host than SaaS
- [ ] Client apps send JWT token in `Authorization: Bearer` header
- [ ] Test token validation with `/api/v1/auth/verify`
- [ ] Test organization context is properly extracted
- [ ] Configure Redis for job queue
- [ ] Set up agent service URL and API key

## Next Steps

1. **Port Configuration**: Change this middleware to run on a different port (e.g., 3001) to avoid conflict with SaaS platform
2. **Organization Enforcement**: Add middleware to enforce organization-level access control
3. **Database Integration**: Connect to your SaaS database to fetch test cases and results
4. **Agent Service**: Configure agent service URL and authentication

---

**🎉 Your middleware is now integrated with your SaaS platform's authentication system!**

No user management needed in this service - just validate tokens and execute tests! 🚀
