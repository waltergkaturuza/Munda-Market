"""
Seed data for Munda Market database
"""
import json
from sqlalchemy.orm import Session
from ..models.crop import Crop, GradeSchema
from ..models.user import User, UserRole, UserStatus
from ..core.auth import get_password_hash


def create_grade_schemas(db: Session):
    """Create standard grade schemas for different crop types"""
    
    # Standard vegetable grading schema
    vegetable_schema = GradeSchema(
        name="Standard Vegetable Grading",
        description="Standard grading for fresh vegetables",
        rules_json=json.dumps({
            "A": {
                "description": "Premium quality - excellent appearance, uniform size, no defects",
                "size_tolerance": 10,  # % variance allowed
                "blemish_count": 0,
                "color_score_min": 9,
                "firmness_score_min": 9
            },
            "B": {
                "description": "Good quality - minor variations, minimal defects",
                "size_tolerance": 20,
                "blemish_count": 2,
                "color_score_min": 7,
                "firmness_score_min": 7
            },
            "C": {
                "description": "Standard quality - acceptable for processing",
                "size_tolerance": 30,
                "blemish_count": 5,
                "color_score_min": 5,
                "firmness_score_min": 5
            }
        })
    )
    
    # Fruit grading schema
    fruit_schema = GradeSchema(
        name="Standard Fruit Grading",
        description="Standard grading for fresh fruits with Brix requirements",
        rules_json=json.dumps({
            "A": {
                "description": "Premium quality - optimal ripeness and sweetness",
                "brix_min": 12,
                "size_tolerance": 10,
                "blemish_count": 0,
                "firmness_score_min": 8
            },
            "B": {
                "description": "Good quality - good flavor and appearance",
                "brix_min": 10,
                "size_tolerance": 20,
                "blemish_count": 2,
                "firmness_score_min": 6
            },
            "C": {
                "description": "Standard quality - suitable for juice/processing",
                "brix_min": 8,
                "size_tolerance": 30,
                "blemish_count": 5,
                "firmness_score_min": 4
            }
        })
    )
    
    # Leafy greens schema
    leafy_schema = GradeSchema(
        name="Leafy Greens Grading",
        description="Grading for leafy vegetables focusing on freshness",
        rules_json=json.dumps({
            "A": {
                "description": "Fresh, crisp leaves with vibrant color",
                "wilting_percentage": 0,
                "yellowing_percentage": 0,
                "pest_damage": 0
            },
            "B": {
                "description": "Good condition with minor wilting",
                "wilting_percentage": 5,
                "yellowing_percentage": 5,
                "pest_damage": 2
            },
            "C": {
                "description": "Acceptable for processing",
                "wilting_percentage": 15,
                "yellowing_percentage": 10,
                "pest_damage": 5
            }
        })
    )
    
    # Check if schemas already exist
    existing_schemas = db.query(GradeSchema).count()
    if existing_schemas == 0:
        db.add(vegetable_schema)
        db.add(fruit_schema)
        db.add(leafy_schema)
        db.commit()
        print("Grade schemas created successfully")
    
    return {
        "vegetable": vegetable_schema,
        "fruit": fruit_schema,
        "leafy": leafy_schema
    }


