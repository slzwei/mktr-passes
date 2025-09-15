# Apple PassKit Web Service

This document describes the Apple PassKit Web Service endpoints implemented for Phase 2. These endpoints allow Apple Wallet to register devices, manage pass registrations, and download updated passes.

## Overview

The PassKit Web Service follows Apple's specification for pass updates and device registration. It provides endpoints for:

- Device registration and unregistration
- Pass update notifications
- Pass download
- Device logging

## Authentication

All endpoints (except logging) require authentication using the `Authorization` header with the `ApplePass` scheme:

```
Authorization: ApplePass <authToken>
```

The `authToken` is generated when a pass is created and stored in the database. It must match the token associated with the pass being accessed.

## Endpoints

### Device Registration

#### POST /v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber

Registers a device to receive push notifications for a specific pass.

**Parameters:**
- `deviceLibraryIdentifier`: Unique identifier for the device
- `passTypeIdentifier`: Pass Type ID (e.g., `pass.com.example.wallet`)
- `serialNumber`: Serial number of the pass

**Request Body:**
```json
{
  "pushToken": "apns-device-token-here"
}
```

**Response:**
- `201 Created`: Device registered successfully
- `200 OK`: Device registration updated
- `401 Unauthorized`: Invalid authorization token
- `404 Not Found`: Pass not found
- `400 Bad Request`: Invalid pass type identifier

**Example:**
```bash
curl -X POST \
  -H "Authorization: ApplePass abc123def456" \
  -H "Content-Type: application/json" \
  -d '{"pushToken": "apns-device-token-here"}' \
  http://localhost:4000/v1/devices/device123/registrations/pass.com.example.wallet/serial456
```

### Device Unregistration

#### DELETE /v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber

Unregisters a device from receiving push notifications for a specific pass.

**Parameters:**
- `deviceLibraryIdentifier`: Unique identifier for the device
- `passTypeIdentifier`: Pass Type ID
- `serialNumber`: Serial number of the pass

**Response:**
- `200 OK`: Device unregistered successfully
- `401 Unauthorized`: Invalid authorization token
- `404 Not Found`: Pass or device not found

**Example:**
```bash
curl -X DELETE \
  -H "Authorization: ApplePass abc123def456" \
  http://localhost:4000/v1/devices/device123/registrations/pass.com.example.wallet/serial456
```

### Get Device Registrations

#### GET /v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier

Gets all passes registered to a device for a specific pass type.

**Parameters:**
- `deviceLibraryIdentifier`: Unique identifier for the device
- `passTypeIdentifier`: Pass Type ID

**Query Parameters:**
- `passesUpdatedSince` (optional): Only return passes updated since this tag

**Response:**
```json
{
  "lastUpdated": "1234567890",
  "serialNumbers": ["serial1", "serial2", "serial3"]
}
```

**Status Codes:**
- `200 OK`: Success
- `404 Not Found`: Device not found

**Example:**
```bash
# Get all passes
curl http://localhost:4000/v1/devices/device123/registrations/pass.com.example.wallet

# Get passes updated since tag
curl "http://localhost:4000/v1/devices/device123/registrations/pass.com.example.wallet?passesUpdatedSince=1234567890"
```

### Download Pass

#### GET /v1/passes/:passTypeIdentifier/:serialNumber

Downloads the latest version of a pass as a .pkpass file.

**Parameters:**
- `passTypeIdentifier`: Pass Type ID
- `serialNumber`: Serial number of the pass

**Response:**
- `200 OK`: Pass file (Content-Type: application/vnd.apple.pkpass)
- `401 Unauthorized`: Invalid authorization token
- `404 Not Found`: Pass not found
- `400 Bad Request`: Invalid pass type identifier
- `500 Internal Server Error`: Failed to rebuild pass

**Headers:**
- `Content-Type`: `application/vnd.apple.pkpass`
- `Content-Disposition`: `attachment; filename="<serialNumber>.pkpass"`
- `Content-Length`: File size in bytes

**Example:**
```bash
curl -H "Authorization: ApplePass abc123def456" \
  -o pass.pkpass \
  http://localhost:4000/v1/passes/pass.com.example.wallet/serial456
```

### Device Logging

#### POST /v1/log

Receives logs from Apple devices for debugging purposes.

**Request Body:**
```json
{
  "logs": ["log message 1", "log message 2"]
}
```

**Response:**
- `200 OK`: Logs received successfully

**Example:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"logs": ["Device error: pass validation failed"]}' \
  http://localhost:4000/v1/log
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

### Common Error Codes

- `UNAUTHORIZED`: Invalid or missing authorization token
- `PASS_NOT_FOUND`: Pass not found or invalid authorization
- `DEVICE_NOT_FOUND`: Device not found
- `INVALID_PASS_TYPE`: Pass type identifier mismatch
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Rate Limiting

The web service implements rate limiting to prevent abuse:

- **General API**: 100 requests per minute per IP
- **PassKit endpoints**: 10 requests per minute per IP

When rate limits are exceeded, the service returns a `429 Too Many Requests` status with retry information.

## Update Flow

The web service supports the following update flow:

1. **Business Update**: Pass data is modified (e.g., stamp count incremented)
2. **Tag Bump**: The pass's `lastUpdateTag` is incremented
3. **Push Enqueue**: Push notifications are queued for all registered devices
4. **Device Poll**: Devices poll for updates using `passesUpdatedSince`
5. **Pass Download**: Devices download the updated pass

## Security Considerations

- All endpoints require proper authentication
- Rate limiting prevents abuse
- Input validation using Zod schemas
- Structured error responses without sensitive information
- Logging of all authentication failures

## Development Mode

In development mode, the service can run without real Apple credentials:

- Set `APNS_MODE=mock` to disable real push notifications
- Mock mode logs push notifications instead of sending them
- All other functionality works normally

## Testing

The service includes comprehensive tests for:

- All endpoint success and failure scenarios
- Authentication validation
- Rate limiting
- Error handling
- Update workflow

See the test files in `apps/api/src/__tests__/` for examples.
