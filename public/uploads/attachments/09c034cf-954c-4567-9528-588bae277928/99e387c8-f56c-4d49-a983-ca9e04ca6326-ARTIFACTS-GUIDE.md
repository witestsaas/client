# Test Execution Artifacts Guide

## Overview

The middleware **automatically captures and stores artifacts** from the web agent after each test execution, including:

- 📹 **Video recordings** (full test playback)
- 📸 **Screenshots** (per-step captures)
- 📝 **Logs** (execution logs and errors)

---

## How Artifacts Are Captured

### 1. **Web Agent Records Artifacts**

The Playwright web agent automatically:
- Records video of the entire test execution
- Captures screenshots at each step
- Collects execution logs

### 2. **Agent Returns Artifacts to Middleware**

After test completion, the agent response includes:

```json
{
  "testRunId": "test-run-123",
  "testCaseId": "test-001",
  "status": "passed",
  "results": {
    "duration": 5234,
    "steps": [...],
    "screenshots": [
      "http://localhost:4000/artifacts/test-run-123/screenshot-1.png",
      "http://localhost:4000/artifacts/test-run-123/screenshot-2.png"
    ],
    "video": "http://localhost:4000/artifacts/test-run-123/video.webm",
    "logs": ["Step 1 completed", "Element found", ...]
  }
}
```

### 3. **Middleware Stores Artifact References**

The middleware extracts and stores artifact URLs in the database:

```typescript
// From test-execution.processor.ts
const artifacts = {
  video: result.results?.video || null,
  screenshots: result.results?.screenshots || [],
  logs: result.results?.logs || [],
};

await testExecutionService.updateTestRunStatus(testRunId, finalStatus, {
  results: result.results,
  artifacts, // Stored in PostgreSQL
  completedAt: new Date(),
});
```

---

## Accessing Artifacts from Qalion

### Method 1: Get Test Run Details (Recommended)

When Qalion retrieves test run details, artifacts are included in the response:

```javascript
// Qalion backend fetches test run with artifacts
const response = await fetch('http://localhost:3001/api/v1/test-execution/test-run-123', {
  headers: {
    'x-api-key': process.env.MIDDLEWARE_API_KEY
  }
});

const testRun = await response.json();

console.log(testRun.artifacts);
/*
{
  video: "http://localhost:4000/artifacts/test-run-123/video.webm",
  screenshots: [
    "http://localhost:4000/artifacts/test-run-123/screenshot-1.png",
    "http://localhost:4000/artifacts/test-run-123/screenshot-2.png"
  ],
  logs: ["Test started", "Navigated to URL", ...]
}
*/
```

### Method 2: WebSocket Real-Time Updates

Qalion can receive artifacts immediately after test completion via WebSocket:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
});

// Subscribe to test run updates
socket.emit('subscribe:testRun', { testRunId: 'test-run-123' });

// Listen for status updates (includes artifacts when completed)
socket.on('status:update', (data) => {
  console.log('Status:', data.status);
  
  if (data.status === 'completed' && data.artifacts) {
    console.log('Video URL:', data.artifacts.video);
    console.log('Screenshots:', data.artifacts.screenshots);
    console.log('Logs:', data.artifacts.logs);
  }
});
```

### Method 3: Webhook Callback

If Qalion provides a webhook URL, the middleware sends artifacts on completion:

```javascript
// Middleware sends webhook to Qalion
POST https://qalion.app/api/webhooks/test-complete

