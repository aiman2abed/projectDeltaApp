from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float, Date, JSON
from sqlalchemy.orm import relationship
from database import Base



class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)

class Module(Base):
    __tablename__ = "modules"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text)
    
    # This creates a link to fetch all lessons inside a module
    lessons = relationship("Lesson", back_populates="module")

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
    
    module = relationship("Module", back_populates="lessons")

class UserProgress(Base):
    __tablename__ = "user_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"))
    ease_factor = Column(Float, default=2.5)
    interval = Column(Integer, default=0)
    repetitions = Column(Integer, default=0)
    next_review_date = Column(Date)