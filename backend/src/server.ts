// Load environment variables FIRST (before any other imports)
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { initDatabase } from './database';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import questRoutes from './routes/quests';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initDatabase();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
})); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
    'http://localhost:5500', 
    'http://127.0.0.1:5500', 
    'http://localhost:3000', 
    'http://localhost:3001',
    'http://questgo.ru',
    'https://questgo.ru'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per minute
  message: 'Слишком много запросов с этого IP, попробуйте позже.'
});
app.use('/api/', limiter);

// API Routes (ВАЖНО: до static files!)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quests', questRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    ai: process.env.GEMINI_API_KEY ? 'Gemini' : 'Fallback'
  });
});

// Backend only serves API routes
// Frontend is served by nginx from frontend container

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Ошибка:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Внутренняя ошибка сервера',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log('\n🚀 QuestGO Backend запущен!');
  console.log(`📡 API доступен на http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend доступен на http://localhost:${PORT}`);
  console.log(`🤖 AI: ${process.env.GEMINI_API_KEY ? '✅ Google Gemini настроен' : '❌ Не настроен (будут использоваться заготовленные квесты)'}`);
  console.log(`💾 Database: LowDB (JSON файл)`);
  console.log(`📁 Database path: ${process.env.DATABASE_PATH || path.join(__dirname, '../data/questgo.json')}`);
  console.log(`📁 Static files: ${path.join(__dirname, '../../')}`);
  console.log('\n💡 Документация API:');
  console.log('   POST   /api/auth/register    - Регистрация');
  console.log('   POST   /api/auth/login       - Вход');
  console.log('   GET    /api/users/me         - Профиль пользователя');
  console.log('   PUT    /api/users/me         - Обновить профиль');
  console.log('   POST   /api/quests/generate  - Сгенерировать квест (Gemini AI)');
  console.log('   GET    /api/quests/history   - История квестов');
  console.log('   POST   /api/quests/:id/complete - Завершить квест');
  console.log('   POST   /api/quests/:id/skip  - Пропустить квест\n');
});

export default app;

