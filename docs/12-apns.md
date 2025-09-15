# APNs Push Notifications

This document describes the APNs (Apple Push Notification service) implementation for sending push notifications to Apple Wallet devices.

## Overview

The APNs service supports three modes of operation:

1. **Token-based authentication** (recommended)
2. **Certificate-based authentication** (fallback)
3. **Mock mode** (development/testing)

## Configuration

### Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `APNS_MODE` | Authentication mode | `mock` | `token`, `cert`, `mock` |
| `APNS_TEAM_ID` | Apple Team ID | `YOUR_TEAM_ID` | `1234567890` |
| `APNS_KEY_ID` | APNs Key ID for token auth | `ABC123XYZ` | `ABC123XYZ` |
| `APNS_AUTH_KEY_P8` | Path to .p8 auth key file | `./infra/certs/AuthKey_ABC123XYZ.p8` | `./certs/AuthKey_ABC123XYZ.p8` |
| `APNS_TOPIC` | APNs topic (Pass Type ID) | `pass.your.bundle.id` | `pass.com.example.wallet` |
| `APNS_ENV` | APNs environment | `sandbox` | `sandbox`, `production` |
| `APNS_CERT_P12` | Path to P12 certificate (fallback) | `./infra/certs/pass-push.p12` | `./certs/pass-push.p12` |
| `APNS_CERT_PASSWORD` | P12 certificate password | `changeme` | `mySecretPassword` |

## Token-Based Authentication (Recommended)

Token-based authentication uses JWT tokens signed with your Apple Developer account's private key.

### Setup

1. **Create APNs Key**:
   - Go to Apple Developer Console
   - Navigate to Certificates, Identifiers & Profiles
   - Go to Keys section
   - Create a new key with APNs capability
   - Download the .p8 file

2. **Configure Environment**:
   ```bash
   APNS_MODE=token
   APNS_TEAM_ID=your_team_id
   APNS_KEY_ID=your_key_id
   APNS_AUTH_KEY_P8=./infra/certs/AuthKey_ABC123XYZ.p8
   APNS_TOPIC=pass.your.bundle.id
   APNS_ENV=sandbox
   ```

### JWT Token Generation

The service automatically generates JWT tokens with the following claims:

```json
{
  "iss": "your_team_id",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Headers:**
```json
{
  "alg": "ES256",
  "kid": "your_key_id"
}
```

### API Endpoints

- **Sandbox**: `https://api.sandbox.push.apple.com:443`
- **Production**: `https://api.push.apple.com:443`

## Certificate-Based Authentication (Fallback)

Certificate-based authentication uses P12 certificates (not yet implemented).

### Setup

1. **Create Push Certificate**:
   - Go to Apple Developer Console
   - Create a new certificate for Apple Push Notification service
   - Download and convert to P12 format

2. **Configure Environment**:
   ```bash
   APNS_MODE=cert
   APNS_CERT_P12=./infra/certs/pass-push.p12
   APNS_CERT_PASSWORD=your_password
   APNS_TOPIC=pass.your.bundle.id
   APNS_ENV=sandbox
   ```

## Mock Mode (Development)

Mock mode logs push notifications instead of sending them, useful for development and testing.

### Setup

```bash
APNS_MODE=mock
```

### Log Output

When a push notification would be sent, the service logs:

```json
{
  "deviceToken": "apns-device-token-here",
  "topic": "pass.com.example.wallet",
  "env": "sandbox",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Push Notification Payload

For Apple Wallet pass updates, the payload is minimal:

```json
{}
```

### Headers

- `apns-topic`: Pass Type ID (e.g., `pass.com.example.wallet`)
- `apns-push-type`: `background`
- `apns-priority`: `5`
- `apns-expiration`: `0` (immediate delivery)

## Error Handling

### HTTP Status Codes

- `200 OK`: Push sent successfully
- `400 Bad Request`: Invalid request
- `403 Forbidden`: Invalid token or certificate
- `410 Gone`: Device token is no longer valid
- `413 Payload Too Large`: Payload exceeds size limit
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: APNs server error

### Error Response Format

```json
{
  "reason": "BadDeviceToken",
  "timestamp": 1234567890
}
```

### Common Error Reasons

- `BadDeviceToken`: Device token is invalid
- `BadTopic`: Topic is invalid
- `BadCertificate`: Certificate is invalid
- `BadCertificateEnvironment`: Certificate doesn't match environment
- `ExpiredProviderToken`: JWT token has expired
- `InvalidProviderToken`: JWT token is invalid
- `MissingProviderToken`: JWT token is missing
- `TooManyRequests`: Rate limit exceeded

## Retry Logic

The service implements exponential backoff for retryable errors:

1. **Immediate retry**: 5xx errors, 429 Too Many Requests
2. **Exponential backoff**: 1s, 2s, 4s, 8s, 16s
3. **Max attempts**: 3 retries
4. **Permanent failure**: 410 Gone, 400 Bad Request

## Rate Limiting

APNs enforces rate limits:

- **Token-based**: 10,000 requests per hour per team
- **Certificate-based**: 10,000 requests per hour per certificate

The service respects these limits and implements client-side rate limiting.

## Topics

The topic for Apple Wallet passes is the Pass Type ID:

```
pass.com.example.wallet
```

This must match the `passTypeIdentifier` in your pass.json file.

## Environment Selection

### Sandbox Environment

- **URL**: `https://api.sandbox.push.apple.com:443`
- **Use case**: Development and testing
- **Device tokens**: From development builds

### Production Environment

- **URL**: `https://api.push.apple.com:443`
- **Use case**: Production apps
- **Device tokens**: From App Store builds

## Security Best Practices

1. **Keep private keys secure**: Store .p8 files with restricted permissions (600)
2. **Rotate keys regularly**: Generate new keys periodically
3. **Use environment-specific keys**: Different keys for sandbox/production
4. **Monitor usage**: Track push notification success rates
5. **Handle errors gracefully**: Implement proper retry and fallback logic

## Monitoring and Logging

The service logs:

- Push notification attempts
- Success/failure rates
- Error details
- Rate limiting events
- Token expiration

### Log Format

```json
{
  "level": "info",
  "message": "APNs push sent",
  "deviceToken": "abc123...",
  "topic": "pass.com.example.wallet",
  "env": "sandbox",
  "success": true,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Testing

### Unit Tests

Test JWT token generation and payload construction:

```typescript
import { APNsService } from '../services/apns';

describe('APNsService', () => {
  it('should generate valid JWT token', async () => {
    const token = await APNsService.createJWT();
    expect(token).toBeDefined();
    // Verify JWT structure
  });
});
```

### Integration Tests

Test push notification sending in mock mode:

```typescript
it('should send push notification in mock mode', async () => {
  const result = await APNsService.sendPush({
    type: 'apns',
    deviceToken: 'test-token',
    topic: 'pass.com.example.wallet',
    env: 'sandbox'
  });
  
  expect(result.success).toBe(true);
});
```

## Troubleshooting

### Common Issues

1. **Invalid JWT Token**:
   - Check APNS_TEAM_ID and APNS_KEY_ID
   - Verify .p8 file is correct
   - Ensure key has APNs capability

2. **Bad Device Token**:
   - Device token may be invalid or expired
   - Check if device is registered correctly

3. **Bad Topic**:
   - Verify APNS_TOPIC matches Pass Type ID
   - Check pass.json configuration

4. **Rate Limiting**:
   - Reduce push notification frequency
   - Implement client-side rate limiting

### Debug Mode

Enable debug logging:

```bash
NODE_ENV=development
```

This will log detailed information about JWT generation and API requests.
