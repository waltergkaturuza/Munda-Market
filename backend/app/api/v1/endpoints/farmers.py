from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel, validator
import json

from ....core.database import get_db
from ....core.auth import get_current_active_user, require_farmer_or_admin
from ....models.user import User, UserRole
from ....models.farm import Farm
from ....models.production import ProductionPlan, Lot, ProductionStatus, LotStatus, IrrigationType
from ....models.crop import Crop

router = APIRouter()


# Pydantic models for farmers
class FarmCreate(BaseModel):
    name: str
    geohash: str
    latitude: float
    longitude: float
    ward: Optional[str] = None
    district: str
    province: str
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    postal_code: Optional[str] = None
    total_hectares: Optional[float] = None
    farm_type: Optional[str] = None
    irrigation_available: Optional[str] = None
    association_name: Optional[str] = None
    association_membership_id: Optional[str] = None
    
    @validator('latitude')
    def validate_latitude(cls, v):
        if not -90 <= v <= 90:
            raise ValueError('Latitude must be between -90 and 90')
        return v
    
    @validator('longitude')
    def validate_longitude(cls, v):
        if not -180 <= v <= 180:
            raise ValueError('Longitude must be between -180 and 180')
        return v


class FarmResponse(BaseModel):
    farm_id: int
    user_id: int
    name: str
    geohash: str
    ward: Optional[str]
    district: str
    province: str
    total_hectares: Optional[float]
    farm_type: Optional[str]
    irrigation_available: Optional[str]
    verification_status: str
    association_name: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ProductionPlanCreate(BaseModel):
    farm_id: int
    crop_id: int
    variety: Optional[str] = None
    hectares: float
    field_identifier: Optional[str] = None
    expected_planting_date: Optional[datetime] = None
    expected_harvest_window_start: Optional[datetime] = None
    expected_harvest_window_end: Optional[datetime] = None
    expected_yield_kg: Optional[float] = None
    target_price_per_kg: float
    irrigation: IrrigationType = IrrigationType.RAINFED
    input_supplier: Optional[str] = None
    seed_variety_details: Optional[dict] = None
    organic_certified: bool = False
    
    @validator('hectares')
    def validate_hectares(cls, v):
        if v <= 0:
            raise ValueError('Hectares must be greater than 0')
        return v
    
    @validator('target_price_per_kg')
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError('Target price must be greater than 0')
        return v


class ProductionPlanResponse(BaseModel):
    plan_id: int
    farm_id: int
    crop_id: int
    variety: Optional[str]
    hectares: float
    field_identifier: Optional[str]
    expected_planting_date: Optional[datetime]
    expected_harvest_window_start: Optional[datetime]
    expected_harvest_window_end: Optional[datetime]
    expected_yield_kg: Optional[float]
    target_price_per_kg: float
    irrigation: IrrigationType
    status: ProductionStatus
    organic_certified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class ProductionUpdate(BaseModel):
    status: Optional[ProductionStatus] = None
    actual_planting_date: Optional[datetime] = None
    harvest_start: Optional[datetime] = None
    harvest_end: Optional[datetime] = None
    actual_yield_kg: Optional[float] = None
    notes: Optional[str] = None


class LotCreate(BaseModel):
    plan_id: int
    grade: str
    available_kg: float
    min_order_kg: float = 1.0
    max_order_kg: Optional[float] = None
    size_range: Optional[str] = None
    color_description: Optional[str] = None
    brix_reading: Optional[float] = None
    harvest_date: Optional[datetime] = None
    
    @validator('available_kg')
    def validate_available_kg(cls, v):
        if v <= 0:
            raise ValueError('Available kg must be greater than 0')
        return v
    
    @validator('grade')
    def validate_grade(cls, v):
        if v not in ['A', 'B', 'C']:
            raise ValueError('Grade must be A, B, or C')
        return v


class LotResponse(BaseModel):
    lot_id: int
    lot_number: str
    plan_id: int
    grade: str
    available_kg: float
    reserved_kg: float
    sold_kg: float
    min_order_kg: float
    current_status: LotStatus
    harvest_date: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Farmer endpoints
