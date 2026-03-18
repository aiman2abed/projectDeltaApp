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


@app.post("/api/modules", response_model=schemas.ModuleResponse)
def create_module(module: schemas.ModuleCreate, db: Session = Depends(get_db)):
    new_module = models.Module(**module.model_dump())
    db.add(new_module)
    db.commit()
    db.refresh(new_module)
    return new_module


@app.post("/api/lessons", response_model=schemas.LessonResponse)
def create_lesson(lesson: schemas.LessonCreate, db: Session = Depends(get_db)):
    new_lesson = models.Lesson(**lesson.model_dump())
    db.add(new_lesson)
    db.commit()
    db.refresh(new_lesson)
    return new_lesson

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
# Add this above or below your other lesson routes
@app.get("/api/lessons", response_model=List[schemas.LessonResponse])
def get_all_lessons(db: Session = Depends(get_db)):
    # This query grabs every single row in the lessons table
    lessons = db.query(models.Lesson).order_by(models.Lesson.id).all()
    return lessons

@app.post("/api/progress/{lesson_id}", response_model=schemas.ProgressUpdateResponse)
def mark_lesson_understood(
    lesson_id: int,
    progress_payload: schemas.ProgressUpdateRequest,
    db: Session = Depends(get_db),
):
    user_id = progress_payload.user_id
    
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

    updated_progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == user_id,
        models.UserProgress.lesson_id == lesson_id
    ).first()

    return {
        "status": "success",
        "message": "Progress recorded and next review scheduled.",
        "next_review_date": updated_progress.next_review_date,
        "interval": updated_progress.interval,
        "repetitions": updated_progress.repetitions,
        "ease_factor": updated_progress.ease_factor,
    }

@app.get("/api/progress/due")
def get_due_reviews(db: Session = Depends(get_db)):
    user_id = 1  # Our hard-coded Guest User
    today = date.today() + timedelta(days=6)  # We want to include lessons due today as well
    
    # Query the database to count how many rows are due today or earlier
    due_count = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == user_id,
        models.UserProgress.next_review_date <= today
    ).count()
    
    return {"due_count": due_count}

@app.get("/api/progress/summary", response_model=List[schemas.ModuleProgressSummary])
def get_progress_summary(db: Session = Depends(get_db)):
    user_id = 1  # Hard-coded Guest User
    
    # 1. Get all modules
    modules = db.query(models.Module).all()
    summary_data = []
    
    for module in modules:
        # 2. Count total lessons in this specific module
        total_lessons = db.query(models.Lesson).filter(
            models.Lesson.module_id == module.id
        ).count()
        
        # 3. Find all progress records for lessons belonging to this module
        progress_records = db.query(models.UserProgress).join(
            models.Lesson, models.UserProgress.lesson_id == models.Lesson.id
        ).filter(
            models.Lesson.module_id == module.id,
            models.UserProgress.user_id == user_id
        ).all()
        
        lessons_started = len(progress_records)
        
        # 4. Calculate the "Mastery Score" (Algorithm)
        # We assume 5 successful repetitions means a lesson is 100% "Mastered"
        if total_lessons > 0 and lessons_started > 0:
            total_reps = sum(p.repetitions for p in progress_records)
            target_reps = total_lessons * 5 
            
            mastery = (total_reps / target_reps) * 100
            mastery_score = min(100.0, round(mastery, 1)) # Cap at 100%
        else:
            mastery_score = 0.0
            
        summary_data.append({
            "module_id": module.id,
            "module_title": module.title,
            "total_lessons": total_lessons,
            "lessons_started": lessons_started,
            "mastery_score": mastery_score
        })
        
    return summary_data

@app.get("/api/progress/review-queue")
def get_review_queue(db: Session = Depends(get_db)):
    user_id = 1
    today = date.today() + timedelta(days=6)  # Include lessons due today as well
    
    # Find the oldest due lesson for this user
    due_progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == user_id,
        models.UserProgress.next_review_date <= today
    ).order_by(models.UserProgress.next_review_date.asc()).first()
    
    if not due_progress:
        return {"lesson_id": None, "message": "All caught up!"}
        
    return {"lesson_id": due_progress.lesson_id}