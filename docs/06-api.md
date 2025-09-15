# API Documentation

## Base URL

- **Development**: `http://localhost:4000`
- **Production**: `https://api.yourdomain.com`

## Authentication

### General API
Currently no authentication required for general API endpoints. Future versions will include API key authentication.

### PassKit Web Service
PassKit endpoints require authentication using the `Authorization` header:

```
Authorization: ApplePass <authToken>
```

The `authToken` is generated when a pass is created and stored in the database.

## Content Types

- **JSON**: `application/json`
- **Multipart**: `multipart/form-data` (for file uploads)
- **PKPASS**: `application/vnd.apple.pkpass` (for pass downloads)

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Endpoints

### 1. Health Check

**GET** `/health`

Check API health status.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. Templates

#### Get All Templates

**GET** `/api/templates`

Get list of all available templates.

**Response**:
```json
{
  "templates": [
    {
      "id": "stamp_card_v1",
      "name": "Stamp Card",
      "style": "generic",
      "images": [
        {
          "role": "icon",
          "required": true,
          "recommendedSize": { "w": 29, "h": 29 }
        }
      ],
      "variables": [
        {
          "key": "brandName",
          "type": "string",
          "description": "Name of the business or brand",
          "required": true
        }
      ],
      "hasBarcode": true,
      "defaultColors": {
        "backgroundColor": "rgb(60,65,80)",
        "foregroundColor": "rgb(255,255,255)",
        "labelColor": "rgb(255,255,255)"
      }
    }
  ]
}
```

#### Get Template by ID

**GET** `/api/templates/:id`

Get specific template details.

**Parameters**:
- `id` (string): Template ID

**Response**:
```json
{
  "template": {
    "id": "stamp_card_v1",
    "name": "Stamp Card",
    "style": "generic",
    "images": [...],
    "fields": [...],
    "variables": {...},
    "barcode": {...},
    "defaultColors": {...}
  }
}
```

**Error Responses**:
- `404`: Template not found

### 3. Assets

#### Upload Image

**POST** `/api/uploads`

Upload an image asset.

**Content-Type**: `multipart/form-data`

**Parameters**:
- `file` (file): PNG image file
- `role` (string, optional): Image role (icon, logo, strip, background, thumbnail)

**Response**:
```json
{
  "id": "asset-uuid",
  "sha256": "a1b2c3d4e5f6...",
  "width": 29,
  "height": 29,
  "role": "icon",
  "originalName": "icon.png"
}
```

**Error Responses**:
- `400`: Invalid file format or dimensions
- `413`: File too large

### 4. Passes

#### Validate Pass Data

**POST** `/api/passes/validate`

Validate pass data before generation.

**Request Body**:
```json
{
  "templateId": "stamp_card_v1",
  "variables": {
    "brandName": "Example Corp",
    "stampCount": 3,
    "stampTarget": 8,
    "rewardText": "Free coffee"
  },
  "colors": {
    "backgroundColor": "rgb(60,65,80)",
    "foregroundColor": "rgb(255,255,255)",
    "labelColor": "rgb(255,255,255)"
  },
  "barcode": {
    "format": "PKBarcodeFormatQR",
    "message": "stamp-card-123",
    "messageEncoding": "utf-8",
    "altText": "Stamp card 123"
  },
  "images": {
    "icon": "asset-uuid-1",
    "icon@2x": "asset-uuid-2"
  }
}
```

**Response**:
```json
{
  "ok": true,
  "errors": []
}
```

**Error Response**:
```json
{
  "ok": false,
  "errors": [
    "Required variable 'brandName' is missing",
    "Required image 'icon' is missing"
  ]
}
```

#### Create Pass

**POST** `/api/passes`

Create and generate a .pkpass file.

**Request Body**: Same as validate endpoint

**Response**:
```json
{
  "id": "pass-uuid",
  "downloadUrl": "/api/passes/pass-uuid/download"
}
```

**Error Responses**:
- `400`: Invalid pass data
- `500`: Pass generation failed

#### Download Pass

**GET** `/api/passes/:id/download`

Download generated .pkpass file.

**Parameters**:
- `id` (string): Pass ID

**Response**:
- **Content-Type**: `application/vnd.apple.pkpass`
- **Content-Disposition**: `attachment; filename="pass.pkpass"`
- **Body**: Binary .pkpass file

**Error Responses**:
- `404`: Pass not found
- `500`: File read error

#### Get Pass Info

**GET** `/api/passes/:id`

Get pass information and metadata.

**Parameters**:
- `id` (string): Pass ID

