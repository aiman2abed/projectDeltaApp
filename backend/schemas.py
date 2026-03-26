from datetime import date
import json
from typing import Dict, List, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, field_validator

QuizOptionsInput = Union[List[str], Dict[str, str], str]


class UserBase(BaseModel):
    email: str
    role: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class User(UserBase):
    id: str

    model_config = ConfigDict(from_attributes=True)


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


class LessonBase(BaseModel):
    module_id: int
    title: str
    content_text: str
    content_math: Optional[str] = None
    video_url: Optional[str] = None
    quiz_question: Optional[str] = None
    quiz_options: Optional[QuizOptionsInput] = None
    correct_answer: Optional[str] = None


class LessonCreate(LessonBase):
    pass


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    content_text: Optional[str] = None
    content_math: Optional[str] = None
    video_url: Optional[str] = None
    quiz_question: Optional[str] = None
    quiz_options: Optional[QuizOptionsInput] = None
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

    @field_validator("quiz_options", mode="before")
    @classmethod
    def parse_quiz_options(cls, value: Optional[QuizOptionsInput]) -> Optional[List[str]]:
        """
        Normalize heterogeneous quiz-option storage into a predictable list for frontend consumers.
        This keeps legacy rows compatible while the system converges on JSON list storage.
        """
        if value is None:
            return None

        if isinstance(value, list):
            return [str(item) for item in value]

        if isinstance(value, dict):
            return [str(item) for item in value.values()]

        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return [str(item) for item in parsed]
            except Exception:
                pass

            if value.startswith("{") and value.endswith("}"):
                cleaned = value[1:-1]
                return [item.strip(' "') for item in cleaned.split(",") if item.strip()]

            return [value]

        return [str(value)]


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
    lessons_started: int
    mastery_score: float

    model_config = ConfigDict(from_attributes=True)
