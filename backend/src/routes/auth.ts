import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { dbHelpers } from '../database';
import { generateToken } from '../middleware/auth';
import { User } from '../types';

const router = express.Router();

// Для демо - упрощенная регистрация/вход (без реального SMS)
// В production здесь должна быть интеграция с SMS-сервисом

/**
 * POST /api/auth/register
 * Регистрация нового пользователя
 */
router.post('/register',
  [
    body('phone').matches(/^\+?[0-9]{10,15}$/).withMessage('Некорректный номер телефона'),
    body('username').matches(/^@[a-zA-Z0-9_]{3,20}$/).withMessage('Username должен начинаться с @ и содержать 3-20 символов'),
    body('age').isInt({ min: 1, max: 120 }).optional(),
    body('gender').isIn(['М', 'Ж']).optional(),
    body('city').isString().optional(),
    body('interests').isArray().optional()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, username, age, gender, city, interests } = req.body;

    try {
      // Проверяем, существует ли пользователь
      const existingByPhone = await dbHelpers.findUserByPhone(phone);
      const existingByUsername = await dbHelpers.findUserByUsername(username);
      
      if (existingByPhone || existingByUsername) {
        return res.status(400).json({ error: 'Пользователь с таким телефоном или username уже существует' });
      }

      // Создаем пользователя
      const user = await dbHelpers.createUser({
        phone,
        username,
        age,
        gender,
        city,
        interests,
        is_pro: 0,
        last_login_at: new Date().toISOString()
      });

      // Генерируем токен
      const token = generateToken(user.id);

      res.status(201).json({
        success: true,
        message: 'Регистрация успешна',
        user: {
          ...user,
          interests: user.interests || []
        },
        token
      });
    } catch (error: any) {
      console.error('Ошибка регистрации:', error);
      res.status(500).json({ error: 'Ошибка сервера при регистрации' });
    }
  }
);

/**
 * POST /api/auth/login
 * Вход существующего пользователя
 */
router.post('/login',
  [
    body('phone').matches(/^\+?[0-9]{10,15}$/).withMessage('Некорректный номер телефона')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone } = req.body;

    try {
      const user = await dbHelpers.findUserByPhone(phone);

      if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      // Обновляем время последнего входа
      await dbHelpers.updateUser(user.id, {
        last_login_at: new Date().toISOString()
      });

      // Генерируем токен
      const token = generateToken(user.id);

      res.json({
        success: true,
        message: 'Вход выполнен успешно',
        user: {
          ...user,
          interests: user.interests || []
        },
        token
      });
    } catch (error: any) {
      console.error('Ошибка входа:', error);
      res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
  }
);

/**
 * POST /api/auth/verify
 * Проверка токена (для поддержки текущего frontend)
 */
router.post('/verify', async (req: Request, res: Response) => {
  // Для демо просто возвращаем успех
  // В production здесь должна быть проверка SMS кода
  res.json({
    success: true,
    message: 'Код подтвержден (демо)'
  });
});

export default router;