**Response**:
```json
{
  "id": "pass-uuid",
  "templateId": "stamp_card_v1",
  "variables": {
    "brandName": "Example Corp",
    "stampCount": 3,
    "stampTarget": 8,
    "rewardText": "Free coffee"
  },
  "colors": {
    "backgroundColor": "rgb(60,65,80)",
    "foregroundColor": "rgb(255,255,255)",
    "labelColor": "rgb(255,255,255)"
  },
  "barcode": {
    "format": "PKBarcodeFormatQR",
    "message": "stamp-card-123",
    "messageEncoding": "utf-8",
    "altText": "Stamp card 123"
  },
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z",
  "assets": [
    {
      "role": "icon",
      "asset": {
        "id": "asset-uuid-1",
        "originalName": "icon.png",
        "width": 29,
        "height": 29
      }
    }
  ]
}
```

**Error Responses**:
- `404`: Pass not found

## Request/Response Schemas

### PassData Schema

```typescript
{
  templateId: string;
  variables: Record<string, any>;
  colors?: {
    backgroundColor?: string;
    foregroundColor?: string;
    labelColor?: string;
  };
  barcode?: {
    format: string;
    message: string;
    messageEncoding?: string;
    altText?: string;
  };
  images: Record<string, string>; // role -> assetId
}
```

### Template Schema

```typescript
{
  id: string;
  name: string;
  style: 'generic';
  images: Array<{
    role: string;
    required: boolean;
    recommendedSize: { w: number; h: number };
  }>;
  variables: Array<{
    key: string;
    type: 'string' | 'number' | 'date' | 'enum';
    description: string;
    required: boolean;
    options?: string[];
  }>;
  hasBarcode: boolean;
  defaultColors?: {
    backgroundColor?: string;
    foregroundColor?: string;
    labelColor?: string;
  };
}
```

### AssetInfo Schema

```typescript
{
  id: string;
  sha256: string;
  width: number;
  height: number;
  role: string;
  originalName: string;
}
```

## Rate Limiting

- **Uploads**: 10 requests per minute per IP
- **Pass Generation**: 5 requests per minute per IP
- **Template Access**: 100 requests per minute per IP

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 404 | Not Found - Resource not found |
| 413 | Payload Too Large - File too large |
| 415 | Unsupported Media Type - Invalid file format |
| 422 | Unprocessable Entity - Validation errors |
| 500 | Internal Server Error - Server error |

## Examples

### Complete Pass Creation Flow

1. **Get Templates**:
   ```bash
   curl http://localhost:4000/api/templates
   ```

2. **Upload Images**:
   ```bash
   curl -X POST http://localhost:4000/api/uploads \
     -F "file=@icon.png" \
     -F "role=icon"
   ```

3. **Validate Pass**:
   ```bash
   curl -X POST http://localhost:4000/api/passes/validate \
     -H "Content-Type: application/json" \
     -d '{
       "templateId": "stamp_card_v1",
       "variables": {
         "brandName": "Example Corp",
         "stampCount": 3,
         "stampTarget": 8,
         "rewardText": "Free coffee"
       },
       "images": {
         "icon": "asset-uuid-1",
         "icon@2x": "asset-uuid-2"
       }
     }'
   ```

4. **Create Pass**:
   ```bash
   curl -X POST http://localhost:4000/api/passes \
     -H "Content-Type: application/json" \
     -d '{
       "templateId": "stamp_card_v1",
       "variables": {
         "brandName": "Example Corp",
         "stampCount": 3,
         "stampTarget": 8,
         "rewardText": "Free coffee"
       },
       "images": {
         "icon": "asset-uuid-1",
         "icon@2x": "asset-uuid-2"
       }
     }'
   ```

5. **Download Pass**:
   ```bash
   curl http://localhost:4000/api/passes/pass-uuid/download \
     -o pass.pkpass
   ```

## SDK Examples

### JavaScript/TypeScript

```typescript
import { apiService } from './services/api';

// Get templates
const templates = await apiService.getTemplates();

// Upload image
const file = new File([...], 'icon.png', { type: 'image/png' });
const asset = await apiService.uploadAsset(file, 'icon');

// Create pass
const pass = await apiService.createPass({
  templateId: 'stamp_card_v1',
  variables: {
    brandName: 'Example Corp',
    stampCount: 3,
    stampTarget: 8,
    rewardText: 'Free coffee'
  },
  images: {
    icon: asset.id,
    'icon@2x': asset2.id
  }
});

// Download pass
const downloadUrl = apiService.getPassDownloadUrl(pass.id);
```

