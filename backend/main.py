from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta
import random
import models, schemas
from database import SessionLocal
from auth import get_current_user, get_admin_user # Add get_admin_user
# 1. Import the gatekeeper
from auth import get_current_user 

app = FastAPI(title="Spirelay")

# ==========================================
# 1. MIDDLEWARE & DEPENDENCIES
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    """Opens a database connection for a request, then safely closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# 2. SYSTEM HEALTH
# ==========================================

@app.get("/")
def read_root():
    return {"status": "success", "message": "The Spirelay API is live!"}

@app.get("/api/users/me")
def get_user_profile(current_user = Depends(get_current_user)):
    """Allows the Next.js frontend to check if the user is an admin or not."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role
    }

# ==========================================
# 3. MODULES API (CRUD & Relationships)
# ==========================================

@app.get("/api/modules", response_model=List[schemas.ModuleResponse])
def get_modules(db: Session = Depends(get_db)):
    """Fetch all available engineering modules."""
    return db.query(models.Module).order_by(models.Module.id).all()

@app.get("/api/modules/{module_id}/lessons", response_model=List[schemas.LessonResponse])
def get_lessons_for_module(module_id: int, db: Session = Depends(get_db)):
    """Fetch all lessons that belong to a specific module."""
    return db.query(models.Lesson).filter(models.Lesson.module_id == module_id).order_by(models.Lesson.id).all()

@app.post("/api/modules", response_model=schemas.ModuleResponse)
def create_module(module: schemas.ModuleCreate, db: Session = Depends(get_db), admin_user = Depends(get_admin_user)):
    """Create a new engineering module."""
    new_module = models.Module(**module.model_dump())
    db.add(new_module)
    db.commit()
    db.refresh(new_module)
    return new_module

@app.put("/api/modules/{module_id}", response_model=schemas.ModuleResponse)
def update_module(module_id: int, module_update: schemas.ModuleUpdate, db: Session = Depends(get_db), admin_user = Depends(get_admin_user)):
    """Update an existing module (Partial updates allowed)."""
    db_module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not db_module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # exclude_unset=True ensures we only update fields the user actually sent
    update_data = module_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_module, key, value)
        
    db.commit()
    db.refresh(db_module)
    return db_module

@app.delete("/api/modules/{module_id}")
def delete_module(module_id: int, db: Session = Depends(get_db), admin_user = Depends(get_admin_user)):
    """Delete a module AND all its cascading lessons/progress records."""
    db_module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not db_module:
        raise HTTPException(status_code=404, detail="Module not found")
        
    db.delete(db_module)
    db.commit()
    return {"status": "success", "message": f"Module {module_id} and its children successfully deleted."}


# ==========================================
# 4. LESSONS API (CRUD)
# ==========================================

@app.get("/api/lessons", response_model=List[schemas.LessonResponse])
def get_all_lessons(db: Session = Depends(get_db)):
    """Fetch every lesson in the database."""
    return db.query(models.Lesson).order_by(models.Lesson.id).all()

@app.get("/api/lessons/{lesson_id}", response_model=schemas.LessonResponse)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    """Fetch a specific micro-lesson by its ID."""
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

@app.post("/api/lessons", response_model=schemas.LessonResponse)
def create_lesson(lesson: schemas.LessonCreate, db: Session = Depends(get_db)):
    """Create a new lesson under a specific module."""
    new_lesson = models.Lesson(**lesson.model_dump())
    db.add(new_lesson)
    db.commit()
    db.refresh(new_lesson)
    return new_lesson

@app.put("/api/lessons/{lesson_id}", response_model=schemas.LessonResponse)
def update_lesson(lesson_id: int, lesson_update: schemas.LessonUpdate, db: Session = Depends(get_db)):
    """Update an existing lesson (Partial updates allowed)."""
    db_lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not db_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    update_data = lesson_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_lesson, key, value)
        
    db.commit()
    db.refresh(db_lesson)
    return db_lesson

@app.delete("/api/lessons/{lesson_id}")
def delete_lesson(lesson_id: int, db: Session = Depends(get_db)):
    """Delete a specific lesson and clean up associated user progress."""
    db_lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not db_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    db.delete(db_lesson)
    db.commit()
    return {"status": "success", "message": f"Lesson {lesson_id} successfully deleted."}


# ==========================================
# 5. SPACED REPETITION PROGRESS API (PROTECTED)
# ==========================================

