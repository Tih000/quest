# Full-Stack Application Deployment

Система развертывания с бэкендом, фронтендом и nginx, основанная на репозитории [artemonsh/deploy-frontend-backend](https://github.com/artemonsh/deploy-frontend-backend).

## 🏗️ Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │    Frontend     │    │    Backend      │
│   (Port 80)     │◄──►│   (Port 3000)   │    │   (Port 5000)   │
│   Reverse Proxy │    │   React App     │    │   Flask API     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Быстрый старт

### Предварительные требования

- Docker
- Docker Compose (или Docker Compose V2)

### Запуск приложения

#### Linux/macOS:
```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd quest

# Установите зависимости (рекомендуется)
chmod +x install-dependencies.sh
./install-dependencies.sh

# Сделайте скрипт исполняемым
chmod +x start.sh

# Запустите приложение
./start.sh
```

#### Windows:
```bash
# Клонируйте репозиторий
git clone <your-repo-url>
cd quest

# Запустите все сервисы
docker compose up --build
```

#### Ручной запуск:
```bash
# Запустите все сервисы
docker compose up --build

# Или с docker-compose (старая версия)
docker-compose up --build
```

Приложение будет доступно по адресу: `http://localhost`

## 📁 Структура проекта

```
quest/
├── backend/                 # Flask API
│   ├── app.py              # Основное приложение
│   ├── requirements.txt     # Python зависимости
│   └── Dockerfile          # Docker конфигурация
├── frontend/               # React приложение
│   ├── src/                # Исходный код React
│   ├── public/             # Статические файлы
│   ├── package.json        # Node.js зависимости
│   ├── server.js           # Express сервер
│   └── Dockerfile          # Docker конфигурация
├── nginx.conf              # Конфигурация Nginx
├── nginx_subdomain.conf    # Конфигурация для поддоменов
├── docker-compose.yml      # Оркестрация сервисов
├── start.sh               # Скрипт запуска для Linux
├── install-dependencies.sh # Скрипт установки зависимостей
├── .gitignore             # Исключения для Git
└── README.md              # Документация
```

## 🔧 Конфигурация сервисов

### Backend (Flask)
- **Порт**: 5000
- **Технологии**: Python 3.11, Flask, Gunicorn
- **API эндпоинты**:
  - `GET /` - Главная страница
  - `GET /health` - Проверка здоровья
  - `GET /api/users` - Получить пользователей
  - `POST /api/users` - Создать пользователя
  - `GET /api/status` - Статус сервиса

### Frontend (React)
- **Порт**: 3000
- **Технологии**: React 18, Express, Axios
- **Функции**: Управление пользователями, API интеграция

### Nginx
- **Порт**: 80
- **Функции**: Reverse proxy, статические файлы, CORS
- **Маршрутизация**:
  - `/` → Frontend (React)
  - `/api/` → Backend (Flask)

## 🌐 Поддомены (nginx_subdomain.conf)

### Основной домен
- `example.com` - Frontend приложение
- `api.example.com` - Backend API
- `admin.example.com` - Админ панель

### Настройка для продакшена

1. Замените `example.com` на ваш домен в `nginx_subdomain.conf`
2. Настройте DNS записи для поддоменов
3. Используйте SSL сертификаты для HTTPS

## 🛠️ Разработка

### Скрипты для Linux

#### install-dependencies.sh
Автоматически устанавливает все необходимые зависимости:
```bash
chmod +x install-dependencies.sh
./install-dependencies.sh
```

**Что делает скрипт:**
- Определяет дистрибутив Linux
- Устанавливает необходимые пакеты (curl, wget, git, lsof, net-tools)
- Проверяет установку Docker и Docker Compose
- Добавляет пользователя в группу docker
- Проверяет права доступа

#### start.sh
Запускает приложение с проверками:
```bash
chmod +x start.sh
./start.sh
```

**Что делает скрипт:**
- Проверяет установку Docker и Docker Compose
- Проверяет наличие системных пакетов
- Проверяет права доступа к Docker
- Проверяет доступность портов (80, 3000, 5000)
- Создает необходимые директории
- Запускает сервисы
- Проверяет здоровье сервисов
- Открывает браузер

### Локальная разработка

#### Linux/macOS:
```bash
# Автоматический запуск с проверками
./start.sh

# Или ручной запуск
docker compose up --build

# Просмотр логов
docker compose logs -f

# Остановка сервисов
docker compose down
```

#### Windows:
```bash
# Запуск в режиме разработки
docker compose up --build

# Просмотр логов
docker compose logs -f

# Остановка сервисов
docker compose down
```

### Пересборка отдельных сервисов

```bash
# Пересборка только backend
docker compose up --build backend

# Пересборка только frontend
docker compose up --build frontend
```

## 📊 Мониторинг

### Health Checks
- Frontend: `http://localhost/health`
- Backend: `http://localhost/api/health`

### Логи
```bash
# Все сервисы
docker compose logs

# Конкретный сервис
docker compose logs backend
docker compose logs frontend
docker compose logs nginx
```

## 🔒 Безопасность

- CORS настроен для API
- Security headers в Nginx
- Rate limiting для API
- Non-root пользователи в контейнерах

## 🚀 Продакшен

### Переменные окружения

Создайте `.env` файл:

```env
# Backend
FLASK_ENV=production
SECRET_KEY=your-secret-key

# Frontend
NODE_ENV=production
REACT_APP_API_URL=https://api.yourdomain.com
```

### Оптимизация

```bash
# Продакшен сборка
docker compose -f docker-compose.prod.yml up --build
```

## 📝 API Документация

### Пользователи

#### Получить всех пользователей
```http
GET /api/users
```

#### Создать пользователя
```http
POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch
3. Внесите изменения
4. Создайте Pull Request

## 📄 Лицензия

MIT License

## 🐧 Требования для Linux

### Установка Docker на Linux

#### Ubuntu/Debian:
```bash
# Обновление пакетов
sudo apt update

# Установка зависимостей
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Добавление GPG ключа Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Добавление репозитория Docker
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установка Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER

# Перезагрузка для применения изменений
sudo reboot
```

#### CentOS/RHEL/Fedora:
```bash
# Установка зависимостей
sudo yum install -y yum-utils

# Добавление репозитория Docker
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Установка Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io

# Запуск и включение Docker
sudo systemctl start docker
sudo systemctl enable docker

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER
```

### Установка Docker Compose

```bash
# Скачивание Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Установка прав на выполнение
sudo chmod +x /usr/local/bin/docker-compose

# Проверка установки
docker-compose --version
```

### Проверка установки

```bash
# Проверка Docker
docker --version
docker run hello-world

# Проверка Docker Compose
docker-compose --version
```

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте логи: `docker compose logs`
2. Убедитесь, что порты 80, 3000, 5000 свободны
3. Проверьте Docker и Docker Compose версии
4. На Linux убедитесь, что пользователь в группе docker: `groups $USER`
5. Если проблемы с правами: `sudo chown -R $USER:$USER .`

### Частые проблемы Linux:

- **Permission denied**: Добавьте пользователя в группу docker и перезайдите
- **Port already in use**: Остановите Apache/Nginx: `sudo systemctl stop apache2` или `sudo systemctl stop nginx`
- **Docker not found**: Убедитесь, что Docker установлен и запущен: `sudo systemctl status docker`

---

**Основано на**: [artemonsh/deploy-frontend-backend](https://github.com/artemonsh/deploy-frontend-backend)#   q u e s t  
 #   q u e s t  
 #   q u e s t  
 