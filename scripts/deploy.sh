#!/bin/bash

# Скрипт деплоя для cvetov-ai
# Использование: ./scripts/deploy.sh [production|staging]

set -e

# Конфигурация
ENVIRONMENT=${1:-production}
REPO_URL="https://github.com/cvetovcom/cvetov-ai.git"
DEPLOY_USER="deploy"
APP_DIR="/var/www/cvetov-ai"
BACKUP_DIR="/var/backups/cvetov-ai"
LOG_DIR="/var/log/cvetov-ai"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция логирования
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Проверка окружения
check_environment() {
    log "Проверка окружения: $ENVIRONMENT"

    if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" ]]; then
        error "Неверное окружение. Используйте: production или staging"
    fi

    # Проверка необходимых утилит
    command -v git >/dev/null 2>&1 || error "Git не установлен"
    command -v node >/dev/null 2>&1 || error "Node.js не установлен"
    command -v npm >/dev/null 2>&1 || error "npm не установлен"
    command -v pm2 >/dev/null 2>&1 || error "PM2 не установлен"
}

# Создание резервной копии
create_backup() {
    log "Создание резервной копии..."

    if [ -d "$APP_DIR" ]; then
        BACKUP_NAME="backup-$(date '+%Y%m%d-%H%M%S')"
        mkdir -p "$BACKUP_DIR"
        cp -r "$APP_DIR" "$BACKUP_DIR/$BACKUP_NAME"
        log "Резервная копия создана: $BACKUP_DIR/$BACKUP_NAME"
    else
        warning "Директория приложения не существует, пропускаем резервное копирование"
    fi
}

# Получение последней версии кода
pull_code() {
    log "Получение последней версии кода..."

    if [ ! -d "$APP_DIR" ]; then
        log "Клонирование репозитория..."
        git clone "$REPO_URL" "$APP_DIR"
    else
        log "Обновление репозитория..."
        cd "$APP_DIR"
        git fetch origin
        git reset --hard origin/main
    fi
}

# Установка зависимостей
install_dependencies() {
    log "Установка зависимостей..."

    cd "$APP_DIR"

    # API зависимости
    log "Установка зависимостей API..."
    cd "$APP_DIR/api"
    npm ci --production

    # Frontend зависимости и сборка
    log "Установка зависимостей Frontend..."
    cd "$APP_DIR/frontend"
    npm ci

    log "Сборка Frontend..."
    npm run build
}

# Сборка API
build_api() {
    log "Сборка API..."

    cd "$APP_DIR/api"
    npm run build
}

# Копирование конфигов окружения
setup_environment() {
    log "Настройка конфигурации окружения..."

    # Копирование .env файлов
    if [ "$ENVIRONMENT" = "production" ]; then
        cp "/etc/cvetov-ai/.env.production" "$APP_DIR/api/.env"
    else
        cp "/etc/cvetov-ai/.env.staging" "$APP_DIR/api/.env"
    fi

    # Проверка наличия необходимых переменных
    if [ ! -f "$APP_DIR/api/.env" ]; then
        error "Файл конфигурации .env не найден!"
    fi
}

# Настройка прав доступа
setup_permissions() {
    log "Настройка прав доступа..."

    chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"
    chmod -R 755 "$APP_DIR"

    # Создание директорий для логов
    mkdir -p "$LOG_DIR"
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "$LOG_DIR"
}

# Перезапуск сервисов
restart_services() {
    log "Перезапуск сервисов..."

    cd "$APP_DIR"

    # Остановка старых процессов
    pm2 stop ecosystem.config.js || warning "Процессы PM2 не были запущены"

    # Запуск новых процессов
    pm2 start ecosystem.config.js

    # Сохранение конфигурации PM2
    pm2 save

    log "Сервисы успешно перезапущены"
}

# Проверка здоровья приложения
health_check() {
    log "Проверка здоровья приложения..."

    sleep 5

    # Проверка API
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        log "API работает корректно"
    else
        error "API не отвечает"
    fi
}

# Очистка старых резервных копий (оставляем последние 5)
cleanup_old_backups() {
    log "Очистка старых резервных копий..."

    if [ -d "$BACKUP_DIR" ]; then
        cd "$BACKUP_DIR"
        ls -t | tail -n +6 | xargs -r rm -rf
        log "Старые резервные копии удалены"
    fi
}

# Основной процесс деплоя
main() {
    log "Начало деплоя для окружения: $ENVIRONMENT"

    check_environment
    create_backup
    pull_code
    install_dependencies
    build_api
    setup_environment
    setup_permissions
    restart_services
    health_check
    cleanup_old_backups

    log "Деплой успешно завершен!"
}

# Запуск скрипта
main "$@"