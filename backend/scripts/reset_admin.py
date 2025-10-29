"""
Reset or create the admin user to known credentials.

Usage (from repo root):
  cd backend
  venv\\Scripts\\activate
  python scripts/reset_admin.py
"""
import sys
import os

# Add the backend directory to Python path so we can import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.core.auth import get_password_hash
from app.models.user import User, UserRole, UserStatus

ADMIN_PHONE = "+263771234567"
ADMIN_PASSWORD = "admin123"
ADMIN_NAME = "System Administrator"
ADMIN_EMAIL = "admin@mundamarket.co.zw"


def main():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if not admin:
            admin = User(
                name=ADMIN_NAME,
                phone=ADMIN_PHONE,
                email=ADMIN_EMAIL,
                hashed_password=get_password_hash(ADMIN_PASSWORD),
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE,
                is_verified=True,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print("+ Admin user created")
        else:
            admin.name = ADMIN_NAME
            admin.phone = ADMIN_PHONE
            admin.email = ADMIN_EMAIL
            admin.hashed_password = get_password_hash(ADMIN_PASSWORD)
            admin.status = UserStatus.ACTIVE
            admin.is_verified = True
            db.commit()
            print("+ Admin user reset")
        print(f"Login: {ADMIN_PHONE} / {ADMIN_PASSWORD}")
    except Exception as e:
        print("X Failed:", e)
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()