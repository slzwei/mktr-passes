# =============================================================================
# Wallet Platform - One-Click Database Reset Script (PowerShell)
# =============================================================================
# Resets the database by dropping and recreating it, then running migrations

param(
    [switch]$Help
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

# Show help
if ($Help) {
    Write-Host "Usage: .\oneclick-reset-db.ps1 [-Help]"
    Write-Host ""
    Write-Host "This script will:"
    Write-Host "  1. Drop the existing 'wallet' database"
    Write-Host "  2. Create a new 'wallet' database"
    Write-Host "  3. Run database migrations"
    Write-Host "  4. Generate a sample pass"
    Write-Host ""
    Write-Host "WARNING: This will delete all existing data!"
    exit 0
}

# Main execution
function Main {
    Write-Host "🗄️  Resetting Wallet Platform Database" -ForegroundColor Yellow
    Write-Host "======================================" -ForegroundColor Yellow
    
    # Check if services are running
    $postgresStatus = docker compose ps | Select-String "wallet-postgres.*Up"
    if (-not $postgresStatus) {
        Write-Error "PostgreSQL container is not running."
        Write-Error "Please start the development stack first:"
        Write-Error "  .\scripts\oneclick-up.ps1"
        exit 1
    }
    
    Write-Warning "This will DROP and recreate the database!"
    Write-Warning "All data will be lost!"
    $confirmation = Read-Host "Are you sure you want to continue? (y/N)"
    if ($confirmation -notmatch '^[Yy]$') {
        Write-Status "Operation cancelled"
        exit 0
    }
    
    # Drop and recreate database
    Write-Status "Dropping database 'wallet'..."
    try {
        docker compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS wallet WITH (FORCE);" | Out-Null
    }
    catch {
        # Ignore errors if database doesn't exist
    }
    
    Write-Status "Creating database 'wallet'..."
    docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE wallet;"
    
    # Run migrations
    Write-Status "Running database migrations..."
    try {
        docker compose exec -T api pnpm run db:migrate
        Write-Success "Database migrations completed"
    }
    catch {
        Write-Error "Database migrations failed"
        exit 1
    }
    
    # Generate sample pass
    Write-Status "Generating sample pass..."
    try {
        docker compose exec -T api pnpm run ci:sample
        Write-Success "Sample pass generated successfully"
        Write-Status "Sample pass location: ./dist/ci-sample.pkpass"
    }
    catch {
        Write-Warning "Sample pass generation failed (this is optional)"
    }
    
    Write-Host ""
    Write-Success "Database has been reset successfully!"
    Write-Status "You can now access the web UI at http://localhost:3000"
}

# Run main function
Main
