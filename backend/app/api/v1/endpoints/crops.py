from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import json

from ....core.database import get_db
from ....models.crop import Crop, GradeSchema

router = APIRouter()


class CropResponse(BaseModel):
    crop_id: int
    name: str
    variety: Optional[str] = None
    category: Optional[str] = None
    unit: str
    perishability_days: Optional[int] = None
    base_price_usd_per_kg: Optional[float] = None
    is_active: bool
    
    # Media and marketing fields
    image_url: Optional[str] = None
    gallery_images: Optional[List[str]] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    
    # Nutritional and benefits
    nutritional_info: Optional[dict] = None
    health_benefits: Optional[str] = None
    
    # Storage and handling tips
    storage_tips: Optional[str] = None
    preparation_tips: Optional[str] = None
    
    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm(cls, crop):
        """Convert ORM model to Pydantic model with JSON parsing"""
        data = {
            'crop_id': crop.crop_id,
            'name': crop.name,
            'variety': crop.variety,
            'category': crop.category,
            'unit': crop.unit,
            'perishability_days': crop.perishability_days,
            'base_price_usd_per_kg': crop.base_price_usd_per_kg,
            'is_active': crop.is_active,
            'image_url': crop.image_url,
            'description': crop.description,
            'short_description': crop.short_description,
            'health_benefits': crop.health_benefits,
            'storage_tips': crop.storage_tips,
            'preparation_tips': crop.preparation_tips,
        }
        
        # Parse JSON fields
        try:
            data['gallery_images'] = json.loads(crop.gallery_images) if crop.gallery_images else None
        except (json.JSONDecodeError, TypeError):
            data['gallery_images'] = None
        
        try:
            data['nutritional_info'] = json.loads(crop.nutritional_info) if crop.nutritional_info else None
        except (json.JSONDecodeError, TypeError):
            data['nutritional_info'] = None
        
        return cls(**data)


@router.get("/", response_model=List[CropResponse])
async def list_crops(
    skip: int = 0,
    limit: int = 100,
    category: str = None,
    db: Session = Depends(get_db)
):
    """List available crops"""
    query = db.query(Crop).filter(Crop.is_active == True)
    
    if category:
        query = query.filter(Crop.category == category)
    
    crops = query.offset(skip).limit(limit).all()
    return [CropResponse.from_orm(crop) for crop in crops]


class CropCreate(BaseModel):
    """Schema for creating/updating crops with media"""
    name: str
    variety: Optional[str] = None
    scientific_name: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    unit: str = "kg"
    
    # Media and marketing
    image_url: Optional[str] = None
    gallery_images: Optional[List[str]] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    
    # Nutritional and benefits
    nutritional_info: Optional[dict] = None
    health_benefits: Optional[str] = None
    
    # Storage and handling
    storage_tips: Optional[str] = None
    preparation_tips: Optional[str] = None
    
    # Other fields
    perishability_days: Optional[int] = None
    cold_chain_required: bool = False
    base_price_usd_per_kg: Optional[float] = None


@router.get("/{crop_id}", response_model=CropResponse)
async def get_crop(
    crop_id: int,
    db: Session = Depends(get_db)
):
    """Get specific crop details"""
    crop = db.query(Crop).filter(Crop.crop_id == crop_id, Crop.is_active == True).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    return CropResponse.from_orm(crop)


@router.post("/", response_model=CropResponse)
async def create_crop(
    crop_data: CropCreate,
    db: Session = Depends(get_db)
):
    """Create a new crop with media and marketing content"""
    # Convert lists/dicts to JSON strings for database storage
    crop_dict = crop_data.model_dump()
    
    if crop_dict.get('gallery_images'):
        crop_dict['gallery_images'] = json.dumps(crop_dict['gallery_images'])
    
    if crop_dict.get('nutritional_info'):
        crop_dict['nutritional_info'] = json.dumps(crop_dict['nutritional_info'])
    
    crop = Crop(**crop_dict)
    db.add(crop)
    db.commit()
    db.refresh(crop)
    
    return CropResponse.from_orm(crop)


@router.put("/{crop_id}", response_model=CropResponse)
async def update_crop(
    crop_id: int,
    crop_data: CropCreate,
    db: Session = Depends(get_db)
):
    """Update crop details including media"""
    crop = db.query(Crop).filter(Crop.crop_id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")
    
    # Update fields
    update_dict = crop_data.model_dump(exclude_unset=True)
    
    # Convert lists/dicts to JSON strings
    if 'gallery_images' in update_dict and update_dict['gallery_images']:
        update_dict['gallery_images'] = json.dumps(update_dict['gallery_images'])
    
    if 'nutritional_info' in update_dict and update_dict['nutritional_info']:
        update_dict['nutritional_info'] = json.dumps(update_dict['nutritional_info'])
    
    for key, value in update_dict.items():
        setattr(crop, key, value)
    
    db.commit()
    db.refresh(crop)
    
    return CropResponse.from_orm(crop)
