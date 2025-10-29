from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ....core.database import get_db
from ....models.crop import Crop, GradeSchema

router = APIRouter()


class CropResponse(BaseModel):
    crop_id: int
    name: str
    variety: str
    category: str
    unit: str
    perishability_days: int
    base_price_usd_per_kg: float
    is_active: bool
    
    class Config:
        from_attributes = True


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
