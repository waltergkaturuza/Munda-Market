"""
Seed Script: Add Sample Product Media
Populates crops with attractive images and marketing content
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models.crop import Crop
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


SAMPLE_CROPS_WITH_MEDIA = [
    {
        "name": "Tomato",
        "variety": "Roma",
        "category": "vegetable",
        "subcategory": "fruit vegetable",
        "image_url": "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?q=80&w=800&auto=format&fit=crop",
        "gallery_images": [
            "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1514512364185-4c2b1c7e4b39?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?q=80&w=1200&auto=format&fit=crop"
        ],
        "short_description": "Fresh, vine-ripened tomatoes perfect for salads and cooking",
        "description": "Our premium Roma tomatoes are carefully grown using sustainable farming practices in the rich soils of Zimbabwe. Each tomato is hand-picked at peak ripeness to ensure maximum flavor and nutritional value. These versatile tomatoes are perfect for sauces, salads, or eating fresh.",
        "nutritional_info": {
            "calories": "18 per 100g",
            "vitamin_c": "21% DV",
            "vitamin_a": "17% DV",
            "potassium": "5% DV",
            "lycopene": "High"
        },
        "health_benefits": "Tomatoes are rich in lycopene, a powerful antioxidant that supports heart health and may reduce cancer risk. They're also an excellent source of vitamins C and K, potassium, and folate. Regular consumption supports eye health, skin health, and immune function.",
        "storage_tips": "Store at room temperature away from direct sunlight until fully ripe. Once ripe, refrigerate to extend freshness for up to 7 days. For best flavor, bring to room temperature 30 minutes before eating.",
        "preparation_tips": "Wash thoroughly under cold water before use. For easy peeling, blanch in boiling water for 30 seconds, then plunge into ice water. Remove the core with a paring knife. For salads, slice just before serving to preserve texture."
    },
    {
        "name": "Onion",
        "variety": "Red",
        "category": "vegetable",
        "subcategory": "root vegetable",
        "image_url": "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=800&auto=format&fit=crop",
        "gallery_images": [
            "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1587411768693-084f5b62e8ff?q=80&w=1200&auto=format&fit=crop"
        ],
        "short_description": "Sweet and crisp red onions with vibrant color",
        "description": "Our red onions are known for their mild, sweet flavor and beautiful deep purple color. Grown in Zimbabwe's ideal climate, these onions have a perfect balance of sweetness and bite. Excellent for raw applications in salads, sandwiches, and garnishes, or cooked in your favorite recipes.",
        "nutritional_info": {
            "calories": "40 per 100g",
            "vitamin_c": "12% DV",
            "vitamin_b6": "6% DV",
            "folate": "5% DV",
            "quercetin": "High"
        },
        "health_benefits": "Red onions contain powerful antioxidants, particularly quercetin and anthocyanins. These compounds support heart health, reduce inflammation, and may help regulate blood sugar. Onions also support digestive health and boost immunity.",
        "storage_tips": "Store in a cool, dry, well-ventilated place away from direct sunlight. Keep away from potatoes as they can cause onions to spoil faster. Properly stored onions can last 2-3 months. Once cut, wrap tightly and refrigerate for up to 7 days.",
        "preparation_tips": "To reduce tears when cutting, chill onions in the refrigerator for 30 minutes before cutting. Use a sharp knife and cut near a window or exhaust fan. For raw use, slice thinly and soak in cold water for 10 minutes to mellow the flavor."
    },
    {
        "name": "Cabbage",
        "variety": "Green",
        "category": "vegetable",
        "subcategory": "leafy vegetable",
        "image_url": "https://images.unsplash.com/photo-1607301405390-7e0070bd2f9f?q=80&w=800&auto=format&fit=crop",
        "gallery_images": [
            "https://images.unsplash.com/photo-1607301405390-7e0070bd2f9f?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1567302543636-2e0b1af1b3ac?q=80&w=1200&auto=format&fit=crop"
        ],
        "short_description": "Crisp, fresh green cabbage with tightly packed leaves",
        "description": "Our green cabbage is harvested at peak maturity, ensuring firm, dense heads with crisp, sweet leaves. Grown using sustainable farming methods, this versatile vegetable is perfect for coleslaw, stir-fries, soups, or fermenting into nutritious sauerkraut. Each head is carefully selected for quality.",
        "nutritional_info": {
            "calories": "25 per 100g",
            "vitamin_c": "61% DV",
            "vitamin_k": "85% DV",
            "folate": "11% DV",
            "fiber": "High"
        },
        "health_benefits": "Cabbage is exceptionally high in vitamin C and K, supporting immune function and bone health. Rich in antioxidants and anti-inflammatory compounds, it may help reduce cancer risk. The high fiber content supports digestive health and weight management.",
        "storage_tips": "Store whole cabbage in the refrigerator crisper drawer, wrapped in plastic or a produce bag. It will stay fresh for up to 2 weeks. Once cut, wrap tightly in plastic wrap and use within 3-5 days for best quality.",
        "preparation_tips": "Remove outer leaves if damaged. Cut in half, remove core, and slice to desired thickness. For coleslaw, slice very thinly and salt lightly to draw out moisture. For cooking, cut into wedges or chop as needed. Cabbage reduces significantly when cooked."
    },
    {
        "name": "Butternut",
        "variety": "Standard",
        "category": "vegetable",
        "subcategory": "squash",
        "image_url": "https://images.unsplash.com/photo-1582642221644-9a5c0a51a140?q=80&w=800&auto=format&fit=crop",
        "gallery_images": [
            "https://images.unsplash.com/photo-1582642221644-9a5c0a51a140?q=80&w=1200&auto=format&fit=crop"
        ],
        "short_description": "Sweet, nutty butternut squash with rich orange flesh",
        "description": "Our butternut squash is grown in nutrient-rich soil, producing vegetables with sweet, nutty flavor and creamy texture. The deep orange flesh indicates high beta-carotene content. Perfect for roasting, soups, risottos, or as a healthy side dish. Each squash is cured for optimal sweetness and storage life.",
        "nutritional_info": {
            "calories": "45 per 100g",
            "vitamin_a": "212% DV",
            "vitamin_c": "35% DV",
            "potassium": "10% DV",
            "fiber": "High"
        },
        "health_benefits": "Butternut squash is exceptionally high in vitamin A (beta-carotene), crucial for eye health and immune function. It's also rich in antioxidants that may reduce inflammation and lower disease risk. The high fiber content supports digestive health and blood sugar control.",
        "storage_tips": "Store whole butternut squash in a cool, dry place for up to 3 months. Do not refrigerate whole squash as cold temperatures can cause it to spoil faster. Once cut, wrap tightly and refrigerate for up to 5 days, or freeze cubes for up to 3 months.",
        "preparation_tips": "Pierce skin several times and microwave for 2-3 minutes to make peeling easier. Cut off ends, peel with a vegetable peeler, cut in half lengthwise, and scoop out seeds. Cube or slice as needed. Roast at 200°C for 25-30 minutes for best flavor."
    },
    {
        "name": "Bell Pepper",
        "variety": "Green",
        "category": "vegetable",
        "subcategory": "fruit vegetable",
        "image_url": "https://images.unsplash.com/photo-1542835435-4fa357baa00b?q=80&w=800&auto=format&fit=crop",
        "gallery_images": [
            "https://images.unsplash.com/photo-1542835435-4fa357baa00b?q=80&w=1200&auto=format&fit=crop"
        ],
        "short_description": "Crisp, fresh green peppers with mild, grassy flavor",
        "description": "Our green bell peppers are harvested young for a mild, slightly grassy flavor and crisp texture. Grown in optimal conditions, these peppers have thick walls and glossy skin. Versatile in the kitchen, use them raw in salads, stuffed and baked, or sautéed in stir-fries. A staple ingredient for countless dishes.",
        "nutritional_info": {
            "calories": "20 per 100g",
            "vitamin_c": "128% DV",
            "vitamin_b6": "15% DV",
            "vitamin_a": "7% DV",
            "fiber": "Good source"
        },
        "health_benefits": "Green bell peppers are extremely high in vitamin C, providing more than your daily needs in one serving. They support immune health, skin health, and iron absorption. The antioxidants lutein and zeaxanthin support eye health, while the fiber aids digestion.",
        "storage_tips": "Store unwashed peppers in the refrigerator crisper drawer in a plastic bag for up to 1-2 weeks. Do not wash until ready to use, as moisture can cause spoilage. Cut peppers should be stored in an airtight container and used within 3-4 days.",
        "preparation_tips": "Wash peppers just before use. Cut off the top, remove seeds and white membrane. Slice into rings or strips as needed. For stuffing, cut off top and carefully remove seeds. To roast, place whole peppers under broiler until blackened, then peel off skin."
    },
    {
        "name": "Carrot",
        "variety": "Orange",
        "category": "vegetable",
        "subcategory": "root vegetable",
        "image_url": "https://images.unsplash.com/photo-1560786466-6c9fc0e9bb49?q=80&w=800&auto=format&fit=crop",
        "gallery_images": [
            "https://images.unsplash.com/photo-1560786466-6c9fc0e9bb49?q=80&w=1200&auto=format&fit=crop"
        ],
        "short_description": "Sweet, crunchy carrots perfect for snacking or cooking",
        "description": "Our carrots are grown in deep, sandy soil that produces straight, uniform roots with excellent color and flavor. Sweet and crunchy, these carrots are perfect for eating raw, juicing, roasting, or adding to soups and stews. Each carrot is carefully washed and sorted for quality.",
        "nutritional_info": {
            "calories": "41 per 100g",
            "vitamin_a": "184% DV",
            "vitamin_k": "16% DV",
            "vitamin_c": "9% DV",
            "fiber": "Good source"
        },
        "health_benefits": "Carrots are famous for their high beta-carotene content, which the body converts to vitamin A. This supports eye health, particularly night vision. The antioxidants in carrots may reduce cancer risk and support heart health. The fiber content aids digestion and weight management.",
        "storage_tips": "Remove green tops if attached (they draw moisture from roots). Store carrots in a plastic bag in the refrigerator crisper drawer for up to 3-4 weeks. For longer storage, keep in a container of water in the fridge, changing water every 4-5 days.",
        "preparation_tips": "Scrub carrots under cold water with a vegetable brush. Peeling is optional - much nutrition is in the skin. Cut off both ends. Slice, dice, or julienne as needed. For even cooking, cut pieces to similar sizes. Roast at 200°C for 20-25 minutes for caramelized flavor."
    }
]


def seed_product_media():
    """Add sample product media to existing crops or create new ones"""
    
    db = SessionLocal()
    updated_count = 0
    created_count = 0
    
    try:
        for crop_data in SAMPLE_CROPS_WITH_MEDIA:
            # Check if crop already exists
            existing_crop = db.query(Crop).filter(
                Crop.name == crop_data["name"],
                Crop.variety == crop_data.get("variety")
            ).first()
            
            # Prepare data with JSON fields
            db_data = crop_data.copy()
            if "gallery_images" in db_data:
                db_data["gallery_images"] = json.dumps(db_data["gallery_images"])
            if "nutritional_info" in db_data:
                db_data["nutritional_info"] = json.dumps(db_data["nutritional_info"])
            
            if existing_crop:
                # Update existing crop
                logger.info(f"Updating {crop_data['name']} ({crop_data.get('variety', 'N/A')})...")
                for key, value in db_data.items():
                    if key not in ["name"]:  # Don't update name
                        setattr(existing_crop, key, value)
                updated_count += 1
            else:
                # Create new crop
                logger.info(f"Creating {crop_data['name']} ({crop_data.get('variety', 'N/A')})...")
                
                # Add default fields for new crops
                if "unit" not in db_data:
                    db_data["unit"] = "kg"
                if "perishability_days" not in db_data:
                    db_data["perishability_days"] = 7
                if "base_price_usd_per_kg" not in db_data:
                    db_data["base_price_usd_per_kg"] = 1.0
                if "is_active" not in db_data:
                    db_data["is_active"] = True
                
                new_crop = Crop(**db_data)
                db.add(new_crop)
                created_count += 1
        
        db.commit()
        
        logger.info("\n" + "=" * 60)
        logger.info("✓ Product media seeding completed!")
        logger.info(f"  • Created: {created_count} new crops")
        logger.info(f"  • Updated: {updated_count} existing crops")
        logger.info("=" * 60)
        logger.info("\nYour crops now have:")
        logger.info("  • Beautiful product images")
        logger.info("  • Detailed descriptions")
        logger.info("  • Nutritional information")
        logger.info("  • Storage and preparation tips")
        logger.info("\nYou can view them at: GET /api/v1/crops/")
        
    except Exception as e:
        logger.error(f"Error seeding product media: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("SEED SCRIPT: Product Media & Marketing Content")
    logger.info("=" * 60)
    logger.info("\nThis will add images and descriptions to crops.")
    
    response = input("\nContinue? (yes/no): ")
    if response.lower() in ['yes', 'y']:
        seed_product_media()
    else:
        logger.info("Seeding cancelled.")