@router.post("/", response_model=dict)
async def create_farmer_profile(
    profile_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update farmer profile with KYC information"""
    if current_user.role != UserRole.FARMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only farmers can create farmer profiles"
        )
    
    # Update user profile data
    current_user.profile_data = json.dumps(profile_data)
    db.commit()
    
    return {
        "message": "Farmer profile updated successfully",
        "user_id": current_user.user_id
    }


@router.get("/", response_model=List[dict])
async def list_farmers(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_farmer_or_admin),
    db: Session = Depends(get_db)
):
    """List farmers (admin only) or get own profile (farmer)"""
    if current_user.role == UserRole.ADMIN:
        farmers = db.query(User).filter(User.role == UserRole.FARMER).offset(skip).limit(limit).all()
        return [
            {
                "user_id": farmer.user_id,
                "name": farmer.name,
                "phone": farmer.phone,
                "status": farmer.status.value,
                "is_verified": farmer.is_verified,
                "created_at": farmer.created_at,
                "profile_data": json.loads(farmer.profile_data) if farmer.profile_data else None
            }
            for farmer in farmers
        ]
    else:
        return [{
            "user_id": current_user.user_id,
            "name": current_user.name,
            "phone": current_user.phone,
            "status": current_user.status.value,
            "is_verified": current_user.is_verified,
            "profile_data": json.loads(current_user.profile_data) if current_user.profile_data else None
        }]


@router.get("/{farmer_id}", response_model=dict)
async def get_farmer(
    farmer_id: int,
    current_user: User = Depends(require_farmer_or_admin),
    db: Session = Depends(get_db)
):
    """Get farmer details"""
    # Farmers can only access their own profile unless they're admin
    if current_user.role != UserRole.ADMIN and current_user.user_id != farmer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    farmer = db.query(User).filter(
        User.user_id == farmer_id,
        User.role == UserRole.FARMER
    ).first()
    
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer not found"
        )
    
    return {
        "user_id": farmer.user_id,
        "name": farmer.name,
        "phone": farmer.phone,
        "email": farmer.email,
        "status": farmer.status.value,
        "is_verified": farmer.is_verified,
        "created_at": farmer.created_at,
        "profile_data": json.loads(farmer.profile_data) if farmer.profile_data else None
    }


# Farm management endpoints
@router.post("/farms", response_model=FarmResponse)
async def create_farm(
    farm_data: FarmCreate,
    current_user: User = Depends(require_farmer_or_admin),
    db: Session = Depends(get_db)
):
    """Register a new farm"""
    # Create farm with location data
    # TODO: Add PostGIS support later
    # from geoalchemy2 import WKTElement
    
    farm = Farm(
        user_id=current_user.user_id,
        name=farm_data.name,
        geohash=farm_data.geohash,
        latitude=farm_data.latitude,
        longitude=farm_data.longitude,
        ward=farm_data.ward,
        district=farm_data.district,
        province=farm_data.province,
        address_line1=farm_data.address_line1,
        address_line2=farm_data.address_line2,
        postal_code=farm_data.postal_code,
        total_hectares=farm_data.total_hectares,
        farm_type=farm_data.farm_type,
        irrigation_available=farm_data.irrigation_available,
        association_name=farm_data.association_name,
        association_membership_id=farm_data.association_membership_id
    )
    
    db.add(farm)
    db.commit()
    db.refresh(farm)
    
    return FarmResponse.from_orm(farm)


@router.get("/farms", response_model=List[FarmResponse])
async def list_farms(
    current_user: User = Depends(require_farmer_or_admin),
    db: Session = Depends(get_db)
):
    """List farms for current farmer"""
    farms = db.query(Farm).filter(Farm.user_id == current_user.user_id).all()
    return [FarmResponse.from_orm(farm) for farm in farms]


# Production plan endpoints
@router.post("/production-plans", response_model=ProductionPlanResponse)
async def create_production_plan(
    plan_data: ProductionPlanCreate,
    current_user: User = Depends(require_farmer_or_admin),
    db: Session = Depends(get_db)
):
    """Create a new production plan"""
    # Verify farm ownership
    farm = db.query(Farm).filter(
        Farm.farm_id == plan_data.farm_id,
        Farm.user_id == current_user.user_id
    ).first()
    
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found or access denied"
        )
    
    # Verify crop exists
    crop = db.query(Crop).filter(Crop.crop_id == plan_data.crop_id).first()
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crop not found"
        )
    
    production_plan = ProductionPlan(
        farm_id=plan_data.farm_id,
        crop_id=plan_data.crop_id,
        variety=plan_data.variety,
        hectares=plan_data.hectares,
        field_identifier=plan_data.field_identifier,
        expected_planting_date=plan_data.expected_planting_date,
        expected_harvest_window_start=plan_data.expected_harvest_window_start,
        expected_harvest_window_end=plan_data.expected_harvest_window_end,
        expected_yield_kg=plan_data.expected_yield_kg,
        target_price_per_kg=plan_data.target_price_per_kg,
        irrigation=plan_data.irrigation,
        input_supplier=plan_data.input_supplier,
        seed_variety_details=json.dumps(plan_data.seed_variety_details) if plan_data.seed_variety_details else None,
        organic_certified=plan_data.organic_certified
    )
    
    db.add(production_plan)
    db.commit()
    db.refresh(production_plan)
    
    return ProductionPlanResponse.from_orm(production_plan)


@router.get("/production-plans", response_model=List[ProductionPlanResponse])
async def list_production_plans(
    current_user: User = Depends(require_farmer_or_admin),
    db: Session = Depends(get_db)
):
    """List production plans for current farmer"""
    # Get all farms for the farmer
    farm_ids = db.query(Farm.farm_id).filter(Farm.user_id == current_user.user_id).subquery()
    
    plans = db.query(ProductionPlan).filter(
        ProductionPlan.farm_id.in_(farm_ids)
    ).all()
    
    return [ProductionPlanResponse.from_orm(plan) for plan in plans]


@router.put("/production-plans/{plan_id}", response_model=ProductionPlanResponse)
async def update_production_plan(
    plan_id: int,
    update_data: ProductionUpdate,
    current_user: User = Depends(require_farmer_or_admin),
    db: Session = Depends(get_db)
):
    """Update production plan progress"""
    # Find plan and verify ownership
    plan = db.query(ProductionPlan).join(Farm).filter(
        ProductionPlan.plan_id == plan_id,
        Farm.user_id == current_user.user_id
    ).first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Production plan not found or access denied"
        )
    
    # Update fields
    if update_data.status:
        plan.status = update_data.status
    if update_data.actual_planting_date:
        plan.actual_planting_date = update_data.actual_planting_date
    if update_data.harvest_start:
        plan.harvest_start = update_data.harvest_start
    if update_data.harvest_end:
        plan.harvest_end = update_data.harvest_end
    if update_data.actual_yield_kg:
        plan.actual_yield_kg = update_data.actual_yield_kg
    
    # Add progress update to history
    if update_data.notes or update_data.status:
        progress_updates = json.loads(plan.progress_updates) if plan.progress_updates else []
        progress_updates.append({
            "date": datetime.utcnow().isoformat(),
            "status": update_data.status.value if update_data.status else None,
            "notes": update_data.notes
        })
        plan.progress_updates = json.dumps(progress_updates)
    
    db.commit()
    db.refresh(plan)
    
    return ProductionPlanResponse.from_orm(plan)


# Lot management endpoints
@router.post("/lots", response_model=LotResponse)
async def create_lot(
    lot_data: LotCreate,
    current_user: User = Depends(require_farmer_or_admin),
    db: Session = Depends(get_db)
):
    """Create a new lot from production plan"""
    # Verify plan ownership
    plan = db.query(ProductionPlan).join(Farm).filter(
        ProductionPlan.plan_id == lot_data.plan_id,
        Farm.user_id == current_user.user_id
    ).first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Production plan not found or access denied"
        )
    
    # Generate lot number
    import uuid
    lot_number = f"LOT-{plan.plan_id}-{uuid.uuid4().hex[:8].upper()}"
    
    lot = Lot(
        plan_id=lot_data.plan_id,
        lot_number=lot_number,
        grade=lot_data.grade,
        available_kg=lot_data.available_kg,
        min_order_kg=lot_data.min_order_kg,
        max_order_kg=lot_data.max_order_kg,
        size_range=lot_data.size_range,
        color_description=lot_data.color_description,
        brix_reading=lot_data.brix_reading,
        harvest_date=lot_data.harvest_date
    )
    
    db.add(lot)
    db.commit()
    db.refresh(lot)
    
    return LotResponse.from_orm(lot)


@router.get("/lots", response_model=List[LotResponse])
async def list_lots(
    current_user: User = Depends(require_farmer_or_admin),
    db: Session = Depends(get_db)
):
    """List lots for current farmer"""
    # Get all production plans for the farmer
    plan_ids = db.query(ProductionPlan.plan_id).join(Farm).filter(
        Farm.user_id == current_user.user_id
    ).subquery()
    
    lots = db.query(Lot).filter(Lot.plan_id.in_(plan_ids)).all()
    
    return [LotResponse.from_orm(lot) for lot in lots]


@router.post("/upload-photo")
async def upload_photo(
    file: UploadFile = File(...),
    lot_id: Optional[int] = None,
    plan_id: Optional[int] = None,
    current_user: User = Depends(require_farmer_or_admin),
    db: Session = Depends(get_db)
):
    """Upload photo for production progress or lot quality"""
    # For MVP, we'll just return a success message
    # In production, you would:
    # 1. Validate file type and size
    # 2. Upload to S3 or similar storage
    # 3. Save URL to database
    # 4. Optionally run image analysis for quality checking
    
    return {
        "message": "Photo uploaded successfully",
        "filename": file.filename,
        "lot_id": lot_id,
        "plan_id": plan_id
    }
