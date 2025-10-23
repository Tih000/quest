# QuestGO - ИИ-квесты приложение

QuestGO - это инновационная платформа для создания персонализированных квестов с использованием искусственного интеллекта Google Gemini. Приложение позволяет пользователям генерировать уникальные приключения, адаптированные под их интересы и предпочтения.

## 🚀 Возможности

- **ИИ-генерация квестов** с использованием Google Gemini 2.5
- **Персонализация** под интересы пользователя
- **Система достижений** и прогресса
- **Совместные квесты** с друзьями (PRO версия)
- **Современный интерфейс** с адаптивным дизайном
- **Мобильная оптимизация**

## 🏗️ Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │    Frontend     │    │    Backend      │
│   (Port 80)     │◄──►│   (Port 3001)   │    │   (Port 3000)   │
│   Reverse Proxy │    │   Static Files  │    │   Node.js API   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

- **Backend**: Node.js/TypeScript API с Express
- **Frontend**: HTML/CSS/JavaScript SPA
- **Database**: LowDB (JSON файлы)
- **AI Integration**: Google Gemini API
- **Reverse Proxy**: Nginx

## 📦 Быстрое развертывание

### Требования

- Linux сервер с Docker и Docker Compose
- Минимум 2GB RAM
- 10GB свободного места
- Открытые порты: 80, 3000, 3001

### Установка

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
   
   Установите обязательные переменные:
   - `GEMINI_API_KEY` - ваш API ключ от Google Gemini
   - `JWT_SECRET` - безопасный ключ для JWT токенов

3. **Запустите развертывание:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

## 🌐 Доступ к приложению

После развертывания приложение будет доступно по адресам:

- **Основной URL**: https://questgo.ru
- **API**: https://questgo.ru/api/
- **Health Check**: https://questgo.ru/health

### Настройка HTTPS

Для настройки SSL сертификата выполните:

```bash
# Настройка SSL для questgo.ru
chmod +x setup-ssl.sh
./setup-ssl.sh
```

## 📁 Структура проекта

```
quest/
├── backend/                 # Backend API (Node.js/TypeScript)
│   ├── src/                # Исходный код
│   │   ├── routes/         # API маршруты
│   │   ├── services/       # Сервисы (Gemini AI)
│   │   ├── middleware/     # Middleware
│   │   └── types/          # TypeScript типы
│   ├── data/               # База данных (JSON)
│   └── package.json        # Зависимости
├── frontend/               # Frontend приложение
│   ├── public/             # Статические файлы
│   │   ├── index.html      # Главная страница
│   │   ├── styles.css      # Стили
│   │   ├── script.js       # JavaScript логика
│   │   └── config.js       # API конфигурация
│   └── package.json        # Зависимости
├── nginx.conf              # Конфигурация Nginx
├── docker-compose.yml      # Docker Compose
├── deploy.sh              # Скрипт развертывания
└── DEPLOYMENT.md          # Подробное руководство
```

## 🔧 Разработка

### Локальная разработка

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Docker разработка

```bash
# Запуск в режиме разработки
docker-compose up --build

# Пересборка после изменений
docker-compose up --build
```

## 📊 API Документация

### Основные эндпоинты

- `POST /api/auth/register` - Регистрация пользователя
- `POST /api/auth/login` - Вход в систему
- `GET /api/users/me` - Профиль пользователя
- `POST /api/quests/generate` - Генерация квеста
- `GET /api/quests/history` - История квестов
- `POST /api/quests/:id/complete` - Завершение квеста

### Примеры запросов

```javascript
// Регистрация
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+7XXXXXXXXXX',
    username: '@username',
    age: 25,
    gender: 'М',
    city: 'Москва',
    interests: ['еда', 'спорт']
  })
});

// Генерация квеста
const quest = await fetch('/api/quests/generate', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});
```

## 🔒 Безопасность

- JWT токены для аутентификации
- Rate limiting для API
- CORS настройки
- Helmet для безопасности заголовков
- Валидация входных данных

## 🚀 Производственное развертывание

Подробное руководство по развертыванию на Linux сервере смотрите в [DEPLOYMENT.md](DEPLOYMENT.md).

## 📈 Мониторинг

```bash
# Просмотр логов
docker-compose logs -f

# Проверка здоровья
curl http://localhost/api/health

# Статистика контейнеров
docker-compose ps
```

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch
3. Внесите изменения
4. Создайте Pull Request

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE)

## 🆘 Поддержка

Если у вас возникли проблемы:

1. Проверьте [DEPLOYMENT.md](DEPLOYMENT.md) для решения проблем
2. Создайте issue в репозитории
3. Обратитесь к разработчикам

## 🔮 Roadmap

- [ ] Мобильное приложение
- [ ] Интеграция с картами
- [ ] Система рейтингов
- [ ] Многоязычность
- [ ] Платежная система