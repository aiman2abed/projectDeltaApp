from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date

# --- MODULE SCHEMAS ---
class ModuleBase(BaseModel):
    title: str
    description: str

class ModuleCreate(ModuleBase):
    pass

class ModuleResponse(ModuleBase):
    id: int

    class Config:
        from_attributes = True

# --- LESSON SCHEMAS ---
class LessonBase(BaseModel):
    title: str
    content_text: str
    content_math: Optional[str] = None
    
    # V2: Micro-Learning Fields
    video_url: Optional[str] = None
    quiz_question: Optional[str] = None
    quiz_options: Optional[List[str]] = None
    correct_answer: Optional[str] = None

class LessonCreate(LessonBase):
    pass

class LessonResponse(LessonBase):
    id: int
    module_id: int

    class Config:
        from_attributes = True


class ProgressUpdateRequest(BaseModel):
    user_id: int
    quality: int = Field(ge=0, le=5)

class ProgressUpdateResponse(BaseModel):
    status: str
    message: str
    next_review_date: date
    interval: int
    repetitions: int
    ease_factor: float

# --- USER PROGRESS SCHEMAS ---
class UserProgressBase(BaseModel):
    user_id: int
    lesson_id: int
    repetitions: int
    interval: int
    ease_factor: float
    next_review_date: date

class UserProgressCreate(UserProgressBase):
    pass

class UserProgress(UserProgressBase):
    id: int

    class Config:
        from_attributes = True