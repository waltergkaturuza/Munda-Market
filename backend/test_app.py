#!/usr/bin/env python3
"""
Test script to verify the FastAPI application can start
"""

import sys
import os

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__)))

def test_imports():
    """Test if all imports work correctly"""
    try:
        print("Testing imports...")
        
        # Test core imports
        from app.core.config import settings
        print("+ Core config imported")
        
        from app.core.database import Base, create_tables
        print("+ Database config imported")
        
        # Test model imports
        from app.models import User, Farm, Crop
        print("+ Models imported")
        
        # Test API imports
        from app.api.v1 import api_router
        print("+ API router imported")
        
        # Test main app
        from app.main import app
        print("+ Main app imported")
        
        print("\n* All imports successful!")
        return True
        
    except ImportError as e:
        print(f"X Import error: {e}")
        return False
    except Exception as e:
        print(f"X Unexpected error: {e}")
        return False


def main():
    """Run import tests"""
    print("Testing Munda Market application imports...\n")
    
    if test_imports():
        print("\nApplication is ready to run!")
        print("To start the server: python -m uvicorn app.main:app --reload")
        return 0
    else:
        print("\nPlease fix import errors before starting the server")
        return 1


if __name__ == "__main__":
    exit(main())
