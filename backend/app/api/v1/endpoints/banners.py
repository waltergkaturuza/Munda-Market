from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime
from pydantic import BaseModel, Field
import json

from ....core.database import get_db
from ....core.auth import get_current_active_user, require_staff
from ....models.user import User
from ....models.banner import Banner, BannerType, BannerPlatform

router = APIRouter()


# ============= Pydantic Models =============
class BannerCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1)
    banner_type: BannerType = BannerType.INFO
    platform: BannerPlatform = BannerPlatform.ALL
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    link_text: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: bool = True
    is_dismissible: bool = True
    priority: int = Field(default=0, ge=0)
    targeting_rules: Optional[dict] = None


class BannerUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    message: Optional[str] = Field(None, min_length=1)
    banner_type: Optional[BannerType] = None
    platform: Optional[BannerPlatform] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    link_text: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None
    is_dismissible: Optional[bool] = None
    priority: Optional[int] = Field(None, ge=0)
    targeting_rules: Optional[dict] = None


class BannerResponse(BaseModel):
    banner_id: int
    title: str
    message: str
    banner_type: BannerType
    platform: BannerPlatform
    image_url: Optional[str]
    link_url: Optional[str]
    link_text: Optional[str]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    is_active: bool
    is_dismissible: bool
    priority: int
    targeting_rules: Optional[dict]
    created_by: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============= Admin Endpoints =============
@router.post("/", response_model=BannerResponse, status_code=status.HTTP_201_CREATED)
async def create_banner(
    banner_data: BannerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Create a new banner (admin only)"""
    
    # Convert targeting_rules dict to JSON string
    targeting_json = None
    if banner_data.targeting_rules:
        targeting_json = json.dumps(banner_data.targeting_rules)
    
    banner = Banner(
        title=banner_data.title,
        message=banner_data.message,
        banner_type=banner_data.banner_type,
        platform=banner_data.platform,
        image_url=banner_data.image_url,
        link_url=banner_data.link_url,
        link_text=banner_data.link_text,
        start_date=banner_data.start_date,
        end_date=banner_data.end_date,
        is_active=banner_data.is_active,
        is_dismissible=banner_data.is_dismissible,
        priority=banner_data.priority,
        targeting_rules=targeting_json,
        created_by=current_user.user_id
    )
    
    db.add(banner)
    db.commit()
    db.refresh(banner)
    
    # Parse targeting_rules back to dict for response
    response_banner = BannerResponse.model_validate(banner)
    if banner.targeting_rules:
        response_banner.targeting_rules = json.loads(banner.targeting_rules)
    
    return response_banner


@router.get("/", response_model=List[BannerResponse])
async def list_banners(
    platform: Optional[BannerPlatform] = Query(None, description="Filter by platform"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """List all banners (admin only)"""
    
    query = db.query(Banner)
    
    if platform:
        query = query.filter(Banner.platform == platform)
    
    if is_active is not None:
        query = query.filter(Banner.is_active == is_active)
    
    banners = query.order_by(Banner.priority.desc(), Banner.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for banner in banners:
        banner_dict = BannerResponse.model_validate(banner).dict()
        if banner.targeting_rules:
            banner_dict['targeting_rules'] = json.loads(banner.targeting_rules)
        result.append(BannerResponse(**banner_dict))
    
    return result


@router.get("/{banner_id}", response_model=BannerResponse)
async def get_banner(
    banner_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get a specific banner by ID (admin only)"""
    
    banner = db.query(Banner).filter(Banner.banner_id == banner_id).first()
    if not banner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Banner not found"
        )
    
    response_banner = BannerResponse.model_validate(banner)
    if banner.targeting_rules:
        response_banner.targeting_rules = json.loads(banner.targeting_rules)
    
    return response_banner


@router.put("/{banner_id}", response_model=BannerResponse)
async def update_banner(
    banner_id: int,
    banner_data: BannerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Update a banner (admin only)"""
    
    banner = db.query(Banner).filter(Banner.banner_id == banner_id).first()
    if not banner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Banner not found"
        )
    
    # Update fields
    update_data = banner_data.dict(exclude_unset=True)
    
    # Handle targeting_rules conversion
    if 'targeting_rules' in update_data and update_data['targeting_rules'] is not None:
        update_data['targeting_rules'] = json.dumps(update_data['targeting_rules'])
    
    for field, value in update_data.items():
        setattr(banner, field, value)
    
    db.commit()
    db.refresh(banner)
    
    response_banner = BannerResponse.model_validate(banner)
    if banner.targeting_rules:
        response_banner.targeting_rules = json.loads(banner.targeting_rules)
    
    return response_banner


@router.delete("/{banner_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_banner(
    banner_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Delete a banner (admin only)"""
    
    banner = db.query(Banner).filter(Banner.banner_id == banner_id).first()
    if not banner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Banner not found"
        )
    
    db.delete(banner)
    db.commit()
    
    return None


# ============= Public Endpoints =============
@router.get("/active/{platform}", response_model=List[BannerResponse])
async def get_active_banners(
    platform: BannerPlatform,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_active_user)
):
    """Get active banners for a specific platform"""
    
    now = datetime.utcnow()
    
    # Build query for active banners
    query = db.query(Banner).filter(
        Banner.is_active == True,
        or_(
            Banner.platform == platform,
            Banner.platform == BannerPlatform.ALL
        ),
        or_(
            Banner.start_date == None,
            Banner.start_date <= now
        ),
        or_(
            Banner.end_date == None,
            Banner.end_date >= now
        )
    )
    
    # Apply targeting rules if user is authenticated
    # For now, we'll return all active banners matching the platform
    # TODO: Implement targeting rules filtering based on user role, tier, etc.
    
    banners = query.order_by(Banner.priority.desc(), Banner.created_at.desc()).all()
    
    result = []
    for banner in banners:
        banner_dict = BannerResponse.model_validate(banner).dict()
        if banner.targeting_rules:
            banner_dict['targeting_rules'] = json.loads(banner.targeting_rules)
        result.append(BannerResponse(**banner_dict))
    
    return result

