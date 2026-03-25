from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta
import random

# Internal app imports
import models, schemas
from database import SessionLocal
from auth import get_current_user, get_admin_user, ValidatedUser

# Initialize FastAPI application
app = FastAPI(
    title="Spirelay API",
    description="The core backend for the Spirelay Cyber-Physical Learning Platform. Handles curriculum management, SM-2 spaced repetition algorithms, and user telemetry.",
    version="3.1.0"
)

# ==========================================
# 1. MIDDLEWARE & DEPENDENCIES
# ==========================================

# Configure Cross-Origin Resource Sharing (CORS)
# Allows the Next.js frontend running on localhost:3000 to securely communicate with this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    """
    Dependency generator for database sessions.
    Opens a fresh connection for every incoming request and guarantees it is safely closed
    after the request resolves, preventing connection leaks.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# 2. SYSTEM HEALTH & IDENTITY
# ==========================================

@app.get("/")
def read_root():
    """
    Public Health Check Endpoint.
    Used by load balancers or uptime monitors to verify the API is alive.
    """
    return {"status": "success", "message": "The Spirelay API is live!"}

@app.get("/api/users/me")
def get_user_profile(current_user: ValidatedUser = Depends(get_current_user)):
    """
    Identity Verification Endpoint. (Protected)
    Validates the Supabase JWT token and returns the current user's profile and RBAC (Role-Based Access Control) level.
    Used by the frontend to gate UI elements like the Admin Dashboard.
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name
    }

# ==========================================
# 3. CURRICULUM MODULES API
# ==========================================

@app.get("/api/modules", response_model=List[schemas.ModuleResponse])
def get_modules(
    db: Session = Depends(get_db),
    current_user: ValidatedUser = Depends(get_current_user)
):
    """
    Fetch all high-level engineering modules/topics.
    Publicly accessible to logged-in users.
    """
    return db.query(models.Module).order_by(models.Module.id).all()

@app.get("/api/modules/{module_id}/lessons", response_model=List[schemas.LessonResponse])
def get_lessons_for_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: ValidatedUser = Depends(get_current_user)
):
    """
    Fetch all micro-lessons mapped to a specific module.
    """
    return db.query(models.Lesson).filter(models.Lesson.module_id == module_id).order_by(models.Lesson.id).all()

@app.post("/api/modules", response_model=schemas.ModuleResponse)
def create_module(module: schemas.ModuleCreate, db: Session = Depends(get_db), admin_user: models.User = Depends(get_admin_user)):
    """
    Create a new module. 
    (Protected: Admin Only)
    """
    new_module = models.Module(**module.model_dump())
    db.add(new_module)
    db.commit()
    db.refresh(new_module)
    return new_module

@app.put("/api/modules/{module_id}", response_model=schemas.ModuleResponse)
def update_module(module_id: int, module_update: schemas.ModuleUpdate, db: Session = Depends(get_db), admin_user: models.User = Depends(get_admin_user)):
    """
    Update an existing module's title or description. Partial updates are supported.
    (Protected: Admin Only)
    """
    db_module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not db_module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    # exclude_unset=True ensures we only overwrite fields provided in the JSON payload
    update_data = module_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_module, key, value)
        
    db.commit()
    db.refresh(db_module)
    return db_module

@app.delete("/api/modules/{module_id}")
def delete_module(module_id: int, db: Session = Depends(get_db), admin_user: models.User = Depends(get_admin_user)):
    """
    Permanently delete a module.
    WARNING: SQLAlchemy cascading rules will also delete all associated lessons and user progress logs!
    (Protected: Admin Only)
    """
    db_module = db.query(models.Module).filter(models.Module.id == module_id).first()
    if not db_module:
        raise HTTPException(status_code=404, detail="Module not found")
        
    db.delete(db_module)
    db.commit()
    return {"status": "success", "message": f"Module {module_id} and its children successfully deleted."}

# ==========================================
# 4. MICRO-LESSON API
# ==========================================

@app.get("/api/lessons", response_model=List[schemas.LessonResponse])
def get_all_lessons(
    db: Session = Depends(get_db),
    current_user: ValidatedUser = Depends(get_current_user)
):
    """Fetch every lesson in the entire database."""
    return db.query(models.Lesson).order_by(models.Lesson.id).all()

@app.get("/api/lessons/{lesson_id}", response_model=schemas.LessonResponse)
def get_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: ValidatedUser = Depends(get_current_user)
):
    """Fetch the specific technical payload for a single lesson node."""
    lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson

@app.post("/api/lessons", response_model=schemas.LessonResponse)
def create_lesson(lesson: schemas.LessonCreate, db: Session = Depends(get_db), admin_user: models.User = Depends(get_admin_user)):
    """
    Inject a new lesson into a module.
    (Protected: Admin Only)
    """
    new_lesson = models.Lesson(**lesson.model_dump())
    db.add(new_lesson)
    db.commit()
    db.refresh(new_lesson)
    return new_lesson

@app.put("/api/lessons/{lesson_id}", response_model=schemas.LessonResponse)
def update_lesson(lesson_id: int, lesson_update: schemas.LessonUpdate, db: Session = Depends(get_db), admin_user: models.User = Depends(get_admin_user)):
    """
    Update a specific lesson's content, math payload, or media URL.
    (Protected: Admin Only)
    """
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
def delete_lesson(lesson_id: int, db: Session = Depends(get_db), admin_user: models.User = Depends(get_admin_user)):
    """
    Permanently delete a lesson and clean up all users' SM-2 progress associated with it.
    (Protected: Admin Only)
    """
    db_lesson = db.query(models.Lesson).filter(models.Lesson.id == lesson_id).first()
    if not db_lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
        
    db.delete(db_lesson)
    db.commit()
    return {"status": "success", "message": f"Lesson {lesson_id} successfully deleted."}

# ==========================================
# 5. SUPER-MEMO 2 (SM-2) PROGRESS ENGINE
# ==========================================

@app.post("/api/progress/{lesson_id}", response_model=schemas.ProgressUpdateResponse)
def mark_lesson_understood(
    lesson_id: int,
    payload: schemas.ProgressUpdateRequest,
    db: Session = Depends(get_db),
    current_user: ValidatedUser = Depends(get_current_user)
):
    """
    Core Spaced Repetition Logic (SM-2 Algorithm).
    Evaluates the user's self-assessed quality (1-5) and recalculates the interval
    and ease factor to predict exactly when they will forget the concept.
    """
    user_id = current_user.id
    q = max(0, min(5, payload.quality))
    
    # 1. Fetch existing telemetry or initialize a new neural pathway
    progress = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == user_id,
        models.UserProgress.lesson_id == lesson_id
    ).first()

    if not progress:
        progress = models.UserProgress(
            user_id=user_id,
            lesson_id=lesson_id,
            ease_factor=2.5,  # Standard SM-2 baseline
            repetitions=0,
            interval=0
        )
        db.add(progress)

    # Anti-spam guardrail: do not permit additional "success" submissions
    # before the current item is due.
    if progress.next_review_date and progress.next_review_date > date.today() and q >= 3:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Review already scheduled for {progress.next_review_date.isoformat()}. "
                "Wait until it is due before logging another successful recall."
            ),
        )

    # 2. Apply SM-2 Interval Calculation
    if q >= 3:  # Successful recall (Hard, Good, Easy)
        if progress.repetitions == 0:
            progress.interval = 1
        elif progress.repetitions == 1:
            progress.interval = 6
        else:
            progress.interval = round(progress.interval * progress.ease_factor)
        
        progress.repetitions += 1
    else:  # Failed recall (Again) - Reset the sequence
        progress.repetitions = 0
        progress.interval = 1

    # 3. Calculate New Ease Factor
    # Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    new_ef = progress.ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    progress.ease_factor = max(1.3, new_ef) # Cap the floor at 1.3 to prevent infinite failure loops

    # 4. Set Next Review Deadline
    progress.next_review_date = date.today() + timedelta(days=progress.interval)
    
    db.commit()
    db.refresh(progress)

    return {
        "status": "success",
        "message": f"SM-2 Calibrated. Review in {progress.interval} days.",
        "next_review_date": progress.next_review_date,
        "interval": progress.interval,
        "repetitions": progress.repetitions,
        "ease_factor": progress.ease_factor
    }

@app.get("/api/progress/due")
def get_due_reviews(
    db: Session = Depends(get_db),
    current_user: ValidatedUser = Depends(get_current_user)
):
    """Calculates how many reviews are currently due for the user's dashboard badge."""
    user_id = current_user.id
    today = date.today() + timedelta(days=6) # Configured lookahead window
    
    due_count = db.query(models.UserProgress).filter(
        models.UserProgress.user_id == user_id,
        models.UserProgress.next_review_date <= today
    ).count()
    
    return {"due_count": due_count}

