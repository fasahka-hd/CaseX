#!/usr/bin/env bash
set -e

echo "Запуск инфраструктуры Upgrader..."

if command -v pg_ctlcluster >/dev/null 2>&1; then
  sudo pg_ctlcluster 17 main start 2>/dev/null || echo "  PostgreSQL уже запущен"
else
  echo "  PostgreSQL не найден: установите postgresql или используйте docker compose"
fi

if command -v redis-server >/dev/null 2>&1; then
  redis-cli ping >/dev/null 2>&1 || sudo redis-server /etc/redis/redis.conf --daemonize yes
  echo "  Redis: $(redis-cli ping 2>/dev/null || echo 'недоступен')"
else
  echo "  Redis не найден: установите redis-server или используйте docker compose"
fi

DB_NAME="${PGDATABASE:-upgrader}"
DB_USER="${PGUSER:-upgrader}"
DB_PASS="${PGPASSWORD:-upgrader_dev_pass}"

if command -v psql >/dev/null 2>&1; then
  sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 \
    || sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
  sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
    || sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
  echo "  База ${DB_NAME} готова"
fi

echo "Готово. Запуск приложения: npm run start:pg"
