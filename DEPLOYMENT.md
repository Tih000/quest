# QuestGO Deployment Guide

## Описание проекта

QuestGO - это ИИ-платформа для создания персонализированных квестов и приключений. Проект состоит из:

- **Backend**: Node.js/TypeScript API с интеграцией Google Gemini AI
- **Frontend**: HTML/CSS/JavaScript приложение
- **Nginx**: Reverse proxy и статический файловый сервер

## Требования

- Linux сервер с Docker и Docker Compose
- Минимум 2GB RAM
- 10GB свободного места на диске
- Открытые порты: 80, 3000, 3001

## Быстрое развертывание

1. **Клонируйте репозиторий:**
   ```bash
   git clone <your-repo-url>
   cd quest
   ```

2. **Настройте переменные окружения:**
   ```bash
   cp env.example .env
   nano .env
   ```
   
   Обязательно установите:
   - `GEMINI_API_KEY` - ваш API ключ от Google Gemini
   - `JWT_SECRET` - безопасный случайный ключ для JWT токенов

3. **Запустите развертывание:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

## Ручное развертывание

Если предпочитаете ручное развертывание:

```bash
# Создайте .env файл
cp env.example .env
nano .env

# Остановите существующие контейнеры
docker-compose down

# Соберите и запустите сервисы
docker-compose up --build -d

# Проверьте статус
docker-compose ps
```

## Структура проекта

```
quest/
├── backend/                 # Backend API (Node.js/TypeScript)
│   ├── src/                # Исходный код
│   ├── data/               # База данных (JSON файлы)
│   ├── package.json        # Зависимости Node.js
│   └── Dockerfile          # Docker образ для backend
├── frontend/               # Frontend приложение
│   ├── public/             # Статические файлы
│   ├── package.json        # Зависимости Node.js
│   └── Dockerfile          # Docker образ для frontend
├── nginx.conf              # Конфигурация Nginx
├── docker-compose.yml      # Docker Compose конфигурация
├── deploy.sh              # Скрипт развертывания
└── env.example            # Пример переменных окружения
```

## Переменные окружения

| Переменная | Описание | Обязательная |
|------------|----------|--------------|
| `GEMINI_API_KEY` | API ключ Google Gemini для генерации квестов | Да |
| `JWT_SECRET` | Секретный ключ для JWT токенов | Да |
| `NODE_ENV` | Окружение (production/development) | Нет |
| `CORS_ORIGIN` | Разрешенные домены для CORS | Нет |

## Доступ к приложению

После успешного развертывания приложение будет доступно по адресам:

- **Основной URL**: http://2.56.179.161
- **Локальный доступ**: http://localhost
- **API**: http://2.56.179.161/api/
- **Health check**: http://2.56.179.161/health

## Полезные команды

```bash
# Просмотр логов
docker-compose logs -f

# Просмотр логов конкретного сервиса
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# Остановка сервисов
docker-compose down

# Перезапуск сервисов
docker-compose restart

# Обновление сервисов
docker-compose pull
docker-compose up -d

# Просмотр статуса
docker-compose ps

# Вход в контейнер
docker-compose exec backend sh
docker-compose exec frontend sh
```

## Мониторинг и диагностика

### Проверка здоровья сервисов

```bash
# Backend health check
curl http://localhost:3000/api/health

# Frontend health check
curl http://localhost:3001/health

# Nginx health check
curl http://localhost/health
```

### Просмотр логов

```bash
# Все сервисы
docker-compose logs

# Только ошибки
docker-compose logs | grep -i error

# Последние 100 строк
docker-compose logs --tail=100
```

## Резервное копирование

База данных хранится в Docker volume `backend_data`. Для резервного копирования:

```bash
# Создание бэкапа
docker run --rm -v quest_backend_data:/data -v $(pwd):/backup alpine tar czf /backup/questgo-backup-$(date +%Y%m%d).tar.gz -C /data .

# Восстановление из бэкапа
docker run --rm -v quest_backend_data:/data -v $(pwd):/backup alpine tar xzf /backup/questgo-backup-YYYYMMDD.tar.gz -C /data
```

## Обновление приложения

```bash
# Остановите сервисы
docker-compose down

# Обновите код
git pull

# Пересоберите и запустите
docker-compose up --build -d
```

## Устранение неполадок

### Проблема: Сервисы не запускаются

```bash
# Проверьте логи
docker-compose logs

# Проверьте статус контейнеров
docker-compose ps

# Пересоберите образы
docker-compose build --no-cache
```

### Проблема: 502 Bad Gateway

```bash
# Проверьте, что backend запущен
curl http://localhost:3000/api/health

# Проверьте логи nginx
docker-compose logs nginx
```

### Проблема: CORS ошибки

Убедитесь, что в `.env` файле правильно настроен `CORS_ORIGIN`.

## Безопасность

- Используйте HTTPS в продакшене
- Регулярно обновляйте зависимости
- Используйте сильные пароли и секретные ключи
- Настройте файрвол для ограничения доступа к портам

## Поддержка

Если у вас возникли проблемы с развертыванием:

1. Проверьте логи: `docker-compose logs`
2. Убедитесь, что все переменные окружения настроены правильно
3. Проверьте, что порты 80, 3000, 3001 открыты
4. Убедитесь, что у вас достаточно ресурсов (RAM, диск)

Для получения помощи создайте issue в репозитории или обратитесь к разработчикам.