### Python

```python
import requests

# Get templates
response = requests.get('http://localhost:4000/api/templates')
templates = response.json()

# Upload image
with open('icon.png', 'rb') as f:
    files = {'file': f}
    data = {'role': 'icon'}
    response = requests.post('http://localhost:4000/api/uploads', files=files, data=data)
    asset = response.json()

# Create pass
pass_data = {
    'templateId': 'stamp_card_v1',
    'variables': {
        'brandName': 'Example Corp',
        'stampCount': 3,
        'stampTarget': 8,
        'rewardText': 'Free coffee'
    },
    'images': {
        'icon': asset['id'],
        'icon@2x': asset2['id']
    }
}
response = requests.post('http://localhost:4000/api/passes', json=pass_data)
pass_info = response.json()

# Download pass
response = requests.get(f'http://localhost:4000/api/passes/{pass_info["id"]}/download')
with open('pass.pkpass', 'wb') as f:
    f.write(response.content)
```

## Testing

### cURL Examples

```bash
# Health check
curl http://localhost:4000/health

# Get templates
curl http://localhost:4000/api/templates

# Upload image
curl -X POST http://localhost:4000/api/uploads \
  -F "file=@icon.png" \
  -F "role=icon"

# Validate pass
curl -X POST http://localhost:4000/api/passes/validate \
  -H "Content-Type: application/json" \
  -d @pass-data.json

# Create pass
curl -X POST http://localhost:4000/api/passes \
  -H "Content-Type: application/json" \
  -d @pass-data.json

# Download pass
curl http://localhost:4000/api/passes/pass-uuid/download \
  -o pass.pkpass
```

### Postman Collection

Import the provided Postman collection for easy API testing:

```json
{
  "info": {
    "name": "Wallet Platform API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/health"
      }
    }
    // ... more requests
  ]
}
```

## PassKit Web Service Endpoints

### Device Registration

#### Register Device

**POST** `/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber`

Registers a device to receive push notifications for a specific pass.

**Headers:**
```
Authorization: ApplePass <authToken>
Content-Type: application/json
```

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

#### Unregister Device

**DELETE** `/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber`

Unregisters a device from receiving push notifications.

**Headers:**
```
Authorization: ApplePass <authToken>
```

**Response:**
- `200 OK`: Device unregistered successfully
- `401 Unauthorized`: Invalid authorization token
- `404 Not Found`: Pass or device not found

### Device Polling

#### Get Device Registrations

**GET** `/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier`

Gets all passes registered to a device for a specific pass type.

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

### Pass Download

#### Download Pass

**GET** `/v1/passes/:passTypeIdentifier/:serialNumber`

Downloads the latest version of a pass as a .pkpass file.

**Headers:**
```
Authorization: ApplePass <authToken>
```

**Response:**
- `200 OK`: Pass file (Content-Type: application/vnd.apple.pkpass)
- `401 Unauthorized`: Invalid authorization token
- `404 Not Found`: Pass not found
- `500 Internal Server Error`: Failed to rebuild pass

**Headers:**
- `Content-Type`: `application/vnd.apple.pkpass`
- `Content-Disposition`: `attachment; filename="<serialNumber>.pkpass"`
- `Content-Length`: File size in bytes

### Device Logging

#### Submit Device Logs

**POST** `/v1/log`

Receives logs from Apple devices for debugging purposes.

**Request Body:**
```json
{
  "logs": ["log message 1", "log message 2"]
}
```

**Response:**
- `200 OK`: Logs received successfully

## Internal API Endpoints

### Pass Updates

#### Increment Pass

**POST** `/internal/passes/:serialNumber/increment`

Increments the stamp count for a pass (example business update).

**Response:**
```json
{
  "success": true,
  "serialNumber": "serial123",
  "newUpdateTag": "123",
  "stampCount": 5
}
```

### Outbox Management

#### Get Outbox Status

**GET** `/internal/outbox/status`

Gets the current status of the outbox queue.

**Response:**
```json
{
  "pending": 5,
  "sent": 100,
  "failed": 2,
  "total": 107
}
```

#### Process Outbox

**POST** `/internal/outbox/process`

Manually triggers outbox processing (for testing).

**Response:**
```json
{
  "success": true,
  "message": "Outbox processed once"
}
```

## Error Responses

All PassKit endpoints return consistent error responses:

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

The API implements rate limiting:

- **General API**: 100 requests per minute per IP
- **PassKit endpoints**: 10 requests per minute per IP

When rate limits are exceeded, the service returns a `429 Too Many Requests` status with retry information.