@app.get("/api/progress/summary", response_model=List[schemas.ModuleProgressSummary])
def get_progress_summary(
    db: Session = Depends(get_db),
    current_user: ValidatedUser = Depends(get_current_user)
):
    """
    Generates Mastery Scores for the home dashboard charts.
    Calculates progress by comparing user repetition logs against total module lesson counts.
    """
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
            target_reps = total_lessons * 5 # Assumes 'Mastery' requires ~5 successful repetitions per lesson
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

@app.get("/api/feed/smart", response_model=List[schemas.LessonResponse])
def get_smart_feed(
    db: Session = Depends(get_db),
    current_user: ValidatedUser = Depends(get_current_user)
):
    """
    The Smart Feed Discovery Algorithm.
    Serves both the Discover Reels and the Training Room Queue.
    Sorts lessons into three priority buckets:
    1. Due Now (Review)
    2. Never Seen (New)
    3. Seen but not due (Fallback)
    Applies module de-duplication to prevent subject fatigue.
    """
    user_id = current_user.id
    today = date.today()

    all_lessons = db.query(models.Lesson).all()
    user_progress = db.query(models.UserProgress).filter(models.UserProgress.user_id == user_id).all()
    
    # Hash map for O(1) lookups
    progress_map = {p.lesson_id: p.next_review_date for p in user_progress}

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

    # Randomize within buckets to prevent predictable sequencing
    random.shuffle(bucket_review)
    random.shuffle(bucket_new)
    random.shuffle(bucket_fallback)

    raw_feed = bucket_review + bucket_new + bucket_fallback
    
    # Apply Diversity Filter (Ensure adjacent items are from different modules)
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
                smart_feed.append(raw_feed.pop(0))

    return smart_feed

