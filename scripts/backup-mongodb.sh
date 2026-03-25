#!/bin/bash
# Backup MongoDB data from Docker container
# Usage: ./scripts/backup-mongodb.sh [output-dir]

set -e

OUTPUT_DIR=${1:-./backups}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="mongodb_backup_${TIMESTAMP}.archive"

echo "=== MongoDB Backup ==="
echo "Output: ${OUTPUT_DIR}/${BACKUP_FILE}"
echo ""

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Get MongoDB credentials from .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo "❌ Error: .env file not found"
    exit 1
fi

# Run mongodump inside the container
docker-compose exec -T mongodb mongodump \
    --username="$MONGO_ROOT_USERNAME" \
    --password="$MONGO_ROOT_PASSWORD" \
    --authenticationDatabase=admin \
    --archive="/tmp/${BACKUP_FILE}" \
    --gzip

# Copy backup from container to host
docker cp mongodb:/tmp/${BACKUP_FILE} "${OUTPUT_DIR}/${BACKUP_FILE}"

# Remove backup from container
docker-compose exec -T mongodb rm "/tmp/${BACKUP_FILE}"

echo ""
echo "✅ Backup completed: ${OUTPUT_DIR}/${BACKUP_FILE}"
echo ""
echo "To restore:"
echo "  docker-compose exec -T mongodb mongorestore \\"
echo "    --username=\"\$MONGO_ROOT_USERNAME\" \\"
echo "    --password=\"\$MONGO_ROOT_PASSWORD\" \\"
echo "    --authenticationDatabase=admin \\"
echo "    --archive=\"/tmp/${BACKUP_FILE}\" \\"
echo "    --gzip"
