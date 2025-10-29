#!/usr/bin/env python3
"""
Initialize the Munda Market database with tables and seed data
"""

import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__)))

from app.core.database import SessionLocal, create_tables
from app.utils.seed_data import seed_database


def main():
    """Initialize database and seed with initial data"""
    print("Initializing Munda Market database...")
    
    try:
        # Create all tables
        print("Creating database tables...")
        create_tables()
        print("+ Database tables created successfully")
        
        # Create database session
        db = SessionLocal()
        
        try:
            # Seed the database
            print("\nSeeding database with initial data...")
            seed_database(db)
            print("+ Database seeded successfully")
            
        except Exception as e:
            print(f"X Error seeding database: {e}")
            db.rollback()
            return 1
        finally:
            db.close()
            
    except Exception as e:
        print(f"X Error creating database tables: {e}")
        return 1
    
    print("\n* Database initialization completed successfully!")
    print("\nNext steps:")
    print("1. Start the API server: python -m uvicorn app.main:app --reload")
    print("2. Visit http://localhost:8000/docs for API documentation")
    print("3. Login with admin credentials: +263771234567 / admin123")
    
    return 0


if __name__ == "__main__":
    exit(main())
