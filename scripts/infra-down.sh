#!/usr/bin/env bash
echo "Остановка инфраструктуры..."
redis-cli shutdown nosave 2>/dev/null && echo "  Redis остановлен" || echo "  Redis уже остановлен"
sudo pg_ctlcluster 17 main stop 2>/dev/null && echo "  PostgreSQL остановлен" || echo "  PostgreSQL уже остановлен"
