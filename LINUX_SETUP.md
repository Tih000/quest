# 🐧 Ручной запуск проекта на Linux с нуля

Полная инструкция по установке и запуску вашего full-stack приложения на Linux.

## 📋 Что нужно скачать и установить

### 1. Системные зависимости

#### Ubuntu/Debian:
```bash
# Обновление пакетов
sudo apt update && sudo apt upgrade -y

# Установка базовых пакетов
sudo apt install -y curl wget git lsof net-tools build-essential
```

#### CentOS/RHEL/Fedora:
```bash
# CentOS/RHEL
sudo yum install -y curl wget git lsof net-tools gcc gcc-c++ make

# Fedora
sudo dnf install -y curl wget git lsof net-tools gcc gcc-c++ make
```

#### Arch Linux:
```bash
sudo pacman -S --noconfirm curl wget git lsof net-tools base-devel
```

### 2. Docker (обязательно)

#### Ubuntu/Debian:
```bash
# Удаление старых версий
sudo apt remove -y docker docker-engine docker.io containerd runc

# Установка зависимостей
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Добавление GPG ключа Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Добавление репозитория Docker
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установка Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Запуск и включение Docker
sudo systemctl start docker
sudo systemctl enable docker

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER
```

#### CentOS/RHEL:
```bash
# Установка зависимостей
sudo yum install -y yum-utils

# Добавление репозитория Docker
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Установка Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Запуск и включение Docker
sudo systemctl start docker
sudo systemctl enable docker

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER
```

#### Fedora:
```bash
# Установка зависимостей
sudo dnf install -y dnf-plugins-core

# Добавление репозитория Docker
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo

# Установка Docker
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Запуск и включение Docker
sudo systemctl start docker
sudo systemctl enable docker

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER
```

### 3. Docker Compose (если не установлен с Docker)

```bash
# Скачивание Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Установка прав на выполнение
sudo chmod +x /usr/local/bin/docker-compose

# Создание символической ссылки
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
```

## 🚀 Пошаговый запуск проекта

### Шаг 1: Получение проекта

```bash
# Клонирование репозитория
git clone https://github.com/Tih000/quest.git
cd quest

# Или если у вас есть архив
# wget https://github.com/Tih000/quest/archive/main.zip
# unzip main.zip
# cd quest-main
```

### Шаг 2: Проверка установки

```bash
# Проверка Docker
docker --version
docker run hello-world

# Проверка Docker Compose
docker compose version
# или
docker-compose --version
```

### Шаг 3: Настройка прав доступа

```bash
# Если пользователь не в группе docker
sudo usermod -aG docker $USER

# Выйти и войти в систему заново, или выполнить:
newgrp docker

# Проверка прав
docker ps
```

### Шаг 4: Проверка портов

```bash
# Проверка занятых портов
sudo netstat -tulpn | grep -E ':(80|3000|5000)\s'

# Если порты заняты, остановите сервисы:
# sudo systemctl stop apache2  # для Apache
# sudo systemctl stop nginx    # для Nginx
```

### Шаг 5: Запуск приложения

#### Автоматический запуск (рекомендуется):
```bash
# Сделать скрипты исполняемыми
chmod +x install-dependencies.sh
chmod +x start.sh

# Установка зависимостей (опционально)
./install-dependencies.sh

# Запуск приложения
./start.sh
```

#### Ручной запуск:
```bash
# Создание необходимых директорий
mkdir -p backend/data

# Запуск всех сервисов
docker compose up --build -d

# Или с docker-compose (старая версия)
docker-compose up --build -d
```

### Шаг 6: Проверка работы

```bash
# Проверка статуса контейнеров
docker compose ps

# Проверка логов
docker compose logs

# Проверка здоровья сервисов
curl http://localhost/health
curl http://localhost:5000/health
curl http://localhost:3000/health
```

## 🌐 Доступ к приложению

После успешного запуска приложение будет доступно по адресам:

- **Основное приложение**: http://localhost
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API через Nginx**: http://localhost/api

## 🛠️ Управление приложением

### Просмотр логов:
```bash
# Все сервисы
docker compose logs -f

# Конкретный сервис
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f nginx
```

### Остановка:
```bash
# Остановка сервисов
docker compose down

# Остановка с удалением контейнеров
docker compose down --volumes --remove-orphans
```

### Перезапуск:
```bash
# Перезапуск всех сервисов
docker compose restart

# Перезапуск конкретного сервиса
docker compose restart backend
```

### Пересборка:
```bash
# Пересборка всех сервисов
docker compose up --build

# Пересборка конкретного сервиса
docker compose up --build backend
```

## 🔧 Структура проекта

```
quest/
├── backend/                 # Flask API
│   ├── app.py              # Основное приложение
│   ├── requirements.txt     # Python зависимости
│   ├── Dockerfile          # Docker конфигурация
│   └── data/               # Данные приложения
├── frontend/               # React приложение
│   ├── src/                # Исходный код React
│   ├── public/             # Статические файлы
│   ├── package.json        # Node.js зависимости
│   ├── server.js           # Express сервер
│   └── Dockerfile          # Docker конфигурация
├── nginx.conf              # Конфигурация Nginx
├── docker-compose.yml      # Оркестрация сервисов
├── start.sh               # Скрипт запуска
├── install-dependencies.sh # Скрипт установки зависимостей
└── README.md              # Документация
```

## 🐛 Решение проблем

### Проблема с правами Docker:
```bash
# Добавить пользователя в группу docker
sudo usermod -aG docker $USER

# Выйти и войти в систему заново
# Или выполнить:
newgrp docker
```

### Порт уже используется:
```bash
# Найти процесс, использующий порт
sudo lsof -i :80
sudo lsof -i :3000
sudo lsof -i :5000

# Остановить процесс
sudo kill -9 <PID>
```

### Проблемы с Docker:
```bash
# Перезапуск Docker
sudo systemctl restart docker

# Проверка статуса Docker
sudo systemctl status docker

# Очистка Docker
docker system prune -a
```

### Проблемы с сетью:
```bash
# Проверка сетей Docker
docker network ls

# Удаление старых сетей
docker network prune
```

## 📊 Мониторинг

### Проверка ресурсов:
```bash
# Использование ресурсов контейнерами
docker stats

# Информация о контейнерах
docker compose ps
```

### Проверка здоровья:
```bash
# Health checks
curl -f http://localhost/health
curl -f http://localhost:5000/health
curl -f http://localhost:3000/health
```

## 🚀 Продакшен настройки

### Переменные окружения:
```bash
# Создание .env файла
cat > .env << EOF
FLASK_ENV=production
SECRET_KEY=your-secret-key-here
NODE_ENV=production
REACT_APP_API_URL=https://yourdomain.com/api
EOF
```

### SSL сертификаты:
```bash
# Установка certbot для Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d yourdomain.com
```

## 📝 Полезные команды

```bash
# Просмотр всех контейнеров
docker ps -a

# Просмотр образов
docker images

# Очистка неиспользуемых ресурсов
docker system prune -a

# Просмотр логов в реальном времени
docker compose logs -f --tail=100

# Выполнение команд в контейнере
docker compose exec backend bash
docker compose exec frontend sh
```

---

**Готово!** Ваше приложение должно быть доступно по адресу http://localhost

При возникновении проблем проверьте логи: `docker compose logs -f`
