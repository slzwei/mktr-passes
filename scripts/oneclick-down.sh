#!/bin/bash

# =============================================================================
# Wallet Platform - One-Click Down Script
# =============================================================================
# Stops the entire development stack and optionally removes volumes

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse command line arguments
NUKE_VOLUMES=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --nuke)
            NUKE_VOLUMES=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--nuke]"
            echo ""
            echo "Options:"
            echo "  --nuke    Remove all volumes (including database data)"
            echo "  -h, --help  Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Main execution
main() {
    echo "🛑 Stopping Wallet Platform Development Stack"
    echo "============================================="
    
    if [ "$NUKE_VOLUMES" = true ]; then
        print_warning "This will remove ALL data including the database!"
        read -p "Are you sure you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Operation cancelled"
            exit 0
        fi
        
        print_status "Stopping services and removing volumes..."
        docker compose down -v
        print_success "Services stopped and volumes removed"
    else
        print_status "Stopping services (keeping volumes)..."
        docker compose down
        print_success "Services stopped (volumes preserved)"
    fi
    
    echo ""
    print_success "Development stack has been stopped"
    
    if [ "$NUKE_VOLUMES" = false ]; then
        echo ""
        print_status "To remove all data including database, run:"
        print_status "  ./scripts/oneclick-down.sh --nuke"
    fi
}

# Run main function
main "$@"
