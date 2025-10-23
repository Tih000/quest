import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { dbHelpers } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { generateQuest } from '../services/gemini';
import { Quest } from '../types';

const router = express.Router();

/**
 * POST /api/quests/generate
 * Генерация нового квеста с помощью AI (Gemini)
 */
router.post('/generate', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Получаем профиль пользователя для персонализации
    const user = await dbHelpers.findUserById(req.userId!);

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const interests = user.interests || [];
    
    // Генерируем квест с помощью Gemini AI
    const quest = await generateQuest({
      city: user.city || 'Москва',
      interests,
      isPro: user.is_pro === 1
    });

    // Сохраняем квест в базу
    const savedQuest = await dbHelpers.createQuest({
      title: quest.title,
      description: quest.description,
      tasks: quest.tasks,
      reward: quest.reward,
      category: quest.category || 'приключения',
      difficulty: quest.difficulty || 'medium',
      is_pro: user.is_pro ? 1 : 0,
      estimated_time: quest.estimated_time || 60,
      created_by_ai: 1
    });

    // Создаем связь пользователь-квест
    await dbHelpers.createUserQuest({
      user_id: req.userId!,
      quest_id: savedQuest.id,
      status: 'assigned',
      points_earned: 0
    });

    res.json({
      success: true,
      quest: {
        id: savedQuest.id,
        ...quest
      }
    });
  } catch (error: any) {
    console.error('Ошибка генерации квеста:', error);
    // Даже если произошла критическая ошибка, пытаемся вернуть заготовленный квест
    try {
      const fallbackQuest = {
        title: 'Специальный квест дня',
        description: 'Сегодня что-то пошло не так с AI, но у нас есть отличный квест для вас!',
        tasks: [
          'Найдите самое красивое место в вашем городе',
          'Сделайте фото и поделитесь в соцсетях',
          'Познакомьтесь с новым человеком'
        ],
        reward: 'Отличное настроение и новые впечатления!',
        category: 'приключения',
        difficulty: 'easy',
        estimated_time: 60
      };
      
      res.json({
        success: true,
        quest: fallbackQuest
      });
    } catch (fallbackError) {
      res.status(500).json({ 
        error: 'Временные проблемы с генерацией квестов. Попробуйте позже.',
        details: error.message 
      });
    }
  }
});

/**
 * GET /api/quests/history
 * История квестов пользователя
 */
router.get('/history', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userQuests = await dbHelpers.findUserQuests(req.userId!);
    
    // Получаем полную информацию о квестах
    const history = await Promise.all(
      userQuests.map(async (uq) => {
        const quest = await dbHelpers.findQuestById(uq.quest_id);
        return {
          user_quest_id: uq.id,
          status: uq.status,
          started_at: uq.started_at,
          completed_at: uq.completed_at,
          points_earned: uq.points_earned,
          quest_id: quest?.id,
          title: quest?.title,
          description: quest?.description,
          tasks: quest?.tasks,
          reward: quest?.reward,
          category: quest?.category,
          difficulty: quest?.difficulty
        };
      })
    );

    // Сортируем по дате (новые первые)
    history.sort((a, b) => 
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );

    res.json({
      history: history.slice(0, 50) // Последние 50
    });
  } catch (error) {
    console.error('Ошибка получения истории:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

/**
 * GET /api/quests/:id
 * Получить конкретный квест
 */
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const questId = parseInt(req.params.id);
    const quest = await dbHelpers.findQuestById(questId);

    if (!quest) {
      return res.status(404).json({ error: 'Квест не найден' });
    }

    const userQuest = await dbHelpers.findUserQuestByIds(req.userId!, questId);

    res.json({
      quest: {
        ...quest,
        status: userQuest?.status,
        started_at: userQuest?.started_at,
        completed_at: userQuest?.completed_at,
        points_earned: userQuest?.points_earned
      }
    });
  } catch (error) {
    console.error('Ошибка получения квеста:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

/**
 * POST /api/quests/:id/complete
 * Отметить квест как выполненный
 */
router.post('/:id/complete', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const questId = parseInt(req.params.id);

    // Проверяем, что квест существует и назначен пользователю
    const userQuest = await dbHelpers.findUserQuestByIds(req.userId!, questId);

    if (!userQuest || userQuest.status === 'completed') {
      return res.status(404).json({ error: 'Квест не найден или уже выполнен' });
    }

    // Обновляем статус
    const points = 100; // Базовые очки за квест
    await dbHelpers.updateUserQuest(userQuest.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      points_earned: points
    });

    // Проверяем достижения
    await checkAndUnlockAchievements(req.userId!);

    res.json({
      success: true,
      message: 'Квест выполнен!',
      points_earned: points
    });
  } catch (error) {
    console.error('Ошибка завершения квеста:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

/**
 * POST /api/quests/:id/skip
 * Пропустить квест
 */
router.post('/:id/skip', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const questId = parseInt(req.params.id);

    const userQuest = await dbHelpers.findUserQuestByIds(req.userId!, questId);

    if (!userQuest || userQuest.status !== 'assigned') {
      return res.status(404).json({ error: 'Квест не найден' });
    }

    await dbHelpers.updateUserQuest(userQuest.id, {
      status: 'skipped',
      skipped_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Квест пропущен'
    });
  } catch (error) {
    console.error('Ошибка пропуска квеста:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

/**
 * GET /api/quests/categories
 * Получить список категорий
 */
router.get('/categories', (req, res: Response) => {
  const categories = [
    { id: 'food', name: 'Еда', icon: '🍔' },
    { id: 'sport', name: 'Спорт', icon: '⚽' },
    { id: 'art', name: 'Искусство', icon: '🎨' },
    { id: 'travel', name: 'Путешествия', icon: '✈️' },
    { id: 'photo', name: 'Фото', icon: '📸' },
    { id: 'communication', name: 'Общение', icon: '💬' },
    { id: 'kindness', name: 'Доброта', icon: '💚' },
    { id: 'adventure', name: 'Приключения', icon: '🗺️' }
  ];

  res.json({ categories });
});

// Вспомогательная функция для проверки достижений
async function checkAndUnlockAchievements(userId: number) {
  try {
    // Получаем количество выполненных квестов
    const completedCount = await dbHelpers.countCompletedQuests(userId);

    // Получаем все достижения
    const achievements = await dbHelpers.getAllAchievements();

    // Проверяем каждое достижение
    for (const achievement of achievements) {
      if (achievement.requirement_type === 'quest_count' && 
          completedCount >= achievement.requirement_value) {
        
        // Проверяем, не разблокировано ли уже
        const hasAchievement = await dbHelpers.hasUserAchievement(userId, achievement.id);

        if (!hasAchievement) {
          // Разблокируем достижение
          await dbHelpers.createUserAchievement(userId, achievement.id);
          console.log(`✨ Пользователь ${userId} разблокировал достижение: ${achievement.code}`);
        }
      }
    }
  } catch (error) {
    console.error('Ошибка проверки достижений:', error);
  }
}

export default router;

