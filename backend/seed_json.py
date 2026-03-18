import json
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

def seed_data():
    db: Session = SessionLocal()
    try:
        with open("ee_curriculum.json", "r") as f:
            data = json.load(f)

        print(f"🚀 Starting smart injection of {len(data)} items...")

        for item in data:
            mod_id = item.get("module_id")
            
            # 1. Find or Create the Module with ACTUAL Title/Description
            db_module = db.query(models.Module).filter(models.Module.id == mod_id).first()
            
            if not db_module:
                print(f"📁 Creating Module {mod_id}: {item.get('module_title')}")
                db_module = models.Module(
                    id=mod_id, 
                    title=item.get("module_title", f"Module {mod_id}"), 
                    description=item.get("module_description", "No description provided.")
                )
                db.add(db_module)
                db.flush() # Sync with DB to ensure mod_id is reserved

            # 2. Add the Lesson
            new_lesson = models.Lesson(
                title=item.get("title"),
                module_id=mod_id,
                content_text=item.get("content_text", ""),
                content_math=item.get("content_math"),
                video_url=item.get("video_url"),
                quiz_question=item.get("quiz_question"),
                quiz_options=item.get("quiz_options"),
                correct_answer=item.get("correct_answer")
            )
            db.add(new_lesson)
            print(f"   ✅ Added Lesson: {item.get('title')}")

        db.commit()
        print("\n✨ Database successfully synchronized!")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()