@app.post("/api/progress/{lesson_id}", response_model=schemas.ProgressUpdateResponse)
def mark_lesson_understood(
    lesson_id: int,
    progress_payload: schemas.ProgressUpdateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user) # Gatekeeper active
):
    """Process SRS algorithm updates when a user passes a lesson quiz."""
    # We now strictly trust the token's UUID over the payload's user_id
    user_id = current_user.id
    
    progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == user_id,
        models.UserProgress.lesson_id == lesson_id
    ).first()

    if not progress:
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
        progress.repetitions += 1
        if progress.repetitions == 2:
            progress.interval = 6
        else:
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
def get_due_reviews(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Calculate how many reviews are currently due for the dashboard badge."""
    user_id = current_user.id
    today = date.today() + timedelta(days=6)
    
    due_count = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == user_id,
        models.UserProgress.next_review_date <= today
    ).count()
    
    return {"due_count": due_count}

@app.get("/api/progress/summary", response_model=List[schemas.ModuleProgressSummary])
def get_progress_summary(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Generate the Mastery Scores for the home dashboard charts."""
    user_id = current_user.id
    modules = db.query(models.Module).all()
    summary_data = []
    
    for module in modules:
        total_lessons = db.query(models.Lesson).filter(models.Lesson.module_id == module.id).count()
        progress_records = db.query(models.UserProgress).join(
            models.Lesson, models.UserProgress.lesson_id == models.Lesson.id
        ).filter(
            models.Lesson.module_id == module.id,
            models.UserProgress.user_id == user_id
        ).all()
        
        lessons_started = len(progress_records)
        
        if total_lessons > 0 and lessons_started > 0:
            total_reps = sum(p.repetitions for p in progress_records)
            target_reps = total_lessons * 5 
            mastery = (total_reps / target_reps) * 100
            mastery_score = min(100.0, round(mastery, 1)) 
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
def get_review_queue(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Fetch the next lesson ID that is due for review."""
    user_id = current_user.id
    today = date.today() + timedelta(days=6) 
    
    due_progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == user_id,
        models.UserProgress.next_review_date <= today
    ).order_by(models.UserProgress.next_review_date.asc()).first()
    
    if not due_progress:
        return {"lesson_id": None, "message": "All caught up!"}
        
    return {"lesson_id": due_progress.lesson_id}

@app.get("/api/feed/smart", response_model=List[schemas.LessonResponse])
def get_smart_feed(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user_id = current_user.id
    today = date.today()

    # 1. Fetch all lessons and all user progress for THIS specific user
    all_lessons = db.query(models.Lesson).all()
    user_progress = db.query(models.UserProgress).filter(models.UserProgress.user_id == user_id).all()
    
    # Create a lookup map for progress: {lesson_id: next_review_date}
    progress_map = {p.lesson_id: p.next_review_date for p in user_progress}

    # 2. Sort into Buckets
    bucket_review = []    # Due now
    bucket_new = []       # Never seen
    bucket_fallback = []  # Seen, but not due yet

    for lesson in all_lessons:
        next_date = progress_map.get(lesson.id)
        if next_date is None:
            bucket_new.append(lesson)
        elif next_date <= today:
            bucket_review.append(lesson)
        else:
            bucket_fallback.append(lesson)

    # 3. Randomize within buckets for freshness
    random.shuffle(bucket_review)
    random.shuffle(bucket_new)
    random.shuffle(bucket_fallback)

    # 4. Combine: Prioritize Review, then New, then Fallback
    raw_feed = bucket_review + bucket_new + bucket_fallback
    
    # 5. Apply Diversity Filter (Module De-duplication)
    smart_feed = []
    if raw_feed:
        smart_feed.append(raw_feed.pop(0))
        
        while raw_feed:
            last_mod_id = smart_feed[-1].module_id
            found_diverse = False
            
            for i, lesson in enumerate(raw_feed):
                if lesson.module_id != last_mod_id:
                    smart_feed.append(raw_feed.pop(i))
                    found_diverse = True
                    break
            
            if not found_diverse:
                # If we only have lessons from the same module left, just add them
                smart_feed.append(raw_feed.pop(0))

    return smart_feed

# ==========================================
# 6. ADMIN USER MANAGEMENT (PROTECTED)
# ==========================================
@app.get("/api/users", response_model=list[schemas.User])
def get_all_users(db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    """Fetch all users synced in the database. Restricted to Admins."""
    return db.query(models.User).all()

@app.put("/api/users/{user_id}/role")
def update_user_role(
    user_id: str, 
    role_update: dict, 
    db: Session = Depends(get_db), 
    admin: models.User = Depends(get_admin_user)
):
    """Update a specific user's role (admin/user). Restricted to Admins."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_role = role_update.get("role")
    if new_role not in ["admin", "user"]:
        raise HTTPException(status_code=400, detail="Invalid role")
        
    user.role = new_role
    db.commit()
    return {"message": f"User {user.email} updated to {new_role}"}