def create_crops(db: Session):
    """Create initial crop data"""
    
    # Get grade schemas
    vegetable_schema = db.query(GradeSchema).filter_by(name="Standard Vegetable Grading").first()
    fruit_schema = db.query(GradeSchema).filter_by(name="Standard Fruit Grading").first()
    leafy_schema = db.query(GradeSchema).filter_by(name="Leafy Greens Grading").first()
    
    crops_data = [
        # Vegetables
        {
            "name": "tomato",
            "variety": "roma",
            "scientific_name": "Solanum lycopersicum",
            "category": "vegetable",
            "subcategory": "fruit vegetable",
            "unit": "kg",
            "grade_schema_id": vegetable_schema.grade_schema_id if vegetable_schema else None,
            "perishability_days": 7,
            "cold_chain_required": False,
            "temperature_min": 10,
            "temperature_max": 25,
            "humidity_requirements": "85-90%",
            "typical_growing_days": 90,
            "seasons": json.dumps(["summer", "winter"]),
            "quality_parameters": json.dumps(["size", "color", "firmness", "brix"]),
            "base_price_usd_per_kg": 1.20
        },
        {
            "name": "onion",
            "variety": "red",
            "scientific_name": "Allium cepa",
            "category": "vegetable",
            "subcategory": "bulb vegetable",
            "unit": "kg",
            "grade_schema_id": vegetable_schema.grade_schema_id if vegetable_schema else None,
            "perishability_days": 30,
            "cold_chain_required": False,
            "temperature_min": 0,
            "temperature_max": 30,
            "humidity_requirements": "65-70%",
            "typical_growing_days": 120,
            "seasons": json.dumps(["winter", "summer"]),
            "quality_parameters": json.dumps(["size", "firmness", "dryness"]),
            "base_price_usd_per_kg": 0.80
        },
        {
            "name": "cabbage",
            "variety": "green",
            "scientific_name": "Brassica oleracea",
            "category": "vegetable",
            "subcategory": "leafy vegetable",
            "unit": "kg",
            "grade_schema_id": leafy_schema.grade_schema_id if leafy_schema else None,
            "perishability_days": 14,
            "cold_chain_required": False,
            "temperature_min": 0,
            "temperature_max": 25,
            "humidity_requirements": "90-95%",
            "typical_growing_days": 75,
            "seasons": json.dumps(["winter", "summer"]),
            "quality_parameters": json.dumps(["size", "color", "firmness", "pest_damage"]),
            "base_price_usd_per_kg": 0.60
        },
        {
            "name": "carrot",
            "variety": "orange",
            "scientific_name": "Daucus carota",
            "category": "vegetable",
            "subcategory": "root vegetable",
            "unit": "kg",
            "grade_schema_id": vegetable_schema.grade_schema_id if vegetable_schema else None,
            "perishability_days": 21,
            "cold_chain_required": False,
            "temperature_min": 0,
            "temperature_max": 25,
            "humidity_requirements": "90-95%",
            "typical_growing_days": 70,
            "seasons": json.dumps(["winter", "summer"]),
            "quality_parameters": json.dumps(["size", "color", "straightness", "firmness"]),
            "base_price_usd_per_kg": 0.70
        },
        
        # Leafy greens
        {
            "name": "spinach",
            "variety": "green",
            "scientific_name": "Spinacia oleracea",
            "category": "vegetable",
            "subcategory": "leafy green",
            "unit": "kg",
            "grade_schema_id": leafy_schema.grade_schema_id if leafy_schema else None,
            "perishability_days": 3,
            "cold_chain_required": True,
            "temperature_min": 0,
            "temperature_max": 5,
            "humidity_requirements": "95-100%",
            "typical_growing_days": 45,
            "seasons": json.dumps(["winter"]),
            "quality_parameters": json.dumps(["color", "freshness", "pest_damage"]),
            "base_price_usd_per_kg": 2.50
        },
        {
            "name": "lettuce",
            "variety": "iceberg",
            "scientific_name": "Lactuca sativa",
            "category": "vegetable",
            "subcategory": "leafy green",
            "unit": "kg",
            "grade_schema_id": leafy_schema.grade_schema_id if leafy_schema else None,
            "perishability_days": 5,
            "cold_chain_required": True,
            "temperature_min": 0,
            "temperature_max": 5,
            "humidity_requirements": "95-100%",
            "typical_growing_days": 50,
            "seasons": json.dumps(["winter", "summer"]),
            "quality_parameters": json.dumps(["crispness", "color", "head_density"]),
            "base_price_usd_per_kg": 2.00
        },
        
        # Fruits
        {
            "name": "orange",
            "variety": "navel",
            "scientific_name": "Citrus sinensis",
            "category": "fruit",
            "subcategory": "citrus",
            "unit": "kg",
            "grade_schema_id": fruit_schema.grade_schema_id if fruit_schema else None,
            "perishability_days": 14,
            "cold_chain_required": False,
            "temperature_min": 5,
            "temperature_max": 15,
            "humidity_requirements": "85-90%",
            "typical_growing_days": 270,
            "seasons": json.dumps(["winter"]),
            "quality_parameters": json.dumps(["size", "color", "brix", "juice_content"]),
            "base_price_usd_per_kg": 1.50
        },
        {
            "name": "banana",
            "variety": "cavendish",
            "scientific_name": "Musa acuminata",
            "category": "fruit",
            "subcategory": "tropical",
            "unit": "kg",
            "grade_schema_id": fruit_schema.grade_schema_id if fruit_schema else None,
            "perishability_days": 5,
            "cold_chain_required": False,
            "temperature_min": 12,
            "temperature_max": 25,
            "humidity_requirements": "85-90%",
            "typical_growing_days": 365,
            "seasons": json.dumps(["year_round"]),
            "quality_parameters": json.dumps(["ripeness", "size", "blemishes"]),
            "base_price_usd_per_kg": 1.00
        }
    ]
    
    # Check if crops already exist
    existing_crops = db.query(Crop).count()
    if existing_crops == 0:
        for crop_data in crops_data:
            crop = Crop(**crop_data)
            db.add(crop)
        
        db.commit()
        print(f"Created {len(crops_data)} crops successfully")


def create_admin_user(db: Session):
    """Create default admin user"""
    
    # Check if admin exists
    admin = db.query(User).filter_by(role=UserRole.ADMIN).first()
    if not admin:
        admin = User(
            name="System Administrator",
            phone="+263771234567",
            email="admin@mundamarket.co.zw",
            role=UserRole.ADMIN,
            hashed_password=get_password_hash("admin123"),
            status=UserStatus.ACTIVE,
            is_verified=True
        )
        db.add(admin)
        db.commit()
        print("Admin user created successfully")
        print("Login credentials: +263771234567 / admin123")


def seed_database(db: Session):
    """Run all seed data functions"""
    print("Starting database seeding...")
    
    create_grade_schemas(db)
    create_crops(db)
    create_admin_user(db)
    
    print("Database seeding completed successfully!")
