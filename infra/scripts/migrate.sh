#!/bin/bash

# Database Migration Runner
# Usage: ./infra/scripts/migrate.sh [up|down|status|fresh]

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

MIGRATIONS_DIR="infra/mysql/migrations"

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

# Check if Docker container is running (only when USE_DOCKER=true)
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

# Execute SQL file
execute_sql_file() {
    local sql_file=$1
    if [ "$USE_DOCKER" = "true" ]; then
        docker exec -i "$CONTAINER_NAME" mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_DATABASE" < "$sql_file"
    else
        mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_DATABASE" < "$sql_file"
    fi
}

# Execute SQL command
execute_sql_command() {
    local sql_command=$1
    if [ "$USE_DOCKER" = "true" ]; then
        docker exec -i "$CONTAINER_NAME" mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_DATABASE" -e "$sql_command"
    else
        mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_DATABASE" -e "$sql_command"
    fi
}

# Get next batch number
get_next_batch() {
    local batch
    if [ "$USE_DOCKER" = "true" ]; then
        batch=$(docker exec "$CONTAINER_NAME" mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_DATABASE" -sN -e "SELECT COALESCE(MAX(batch), 0) + 1 FROM _migrations;" 2>/dev/null || echo "1")
    else
        batch=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_DATABASE" -sN -e "SELECT COALESCE(MAX(batch), 0) + 1 FROM _migrations;" 2>/dev/null || echo "1")
    fi
    echo "$batch"
}

# Check if migration has been run
is_migration_executed() {
    local migration_name=$1
    local count
    if [ "$USE_DOCKER" = "true" ]; then
        count=$(docker exec "$CONTAINER_NAME" mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_DATABASE" -sN -e "SELECT COUNT(*) FROM _migrations WHERE migration_name = '$migration_name';" 2>/dev/null || echo "0")
    else
        count=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_DATABASE" -sN -e "SELECT COUNT(*) FROM _migrations WHERE migration_name = '$migration_name';" 2>/dev/null || echo "0")
    fi
    [ "$count" -gt 0 ]
}

# Record migration execution
record_migration() {
    local migration_name=$1
    local batch=$2
    execute_sql_command "INSERT INTO _migrations (migration_name, batch) VALUES ('$migration_name', $batch);"
}

# Remove migration record
remove_migration_record() {
    local migration_name=$1
    execute_sql_command "DELETE FROM _migrations WHERE migration_name = '$migration_name';"
}

# Run migrations (up)
migrate_up() {
    log_info "Running pending migrations..."
    check_container

    # Ensure migrations table exists
    log_info "Ensuring migrations tracking table exists..."
    execute_sql_file "$MIGRATIONS_DIR/00000000_000_create_migrations_table.sql"

    local batch=$(get_next_batch)
    local executed_count=0

    # Find all migration files (excluding rollback files)
    for migration_file in $(ls "$MIGRATIONS_DIR" | grep -v "rollback" | grep ".sql$" | sort); do
        migration_name="${migration_file%.sql}"

        # Skip the migrations tracking table itself
        if [ "$migration_name" = "00000000_000_create_migrations_table" ]; then
            continue
        fi

        if is_migration_executed "$migration_name"; then
            log_info "Skipping $migration_name (already executed)"
        else
            log_info "Executing $migration_name..."
            execute_sql_file "$MIGRATIONS_DIR/$migration_file"
            record_migration "$migration_name" "$batch"
            log_success "Executed $migration_name"
            ((executed_count++))
        fi
    done

    if [ $executed_count -eq 0 ]; then
        log_info "No new migrations to execute"
    else
        log_success "Successfully executed $executed_count migration(s) in batch $batch"
    fi
}

# Rollback last batch of migrations
migrate_down() {
    log_warning "Rolling back last batch of migrations..."
    check_container

    # Get last batch number
    local last_batch
    if [ "$USE_DOCKER" = "true" ]; then
        last_batch=$(docker exec "$CONTAINER_NAME" mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_DATABASE" -sN -e "SELECT MAX(batch) FROM _migrations;" 2>/dev/null || echo "0")
    else
        last_batch=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_DATABASE" -sN -e "SELECT MAX(batch) FROM _migrations;" 2>/dev/null || echo "0")
    fi

    if [ "$last_batch" = "0" ] || [ -z "$last_batch" ]; then
        log_info "No migrations to rollback"
        return
    fi

    log_info "Rolling back batch $last_batch..."

    # Get migrations in last batch (reverse order)
    local migrations
    if [ "$USE_DOCKER" = "true" ]; then
        migrations=$(docker exec "$CONTAINER_NAME" mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_DATABASE" -sN -e "SELECT migration_name FROM _migrations WHERE batch = $last_batch ORDER BY id DESC;")
    else
        migrations=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_DATABASE" -sN -e "SELECT migration_name FROM _migrations WHERE batch = $last_batch ORDER BY id DESC;")
    fi

    while IFS= read -r migration_name; do
        if [ -z "$migration_name" ]; then
            continue
        fi

        rollback_file="$MIGRATIONS_DIR/${migration_name%.sql}_rollback_${migration_name#*_}.sql"

        # Try to find rollback file
        if [ ! -f "$rollback_file" ]; then
            # Try alternative naming pattern
            rollback_file=$(ls "$MIGRATIONS_DIR" | grep "rollback" | grep "${migration_name#*_}" | head -1)
            rollback_file="$MIGRATIONS_DIR/$rollback_file"
        fi

        if [ -f "$rollback_file" ]; then
            log_info "Rolling back $migration_name..."
            execute_sql_file "$rollback_file"
            remove_migration_record "$migration_name"
            log_success "Rolled back $migration_name"
        else
            log_error "Rollback file not found for $migration_name"
        fi
    done <<< "$migrations"

    log_success "Rollback completed for batch $last_batch"
}

# Show migration status
migrate_status() {
    log_info "Migration status:"
    check_container

    # Check if migrations table exists
    local table_exists
    if [ "$USE_DOCKER" = "true" ]; then
        table_exists=$(docker exec "$CONTAINER_NAME" mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_DATABASE" -e "SHOW TABLES LIKE '_migrations';" 2>/dev/null | grep -c "_migrations" || echo "0")
    else
        table_exists=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_DATABASE" -e "SHOW TABLES LIKE '_migrations';" 2>/dev/null | grep -c "_migrations" || echo "0")
    fi

    if [ "$table_exists" = "0" ]; then
        log_warning "Migrations table does not exist. Run './infra/scripts/migrate.sh up' first."
        return
    fi

    echo ""
    echo "Executed migrations:"
    if [ "$USE_DOCKER" = "true" ]; then
        docker exec "$CONTAINER_NAME" mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_DATABASE" -e "SELECT id, migration_name, batch, executed_at FROM _migrations ORDER BY id;"
    else
        mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_DATABASE" -e "SELECT id, migration_name, batch, executed_at FROM _migrations ORDER BY id;"
    fi

    echo ""
    echo "Pending migrations:"
    local pending_count=0
    for migration_file in $(ls "$MIGRATIONS_DIR" | grep -v "rollback" | grep ".sql$" | sort); do
        migration_name="${migration_file%.sql}"

        if [ "$migration_name" = "00000000_000_create_migrations_table" ]; then
            continue
        fi

        if ! is_migration_executed "$migration_name"; then
            echo "  - $migration_name"
            ((pending_count++))
        fi
    done

    if [ $pending_count -eq 0 ]; then
        echo "  (none)"
    fi
}

# Fresh migration (drop all tables and re-run)
migrate_fresh() {
    log_warning "This will drop all tables and re-run all migrations!"
    read -p "Are you sure? (yes/no): " confirmation

    if [ "$confirmation" != "yes" ]; then
        log_info "Operation cancelled"
        return
    fi

    check_container

    log_info "Dropping all tables..."

    # Get all tables and drop them
    local tables
    if [ "$USE_DOCKER" = "true" ]; then
        tables=$(docker exec "$CONTAINER_NAME" mysql -u root -p"$DB_ROOT_PASSWORD" "$DB_DATABASE" -sN -e "SHOW TABLES;")
    else
        tables=$(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_DATABASE" -sN -e "SHOW TABLES;")
    fi

    if [ -n "$tables" ]; then
        execute_sql_command "SET FOREIGN_KEY_CHECKS = 0;"
        while IFS= read -r table; do
            if [ -n "$table" ]; then
                log_info "Dropping table: $table"
                execute_sql_command "DROP TABLE IF EXISTS \`$table\`;"
            fi
        done <<< "$tables"
        execute_sql_command "SET FOREIGN_KEY_CHECKS = 1;"
        log_success "All tables dropped"
    else
        log_info "No tables to drop"
    fi

    # Run all migrations
    migrate_up
}

# Main script
case "${1:-up}" in
    up)
        migrate_up
        ;;
    down)
        migrate_down
        ;;
    status)
        migrate_status
        ;;
    fresh)
        migrate_fresh
        ;;
    *)
        echo "Usage: $0 [up|down|status|fresh]"
        echo ""
        echo "Commands:"
        echo "  up      - Run pending migrations (default)"
        echo "  down    - Rollback last batch of migrations"
        echo "  status  - Show migration status"
        echo "  fresh   - Drop all tables and re-run all migrations"
        exit 1
        ;;
esac
