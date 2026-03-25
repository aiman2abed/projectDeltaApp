export interface Module {
  id: number;
  title: string;
  description: string;
}

export interface Lesson {
  id: number;
  module_id: number;
  title: string;
  content_text: string;
  content_math?: string | null;
  video_url?: string | null;
  quiz_question?: string | null;
  quiz_options?: string[] | null;
  correct_answer?: string | null;
}

export interface ProgressUpdateRequest {
  quality: 0 | 1 | 2 | 3 | 4 | 5;
}

export interface ProgressUpdateResponse {
  status: "success";
  message: string;
  next_review_date: string;
  interval: number;
  repetitions: number;
  ease_factor: number;
}

export interface ReviewQueueResponse {
  lesson_id: number | null;
}

export interface ModuleProgressSummary {
  module_id: number;
  module_title: string;
  total_lessons: number;
  lessons_started: number;
  mastery_score: number;
}
