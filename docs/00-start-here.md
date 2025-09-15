# 🚀 Wallet Platform - Quick Start Guide

Welcome to the Wallet Platform! This guide will get you up and running in minutes with a complete development environment.

## 📋 Prerequisites

### Required
- **Docker Desktop** (or Docker Engine) - [Download here](https://www.docker.com/products/docker-desktop/)
- **Git** (optional, for version control)

### Optional (for local development without Docker)
- **Node.js 20+** - [Download here](https://nodejs.org/)
- **pnpm 8+** - Install with `npm install -g pnpm`

### DevContainer (Recommended for VS Code users)
- **VS Code** with **Dev Containers extension** - [Install here](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

## 🏃‍♂️ Quick Start Options

### Option 1: DevContainer (VS Code - Recommended)

1. **Open in DevContainer:**
   - Open VS Code
   - Open this repository
   - Click "Reopen in Container" when prompted
   - Or use Command Palette: `Dev Containers: Reopen in Container`

2. **The DevContainer will automatically:**
   - Install Node.js 20, pnpm, and system dependencies
   - Install VS Code extensions
   - Set up the development environment
   - Forward ports 3000, 3001, 8080, 5432

3. **Start the development stack:**
   ```bash
   ./scripts/oneclick-up.sh
   ```

### Option 2: Docker Compose (Any Editor)

### 1. Start the Development Stack

**On macOS/Linux:**
```bash
./scripts/oneclick-up.sh
```

**On Windows:**
```powershell
.\scripts\oneclick-up.ps1
```

This single command will:
- ✅ Start PostgreSQL 16 database
- ✅ Start API server (Fastify)
- ✅ Start Web frontend (Vite + React)
- ✅ Start Worker service (APNs/Outbox)
- ✅ Start Adminer (Database UI)
- ✅ Run database migrations
- ✅ Seed with sample data
- ✅ Generate a sample .pkpass file

### 2. Access Your Services

Once the stack is running, you can access:

| Service | URL | Description |
|---------|-----|-------------|
| 🌐 **Web UI** | http://localhost:3000 | WYSIWYG pass editor |
| 🔧 **API** | http://localhost:3001 | REST API server |
| 🗄️ **Adminer** | http://localhost:8080 | Database management UI |

### 3. Database Access (Adminer)

To access the database directly:
- **System:** PostgreSQL
- **Server:** postgres
- **Username:** postgres
- **Password:** postgres
- **Database:** wallet

## 🛠️ Development Commands

### One-Click Scripts

| Command | Description |
|---------|-------------|
| `./scripts/oneclick-up.sh` | Start entire development stack |
| `./scripts/oneclick-down.sh` | Stop all services (keep data) |
| `./scripts/oneclick-down.sh --nuke` | Stop all services and delete data |
| `./scripts/oneclick-reset-db.sh` | Reset database and run migrations |

### NPM Scripts

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start web + API in development mode |
| `pnpm run dev:web` | Start only the web frontend |
| `pnpm run dev:api` | Start only the API server |
| `pnpm run worker:dev` | Start only the worker service |
| `pnpm run stack:up` | Start Docker stack |
| `pnpm run stack:down` | Stop Docker stack |
| `pnpm run stack:logs` | View all service logs |
| `pnpm run ci:sample` | Generate sample .pkpass file |

### Docker Commands

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start all services |
| `docker compose down` | Stop all services |
| `docker compose logs -f` | View logs (follow mode) |
| `docker compose exec api bash` | Access API container |
| `docker compose exec postgres psql -U postgres -d wallet` | Access database |

## 🔍 Troubleshooting

### Common Issues

**Docker not running:**
```
Error: Docker is not running or not accessible
```
- Start Docker Desktop
- On Linux: `sudo systemctl start docker`

**Port already in use:**
```
Error: Port 3000 is already in use
```
- Stop other services using these ports
- Or change ports in `docker-compose.yml`

**Database connection failed:**
```
Error: Database migrations failed
```
- Wait a few more seconds for PostgreSQL to start
- Check logs: `docker compose logs postgres`

**Services not healthy:**
```
Error: API failed to become healthy
```
- Check logs: `docker compose logs api`
- Ensure all dependencies are installed

### Viewing Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f web
docker compose logs -f worker
docker compose logs -f postgres
```

### Resetting Everything

```bash
# Stop and remove all data
./scripts/oneclick-down.sh --nuke

# Start fresh
./scripts/oneclick-up.sh
```

## 🏗️ Project Structure

```
wallet-platform/
├── apps/
│   ├── api/          # Fastify API server
│   ├── web/          # React frontend
│   └── cli/          # CLI tools
├── packages/
│   ├── core/         # Shared business logic
│   └── pkpass/       # Apple Wallet pass generation
├── infra/
│   └── db/           # Database schema & migrations
├── scripts/          # One-click automation scripts
├── docs/             # Documentation
└── docker-compose.yml
```

## 🔧 Configuration

### Environment Variables

The platform uses environment-specific configuration:

- **`.env.example`** - Template with all available options
- **`env.dev`** - Development defaults (mock signing)
- **`env.ci`** - CI/CD defaults (mock signing)

### Development Mode

By default, the platform runs in **development mode** with:
- ✅ Mock Apple Wallet signing (no certificates needed)
- ✅ Mock APNs push notifications
- ✅ Hot reload for all services
- ✅ Detailed logging
- ✅ CORS enabled for all origins

### Production Mode

For production deployment, you'll need:
- 🔐 Real Apple Developer certificates
- 🔐 Real APNs configuration
- 🔐 Secure environment variables
- 🔐 Production database

## 📚 Next Steps

### Learn More

- **[Configuration Guide](03-config.md)** - Detailed configuration options
- **[Web Service Guide](11-web-service.md)** - Apple Wallet Web Service integration
- **[APNs Guide](12-apns.md)** - Push notification setup
- **[Update Flow Guide](13-update-flow.md)** - Pass update mechanisms

### Development Workflow

1. **Create a pass template** using the web UI
2. **Upload assets** (images, icons)
3. **Generate .pkpass** files
4. **Test in Apple Wallet** (iOS Simulator or device)
5. **Set up push notifications** for real-time updates

### Architecture

The platform follows **SOLID principles** with clean layering:

```
┌─────────────────┐
│   Presentation  │ ← Web UI, API Routes
├─────────────────┤
│   Application   │ ← Services, Use Cases
├─────────────────┤
│     Domain      │ ← Business Logic, Entities
├─────────────────┤
│ Infrastructure  │ ← Database, External APIs
└─────────────────┘
```

## 🆘 Getting Help

### Documentation
- Check the `docs/` directory for detailed guides
- Each service has its own README

### Support
- Review logs for error messages
- Check the troubleshooting section above
- Ensure all prerequisites are installed

### Sample Data

The platform comes with built-in templates:
- **Stamp Card** - Loyalty program template
- **Coupon** - Discount coupon template  
- **Membership** - Membership card template

## 🎉 You're Ready!

Your development environment is now running with:
- ✅ Complete Apple Wallet pass creation platform
- ✅ Real-time web editor
- ✅ Database management interface
- ✅ Sample data and templates
- ✅ One-click automation scripts

**Happy coding!** 🚀
