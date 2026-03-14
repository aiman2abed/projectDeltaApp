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
  user_id: number;
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
