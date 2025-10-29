from datetime import datetime, timedelta, timezone
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .config import settings
from .database import get_db
from ..models.user import User, UserRole, UserStatus

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT token scheme - make it optional for some endpoints
security = HTTPBearer(auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Convert UTC datetime to Unix timestamp (integer)
    expire_timestamp = int(expire.timestamp())
    to_encode.update({"exp": expire_timestamp})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError as e:
        print(f"DEBUG: JWTError in verify_token: {type(e).__name__} - {str(e)}")
        return None
    except Exception as e:
        print(f"DEBUG: Unexpected error in verify_token: {type(e).__name__} - {str(e)}")
        return None


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate user with username/email and password"""
    # Try to find user by phone or email
    user = db.query(User).filter(
        (User.phone == username) | (User.email == username)
    ).first()
    
    if not user:
        return None
    
    if not verify_password(password, user.hashed_password):
        return None
    
    if user.status != UserStatus.ACTIVE:
        return None
    
    return user


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if credentials is None:
        print("DEBUG: No credentials provided in Authorization header")
        raise credentials_exception
    
    try:
        print(f"DEBUG: Verifying token: {credentials.credentials[:20]}...")
        print(f"DEBUG: Token length: {len(credentials.credentials)}")
        print(f"DEBUG: Using SECRET_KEY length: {len(settings.SECRET_KEY)}, ALGORITHM: {settings.ALGORITHM}")
        
        payload = verify_token(credentials.credentials)
        if payload is None:
            print("DEBUG: Token verification returned None")
            raise credentials_exception
        
        # JWT 'sub' claim is a string, convert to int
        sub_claim = payload.get("sub")
        if sub_claim is None:
            print("DEBUG: No 'sub' claim in token payload")
            raise credentials_exception
        
        try:
            user_id: int = int(sub_claim)
        except (ValueError, TypeError):
            print(f"DEBUG: Invalid 'sub' claim format: {sub_claim}")
            raise credentials_exception
        
        print(f"DEBUG: Token valid, user_id={user_id}, exp={payload.get('exp')}")
        
        # jwt.decode already validates expiration automatically, so no need to check again
            
    except JWTError as e:
        print(f"DEBUG: JWTError during token verification: {e}")
        raise credentials_exception
    
    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None:
        print(f"DEBUG: User {user_id} not found in database")
        raise credentials_exception
    
    print(f"DEBUG: User found: {user.name}, status={user.status}")
    # Check if user is still active
    if user.status != UserStatus.ACTIVE:
        print(f"DEBUG: User {user_id} is not ACTIVE (status={user.status})")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is not active"
        )
    
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if current_user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user"
        )
    return current_user


# Role-based access control
class RequireRole:
    def __init__(self, *allowed_roles: UserRole):
        self.allowed_roles = allowed_roles
    
    def __call__(self, current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[role.value for role in self.allowed_roles]}"
            )
        return current_user


# Convenience functions for common role checks
require_admin = RequireRole(UserRole.ADMIN)
require_farmer = RequireRole(UserRole.FARMER)
require_buyer = RequireRole(UserRole.BUYER)
require_ops = RequireRole(UserRole.OPS)

# Combined role requirements
require_farmer_or_admin = RequireRole(UserRole.FARMER, UserRole.ADMIN)
require_buyer_or_admin = RequireRole(UserRole.BUYER, UserRole.ADMIN)
require_ops_or_admin = RequireRole(UserRole.OPS, UserRole.ADMIN)
require_staff = RequireRole(UserRole.ADMIN, UserRole.OPS)
