from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, validator
import json

from ....core.database import get_db
from ....core.auth import (
    authenticate_user,
    create_access_token,
    get_current_active_user,
    get_password_hash,
    verify_password
)
from ....models.user import User, UserRole, UserStatus

router = APIRouter()


# Pydantic models for request/response
class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: dict


class UserRegistration(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    password: str
    role: UserRole
    gov_id: Optional[str] = None
    
    # Role-specific profile data
    profile_data: Optional[dict] = None
    
    @validator('phone')
    def validate_phone(cls, v):
        # Basic phone validation for Zimbabwe
        if not v.startswith('+263') and not v.startswith('0'):
            raise ValueError('Phone number must start with +263 or 0')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v


class UserLogin(BaseModel):
    username: str  # phone or email
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class PasswordChange(BaseModel):
    old_password: str
    new_password: str


class UserResponse(BaseModel):
    user_id: int
    name: str
    phone: str
    email: Optional[str]
    role: UserRole
    status: UserStatus
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True


@router.post("/login", response_model=Token)
async def login(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """Authenticate user and return access token"""
    user = authenticate_user(db, login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Create access token
    access_token_expires = timedelta(minutes=30)  # From settings
    # JWT 'sub' claim must be a string, not an integer
    access_token = create_access_token(
        data={"sub": str(user.user_id), "role": user.role.value},
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=1800,  # 30 minutes in seconds
        user={
            "user_id": user.user_id,
            "name": user.name,
            "phone": user.phone,
            "email": user.email,
            "role": user.role.value,
            "status": user.status.value,
            "is_verified": user.is_verified
        }
    )


@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserRegistration,
    db: Session = Depends(get_db)
):
    """Register new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.phone == user_data.phone) | 
        (User.email == user_data.email if user_data.email else False)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this phone number or email already exists"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    
    new_user = User(
        name=user_data.name,
        phone=user_data.phone,
        email=user_data.email,
        role=user_data.role,
        hashed_password=hashed_password,
        status=UserStatus.PENDING,  # Requires verification
        profile_data=json.dumps(user_data.profile_data) if user_data.profile_data else None
    )
    
    # Hash government ID if provided
    if user_data.gov_id:
        new_user.gov_id_hash = User.hash_gov_id(user_data.gov_id)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse.model_validate(new_user)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get current authenticated user information"""
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    if update_data.name:
        current_user.name = update_data.name
    if update_data.email:
        # Check if email already taken by another user
        existing = db.query(User).filter(User.email == update_data.email, User.user_id != current_user.user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = update_data.email
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/refresh")
async def refresh_token(
    current_user: User = Depends(get_current_active_user)
):
    """Refresh access token"""
    access_token_expires = timedelta(minutes=30)
    # JWT 'sub' claim must be a string, not an integer
    access_token = create_access_token(
        data={"sub": str(current_user.user_id), "role": current_user.role.value},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 1800
    }


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_active_user)
):
    """Logout user (client should discard token)"""
    # In a production system, you might want to blacklist the token
    # For now, we just return a success message
    return {"message": "Successfully logged out"}


@router.put("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    # Verify old password
    if not verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    # Validate new password
    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long"
        )
    
    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}
