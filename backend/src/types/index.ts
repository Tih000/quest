// Общие типы для приложения QuestGO

export interface User {
  id: number;
  phone: string;
  username: string;
  age?: number;
  gender?: string;
  city?: string;
  interests?: string[];
  avatar_url?: string;
  is_pro: number;
  pro_expires_at?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface Quest {
  id: number;
  title: string;
  description: string;
  tasks: string[];
  reward: string;
  category: string;
  difficulty: string;
  is_pro: number;
  estimated_time?: number;
  created_by_ai: number;
  created_at: string;
}

export interface QuestGeneration {
  title: string;
  description: string;
  tasks: string[];
  reward: string;
  category?: string;
  difficulty?: string;
  estimated_time?: number;
}

export interface UserQuest {
  id: number;
  user_id: number;
  quest_id: number;
  status: string;
  started_at: string;
  completed_at?: string;
  skipped_at?: string;
  photo_url?: string;
  points_earned: number;
}

export interface Achievement {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  is_pro: number;
  created_at: string;
}

export interface UserAchievement {
  id: number;
  user_id: number;
  achievement_id: number;
  unlocked_at: string;
}

export interface DatabaseSchema {
  users: User[];
  quests: Quest[];
  user_quests: UserQuest[];
  achievements: Achievement[];
  user_achievements: UserAchievement[];
  meta: {
    nextUserId: number;
    nextQuestId: number;
    nextUserQuestId: number;
    nextAchievementId: number;
    nextUserAchievementId: number;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  token: string;
}

export interface QuestResponse {
  success: boolean;
  quest: Quest;
}

export interface UserStats {
  total_quests: number;
  completed_quests: number;
  total_points: number;
  achievements_unlocked: number;
}
