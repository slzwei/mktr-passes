#!/bin/bash

# =============================================================================
# Wallet Platform - One-Click Database Reset Script
# =============================================================================
# Resets the database by dropping and recreating it, then running migrations

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

# Main execution
main() {
    echo "🗄️  Resetting Wallet Platform Database"
    echo "======================================"
    
    # Check if services are running
    if ! docker compose ps | grep -q "wallet-postgres.*Up"; then
        print_error "PostgreSQL container is not running."
        print_error "Please start the development stack first:"
        print_error "  ./scripts/oneclick-up.sh"
        exit 1
    fi
    
    print_warning "This will DROP and recreate the database!"
    print_warning "All data will be lost!"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Operation cancelled"
        exit 0
    fi
    
    # Drop and recreate database
    print_status "Dropping database 'wallet'..."
    docker compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS wallet WITH (FORCE);" || true
    
    print_status "Creating database 'wallet'..."
    docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE wallet;"
    
    # Run migrations
    print_status "Running database migrations..."
    if docker compose exec -T api pnpm run db:migrate; then
        print_success "Database migrations completed"
    else
        print_error "Database migrations failed"
        exit 1
    fi
    
    # Generate sample pass
    print_status "Generating sample pass..."
    if docker compose exec -T api pnpm run ci:sample; then
        print_success "Sample pass generated successfully"
        print_status "Sample pass location: ./dist/ci-sample.pkpass"
    else
        print_warning "Sample pass generation failed (this is optional)"
    fi
    
    echo ""
    print_success "Database has been reset successfully!"
    print_status "You can now access the web UI at http://localhost:3000"
}

# Run main function
main "$@"
