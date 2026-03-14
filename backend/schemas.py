from pydantic import BaseModel
from typing import Optional

# 1. Schema for a single Lesson
class LessonResponse(BaseModel):
    id: int
    title: str
    content_text: str
    content_math: Optional[str] = None

    class Config:
        from_attributes = True  # Tells Pydantic to read data from SQLAlchemy objects

# 2. Schema for a Module
class ModuleResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None

    class Config:
        from_attributes = True