{
  "testRunId": "frontend-test-123",
  "testCaseId": "test-001",
  "status": "completed",
  "results": {...},
  "artifacts": {
    "video": "http://localhost:4000/artifacts/test-run-123/video.webm",
    "screenshots": ["..."],
    "logs": ["..."]
  },
  "duration": 5234
}
```

---

## Database Schema

Artifacts are stored in the `test_runs` table:

```sql
CREATE TABLE test_runs (
  id VARCHAR PRIMARY KEY,
  test_case_id VARCHAR NOT NULL,
  user_id VARCHAR NOT NULL,
  org_slug VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'queued',
  configuration JSONB,
  results JSONB,
  artifacts JSONB, -- <-- Artifacts stored here
  error JSONB,
  logs TEXT[],
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration INTEGER,
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

Example `artifacts` JSONB column:

```json
{
  "video": "http://localhost:4000/artifacts/test-run-1770206789/video.webm",
  "screenshots": [
    "http://localhost:4000/artifacts/test-run-1770206789/step-1.png",
    "http://localhost:4000/artifacts/test-run-1770206789/step-2.png"
  ],
  "logs": [
    "Test execution started",
    "Navigated to https://example.com",
    "Clicked button #submit",
    "Test completed successfully"
  ]
}
```

---

## Example Flow: Qalion → Middleware → Web Agent → Qalion

### 1. **Qalion Triggers Test**

```javascript
const response = await fetch('http://localhost:3001/api/v1/test-execution/trigger', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'qdytR30sKwGPu/n6QggdPAcPK2RqqSlRNUs7c3uoGFY='
  },
  body: JSON.stringify({
    testCaseId: 'test-001',
    userId: 'user-123',
    orgSlug: 'demo',
    configuration: {
      url: 'https://example.com',
      video: true,        // Enable video recording
      screenshots: true   // Enable screenshots
    }
  })
});

const { testRunId } = await response.json();
// testRunId: "test-run-1770206789-abc123"
```

### 2. **Middleware Executes via Web Agent**

```javascript
// Middleware sends to web agent
POST http://localhost:4000/api/test/execute
{
  "testRunId": "test-run-1770206789-abc123",
  "testCaseId": "test-001",
  "config": {
    "video": true,
    "screenshots": true
  }
}
```

### 3. **Web Agent Records & Returns Artifacts**

```javascript
// Web agent response to middleware
{
  "testRunId": "test-run-1770206789-abc123",
  "status": "passed",
  "results": {
    "duration": 5234,
    "video": "http://localhost:4000/artifacts/test-run-1770206789-abc123/video.webm",
    "screenshots": [
      "http://localhost:4000/artifacts/test-run-1770206789-abc123/screenshot-1.png",
      "http://localhost:4000/artifacts/test-run-1770206789-abc123/screenshot-2.png"
    ],
    "logs": ["Test started", "Completed"]
  }
}
```

### 4. **Middleware Stores Artifacts in Database**

```typescript
// Middleware processor extracts artifacts
const artifacts = {
  video: result.results?.video,
  screenshots: result.results?.screenshots,
  logs: result.results?.logs,
};

// Save to database
await testExecutionService.updateTestRunStatus(testRunId, 'completed', {
  artifacts,
  results: result.results,
  completedAt: new Date(),
});
```

### 5. **Qalion Retrieves Artifacts**

```javascript
// Option A: Poll for completion
const testRun = await fetch(`http://localhost:3001/api/v1/test-execution/${testRunId}`, {
  headers: { 'x-api-key': 'qdytR30sKwGPu/n6QggdPAcPK2RqqSlRNUs7c3uoGFY=' }
}).then(r => r.json());

// Display video in Qalion UI
const videoUrl = testRun.artifacts.video;
// <video src="http://localhost:4000/artifacts/test-run-1770206789/video.webm" controls />

// Option B: Receive via WebSocket (real-time)
socket.on('status:update', (data) => {
  if (data.artifacts?.video) {
    displayVideo(data.artifacts.video);
  }
});
```

---

## Artifact File Storage

### Web Agent Storage (Local Development)

By default, the web agent stores artifacts in:

```
web-agent/
  artifacts/
    test-run-123/
      video.webm          # Full test recording
      screenshot-1.png    # Step 1 screenshot
      screenshot-2.png    # Step 2 screenshot
      execution.log       # Console logs
