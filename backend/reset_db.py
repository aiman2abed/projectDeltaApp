from database import engine
from sqlalchemy import text

def reset_database():
    with engine.connect() as conn:
        print("🧹 Wiping data and resetting ID counters...")
        # This order is important because of Foreign Key dependencies
        conn.execute(text("TRUNCATE TABLE user_progress RESTART IDENTITY CASCADE;"))
        conn.execute(text("TRUNCATE TABLE lessons RESTART IDENTITY CASCADE;"))
        conn.execute(text("TRUNCATE TABLE modules RESTART IDENTITY CASCADE;"))
        conn.commit()
    print("✨ Database is now empty and IDs are reset to 1.")

if __name__ == "__main__":
    reset_database()