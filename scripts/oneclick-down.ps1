# =============================================================================
# Wallet Platform - One-Click Down Script (PowerShell)
# =============================================================================
# Stops the entire development stack and optionally removes volumes

param(
    [switch]$Nuke,
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
    Write-Host "Usage: .\oneclick-down.ps1 [-Nuke] [-Help]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Nuke    Remove all volumes (including database data)"
    Write-Host "  -Help    Show this help message"
    exit 0
}

# Main execution
function Main {
    Write-Host "🛑 Stopping Wallet Platform Development Stack" -ForegroundColor Red
    Write-Host "=============================================" -ForegroundColor Red
    
    if ($Nuke) {
        Write-Warning "This will remove ALL data including the database!"
        $confirmation = Read-Host "Are you sure you want to continue? (y/N)"
        if ($confirmation -notmatch '^[Yy]$') {
            Write-Status "Operation cancelled"
            exit 0
        }
        
        Write-Status "Stopping services and removing volumes..."
        docker compose down -v
        Write-Success "Services stopped and volumes removed"
    }
    else {
        Write-Status "Stopping services (keeping volumes)..."
        docker compose down
        Write-Success "Services stopped (volumes preserved)"
    }
    
    Write-Host ""
    Write-Success "Development stack has been stopped"
    
    if (-not $Nuke) {
        Write-Host ""
        Write-Status "To remove all data including database, run:"
        Write-Status "  .\scripts\oneclick-down.ps1 -Nuke"
    }
}

# Run main function
Main
