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
    def __init__(self, id: str, email: str, role: str, first_name: str = "", last_name: str = ""):
        self.id = id
        self.email = email
        self.role = role
        self.first_name = first_name
        self.last_name = last_name

async def get_current_user(auth: HTTPAuthorizationCredentials = Depends(security)):
    token = auth.credentials
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Supabase Auth Error: {str(e)}")
        
    db = SessionLocal()
    try:
        db_user = db.query(models.User).filter(models.User.id == user_response.user.id).first()
        
        # Extract metadata from Supabase
        meta = user_response.user.user_metadata or {}
        f_name = meta.get("first_name", "")
        l_name = meta.get("last_name", "")
        
        if not db_user:
            db_user = models.User(
                id=user_response.user.id,
                email=user_response.user.email,
                role="user",
                first_name=f_name,
                last_name=l_name
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
            
        return ValidatedUser(
            id=db_user.id, 
            email=db_user.email, 
            role=db_user.role,
            first_name=getattr(db_user, 'first_name', ''),
            last_name=getattr(db_user, 'last_name', '')
        )
    except Exception as db_err:
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