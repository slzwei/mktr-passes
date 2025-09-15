# Wallet Platform

[![CI](https://github.com/your-org/mktr-passes/workflows/ci/badge.svg)](https://github.com/your-org/mktr-passes/actions/workflows/ci.yml)

A production-grade pass creation platform for Apple Wallet (and later Google Wallet). Built from scratch without third-party wallet platform services, following Apple's official PassKit format specification.

## Features

- 🎨 **WYSIWYG Editor**: React-based editor with live preview
- 📱 **Apple Wallet Support**: Valid .pkpass file generation
- 🎯 **Template System**: 3 restaurant-friendly templates (stamp card, coupon, membership)
- 🔒 **Secure Signing**: PKCS#7 detached signatures with Apple certificates
- 🛠️ **CLI Tool**: Local pass generation and testing
- 📚 **Comprehensive Docs**: Every feature and config variable documented

## 🚀 Quick Start

**New to the project?** Start here: **[📖 Quick Start Guide](docs/00-start-here.md)**

### Prerequisites

- **Docker Desktop** (recommended) or Node.js 20+ + pnpm 8+
- **VS Code with Dev Containers** (optional but recommended)

### One-Click Setup (Docker)

```bash
# Start entire development stack
./scripts/oneclick-up.sh

# Access your services:
# 🌐 Web UI: http://localhost:3000
# 🔧 API: http://localhost:3001  
# 🗄️ Database: http://localhost:8080
```

### Manual Setup

```bash
# Clone and install
git clone <repository-url>
cd wallet-platform
pnpm install

# Set up environment
cp env.example .env

# Start with Docker
docker compose up -d

# Or start locally
pnpm dev
```

**📚 For detailed setup instructions, see [docs/00-start-here.md](docs/00-start-here.md)**

### Development

```bash
# Start all services
pnpm dev

# Start individual services
pnpm --filter web dev      # Web app on :3000
pnpm --filter api dev      # API on :4000
pnpm --filter cli dev      # CLI tool

# Build all packages
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint
```

## Project Structure

```
/wallet-platform
  /apps
    /web              # React + Vite + TypeScript + Tailwind
    /api              # Node 20 + TypeScript + Fastify + zod
    /cli              # Node TS small CLI for local pkpass generation/testing
  /packages
    /core             # shared types, validation schemas, pass schema, template DSL
    /pkpass           # pure library to build .pkpass (manifest, sign, zip)
  /infra
    /db               # Prisma schema + migrations (PostgreSQL)
    /certs            # local dev placeholder (do NOT commit real certs)
  /docs               # comprehensive documentation
```

## Templates

### 1. Stamp Card
- **Purpose**: Loyalty stamp card for tracking customer visits
- **Variables**: brandName, stampCount, stampTarget, rewardText
- **Features**: Progress tracking, barcode support

### 2. Coupon
- **Purpose**: Discount coupon with expiry and redemption code
- **Variables**: offerText, expiryDate, couponCode, brandName
- **Features**: Expiry date, mandatory barcode

### 3. Membership Card
- **Purpose**: Membership card with tier and member identification
- **Variables**: memberName, membershipTier, memberId, expiryDate
- **Features**: Tier management, member ID barcode

## API Usage

### Create a Pass

```bash
# 1. Upload images
curl -X POST http://localhost:4000/api/uploads \
  -F "file=@icon.png" \
  -F "role=icon"

# 2. Create pass
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

# 3. Download pass
curl http://localhost:4000/api/passes/pass-uuid/download \
  -o pass.pkpass
```

### CLI Usage

```bash
# Generate sample pass
pnpm cli make-sample --template stamp_card_v1 --dev

# Validate pass
pnpm cli validate --file pass.pkpass

# Generate with custom data
pnpm cli make-sample \
  --template coupon_v1 \
  --vars ./sample-vars.json \
  --images ./assets/ \
  --out ./my-pass.pkpass
```

## Configuration

### Environment Variables

```bash
# Core
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://user:pass@localhost:5432/wallet

# Storage
STORAGE_DIR=./apps/api/uploads
PKPASS_OUTPUT_DIR=./apps/api/passes

# Apple Wallet Certificates
APPLE_PASS_CERT_P12=./infra/certs/pass.p12
APPLE_PASS_CERT_PASSWORD=changeme
APPLE_WWDR_CERT_PEM=./infra/certs/AppleWWDRCAG3.pem

# Apple Wallet Identifiers
PASS_TEAM_IDENTIFIER=YOUR_TEAM_ID
PASS_TYPE_IDENTIFIER=pass.your.bundle.id
PASS_ORG_NAME=Your Organization Name
```

### Apple Certificates

1. **Pass Type ID Certificate**: Get from Apple Developer Portal
2. **Apple WWDR Certificate**: Download from Apple
3. **Place in `infra/certs/`**: Never commit real certificates

## Documentation

- [Overview](docs/01-overview.md) - System overview and milestones
- [Features](docs/02-features.md) - Complete feature list
- [Configuration](docs/03-config.md) - All config variables
- [Templates](docs/04-templates.md) - Template system and DSL
- [PKPASS Format](docs/05-pkpass-format.md) - Apple Wallet specification
- [API](docs/06-api.md) - Complete API documentation
- [UX Editor](docs/07-ux-editor.md) - WYSIWYG editor guide
- [Security](docs/08-security.md) - Security practices
- [QA Checklist](docs/09-qa-checklist.md) - Testing procedures
- [Google Wallet Plan](docs/10-google-wallet-plan.md) - Future Google Wallet support

## Development

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL
- OpenSSL (for pass signing)

### Setup

```bash
# Install dependencies
pnpm install

# Set up database
createdb wallet
pnpm --filter db migrate

# Set up certificates (development)
mkdir -p infra/certs
# Place your certificates here

# Start development
pnpm dev
```

### Testing

```bash
# Run all tests
pnpm test

# Test specific package
pnpm --filter core test

# Test CLI
pnpm cli make-sample --template stamp_card_v1 --dev

# Validate generated pass
pnpm cli validate --file ./dist/sample.pkpass
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter web build

# Production build
NODE_ENV=production pnpm build
```

## Deployment

### Production Requirements

- Node.js 20+
- PostgreSQL
- Real Apple certificates
- SSL/TLS termination
- File storage (S3, etc.)

### Environment Setup

1. Set all environment variables
2. Configure production database
3. Install real Apple certificates
4. Set up file storage
5. Configure SSL/TLS
6. Set up monitoring

### Docker (Optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install -g pnpm
RUN pnpm install
COPY . .
RUN pnpm build
EXPOSE 4000
CMD ["pnpm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update documentation
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- Documentation: [docs/](docs/)
- Issues: GitHub Issues
- Discussions: GitHub Discussions

## Roadmap

### Milestone 1 (Current)
- ✅ Apple Wallet pass creation
- ✅ WYSIWYG editor
- ✅ Template system
- ✅ CLI tool
- ✅ Complete documentation

### Milestone 2 (Future)
- Apple push notifications (APNs)
- Device registration
- Pass update web service
- Real-time pass updates

### Milestone 3 (Future)
- Google Wallet support
- JWT Save links
- REST API integration
- Cross-platform passes

## Security

- No hardcoded secrets
- Certificate-based signing
- Input validation
- Secure file handling
- Regular security audits

## Performance

- SHA-256 deduplication
- Image optimization
- Database indexing
- Caching strategies
- CDN ready

## Troubleshooting

### Common Issues

1. **Pass won't install**: Check certificate validity
2. **Images not displaying**: Verify dimensions and format
3. **Barcode not scanning**: Check message encoding
4. **API errors**: Check logs and database connection

### Debug Commands

```bash
# Check pass structure
unzip -l pass.pkpass

# Validate pass
pnpm cli validate --file pass.pkpass

# Check logs
tail -f logs/api.log

# Database
pnpm --filter db studio
```

## Changelog

### v1.0.0 (Milestone 1)
- Initial release
- Apple Wallet support
- 3 restaurant templates
- WYSIWYG editor
- CLI tool
- Complete documentation
