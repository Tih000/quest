import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { QuestGeneration } from '../types';

// Загружаем переменные окружения
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log('🔑 GEMINI_API_KEY загружен:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : '❌ ПУСТОЙ');

if (!GEMINI_API_KEY) {
  console.warn('⚠️  ВНИМАНИЕ: GEMINI_API_KEY не установлен. AI генерация будет недоступна.');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

interface QuestParams {
  city: string;
  interests: string[];
  isPro: boolean;
}

const QUEST_PROMPT = `Задача: Сгенерируй уникальный квест для пользователя.
Квест должен быть интересным, выполнимым за 1 день и мотивировать человека выйти из дома, пообщаться, попробовать что-то новое или испытать эмоции.

Формат вывода строго в JSON:
{
  "title": "Название квеста — короткое, запоминающееся, атмосферное",
  "description": "2–3 предложения, которые интригуют и создают настроение",
  "tasks": ["Задание 1", "Задание 2", "Задание 3"],
  "reward": "Эмоциональное завершение или предложение сделать фото/видео-отчет",
  "category": "одна из: еда, спорт, искусство, путешествия, фото, общение, доброта, приключения",
  "difficulty": "easy, medium или hard",
  "estimatedTime": "время в минутах (число)"
}

Требования:
- Место действия — {{city}}.
- Квест должен подходить для одного человека, но при желании быть интересным и для компании.
- Не использовать сложные или платные действия (например, покупать билеты в театр).
- Использовать реальные локации {{city}} (парки, районы, набережные, станции метро, знаковые места).
- Сохранять легкий, мотивационный и дружелюбный тон.
- Примеры тональности: вдохновляющий, креативный, приключенческий, иногда с ноткой романтики или саморазвития.
- Задания должны быть списком из 2-3 конкретных шагов (понятных, выполнимых, без привязки к конкретному времени).
{{interests}}
{{pro}}

Важно: Квест не должен быть скучным или слишком сложным. В нём должна быть «эмоция» — чувство приключения, открытия, свободы или общения.

ОТВЕТ ДОЛЖЕН БЫТЬ ТОЛЬКО ВАЛИДНЫМ JSON, БЕЗ ДОПОЛНИТЕЛЬНОГО ТЕКСТА И БЕЗ MARKDOWN ФОРМАТИРОВАНИЯ.`;

/**
 * Генерация квеста с помощью Google Gemini AI
 * ВАЖНО: Эта функция никогда не выбрасывает ошибки, всегда возвращает квест
 */
export async function generateQuest(params: QuestParams): Promise<QuestGeneration> {
  const { city, interests, isPro } = params;
  
  try {

    // Формируем промпт
    let prompt = QUEST_PROMPT.replace(/\{\{city\}\}/g, city);
    
    if (interests && interests.length > 0) {
      prompt = prompt.replace('{{interests}}', `- Учитывай интересы пользователя: ${interests.join(', ')}.`);
    } else {
      prompt = prompt.replace('{{interests}}', '');
    }

    if (isPro) {
      prompt = prompt.replace('{{pro}}', '- Это PRO пользователь, сделай квест более сложным и креативным с элементом VIP.');
    } else {
      prompt = prompt.replace('{{pro}}', '');
    }

    // Если нет API ключа, возвращаем заготовленный квест
    if (!genAI) {
      console.log('🤖 Генерация квеста без AI (нет API ключа)');
      return getFallbackQuest(city, isPro);
    }

  // Попытки генерации с задержкой
  const maxAttempts = 4; // 4 попытки за 20 секунд
  const delayBetweenAttempts = 1000; // 1 секунда между попытками
  const startTime = Date.now();
  const maxWaitTime = 20000; // 20 секунд максимум

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Проверяем, не превышено ли время ожидания
    if (Date.now() - startTime > maxWaitTime) {
      console.log(`⏰ Превышено время ожидания (20 сек), переходим к заготовленным квестам`);
      break;
    }

    try {
      console.log(`🤖 [${new Date().toISOString()}] Попытка генерации квеста ${attempt}/${maxAttempts} через Google Gemini...`);
      
      // Используем Gemini 2.0 Flash Experimental - быстрая и бесплатная модель
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.9, // Высокая креативность
          maxOutputTokens: 500,
          responseMimeType: 'application/json', // Требуем JSON ответ
        }
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      if (!text) {
        throw new Error('Пустой ответ от Gemini');
      }

      // Парсим JSON
      let quest: QuestGeneration;
      try {
        // Убираем markdown форматирование если оно есть
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        quest = JSON.parse(cleanText);
      } catch (parseError) {
        console.error('Ошибка парсинга JSON:', text);
        throw new Error('Некорректный формат ответа от AI');
      }
      
      // Валидация ответа
      if (!quest.title || !quest.description || !quest.tasks || !Array.isArray(quest.tasks)) {
        throw new Error('Некорректный формат ответа от AI');
      }

      console.log(`✅ Квест сгенерирован с попытки ${attempt}: "${quest.title}"`);
      
      return quest;
      
    } catch (error: any) {
      const isServiceUnavailable = error.message.includes('503') || 
                                  error.message.includes('Service Unavailable') ||
                                  error.message.includes('overloaded');
      
      if (isServiceUnavailable) {
        console.log(`⚠️  [${new Date().toISOString()}] Сервис Gemini перегружен (попытка ${attempt}/${maxAttempts}): ${error.message}`);
      } else {
        console.error(`❌ [${new Date().toISOString()}] Ошибка генерации квеста через Gemini (попытка ${attempt}):`, error.message);
      }
      
      // Если это не последняя попытка, ждем перед следующей попыткой
      if (attempt < maxAttempts && Date.now() - startTime + delayBetweenAttempts <= maxWaitTime) {
        console.log(`⏳ [${new Date().toISOString()}] Ждем ${delayBetweenAttempts/1000} секунд перед следующей попыткой...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts));
        continue;
      } else {
        console.log(`🔄 Попытка ${attempt} не удалась, ${attempt === maxAttempts ? 'все попытки исчерпаны' : 'время истекло'}`);
      }
    }
  }

    console.log('🔄 Все попытки исчерпаны, используем заготовленные квесты');
    return getFallbackQuest(city, isPro);
    
  } catch (error: any) {
    // Абсолютно безопасный fallback - никогда не выбрасываем ошибки
    console.error('🚨 Критическая ошибка в generateQuest, используем заготовленный квест:', error.message);
    return getFallbackQuest(params.city, params.isPro);
  }
}

/**
 * Заготовленные квесты на случай ошибки API
 */
function getFallbackQuest(city: string, isPro: boolean): QuestGeneration {
  const fallbackQuests: QuestGeneration[] = [
    {
      title: 'Фиолетовая охота',
      description: 'Сегодня твой любимый цвет — фиолетовый! Докажи это городу.',
      tasks: [
        'Найди и сфотографируй что-то фиолетовое в радиусе 100 метров от твоего дома',
        'Купи что-нибудь фиолетовое (мороженое, цветок, открытку)',
        'Найди человека в фиолетовой одежде и попроси сделать совместное селфи',
        'Сделай фото заката с фиолетовыми оттенками',
        'Поделись лучшим фиолетовым фото в соцсетях с хештегом #QuestGO'
      ],
      reward: 'Отправь коллаж из всех фиолетовых находок и почувствуй себя настоящим охотником за цветом!',
      category: 'фото',
      difficulty: 'easy',
      estimated_time: 60
    },
    {
      title: 'Кофейный детектив',
      description: 'Стань экспертом по кофейням своего района за один день!',
      tasks: [
        `Найди 3 кофейни в радиусе 1 км от тебя в ${city}`,
        'Закажи в каждой разный напиток (капучино, латте, раф)',
        'Спроси бариста о самом необычном заказе дня',
        'Сфотографируй самую красивую подачу кофе',
        'Оставь позитивный отзыв в любимой кофейне'
      ],
      reward: 'Теперь ты знаешь, где варят лучший кофе в твоем районе!',
      category: 'еда',
      difficulty: 'medium',
      estimated_time: 120
    },
    {
      title: 'Случайная доброта',
      description: 'Сегодня ты — тайный супергерой доброты. Никто не должен знать!',
      tasks: [
        'Купи кофе для незнакомца и уйди, не дожидаясь благодарности',
        'Оставь записку с комплиментом на чьей-то машине',
        'Помоги кому-то донести тяжелые сумки',
        'Оставь книгу на скамейке с запиской "Возьми меня"',
        'Накорми бездомное животное'
      ],
      reward: 'Запиши, как ты себя чувствуешь после этих добрых дел. Это твоя суперсила!',
      category: 'доброта',
      difficulty: 'medium',
      estimated_time: 90
    }
  ];

  const proQuests: QuestGeneration[] = [
    {
      title: 'VIP: Гастрономическое приключение',
      description: 'Сегодня ты — критик Мишлен. Испытай 5 разных кухонь мира!',
      tasks: [
        `Посети 5 заведений разных кухонь в ${city} (итальянская, японская, грузинская, индийская, французская)`,
        'Закажи в каждом самое популярное блюдо',
        'Веди дневник вкусов: описывай каждое блюдо одним словом',
        'Сделай эстетичное фото каждого блюда',
        'Составь свой топ-3 и поделись в stories'
      ],
      reward: 'Создай свою карту гастрономических открытий города!',
      category: 'еда',
      difficulty: 'hard',
      estimated_time: 240
    },
    {
      title: 'VIP: Фотосессия в стиле 80-х',
      description: 'Превратись в звезду ретро-эпохи на один день!',
      tasks: [
        'Найди винтажную одежду в стиле 80-х (комиссионки, гардероб родителей)',
        'Создай образ с яркими аксессуарами',
        `Найди локации в ${city} в стиле 80-х (старые здания, советская архитектура)`,
        'Устрой фотосессию с друзьями или прохожими',
        'Создай ретро-коллаж и выложи с музыкой 80-х'
      ],
      reward: 'Машина времени готова! Сохрани эти фото как память о путешествии в прошлое.',
      category: 'фото',
      difficulty: 'hard',
      estimated_time: 180
    }
  ];

  const questsPool = isPro ? [...fallbackQuests, ...proQuests] : fallbackQuests;
  const randomQuest = questsPool[Math.floor(Math.random() * questsPool.length)];
  
  return {
    ...randomQuest,
    description: randomQuest.description.replace(/Москва/g, city)
  };
}

export default {
  generateQuest
};

