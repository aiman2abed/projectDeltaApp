from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    # String is required here to hold Supabase UUIDs
    id = Column(String, primary_key=True, index=True) 
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, default="user")
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)

    # The relationship linking User to their Progress
    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")


class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

    lessons = relationship("Lesson", back_populates="module", cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="CASCADE"))
    title = Column(String(255), nullable=False)
    content_text = Column(Text, nullable=False)
    content_math = Column(Text, nullable=True)
    
    # Media/Quiz Fields
    video_url = Column(String, nullable=True)
    quiz_question = Column(String, nullable=True)
    # Using String/Text for simple arrays in SQLite/Postgres. JSON is better if strictly Postgres.
    quiz_options = Column(Text, nullable=True) 
    correct_answer = Column(String, nullable=True)

    module = relationship("Module", back_populates="lessons")
    progress = relationship("UserProgress", back_populates="lesson", cascade="all, delete-orphan")


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    
    # ⚠️ CRITICAL FIX: user_id MUST be a String to match User.id (Supabase UUID)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"))
    
    ease_factor = Column(Float, default=2.5)
    interval = Column(Integer, default=0)
    repetitions = Column(Integer, default=0)
    next_review_date = Column(Date, default=datetime.date.today)

    # ⚠️ CRITICAL FIX: The back_populates mapping that caused your error
    user = relationship("User", back_populates="progress")
    lesson = relationship("Lesson", back_populates="progress")