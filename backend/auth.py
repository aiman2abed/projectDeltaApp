import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from dotenv import load_dotenv
from database import SessionLocal
import models

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

security = HTTPBearer()

# DTO: This prevents SQLAlchemy "DetachedInstanceErrors" after the session closes
class ValidatedUser:
    def __init__(self, id: str, email: str, role: str):
        self.id = id
        self.email = email
        self.role = role

async def get_current_user(auth: HTTPAuthorizationCredentials = Depends(security)):
    """Validates token AND ensures the user exists in our local database."""
    token = auth.credentials
    # 1. Verify token with Supabase
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Supabase Auth Error: {str(e)}")
        
    # 2. Lazy Sync with our database
    db = SessionLocal()
    try:
        db_user = db.query(models.User).filter(models.User.id == user_response.user.id).first()
        
        if not db_user:
            db_user = models.User(
                id=user_response.user.id,
                email=user_response.user.email,
                role="user"
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            
        # Safely extract data into our DTO before the 'finally' block closes the DB!
        return ValidatedUser(id=db_user.id, email=db_user.email, role=db_user.role)
    except Exception as db_err:
        # Stop masking DB errors as 401s! Let them bubble up so we can see them.
        print(f"Database Error in Lazy Sync: {db_err}")
        raise HTTPException(status_code=500, detail="Internal Database Synchronization Error")
    finally:
        db.close()

async def get_admin_user(current_user: ValidatedUser = Depends(get_current_user)):
    """Secondary Gatekeeper: Checks if the validated user has admin rights."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access the Content Studio."
        )
    return current_user