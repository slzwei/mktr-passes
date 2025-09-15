# Configuration

## Environment Variables

### Core Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NODE_ENV` | Environment mode | `development` | `production` |
| `PORT` | API server port | `4000` | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/wallet` | `postgresql://user:pass@localhost:5432/wallet` |

### Storage Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `STORAGE_DIR` | Directory for uploaded images | `./apps/api/uploads` | `./uploads` |
| `PKPASS_OUTPUT_DIR` | Directory for generated .pkpass files | `./apps/api/passes` | `./passes` |

### Apple Wallet Certificates

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `APPLE_PASS_CERT_P12` | Path to Pass Type ID certificate (P12) | `./infra/certs/pass.p12` | `./certs/pass.p12` |
| `APPLE_PASS_CERT_PASSWORD` | Password for P12 certificate | `changeme` | `mySecretPassword` |
| `APPLE_WWDR_CERT_PEM` | Path to Apple WWDR certificate (PEM) | `./infra/certs/AppleWWDRCAG3.pem` | `./certs/AppleWWDRCAG3.pem` |

### Apple Wallet Identifiers

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PASS_TEAM_IDENTIFIER` | Apple Team ID (10 characters) | `YOUR_TEAM_ID` | `1234567890` |
| `PASS_TYPE_IDENTIFIER` | Pass Type ID (starts with 'pass.') | `pass.your.bundle.id` | `pass.com.example.wallet` |
| `PASS_ORG_NAME` | Organization name for passes | `Your Organization Name` | `Example Corp` |

### Web Service Authentication

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PASS_WEB_AUTH_SCHEME` | Authorization header scheme | `ApplePass` | `ApplePass` |

### APNs Push Notifications

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `APNS_MODE` | APNs authentication mode | `mock` | `token`, `cert`, `mock` |
| `APNS_TEAM_ID` | Apple Team ID for APNs | `YOUR_TEAM_ID` | `1234567890` |
| `APNS_KEY_ID` | APNs Key ID for token auth | `ABC123XYZ` | `ABC123XYZ` |
| `APNS_AUTH_KEY_P8` | Path to .p8 auth key file | `./infra/certs/AuthKey_ABC123XYZ.p8` | `./certs/AuthKey_ABC123XYZ.p8` |
| `APNS_TOPIC` | APNs topic (Pass Type ID) | `pass.your.bundle.id` | `pass.com.example.wallet` |
| `APNS_ENV` | APNs environment | `sandbox` | `sandbox`, `production` |
| `APNS_CERT_P12` | Path to P12 certificate (fallback) | `./infra/certs/pass-push.p12` | `./certs/pass-push.p12` |
| `APNS_CERT_PASSWORD` | P12 certificate password | `changeme` | `mySecretPassword` |

## Configuration Files

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"pnpm --filter web dev\" \"pnpm --filter api dev\"",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "format": "prettier --write .",
    "test": "pnpm -r test",
    "clean": "pnpm -r clean"
  }
}
```

### Vite Configuration (Web App)

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

### Tailwind Configuration

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          // ... more colors
        },
      },
    },
  },
  plugins: [],
}
```

### Prisma Configuration

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

## Development Configuration

### Local Development Setup

1. **Environment File**: Copy `env.example` to `.env` and configure:
   ```bash
   cp env.example .env
   ```

2. **Database Setup**: Start PostgreSQL and run migrations:
   ```bash
   pnpm --filter db migrate
   ```

3. **Certificate Setup**: Place certificates in `infra/certs/`:
   - `pass.p12`: Your Pass Type ID certificate
   - `AppleWWDRCAG3.pem`: Apple WWDR certificate

4. **Development Mode**: Use CLI with `--dev` flag for dummy certificates

### Production Configuration

1. **Environment Variables**: Set all required environment variables
2. **Database**: Configure production PostgreSQL instance
3. **Certificates**: Use real Apple certificates
4. **Storage**: Configure persistent storage (S3, etc.)
5. **CDN**: Configure CDN for asset delivery

## Template Configuration

### Template Variables

Each template defines variables with the following properties:

```typescript
{
  key: string;
  type: 'string' | 'number' | 'date' | 'enum';
  description: string;
  required: boolean;
  options?: string[]; // For enum type
}
```

### Image Requirements

```typescript
{
  role: 'icon' | 'logo' | 'strip' | 'background' | 'thumbnail';
  required: boolean;
  recommendedSize: { w: number; h: number };
}
```

### Apple Image Sizes

| Role | Size (@1x) | Size (@2x) | Required |
|------|------------|------------|----------|
| icon | 29×29 | 58×58 | Yes |
| logo | 160×50 | 320×100 | No |
| strip | 320×84 | 640×168 | No |
| background | 180×220 | 360×440 | No |
| thumbnail | 90×90 | 180×180 | No |

## API Configuration

### CORS Settings

```typescript
await fastify.register(cors, {
  origin: true, // Allow all origins in development
  credentials: true,
});
```

### File Upload Limits

- **Max File Size**: 10MB per image
- **Allowed Types**: PNG only
- **Max Files**: 1 per upload request

### Rate Limiting

- **Uploads**: 10 requests per minute per IP
- **Pass Generation**: 5 requests per minute per IP
- **Template Access**: 100 requests per minute per IP

## Database Configuration

### Connection Pool

```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

### Migration Settings

- **Auto-migrate**: Disabled in production
- **Backup**: Before each migration
- **Rollback**: Supported for failed migrations

## Security Configuration

### Certificate Security

- **File Permissions**: 600 (owner read/write only)
- **Directory Permissions**: 700 (owner access only)
- **Environment Variables**: Never log certificate passwords
- **Backup**: Encrypted certificate backups

### Input Validation

- **File Types**: Strict MIME type checking
- **File Size**: Reasonable limits per file type
- **Content Validation**: Malicious content detection
- **SQL Injection**: Parameterized queries only

### Error Handling

- **Logging**: Structured logging with levels
- **Sensitive Data**: Never log passwords or keys
- **User Feedback**: Clear, actionable error messages
- **Debug Mode**: Detailed errors in development only

## Monitoring Configuration

### Health Checks

- **API Health**: `GET /health`
- **Database Health**: Connection status
- **Storage Health**: Disk space and permissions
- **Certificate Health**: Validity and expiration

### Metrics

- **Pass Generation**: Success/failure rates
- **Upload Performance**: File processing times
- **Database Performance**: Query execution times
- **Error Rates**: By endpoint and error type

### Logging

- **Level**: INFO in production, DEBUG in development
- **Format**: JSON structured logging
- **Retention**: 30 days for application logs
- **Rotation**: Daily log rotation
