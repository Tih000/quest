import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import path from 'path';
import fs from 'fs';
import { DatabaseSchema, User, Quest, UserQuest, Achievement, UserAchievement } from './types';

// Типы данных импортированы из ./types

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../data/questgo.json');

// Создаем директорию для БД если её нет
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  console.log(`📁 Создаем директорию для БД: ${dbDir}`);
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`📁 Database path: ${DB_PATH}`);

// Инициализация базы данных
const adapter = new FileSync<DatabaseSchema>(DB_PATH);
const defaultData: DatabaseSchema = {
  users: [],
  quests: [],
  user_quests: [],
  achievements: [],
  user_achievements: [],
  meta: {
    nextUserId: 1,
    nextQuestId: 1,
    nextUserQuestId: 1,
    nextAchievementId: 1,
    nextUserAchievementId: 1
  }
};

export const db: any = low(adapter);

// Устанавливаем значения по умолчанию
db.defaults(defaultData).write();

export function initDatabase() {
  console.log('🗄️  Инициализация базы данных...');
  
  // Если база пустая, инициализируем
  const achievements = db.get('achievements').value();
  if (!achievements || achievements.length === 0) {
    const achievementsData = [
      { 
        code: 'novice', 
        name: 'Новичок', 
        description: 'Выполните 5 квестов', 
        icon: '🌟', 
        requirement_type: 'quest_count', 
        requirement_value: 5, 
        is_pro: 0 
      },
      { 
        code: 'seeker', 
        name: 'Искатель', 
        description: 'Выполните 20 квестов', 
        icon: '🔍', 
        requirement_type: 'quest_count', 
        requirement_value: 20, 
        is_pro: 0 
      },
      { 
        code: 'master', 
        name: 'Мастер приключений', 
        description: 'Выполните 50 квестов', 
        icon: '🏆', 
        requirement_type: 'quest_count', 
        requirement_value: 50, 
        is_pro: 0 
      },
      { 
        code: 'team_player', 
        name: 'Командный игрок', 
        description: 'Выполните 10 совместных квестов', 
        icon: '👥', 
        requirement_type: 'shared_quests', 
        requirement_value: 10, 
        is_pro: 1 
      }
    ];

    const meta = db.get('meta').value();
    achievementsData.forEach(ach => {
      db.get('achievements').push({
        id: meta.nextAchievementId++,
        ...ach,
        created_at: new Date().toISOString()
      }).write();
    });
    
    db.set('meta.nextAchievementId', meta.nextAchievementId).write();
  }

  console.log('✅ База данных инициализирована');
}

// Helper функции для работы с БД
export const dbHelpers = {
  // Users
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const meta = db.get('meta').value();
    const user: User = {
      id: meta.nextUserId,
      ...userData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.get('users').push(user).write();
    db.set('meta.nextUserId', meta.nextUserId + 1).write();
    return user;
  },

  async findUserByPhone(phone: string): Promise<User | undefined> {
    return db.get('users').find({ phone }).value();
  },

  async findUserByUsername(username: string): Promise<User | undefined> {
    return db.get('users').find({ username }).value();
  },

  async findUserById(id: number): Promise<User | undefined> {
    return db.get('users').find({ id }).value();
  },

  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    const user = db.get('users').find({ id }).value();
    if (!user) return null;
    
    const updatedUser = {
      ...user,
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    db.get('users').find({ id }).assign(updatedUser).write();
    return updatedUser;
  },

  // Quests
  async createQuest(questData: Omit<Quest, 'id' | 'created_at'>): Promise<Quest> {
    const meta = db.get('meta').value();
    const quest: Quest = {
      id: meta.nextQuestId,
      ...questData,
      created_at: new Date().toISOString()
    };
    db.get('quests').push(quest).write();
    db.set('meta.nextQuestId', meta.nextQuestId + 1).write();
    return quest;
  },

  async findQuestById(id: number): Promise<Quest | undefined> {
    return db.get('quests').find({ id }).value();
  },

  // User Quests
  async createUserQuest(data: Omit<UserQuest, 'id' | 'started_at'>): Promise<UserQuest> {
    const meta = db.get('meta').value();
    const userQuest: UserQuest = {
      id: meta.nextUserQuestId,
      ...data,
      started_at: new Date().toISOString()
    };
    db.get('user_quests').push(userQuest).write();
    db.set('meta.nextUserQuestId', meta.nextUserQuestId + 1).write();
    return userQuest;
  },

  async findUserQuests(userId: number): Promise<UserQuest[]> {
    return db.get('user_quests').filter({ user_id: userId }).value() || [];
  },

  async findUserQuestByIds(userId: number, questId: number): Promise<UserQuest | undefined> {
    const quests = db.get('user_quests')
      .filter({ user_id: userId, quest_id: questId })
      .value() || [];
    
    return quests.sort((a: UserQuest, b: UserQuest) => 
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    )[0];
  },

  async updateUserQuest(id: number, updates: Partial<UserQuest>): Promise<UserQuest | null> {
    const userQuest = db.get('user_quests').find({ id }).value();
    if (!userQuest) return null;
    
    const updatedUserQuest = {
      ...userQuest,
      ...updates
    };
    
    db.get('user_quests').find({ id }).assign(updatedUserQuest).write();
    return updatedUserQuest;
  },

  async countCompletedQuests(userId: number): Promise<number> {
    return db.get('user_quests')
      .filter({ user_id: userId, status: 'completed' })
      .size()
      .value();
  },

  // Achievements
  async getAllAchievements(): Promise<Achievement[]> {
    return db.get('achievements').value() || [];
  },

  async createUserAchievement(userId: number, achievementId: number): Promise<UserAchievement> {
    const meta = db.get('meta').value();
    const userAchievement: UserAchievement = {
      id: meta.nextUserAchievementId,
      user_id: userId,
      achievement_id: achievementId,
      unlocked_at: new Date().toISOString()
    };
    db.get('user_achievements').push(userAchievement).write();
    db.set('meta.nextUserAchievementId', meta.nextUserAchievementId + 1).write();
    return userAchievement;
  },

  async findUserAchievements(userId: number): Promise<UserAchievement[]> {
    return db.get('user_achievements').filter({ user_id: userId }).value() || [];
  },

  async hasUserAchievement(userId: number, achievementId: number): Promise<boolean> {
    return db.get('user_achievements')
      .find({ user_id: userId, achievement_id: achievementId })
      .value() !== undefined;
  }
};

export default db;

