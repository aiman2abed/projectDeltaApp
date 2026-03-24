from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Optional, Any
from datetime import date
import json

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    email: str
    role: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class User(UserBase):
    id: str

    model_config = ConfigDict(from_attributes=True)

# --- MODULE SCHEMAS ---
class ModuleBase(BaseModel):
    title: str
    description: str

class ModuleCreate(ModuleBase):
    pass

class ModuleResponse(ModuleBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

# --- LESSON SCHEMAS ---
class LessonBase(BaseModel):
    module_id: int
    title: str
    content_text: str
    content_math: Optional[str] = None
    video_url: Optional[str] = None
    quiz_question: Optional[str] = None
    quiz_options: Optional[Any] = None # Accept any format temporarily for flexible creation
    correct_answer: Optional[str] = None

class LessonCreate(LessonBase):
    pass

class LessonUpdate(BaseModel):
    title: Optional[str] = None
    content_text: Optional[str] = None
    content_math: Optional[str] = None
    video_url: Optional[str] = None
    quiz_question: Optional[str] = None
    quiz_options: Optional[Any] = None 
    correct_answer: Optional[str] = None

class LessonResponse(BaseModel):
    id: int
    module_id: int
    title: str
    content_text: str
    content_math: Optional[str] = None
    video_url: Optional[str] = None 
    quiz_question: Optional[str] = None
    quiz_options: Optional[List[str]] = None
    correct_answer: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    # 🛠️ CRITICAL FIX: Convert DB string to List[str] automatically
    @field_validator('quiz_options', mode='before')
    @classmethod
    def parse_quiz_options(cls, v):
        if isinstance(v, str):
            # Try to parse it as JSON first
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                pass
            
            # If it's a raw Postgres array like "{Option A, Option B}"
            if v.startswith("{") and v.endswith("}"):
                # Strip the brackets
                cleaned = v[1:-1]
                # Split by comma. This is a simplified split; 
                # for robust parsing, JSON storage in DB is highly recommended.
                # Here we strip extra quotes just in case.
                items = [item.strip(' "') for item in cleaned.split(',')]
                return items
                
            return [v] # Fallback: return the raw string as a single item list
            
        return v

# --- PROGRESS SCHEMAS ---
class ProgressUpdateRequest(BaseModel):
    quality: int = Field(..., ge=0, le=5) 

class ProgressUpdateResponse(BaseModel):
    status: str
    message: str
    next_review_date: date
    interval: int
    repetitions: int
    ease_factor: float

class UserProgressBase(BaseModel):
    user_id: str
    lesson_id: int
    repetitions: int
    interval: int
    ease_factor: float
    next_review_date: date

class UserProgressCreate(UserProgressBase):
    pass

class UserProgress(UserProgressBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class ModuleProgressSummary(BaseModel):
    module_id: int
    module_title: str
    total_lessons: int
    lessons_started : int
    mastery_score : float

    model_config = ConfigDict(from_attributes=True)