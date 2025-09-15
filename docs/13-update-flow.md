# Pass Update Flow

This document describes the complete flow for updating Apple Wallet passes, from business logic changes to device notifications.

## Overview

The pass update flow consists of several components working together:

1. **Business Update**: Pass data is modified
2. **Tag Bump**: Update tag is incremented
3. **Push Enqueue**: Notifications are queued for devices
4. **APNs Delivery**: Push notifications are sent
5. **Device Polling**: Devices check for updates
6. **Pass Download**: Updated pass is downloaded

## Sequence Diagram

```
Business Logic -> Pass Service -> Update Service -> Outbox Worker -> APNs Service
     |                |              |                |              |
     v                v              v                v              v
[Update Data] -> [Bump Tag] -> [Enqueue Pushes] -> [Process Queue] -> [Send Push]
     |                |              |                |              |
     v                v              v                v              v
[Store in DB] -> [Update Tag] -> [Create Outbox] -> [APNs Request] -> [Device Receives]
     |                |              |                |              |
     v                v              v                v              v
[Pass Updated] -> [Tag: 123] -> [Outbox Entry] -> [Push Sent] -> [Device Polls]
     |                |              |                |              |
     v                v              v                v              v
[Ready for DL] -> [Ready for DL] -> [Mark Sent] -> [Success] -> [Download Pass]
```

## Detailed Flow

### 1. Business Update

A business event triggers a pass update (e.g., stamp count incremented):

```typescript
// Example: Increment stamp count
POST /internal/passes/serial123/increment

// Response
{
  "success": true,
  "serialNumber": "serial123",
  "newUpdateTag": "123",
  "stampCount": 5
}
```

**What happens:**
- Pass data is modified in the database
- `variablesJson` is updated with new values
- Pass is marked as needing an update

### 2. Tag Bump

The pass's update tag is incremented to signal changes:

```typescript
// UpdateService.bumpPassUpdateTag()
const newTag = await UpdateService.bumpPassUpdateTag(passId);
// Result: "123" (incremented from "122")
```

**What happens:**
- `lastUpdateTag` is incremented (monotonically increasing)
- `lastUpdatedAt` is set to current timestamp
- Pass is marked as updated

### 3. Push Enqueue

Push notifications are queued for all registered devices:

```typescript
// UpdateService.enqueuePassPushes()
await UpdateService.enqueuePassPushes(passId);
```

**What happens:**
- All devices registered to the pass are found
- Outbox entries are created for each device
- Each entry contains APNs payload and device token

**Outbox Entry Example:**
```json
{
  "id": "outbox123",
  "passId": "pass456",
  "payload": {
    "type": "apns",
    "deviceToken": "apns-device-token-here",
    "topic": "pass.com.example.wallet",
    "env": "sandbox"
  },
  "status": "pending",
  "attempts": 0
}
```

### 4. APNs Delivery

The outbox worker processes pending notifications:

```typescript
// OutboxWorker.processOutbox()
const entries = await UpdateService.getPendingOutboxEntries(10);
for (const entry of entries) {
  const result = await APNsService.sendPush(entry.payload);
  if (result.success) {
    await UpdateService.markOutboxSent(entry.id);
  } else {
    await UpdateService.markOutboxFailed(entry.id, result.error);
  }
}
```

**What happens:**
- Worker picks up pending outbox entries
- APNs service sends push notifications
- Entries are marked as sent or failed
- Retry logic handles failures

### 5. Device Polling

Apple Wallet devices poll for updates:

```bash
# Device checks for updates
GET /v1/devices/device123/registrations/pass.com.example.wallet?passesUpdatedSince=122

# Response
{
  "lastUpdated": "123",
  "serialNumbers": ["serial123"]
}
```

**What happens:**
- Device sends last known update tag
- Service returns passes updated since that tag
- Device knows which passes need updating

### 6. Pass Download

Device downloads the updated pass:

```bash
# Device downloads updated pass
GET /v1/passes/pass.com.example.wallet/serial123
Authorization: ApplePass abc123def456

# Response: .pkpass file
Content-Type: application/vnd.apple.pkpass
Content-Disposition: attachment; filename="serial123.pkpass"
```

