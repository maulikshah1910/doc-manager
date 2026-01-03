#!/bin/bash

# Database Quick Setup Script
# This script automates the complete database setup process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════╗"
echo "║   Document Manager - Database Setup               ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Check if .env exists
echo -e "${BLUE}[Step 1/5]${NC} Checking environment configuration..."
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠${NC} .env file not found"
    echo -e "${BLUE}ℹ${NC} Creating .env from .env.sample..."
    cp .env.sample .env
    echo -e "${GREEN}✓${NC} .env file created"
    echo -e "${YELLOW}⚠${NC} Please review .env file and update if needed"
else
    echo -e "${GREEN}✓${NC} .env file exists"
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

USE_DOCKER="${USE_DOCKER:-false}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"

echo ""

if [ "$USE_DOCKER" = "true" ]; then
    # Docker-based setup
    # Step 2: Check Docker
    echo -e "${BLUE}[Step 2/5]${NC} Checking Docker..."
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗${NC} Docker is not installed"
        echo -e "${BLUE}ℹ${NC} Please install Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! docker ps &> /dev/null; then
        echo -e "${RED}✗${NC} Docker daemon is not running"
        echo -e "${BLUE}ℹ${NC} Please start Docker and try again"
        exit 1
    fi

    echo -e "${GREEN}✓${NC} Docker is running"
    echo ""

    # Step 3: Start MySQL Container
    echo -e "${BLUE}[Step 3/5]${NC} Starting MySQL container..."

    if docker ps | grep -q "${DB_CONTAINER_NAME:-doc-manager-mysql}"; then
        echo -e "${YELLOW}⚠${NC} MySQL container already running"
    else
        echo -e "${BLUE}ℹ${NC} Starting MySQL with docker-compose..."
        docker-compose up -d mysql
        echo -e "${GREEN}✓${NC} MySQL container started"
    fi

    echo ""

    # Step 4: Wait for MySQL to be ready
    echo -e "${BLUE}[Step 4/5]${NC} Waiting for MySQL to be ready..."

    MAX_RETRIES=30
    RETRY_COUNT=0

    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if docker exec "${DB_CONTAINER_NAME:-doc-manager-mysql}" mysqladmin ping -u root -p"${DB_ROOT_PASSWORD:-root_password}" --silent 2>/dev/null; then
            echo -e "${GREEN}✓${NC} MySQL is ready"
            break
        fi

        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo -n "."
        sleep 1
    done

    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo -e "\n${RED}✗${NC} MySQL failed to start within expected time"
        echo -e "${BLUE}ℹ${NC} Check logs with: docker-compose logs mysql"
        exit 1
    fi

    echo ""
else
    # Local MySQL or RDS setup
    # Step 2: Check MySQL CLI
    echo -e "${BLUE}[Step 2/5]${NC} Checking MySQL client..."
    if ! command -v mysql &> /dev/null; then
        echo -e "${RED}✗${NC} MySQL client is not installed"
        echo -e "${BLUE}ℹ${NC} Please install MySQL client"
        exit 1
    fi

    echo -e "${GREEN}✓${NC} MySQL client is available"
    echo ""

    # Step 3: Check MySQL Connection
    echo -e "${BLUE}[Step 3/5]${NC} Checking MySQL connection..."
    if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} MySQL connection successful"
    else
        echo -e "${RED}✗${NC} Cannot connect to MySQL at $DB_HOST:$DB_PORT"
        echo -e "${BLUE}ℹ${NC} Please check your database connection settings in .env"
        exit 1
    fi

    echo ""

    # Step 4: Ensure database exists
    echo -e "${BLUE}[Step 4/5]${NC} Ensuring database exists..."
    if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS ${DB_DATABASE:-doc_manager};" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Database '${DB_DATABASE:-doc_manager}' is ready"
    else
        echo -e "${RED}✗${NC} Failed to create/verify database"
        exit 1
    fi

    echo ""
fi

# Step 5: Run Migrations
echo -e "${BLUE}[Step 5/5]${NC} Running database migrations..."
./infra/scripts/migrate.sh up

echo ""
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════╗"
echo "║   Database Setup Complete! 🎉                     ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${GREEN}Database Connection Information:${NC}"
echo "  Host:     ${DB_HOST:-localhost}"
echo "  Port:     ${DB_PORT:-3306}"
echo "  Database: ${DB_DATABASE:-doc_manager}"
echo "  User:     ${DB_USER:-doc_user}"
echo "  Password: ${DB_PASSWORD:-doc_password}"

echo ""
echo -e "${GREEN}Useful Commands:${NC}"
echo "  View migration status:  ./infra/scripts/migrate.sh status"
if [ "$USE_DOCKER" = "true" ]; then
    echo "  Connect to MySQL:       docker exec -it ${DB_CONTAINER_NAME:-doc-manager-mysql} mysql -u root -p${DB_ROOT_PASSWORD:-root_password} ${DB_DATABASE:-doc_manager}"
    echo "  View MySQL logs:        docker-compose logs -f mysql"
    echo "  Stop MySQL:             docker-compose stop mysql"
    echo "  Restart MySQL:          docker-compose restart mysql"
else
    echo "  Connect to MySQL:       mysql -h${DB_HOST} -P${DB_PORT} -u${DB_USER} -p ${DB_DATABASE:-doc_manager}"
    echo "  Run migrations:         ./infra/scripts/migrate.sh up"
    echo "  Rollback migrations:    ./infra/scripts/migrate.sh down"
    echo "  Seed database:          ./infra/scripts/seed.sh"
fi

echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Review the database schema in infra/mysql/migrations/"
echo "  2. Set up the NestJS backend application"
echo "  3. Configure TypeORM with database connection"
echo "  4. Create seed data for initial users and roles"

echo ""
