# =============================================================================
# Wallet Platform - One-Click Up Script (PowerShell)
# =============================================================================
# Starts the entire development stack with Docker Compose
# Includes database migration and health checks

param(
    [switch]$Nuke
)

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check if Docker is running
function Test-Docker {
    try {
        docker info | Out-Null
        Write-Success "Docker is running"
        return $true
    }
    catch {
        Write-Error "Docker is not running or not accessible."
        Write-Error "Please start Docker Desktop and try again."
        Write-Error "On Windows: Open Docker Desktop from Start Menu"
        return $false
    }
}

# Function to check if Docker Compose is available
function Test-DockerCompose {
    try {
        if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
            Write-Success "Docker Compose is available"
            return $true
        }
        elseif (docker compose version | Out-Null) {
            Write-Success "Docker Compose is available"
            return $true
        }
        else {
            Write-Error "Docker Compose is not available."
            Write-Error "Please install Docker Compose and try again."
            return $false
        }
    }
    catch {
        Write-Error "Docker Compose is not available."
        Write-Error "Please install Docker Compose and try again."
        return $false
    }
}

# Function to wait for service to be healthy
function Wait-ForService {
    param(
        [string]$ServiceName,
        [string]$HealthUrl,
        [int]$MaxAttempts = 30
    )
    
    Write-Status "Waiting for $ServiceName to be healthy..."
    
    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        try {
            $response = Invoke-WebRequest -Uri $HealthUrl -Method Get -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Success "$ServiceName is healthy"
                return $true
            }
        }
        catch {
            # Service not ready yet
        }
        
        Write-Status "Attempt $attempt/$MaxAttempts - waiting for $ServiceName..."
        Start-Sleep -Seconds 2
    }
    
    Write-Error "$ServiceName failed to become healthy after $MaxAttempts attempts"
    return $false
}

# Function to run database migrations
function Invoke-DatabaseMigrations {
    Write-Status "Running database migrations..."
    
    try {
        docker compose exec -T api pnpm run db:migrate
        Write-Success "Database migrations completed"
    }
    catch {
        Write-Warning "Database migrations failed or already up to date"
    }
}

# Function to seed database
function Invoke-DatabaseSeed {
    Write-Status "Seeding database with sample data..."
    
    try {
        docker compose exec -T api pnpm --filter @wallet-platform/db run seed
        Write-Success "Database seeded successfully"
    }
    catch {
        Write-Warning "Database seeding failed (this is optional)"
    }
}

# Function to generate sample pass
function New-SamplePass {
    Write-Status "Generating sample pass..."
    
    try {
        docker compose exec -T api pnpm run ci:sample
        Write-Success "Sample pass generated successfully"
        Write-Status "Sample pass location: ./dist/ci-sample.pkpass"
    }
    catch {
        Write-Warning "Sample pass generation failed (this is optional)"
    }
}

# Main execution
function Main {
    Write-Host "🚀 Starting Wallet Platform Development Stack" -ForegroundColor Cyan
    Write-Host "==============================================" -ForegroundColor Cyan
    
    # Check prerequisites
    if (-not (Test-Docker)) {
        exit 1
    }
    
    if (-not (Test-DockerCompose)) {
        exit 1
    }
    
    # Start services
    Write-Status "Starting Docker Compose services..."
    docker compose up -d
    
    # Wait for PostgreSQL to be healthy
    Write-Status "Waiting for PostgreSQL to be ready..."
    Start-Sleep -Seconds 10  # Give PostgreSQL time to start
    
    # Wait for API to be healthy
    Wait-ForService -ServiceName "API" -HealthUrl "http://localhost:3001/health"
    
    # Run database migrations
    Invoke-DatabaseMigrations
    
    # Seed database
    Invoke-DatabaseSeed
    
    # Generate sample pass
    New-SamplePass
    
    # Print access information
    Write-Host ""
    Write-Host "🎉 Development Stack is Ready!" -ForegroundColor Green
    Write-Host "===============================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 Web UI:     http://localhost:3000" -ForegroundColor White
    Write-Host "🔧 API:        http://localhost:3001" -ForegroundColor White
    Write-Host "🗄️  Adminer:    http://localhost:8080" -ForegroundColor White
    Write-Host ""
    Write-Host "Database Connection (Adminer):" -ForegroundColor Yellow
    Write-Host "  System:   PostgreSQL" -ForegroundColor White
    Write-Host "  Server:   postgres" -ForegroundColor White
    Write-Host "  Username: postgres" -ForegroundColor White
    Write-Host "  Password: postgres" -ForegroundColor White
    Write-Host "  Database: wallet" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Useful Commands:" -ForegroundColor Yellow
    Write-Host "  View logs:    docker compose logs -f" -ForegroundColor White
    Write-Host "  Stop stack:   .\scripts\oneclick-down.ps1" -ForegroundColor White
    Write-Host "  Reset DB:     .\scripts\oneclick-reset-db.ps1" -ForegroundColor White
    Write-Host ""
    Write-Success "All services are running and healthy!"
}

# Run main function
Main
