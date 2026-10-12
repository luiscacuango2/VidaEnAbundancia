// src/types/database.ts

export interface Volume {
  id: string;
  order_number: number;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  volume_id: string;
  order_number: number;
  title: string;
  content: string | null;
  memory_verse: string | null;
  bible_reading: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  question: string;
  question_type: 'multiple_choice' | 'true_false' | 'fill_in_blank';
  explanation: string | null;
  order_number: number;
}

export interface QuizOption {
  id: string;
  quiz_id: string;
  option_text: string;
  is_correct: boolean;
  order_number: number;
}

export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  total_points: number;
  role: 'student' | 'teacher' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string | null;
  icon_url: string | null;
  points_reward: number;
}