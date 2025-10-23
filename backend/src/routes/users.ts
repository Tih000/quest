import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { dbHelpers } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { User } from '../types';

const router = express.Router();

/**
 * GET /api/users/me
 * Получить профиль текущего пользователя
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await dbHelpers.findUserById(req.userId!);

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Получаем статистику
    const userQuests = await dbHelpers.findUserQuests(user.id);
    const completedQuests = userQuests.filter(uq => uq.status === 'completed');
    const totalPoints = completedQuests.reduce((sum, uq) => sum + uq.points_earned, 0);

    const stats = {
      total_quests: userQuests.length,
      completed_quests: completedQuests.length,
      total_points: totalPoints
    };

    // Получаем достижения
    const userAchievements = await dbHelpers.findUserAchievements(user.id);
    const allAchievements = await dbHelpers.getAllAchievements();
    
    const achievements = userAchievements.map(ua => {
      const achievement = allAchievements.find(a => a.id === ua.achievement_id);
      return {
        code: achievement?.code,
        name: achievement?.name,
        icon: achievement?.icon,
        unlocked_at: ua.unlocked_at
      };
    });

    res.json({
      user: {
        ...user,
        interests: user.interests || []
      },
      stats,
      achievements
    });
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

/**
 * PUT /api/users/me
 * Обновить профиль текущего пользователя
 */
router.put('/me',
  authenticateToken,
  [
    body('username').matches(/^@[a-zA-Z0-9_]{3,20}$/).optional(),
    body('age').isInt({ min: 1, max: 120 }).optional(),
    body('gender').isIn(['М', 'Ж']).optional(),
    body('city').isString().optional(),
    body('interests').isArray().optional()
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, age, gender, city, interests } = req.body;

    try {
      // Проверяем, не занят ли username
      if (username) {
        const existing = await dbHelpers.findUserByUsername(username);
        if (existing && existing.id !== req.userId!) {
          return res.status(400).json({ error: 'Username уже занят' });
        }
      }

      // Обновляем профиль
      const updates: any = {};
      if (username !== undefined) updates.username = username;
      if (age !== undefined) updates.age = age;
      if (gender !== undefined) updates.gender = gender;
      if (city !== undefined) updates.city = city;
      if (interests !== undefined) updates.interests = interests;

      await dbHelpers.updateUser(req.userId!, updates);

      // Получаем обновленного пользователя
      const user = await dbHelpers.findUserById(req.userId!);

      res.json({
        success: true,
        user: {
          ...user,
          interests: user?.interests || []
        }
      });
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

/**
 * GET /api/users/stats
 * Получить детальную статистику пользователя
 */
router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userQuests = await dbHelpers.findUserQuests(req.userId!);
    
    const stats = {
      total_quests: userQuests.length,
      completed_quests: userQuests.filter(uq => uq.status === 'completed').length,
      skipped_quests: userQuests.filter(uq => uq.status === 'skipped').length,
      in_progress_quests: userQuests.filter(uq => uq.status === 'assigned').length,
      total_points: userQuests
        .filter(uq => uq.status === 'completed')
        .reduce((sum, uq) => sum + uq.points_earned, 0)
    };

    const achievementsCount = await dbHelpers.findUserAchievements(req.userId!);

    res.json({
      ...stats,
      achievements_unlocked: achievementsCount.length
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

