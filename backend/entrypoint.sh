#!/bin/sh
set -e

echo "==> Waiting for Postgres..."
until pg_isready -h db -U "${POSTGRES_USER:-appuser}" -q; do
  sleep 1
done
echo "==> Postgres is ready."

echo "==> Running database migrations..."
alembic upgrade head
echo "==> Migrations complete."

echo "==> Checking if database needs seeding..."
ROW_COUNT=$(python -c "
from app.models.university import University
from app.database import SessionLocal
db = SessionLocal()
try:
    count = db.query(University).count()
    print(count)
finally:
    db.close()
")

if [ "$ROW_COUNT" = "0" ]; then
  echo "==> Database is empty — seeding from extracted_rules..."
  python hydrate_db.py --json-dir /app/extracted_rules
  echo "==> Seeding complete."
else
  echo "==> Database already has $ROW_COUNT universities — skipping seed."
fi

echo "==> Starting API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
