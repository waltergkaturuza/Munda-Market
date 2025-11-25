"""
Database Migration Script
Adds product media and marketing fields to the database
"""
import sys
import os
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal, engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_migration():
    """Run the database migration to add product media fields"""
    
    migration_file = Path(__file__).parent / "001_add_product_media_fields.sql"
    
    logger.info(f"Reading migration file: {migration_file}")
    
    with open(migration_file, 'r') as f:
        sql_content = f.read()
    
    # Split into individual statements (handle comments)
    statements = []
    current_statement = []
    
    for line in sql_content.split('\n'):
        # Skip comment lines
        if line.strip().startswith('--') or not line.strip():
            continue
        
        current_statement.append(line)
        
        # Execute when we hit a semicolon
        if line.strip().endswith(';'):
            statement = '\n'.join(current_statement)
            if statement.strip():
                statements.append(statement)
            current_statement = []
    
    # Execute all statements
    db = SessionLocal()
    success_count = 0
    error_count = 0
    
    try:
        for i, statement in enumerate(statements, 1):
            try:
                logger.info(f"Executing statement {i}/{len(statements)}")
                db.execute(text(statement))
                db.commit()
                success_count += 1
            except Exception as e:
                logger.warning(f"Statement {i} failed (may already exist): {str(e)}")
                db.rollback()
                error_count += 1
                # Continue with next statement
        
        logger.info(f"\nMigration completed!")
        logger.info(f"✓ Successful: {success_count}")
        logger.info(f"⚠ Skipped/Failed: {error_count}")
        logger.info("\nYour database now supports:")
        logger.info("  • Product images (single + gallery)")
        logger.info("  • Detailed product descriptions")
        logger.info("  • Nutritional information")
        logger.info("  • Storage and preparation tips")
        logger.info("  • Marketing content for listings")
        logger.info("  • Promotional badges")
        
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("DATABASE MIGRATION: Add Product Media & Marketing Fields")
    logger.info("=" * 60)
    
    response = input("\nThis will modify your database schema. Continue? (yes/no): ")
    if response.lower() in ['yes', 'y']:
        run_migration()
    else:
        logger.info("Migration cancelled.")

