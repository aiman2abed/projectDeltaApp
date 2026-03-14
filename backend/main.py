from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models, schemas
from database import SessionLocal

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