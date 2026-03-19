from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date
from uuid import UUID


# --- USER SCHEMAS ---
class UserBase(BaseModel):
    email: str
    role: str

class User(UserBase):
    id: UUID

    class Config:
        from_attributes = True

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

class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

# --- LESSON SCHEMAS ---
class LessonBase(BaseModel):
    module_id: int
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

    class Config:
        from_attributes = True

class LessonUpdate(BaseModel):
    title: Optional[str] = None
    content_text: Optional[str] = None
    content_math: Optional[str] = None
    video_url: Optional[str] = None
    quiz_question: Optional[str] = None
    quiz_options: Optional[List[str]] = None # Or Optional[str] depending on how you store it
    correct_answer: Optional[str] = None

class ProgressUpdateRequest(BaseModel):
    user_id: str
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

    class Config:
        from_attributes = True

class ModuleProgressSummary(BaseModel):
    module_id: int
    module_title: str
    total_lessons: int
    lessons_started : int
    mastery_score : float

    class Config:
        from_attributes = True