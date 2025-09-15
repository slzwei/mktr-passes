# Wallet Platform - Overview

## System Overview

The Wallet Platform is a production-grade pass creation platform for Apple Wallet (and later Google Wallet). It provides a complete solution for generating, managing, and distributing digital passes without relying on third-party wallet platform services.

## Architecture

The platform is built as a monorepo with the following structure:

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

## Milestones

### Milestone 1 (Current) - Pass Creation Platform
- ✅ Web WYSIWYG pass editor with templated layouts
- ✅ Server-side pkpass builder producing valid .pkpass files
- ✅ 3 restaurant-friendly templates (stamp card, coupon, membership)
- ✅ Complete documentation
- ✅ CLI tool for local testing

### Milestone 2 (Future) - Apple Push Updates
- Apple push notifications (APNs) for pass updates
- Device registration and pass update web service endpoints
- Real-time pass updates

### Milestone 3 (Future) - Google Wallet
- Google Wallet pass generation
- Issuer management
- JWT Save links and REST patching

## Key Features

### Template System
- **Stamp Card**: Primary field shows "X of N stamps", auxiliary shows reward text
- **Coupon**: Primary shows discount/offer, secondary shows expiry, barcode mandatory
- **Membership Card**: Primary shows member name/tier, secondary shows join/expiry

### WYSIWYG Editor
- Live preview of pass appearance
- Variable editing with validation
- Image upload with dimension validation
- Color customization
- Barcode configuration

### Pass Generation
- Valid Apple Wallet .pkpass files
- PKCS#7 detached signatures
- SHA-1 manifest validation
- Image dimension enforcement
- Template-based pass.json generation

### Development Tools
- CLI for local pass generation
- Comprehensive validation
- Development mode with dummy certificates
- Full TypeScript support

## Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
- **Backend**: Node.js 20, Fastify, TypeScript, Prisma
- **Database**: PostgreSQL
- **Image Processing**: Sharp
- **Signing**: OpenSSL (preferred) / node-forge (fallback)
- **Validation**: Zod schemas
- **Build**: pnpm workspaces, TypeScript

## Security

- No hardcoded secrets (environment variables only)
- Certificate-based signing with Apple requirements
- Image validation and sanitization
- SHA-256 deduplication for assets
- Proper error handling and logging

## Next Steps

1. Complete Milestone 1 implementation
2. Set up development environment
3. Test with real Apple certificates
4. Deploy to production
5. Begin Milestone 2 (Apple push updates)