```

### Production Storage (Recommended)

For production, store artifacts in cloud storage:

**Option 1: AWS S3**
```javascript
// Web agent uploads to S3
const videoUrl = await uploadToS3('artifacts/test-run-123/video.webm');
// Returns: "https://s3.amazonaws.com/my-bucket/artifacts/test-run-123/video.webm"
```

**Option 2: Azure Blob Storage**
```javascript
const videoUrl = await uploadToAzure('artifacts/test-run-123/video.webm');
// Returns: "https://mystorageaccount.blob.core.windows.net/artifacts/..."
```

**Option 3: Google Cloud Storage**
```javascript
const videoUrl = await uploadToGCS('artifacts/test-run-123/video.webm');
// Returns: "https://storage.googleapis.com/my-bucket/artifacts/..."
```

---

## Configuring Video Recording

### In Qalion (Trigger Request)

```javascript
// Enable/disable video per test
configuration: {
  video: true,           // true = record video, false = no video
  screenshots: true,     // true = capture screenshots
  browser: 'chromium',
  headless: true
}
```

### In Web Agent (Playwright Config)

```typescript
// Web agent Playwright configuration
const browser = await chromium.launch({
  headless: true,
  recordVideo: {
    dir: `./artifacts/${testRunId}`,
    size: { width: 1920, height: 1080 }
  }
});
```

---

## API Response Examples

### Completed Test with Artifacts

```http
GET /api/v1/test-execution/test-run-123
Headers:
  x-api-key: qdytR30sKwGPu/n6QggdPAcPK2RqqSlRNUs7c3uoGFY=

Response:
{
  "id": "test-run-123",
  "testCaseId": "test-001",
  "userId": "user-456",
  "orgSlug": "demo",
  "status": "completed",
  "configuration": {...},
  "results": {
    "duration": 5234,
    "steps": [...]
  },
  "artifacts": {
    "video": "http://localhost:4000/artifacts/test-run-123/video.webm",
    "screenshots": [
      "http://localhost:4000/artifacts/test-run-123/screenshot-1.png",
      "http://localhost:4000/artifacts/test-run-123/screenshot-2.png"
    ],
    "logs": [
      "2026-02-04T10:00:00Z - Test started",
      "2026-02-04T10:00:02Z - Navigated to https://example.com",
      "2026-02-04T10:00:05Z - Test completed"
    ]
  },
  "startedAt": "2026-02-04T10:00:00Z",
  "completedAt": "2026-02-04T10:00:05Z",
  "duration": 5234,
  "createdAt": "2026-02-04T09:59:58Z",
  "updatedAt": "2026-02-04T10:00:05Z"
}
```

---

## Troubleshooting

### ❌ Video URL returns 404

**Cause:** Web agent artifact server not running or file deleted

**Solution:**
```bash
# Check web agent is running
curl http://localhost:4000/api/health

# Verify artifact files exist
ls web-agent/artifacts/test-run-123/
```

### ❌ `artifacts` field is null

**Cause:** Video recording disabled or web agent didn't return artifacts

**Solution:**
1. Enable video in configuration:
   ```json
   { "configuration": { "video": true } }
   ```
2. Check web agent logs for recording errors
3. Ensure sufficient disk space

### ❌ Screenshots array is empty

**Cause:** Screenshots disabled or test failed before any steps

**Solution:**
- Enable screenshots: `{ "configuration": { "screenshots": true } }`
- Check test actually executed steps (test might have failed immediately)

---

## Summary

✅ **Middleware automatically captures artifacts** from web agent  
✅ **Artifacts include:** video, screenshots, logs  
✅ **Stored in database** as JSONB in `artifacts` column  
✅ **Accessible via:**
- REST API: `GET /api/v1/test-execution/{testRunId}`
- WebSocket: real-time `status:update` events
- Webhook: automatic callback to Qalion

**Video URL Format:**  
`http://localhost:4000/artifacts/{testRunId}/video.webm`

**Screenshots URL Format:**  
`http://localhost:4000/artifacts/{testRunId}/screenshot-{n}.png`