**What happens:**
- Pass is rebuilt with latest data
- .pkpass file is generated
- File is served to the device
- Device updates the pass in Wallet

## Data Models

### Pass Model

```typescript
{
  id: string;
  serialNumber: string;
  templateId: string;
  variablesJson: object;
  colorsJson: object;
  barcodeJson: object;
  lastUpdateTag: string;        // Monotonically increasing
  lastUpdatedAt: DateTime;
  authToken: string;            // For web service auth
  pkpassPath: string;           // Path to .pkpass file
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### Device Model

```typescript
{
  id: string;
  deviceLibraryIdentifier: string;  // Unique device ID
  pushToken: string;                // APNs device token
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

### PassRegistration Model

```typescript
{
  id: string;
  passId: string;
  deviceId: string;
  passTypeIdentifier: string;
  createdAt: DateTime;
}
```

### UpdateOutbox Model

```typescript
{
  id: string;
  passId: string;
  payload: {
    type: 'apns';
    deviceToken: string;
    topic: string;
    env: 'sandbox' | 'production';
  };
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  lastError: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

## Error Handling

### Update Service Errors

- **Pass not found**: Return error, don't enqueue pushes
- **Database errors**: Log and retry
- **Validation errors**: Return error to caller

### APNs Errors

- **Invalid device token**: Mark as failed, don't retry
- **Rate limiting**: Implement exponential backoff
- **Network errors**: Retry with backoff
- **Authentication errors**: Log and alert

### Device Polling Errors

- **Invalid update tag**: Return all passes
- **Device not found**: Return 404
- **Rate limiting**: Return 429 with retry info

### Pass Download Errors

- **Pass not found**: Return 404
- **Invalid auth**: Return 401
- **Rebuild failed**: Return 500
- **File not found**: Return 500

## Performance Considerations

### Update Tag Strategy

- Use monotonically increasing integers
- Store as strings for consistency
- Increment atomically to prevent conflicts

### Outbox Processing

- Process entries in batches (default: 10)
- Use exponential backoff for retries
- Clean up old entries periodically

### Pass Rebuilding

- Rebuild on demand for latest data
- Cache rebuilt passes by update tag
- Clean up old .pkpass files

### Rate Limiting

- Limit device registration attempts
- Limit pass download frequency
- Implement APNs rate limiting

## Monitoring

### Metrics to Track

- Update tag increments per pass
- Outbox entries created/processed
- APNs success/failure rates
- Device polling frequency
- Pass download success rates

### Logging

- All update operations
- APNs delivery attempts
- Error conditions
- Performance metrics

### Alerts

- High failure rates
- Outbox queue backlog
- APNs authentication failures
- Database connection issues

## Testing

### Unit Tests

- Update service functions
- APNs payload generation
- Error handling logic
- Tag increment logic

### Integration Tests

- Complete update flow
- Device registration/deregistration
- Pass download
- Error scenarios

### End-to-End Tests

- Business update → device notification
- Multiple device updates
- Failure recovery
- Rate limiting behavior

## Configuration

### Environment Variables

```bash
# Update service
UPDATE_TAG_STRATEGY=monotonic
OUTBOX_BATCH_SIZE=10
OUTBOX_RETRY_ATTEMPTS=3

# APNs
APNS_MODE=mock
APNS_TEAM_ID=your_team_id
APNS_KEY_ID=your_key_id
APNS_AUTH_KEY_P8=./certs/AuthKey.p8
APNS_TOPIC=pass.com.example.wallet
APNS_ENV=sandbox

# Rate limiting
RATE_LIMIT_GENERAL=100
RATE_LIMIT_PASSKIT=10
RATE_LIMIT_WINDOW=60000
```

### Database Configuration

- Enable connection pooling
- Set appropriate timeouts
- Configure backup strategy
- Monitor query performance

## Security

### Authentication

- Validate auth tokens on all endpoints
- Use secure token generation
- Implement token rotation

### Rate Limiting

- Prevent abuse of registration endpoints
- Limit pass download frequency
- Implement IP-based limiting

### Data Protection

- Encrypt sensitive data
- Secure certificate storage
- Audit log access
- Implement access controls
