from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.auth_service import (
    authenticate_user,
    create_user,
    get_current_user,
    get_user_by_email,
    get_user_by_username,
)
from app.utils.jwt_utils import create_access_token
from app.config import settings
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


# --- Schemas ---

class SignupRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        if not v.isalnum() and "_" not in v:
            raise ValueError("Username may only contain alphanumerics and underscores")
        return v.lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: str | None
    is_active: bool

    class Config:
        from_attributes = True


# --- Endpoints ---

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    if get_user_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if get_user_by_username(db, data.username):
        raise HTTPException(status_code=400, detail="Username already taken")

    user = create_user(db, data.email, data.username, data.password, data.full_name)
    token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": str(user.id), "email": user.email, "username": user.username, "full_name": user.full_name},
    }


@router.post("/login", response_model=TokenResponse)
def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect credentials")
    token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": str(user.id), "email": user.email, "username": user.username, "full_name": user.full_name},
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
