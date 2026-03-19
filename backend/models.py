import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, Date, JSON
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    
    # 1. Changed to UUID to match Supabase Auth
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    role = Column(String(50), default="user")  
    # password_hash removed: Supabase handles auth entirely

class Module(Base):
    __tablename__ = "modules"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text)
    
    # PARENT: "If this module dies, delete its child lessons."
    lessons = relationship("Lesson", back_populates="module", cascade="all, delete-orphan")

class Lesson(Base):
    __tablename__ = "lessons"
    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    content_text = Column(Text, nullable=False)
    content_math = Column(Text)

    video_url = Column(String, nullable=True)
    quiz_question = Column(Text, nullable=True)
    quiz_options = Column(JSON, nullable=True)
    correct_answer = Column(String, nullable=True)
    
    # CHILD: Just links back to the parent. No cascade here!
    module = relationship("Module", back_populates="lessons")
    
    # PARENT: "If this lesson dies, delete the progress records of anyone who studied it."
    progress_records = relationship("UserProgress", back_populates="lesson", cascade="all, delete-orphan")

class UserProgress(Base):
    __tablename__ = "user_progress"
    id = Column(Integer, primary_key=True, index=True)
    
    # 2. Changed to UUID so it can properly link to the new User table
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"))
    ease_factor = Column(Float, default=2.5)
    interval = Column(Integer, default=0)
    repetitions = Column(Integer, default=0)
    next_review_date = Column(Date)
    
    # CHILD: Just links back to the lesson.
    lesson = relationship("Lesson", back_populates="progress_records")