# Cvetov AI - Руководство по деплою

## Содержание
1. [Требования](#требования)
2. [Структура проекта](#структура-проекта)
3. [Первичная настройка сервера](#первичная-настройка-сервера)
4. [Настройка окружения](#настройка-окружения)
5. [Деплой](#деплой)
6. [Мониторинг](#мониторинг)
7. [Откат изменений](#откат-изменений)
8. [Устранение неполадок](#устранение-неполадок)

## Требования

### Системные требования
- Ubuntu 20.04 LTS или выше
- Минимум 2 GB RAM
- Минимум 10 GB свободного места на диске
- Доступ к серверу по SSH

### Необходимое ПО
- Node.js 18.x или выше
- npm 9.x или выше
- PM2 (процесс-менеджер)
- Nginx
- Git
- Certbot (для SSL сертификатов)

## Структура проекта

```
cvetov-ai/
├── api/                    # Backend API
│   ├── src/               # Исходный код
│   ├── dist/              # Скомпилированный код
│   └── .env               # Переменные окружения
├── frontend/              # Frontend приложение
│   ├── src/              # Исходный код
│   └── dist/             # Собранный production билд
├── scripts/              # Скрипты деплоя
│   └── deploy.sh        # Основной скрипт деплоя
├── nginx/               # Конфигурация Nginx
│   └── cvetov-ai.conf  # Конфигурация сайта
└── ecosystem.config.js  # Конфигурация PM2
```

## Первичная настройка сервера

### 1. Обновление системы
```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Установка Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. Установка PM2
```bash
sudo npm install -g pm2
pm2 startup systemd -u deploy --hp /home/deploy
```

### 4. Установка Nginx
```bash
sudo apt install -y nginx
```

### 5. Создание пользователя для деплоя
```bash
sudo adduser deploy
sudo usermod -aG sudo deploy
sudo usermod -aG www-data deploy
```

### 6. Настройка директорий
```bash
sudo mkdir -p /var/www/cvetov-ai
sudo mkdir -p /var/backups/cvetov-ai
sudo mkdir -p /var/log/cvetov-ai
sudo mkdir -p /etc/cvetov-ai

sudo chown -R deploy:deploy /var/www/cvetov-ai
sudo chown -R deploy:deploy /var/backups/cvetov-ai
sudo chown -R deploy:deploy /var/log/cvetov-ai
sudo chown -R deploy:deploy /etc/cvetov-ai
```

## Настройка окружения

### 1. Создание файлов конфигурации

Создайте файл `/etc/cvetov-ai/.env.production`:
```env
# API Server Configuration
PORT=8000
HOST=127.0.0.1
LOG_LEVEL=info

# CORS Configuration
CORS_ORIGIN=https://ai.cvetov.com

# Claude AI API
ANTHROPIC_API_KEY=ваш-ключ-anthropic

# Backend API Configuration
BACKEND_API_URL=https://api.cvetov.com
BACKEND_API_TOKEN=ваш-токен-backend
```

Для staging окружения создайте `/etc/cvetov-ai/.env.staging` с соответствующими настройками.

### 2. Настройка Nginx

Скопируйте конфигурацию:
```bash
sudo cp /var/www/cvetov-ai/nginx/cvetov-ai.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/cvetov-ai.conf /etc/nginx/sites-enabled/
```

### 3. Получение SSL сертификата
```bash
sudo certbot --nginx -d ai.cvetov.com
```

### 4. Проверка и перезапуск Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Деплой

### Автоматический деплой

Используйте готовый скрипт деплоя:
```bash
cd /var/www/cvetov-ai
chmod +x scripts/deploy.sh
sudo ./scripts/deploy.sh production
```

### Ручной деплой

1. **Получение кода из репозитория**
```bash
cd /var/www/cvetov-ai
git pull origin main
```

2. **Установка зависимостей**
```bash
# API
cd api
npm ci --production

# Frontend
cd ../frontend
npm ci
```

3. **Сборка проекта**
```bash
# API
cd ../api
npm run build

# Frontend
cd ../frontend
npm run build
```

4. **Копирование конфигурации**
```bash
cp /etc/cvetov-ai/.env.production /var/www/cvetov-ai/api/.env
```

5. **Перезапуск сервисов**
```bash
cd /var/www/cvetov-ai
pm2 restart ecosystem.config.js
pm2 save
```

## Мониторинг

### Просмотр логов PM2
```bash
# Все логи
pm2 logs

# Логи конкретного процесса
pm2 logs cvetov-ai-api

# Последние 100 строк
pm2 logs --lines 100
```

### Статус процессов
```bash
pm2 status
pm2 monit  # Интерактивный мониторинг
```

### Проверка здоровья API
```bash
curl http://localhost:8000/health
```

### Логи Nginx
```bash
# Access логи
sudo tail -f /var/log/nginx/cvetov-ai.access.log

# Error логи
sudo tail -f /var/log/nginx/cvetov-ai.error.log
```

## Откат изменений

### Быстрый откат к предыдущей версии

1. **Восстановление из резервной копии**
```bash
# Просмотр доступных резервных копий
ls -la /var/backups/cvetov-ai/

# Восстановление
sudo rm -rf /var/www/cvetov-ai
sudo cp -r /var/backups/cvetov-ai/backup-20241127-120000 /var/www/cvetov-ai
```

2. **Перезапуск сервисов**
```bash
cd /var/www/cvetov-ai
pm2 restart ecosystem.config.js
```

### Откат через Git

```bash
cd /var/www/cvetov-ai
git log --oneline -10  # Просмотр последних коммитов
git checkout <commit-hash>  # Откат к конкретному коммиту

# Пересборка и перезапуск
cd api && npm run build
cd ../frontend && npm run build
pm2 restart ecosystem.config.js
```

## Устранение неполадок

### API не отвечает

1. Проверьте статус PM2:
```bash
pm2 status
```

2. Проверьте логи:
```bash
pm2 logs cvetov-ai-api --lines 100
```

3. Проверьте порт:
```bash
sudo lsof -i :8000
```

4. Перезапустите процесс:
```bash
pm2 restart cvetov-ai-api
```

### Frontend не загружается

1. Проверьте сборку:
```bash
ls -la /var/www/cvetov-ai/frontend/dist/
```

2. Проверьте права доступа:
```bash
sudo chown -R www-data:www-data /var/www/cvetov-ai/frontend/dist
```

3. Проверьте конфигурацию Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Проблемы с памятью

1. Проверьте использование памяти:
```bash
pm2 monit
free -h
```

2. Настройте лимиты памяти в `ecosystem.config.js`:
```javascript
max_memory_restart: '500M'
```

3. Перезапустите с новыми настройками:
```bash
pm2 restart ecosystem.config.js
```

### Проблемы с SSL

1. Проверьте сертификат:
```bash
sudo certbot certificates
```

2. Обновите сертификат:
```bash
sudo certbot renew
```

3. Настройте автообновление:
```bash
sudo crontab -e
# Добавьте строку:
0 2 * * * /usr/bin/certbot renew --quiet
```

## Полезные команды

### PM2
```bash
pm2 start ecosystem.config.js    # Запуск
pm2 stop all                     # Остановка всех процессов
pm2 restart all                  # Перезапуск всех процессов
pm2 delete all                   # Удаление всех процессов
pm2 save                         # Сохранение конфигурации
pm2 startup                      # Настройка автозапуска
pm2 list                         # Список процессов
```

### Nginx
```bash
sudo nginx -t                    # Проверка конфигурации
sudo systemctl start nginx       # Запуск
sudo systemctl stop nginx        # Остановка
sudo systemctl restart nginx     # Перезапуск
sudo systemctl reload nginx      # Перезагрузка конфигурации
sudo systemctl status nginx      # Статус
```

### Системные
```bash
df -h                            # Свободное место на диске
free -h                          # Использование памяти
htop                             # Мониторинг процессов
netstat -tulpn                   # Открытые порты
journalctl -u nginx -f           # Системные логи Nginx
```

## Контакты

При возникновении проблем обращайтесь:
- GitHub Issues: https://github.com/cvetovcom/cvetov-ai/issues
- Email: support@cvetov.com

## Дополнительная документация

- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)