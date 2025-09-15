#!/bin/bash

# =============================================================================
# Wallet Platform - One-Click Up Script
# =============================================================================
# Starts the entire development stack with Docker Compose
# Includes database migration and health checks

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

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running or not accessible."
        print_error "Please start Docker Desktop and try again."
        print_error "On macOS: Open Docker Desktop from Applications"
        print_error "On Linux: Run 'sudo systemctl start docker'"
        exit 1
    fi
    print_success "Docker is running"
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose is not available."
        print_error "Please install Docker Compose and try again."
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Function to wait for service to be healthy
wait_for_service() {
    local service_name=$1
    local health_url=$2
    local max_attempts=30
    local attempt=1

    print_status "Waiting for $service_name to be healthy..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$health_url" >/dev/null 2>&1; then
            print_success "$service_name is healthy"
            return 0
        fi
        
        print_status "Attempt $attempt/$max_attempts - waiting for $service_name..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to become healthy after $max_attempts attempts"
    return 1
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    if docker compose exec -T api pnpm run db:migrate; then
        print_success "Database migrations completed"
    else
        print_warning "Database migrations failed or already up to date"
    fi
}

# Function to seed database
seed_database() {
    print_status "Seeding database with sample data..."
    
    if docker compose exec -T api pnpm --filter @wallet-platform/db run seed; then
        print_success "Database seeded successfully"
    else
        print_warning "Database seeding failed (this is optional)"
    fi
}

# Function to generate sample pass
generate_sample_pass() {
    print_status "Generating sample pass..."
    
    if docker compose exec -T api pnpm run ci:sample; then
        print_success "Sample pass generated successfully"
        print_status "Sample pass location: ./dist/ci-sample.pkpass"
    else
        print_warning "Sample pass generation failed (this is optional)"
    fi
}

# Main execution
main() {
    echo "🚀 Starting Wallet Platform Development Stack"
    echo "=============================================="
    
    # Check prerequisites
    check_docker
    check_docker_compose
    
    # Start services
    print_status "Starting Docker Compose services..."
    docker compose up -d
    
    # Wait for PostgreSQL to be healthy
    print_status "Waiting for PostgreSQL to be ready..."
    sleep 10  # Give PostgreSQL time to start
    
    # Wait for API to be healthy
    wait_for_service "API" "http://localhost:3001/health"
    
    # Run database migrations
    run_migrations
    
    # Seed database
    seed_database
    
    # Generate sample pass
    generate_sample_pass
    
    # Print access information
    echo ""
    echo "🎉 Development Stack is Ready!"
    echo "==============================="
    echo ""
    echo "📱 Web UI:     http://localhost:3000"
    echo "🔧 API:        http://localhost:3001"
    echo "🗄️  Adminer:    http://localhost:8080"
    echo ""
    echo "Database Connection (Adminer):"
    echo "  System:   PostgreSQL"
    echo "  Server:   postgres"
    echo "  Username: postgres"
    echo "  Password: postgres"
    echo "  Database: wallet"
    echo ""
    echo "📋 Useful Commands:"
    echo "  View logs:    docker compose logs -f"
    echo "  Stop stack:   ./scripts/oneclick-down.sh"
    echo "  Reset DB:     ./scripts/oneclick-reset-db.sh"
    echo ""
    print_success "All services are running and healthy!"
}

# Run main function
main "$@"
