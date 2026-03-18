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

async def get_current_user(auth: HTTPAuthorizationCredentials = Depends(security)):
    """Validates token AND ensures the user exists in our local database."""
    token = auth.credentials
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Lazy Sync: Check our local DB for this user
        db = SessionLocal()
        try:
            db_user = db.query(models.User).filter(models.User.id == user_response.user.id).first()
            
            # If they don't exist in our DB yet, create them!
            if not db_user:
                db_user = models.User(
                    id=user_response.user.id,
                    email=user_response.user.email,
                    role="user" # Everyone starts as a regular user
                )
                db.add(db_user)
                db.commit()
                db.refresh(db_user)
                
            return db_user # We return the SQLAlchemy User object (with the role!)
        finally:
            db.close()
            
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Auth Error: {str(e)}")

async def get_admin_user(current_user: models.User = Depends(get_current_user)):
    """Secondary Gatekeeper: Checks if the validated user has admin rights."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access the Content Studio."
        )
    return current_user