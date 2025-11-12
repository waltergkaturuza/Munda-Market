"""
Reset or create a buyer user to known credentials.

Usage (from repo root):
  cd backend
  venv\\Scripts\\activate
  
  # For local database:
  python scripts/reset_buyer.py [phone_or_email] [password]
  
  # For Render production database:
  set DATABASE_URL=postgresql://user:pass@host/db
  python scripts/reset_buyer.py [phone_or_email] [password]
  
Examples:
  python scripts/reset_buyer.py +263771234567 buyer123
  python scripts/reset_buyer.py buyer@mundamarket.co.zw buyer123
  python scripts/reset_buyer.py  # Creates/resets default test buyer
  python scripts/reset_buyer.py --list  # List all buyers
"""
import sys
import os

# Add the backend directory to Python path so we can import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.core.auth import get_password_hash
from app.models.user import User, UserRole, UserStatus

# Default test buyer credentials
DEFAULT_BUYER_PHONE = "+263771234568"
DEFAULT_BUYER_PASSWORD = "buyer123"
DEFAULT_BUYER_NAME = "Test Buyer"
DEFAULT_BUYER_EMAIL = "buyer@mundamarket.co.zw"


def reset_buyer(identifier: str = None, password: str = None):
    """
    Reset or create a buyer user.
    
    Args:
        identifier: Phone number or email. If None, uses default test buyer.
        password: New password. If None, uses default password.
    """
    db = SessionLocal()
    try:
        # Determine identifier and password
        if identifier is None:
            identifier = DEFAULT_BUYER_PHONE
            buyer_name = DEFAULT_BUYER_NAME
            buyer_email = DEFAULT_BUYER_EMAIL
            buyer_phone = DEFAULT_BUYER_PHONE
        else:
            # Check if identifier is email or phone
            if '@' in identifier:
                buyer_email = identifier
                buyer_phone = None
            else:
                buyer_phone = identifier
                buyer_email = None
            
            # Try to find existing buyer
            existing = db.query(User).filter(
                (User.phone == buyer_phone) if buyer_phone else False,
                (User.email == buyer_email) if buyer_email else False
            ).first()
            
            if existing:
                buyer_name = existing.name or "Buyer User"
                if buyer_phone:
                    buyer_phone = existing.phone
                if buyer_email:
                    buyer_email = existing.email
            else:
                buyer_name = "Buyer User"
                if not buyer_phone:
                    buyer_phone = DEFAULT_BUYER_PHONE
                if not buyer_email:
                    buyer_email = DEFAULT_BUYER_EMAIL
        
        if password is None:
            password = DEFAULT_BUYER_PASSWORD
        
        # Find or create buyer
        buyer = db.query(User).filter(
            (User.phone == buyer_phone) | (User.email == buyer_email)
        ).first()
        
        if not buyer:
            # Create new buyer
            buyer = User(
                name=buyer_name,
                phone=buyer_phone,
                email=buyer_email,
                hashed_password=get_password_hash(password),
                role=UserRole.BUYER,
                status=UserStatus.ACTIVE,
                is_verified=True,
            )
            db.add(buyer)
            db.commit()
            db.refresh(buyer)
            print(f"+ Buyer user created: {buyer_phone} / {buyer_email}")
        else:
            # Update existing buyer
            buyer.name = buyer_name
            if buyer_phone:
                buyer.phone = buyer_phone
            if buyer_email:
                buyer.email = buyer_email
            buyer.hashed_password = get_password_hash(password)
            buyer.status = UserStatus.ACTIVE
            buyer.is_verified = True
            db.commit()
            print(f"+ Buyer user reset: {buyer.phone} / {buyer.email}")
        
        print(f"Login credentials:")
        print(f"  Phone: {buyer.phone}")
        if buyer.email:
            print(f"  Email: {buyer.email}")
        print(f"  Password: {password}")
        print(f"  User ID: {buyer.user_id}")
        print(f"  Status: {buyer.status.value}")
        
    except Exception as e:
        print(f"X Failed: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


def list_buyers():
    """List all buyer users"""
    db = SessionLocal()
    try:
        buyers = db.query(User).filter(User.role == UserRole.BUYER).all()
        if not buyers:
            print("No buyers found.")
            return
        
        print(f"\nFound {len(buyers)} buyer(s):\n")
        for buyer in buyers:
            print(f"  ID: {buyer.user_id}")
            print(f"  Name: {buyer.name}")
            print(f"  Phone: {buyer.phone}")
            print(f"  Email: {buyer.email or 'N/A'}")
            print(f"  Status: {buyer.status.value}")
            print(f"  Verified: {buyer.is_verified}")
            print()
    except Exception as e:
        print(f"X Failed to list buyers: {e}")
    finally:
        db.close()


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Reset or create buyer user')
    parser.add_argument('identifier', nargs='?', help='Phone number or email (optional, defaults to test buyer)')
    parser.add_argument('password', nargs='?', help='Password (optional, defaults to buyer123)')
    parser.add_argument('--list', action='store_true', help='List all buyers')
    
    args = parser.parse_args()
    
    if args.list:
        list_buyers()
    else:
        reset_buyer(args.identifier, args.password)


if __name__ == "__main__":
    main()