# ==========================================
# 6. ADMIN TENANT MANAGEMENT (PROTECTED)
# ==========================================

@app.get("/api/users", response_model=list[schemas.User])
def get_all_users(db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    """Fetch all users mapped from Supabase to the local Postgres instance. Restricted to Admins."""
    return db.query(models.User).all()

@app.put("/api/users/{user_id}/role")
def update_user_role(
    user_id: str, 
    role_update: dict, 
    db: Session = Depends(get_db), 
    admin: models.User = Depends(get_admin_user)
):
    """
    Elevate or revoke an operator's privileges. 
    Restricted to Admins.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_role = role_update.get("role")
    if new_role not in ["admin", "user"]:
        raise HTTPException(status_code=400, detail="Invalid role specified.")
        
    user.role = new_role
    db.commit()
    return {"message": f"User {user.email} permissions updated to {new_role}."}

@app.delete("/api/admin/users/{target_user_id}/progress")
def wipe_user_progress(
    target_user_id: str,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_admin_user)
):
    """
    Sanction Protocol: Data Wipe.
    Permanently erases all SM-2 tracking data and mastery progression for a specific user.
    Does NOT delete their account or modify their access credentials.
    Restricted to Admins.
    """
    # Verify the target user actually exists in the system
    target_user = db.query(models.User).filter(models.User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found in the registry.")

    # Execute the deletion of all progress records tied to their ID
    deleted_count = db.query(models.UserProgress).filter(models.UserProgress.user_id == target_user_id).delete()
    db.commit()

    return {"message": f"Sanction Executed. {deleted_count} telemetry records wiped for user {target_user.email}."}
