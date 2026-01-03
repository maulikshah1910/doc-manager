#!/bin/bash

# Database Seeder Runner
# Usage: ./infra/scripts/seed.sh [all|seed_name]

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Database configuration
USE_DOCKER="${USE_DOCKER:-false}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_DATABASE="${DB_DATABASE:-doc_manager}"
DB_USER="${DB_USER:-doc_user}"
DB_PASSWORD="${DB_PASSWORD:-doc_password}"
DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD:-root_password}"
CONTAINER_NAME="${DB_CONTAINER_NAME:-doc-manager-mysql}"

SEEDS_DIR="infra/mysql/seeds"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if database is accessible
check_container() {
    if [ "$USE_DOCKER" = "true" ]; then
        if ! docker ps | grep -q "$CONTAINER_NAME"; then
            log_error "MySQL container '$CONTAINER_NAME' is not running"
            log_info "Start it with: docker-compose up -d mysql"
            exit 1
        fi
    else
        # Check if MySQL is accessible for local/RDS connections
        if ! mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" 2>/dev/null; then
            log_error "Cannot connect to MySQL at $DB_HOST:$DB_PORT"
            log_info "Please check your database connection settings in .env"
            exit 1
        fi
    fi
}

# Execute SQL seed file
execute_seed_file() {
    local seed_file=$1
    local seed_name=$(basename "$seed_file" .sql)

    log_info "Running seed: $seed_name..."

    if [ "$USE_DOCKER" = "true" ]; then
        if docker exec -i "$CONTAINER_NAME" mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_DATABASE" < "$seed_file" 2>&1; then
            log_success "Completed: $seed_name"
            return 0
        else
            log_error "Failed: $seed_name"
            return 1
        fi
    else
        if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_DATABASE" < "$seed_file" 2>&1; then
            log_success "Completed: $seed_name"
            return 0
        else
            log_error "Failed: $seed_name"
            return 1
        fi
    fi
}

# Run all seeds
seed_all() {
    log_info "Running all seed files..."
    check_container

    local total=0
    local success=0
    local failed=0

    # Find all seed files and sort them
    for seed_file in $(ls "$SEEDS_DIR"/*.sql 2>/dev/null | sort); do
        ((total++))

        if execute_seed_file "$seed_file"; then
            ((success++))
        else
            ((failed++))
        fi

        echo ""
    done

    if [ $total -eq 0 ]; then
        log_warning "No seed files found in $SEEDS_DIR"
        return 0
    fi

    # Summary
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}Seeding Summary${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Total seeds:     $total"
    echo -e "${GREEN}Successful:      $success${NC}"
    if [ $failed -gt 0 ]; then
        echo -e "${RED}Failed:          $failed${NC}"
    fi
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ $failed -gt 0 ]; then
        exit 1
    fi
}

# Run specific seed
seed_specific() {
    local seed_name=$1
    check_container

    # Try to find the seed file
    local seed_file=""

    # Try exact match
    if [ -f "$SEEDS_DIR/${seed_name}.sql" ]; then
        seed_file="$SEEDS_DIR/${seed_name}.sql"
    # Try with wildcard (e.g., "users" matches "001_seed_users.sql")
    else
        seed_file=$(ls "$SEEDS_DIR"/*${seed_name}*.sql 2>/dev/null | head -1)
    fi

    if [ -z "$seed_file" ]; then
        log_error "Seed file not found: $seed_name"
        log_info "Available seeds:"
        ls "$SEEDS_DIR"/*.sql 2>/dev/null | xargs -n 1 basename | sed 's/^/  - /'
        exit 1
    fi

    execute_seed_file "$seed_file"
}

# List available seeds
list_seeds() {
    log_info "Available seed files:"
    echo ""

    if ls "$SEEDS_DIR"/*.sql 1> /dev/null 2>&1; then
        for seed_file in $(ls "$SEEDS_DIR"/*.sql | sort); do
            seed_name=$(basename "$seed_file" .sql)
            echo "  - $seed_name"
        done
    else
        log_warning "No seed files found in $SEEDS_DIR"
    fi

    echo ""
    log_info "Usage: ./infra/scripts/seed.sh [all|seed_name|list]"
}

# Main script
case "${1:-all}" in
    all)
        seed_all
        ;;
    list)
        list_seeds
        ;;
    *)
        seed_specific "$1"
        ;;
esac
