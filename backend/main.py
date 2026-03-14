from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import SessionLocal

from datetime import date, timedelta

app = FastAPI()

# --- NEW CORS CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Allows your Next.js frontend
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)

# Dependency: This opens a database connection for a request, then safely closes it.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/")
def read_root():
    return {"status": "success", "message": "The EE Microlearning API is live!"}

# --- NEW ENDPOINTS BELOW ---

@app.get("/api/modules", response_model=List[schemas.ModuleResponse])
def get_modules(db: Session = Depends(get_db)):
    """Fetch all available engineering modules."""
    modules = db.query(models.Module).all()
    return modules

@app.get("/api/lessons/{lesson_id}", response_model=schemas.LessonResponse)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    """Fetch a specific micro-lesson by its ID."""
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    return lesson

@app.post("/api/progress/{lesson_id}")
def mark_lesson_understood(lesson_id: int, db: Session = Depends(get_db)):
    user_id = 1  # Hard-coded Guest User
    
    # Check if this user has studied this lesson before
    progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == user_id,
        models.UserProgress.lesson_id == lesson_id
    ).first()

    if not progress:
        # First time learning this lesson
        new_progress = models.UserProgress(
            user_id=user_id,
            lesson_id=lesson_id,
            repetitions=1,
            interval=1,
            ease_factor=2.5,
            next_review_date=date.today() + timedelta(days=1)
        )
        db.add(new_progress)
    else:
        # Reviewing an existing lesson
        progress.repetitions += 1
        
        if progress.repetitions == 2:
            progress.interval = 6
        else:
            # Round the new interval to the nearest whole day
            progress.interval = round(progress.interval * progress.ease_factor)
            
        progress.next_review_date = date.today() + timedelta(days=progress.interval)

    db.commit()
    return {"status": "success", "message": "Progress recorded and next review scheduled."}

@app.get("/api/progress/due")
def get_due_reviews(db: Session = Depends(get_db)):
    user_id = 1  # Our hard-coded Guest User
    today = date.today()
    
    # Query the database to count how many rows are due today or earlier
    due_count = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == user_id,
        models.UserProgress.next_review_date <= today
    ).count()
    
    return {"due_count": due_count}

@app.get("/api/progress/review-queue")
def get_review_queue(db: Session = Depends(get_db)):
    user_id = 1
    today = date.today()
    
    # Find the oldest due lesson for this user
    due_progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == user_id,
        models.UserProgress.next_review_date <= today
    ).order_by(models.UserProgress.next_review_date.asc()).first()
    
    if not due_progress:
        return {"lesson_id": None, "message": "All caught up!"}
        
    return {"lesson_id": due_progress.lesson_id}