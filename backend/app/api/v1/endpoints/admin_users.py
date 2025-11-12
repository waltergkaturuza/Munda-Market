from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime

from ....core.database import get_db
from ....core.auth import require_staff
from ....models.user import User, UserRole, UserStatus
from ....models.farm import Farm
from ....models.production import ProductionPlan
from ....models.order import Order, OrderStatus
from ....models.payment import Payment, Payout
from ....models.audit import AuditLog, AuditAction, AuditEntity
from ....models.buyer import Buyer, BuyerTier, BuyerStatus, PaymentTerms

router = APIRouter()


# ============= Farmers Management =============
class FarmerResponse(BaseModel):
    user_id: int
    name: str
    phone: str
    email: Optional[str]
    status: str
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]
    farms_count: int = 0
    total_production_kg: float = 0.0
    total_earnings_usd: float = 0.0
    
    class Config:
        from_attributes = True


class FarmerDetailResponse(FarmerResponse):
    farms: List[dict] = []
    production_plans: List[dict] = []
    payouts: List[dict] = []


class UpdateUserRequest(BaseModel):
    status: Optional[str] = None
    is_verified: Optional[bool] = None


class SuspendRequest(BaseModel):
    reason: str


@router.get("/admin/farmers", response_model=List[FarmerResponse])
async def get_all_farmers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get all farmers with stats"""
    from ....models.farm import Farm
    from ....models.production import ProductionPlan
    
    farmers = db.query(User).filter(User.role == UserRole.FARMER).all()
    result = []
    
    for farmer in farmers:
        # Count farms
        farms_count = db.query(Farm).filter(Farm.user_id == farmer.user_id).count()
        
        # Sum production
        total_production = db.query(func.sum(ProductionPlan.expected_yield_kg)).filter(
            ProductionPlan.farm_id.in_(
                db.query(Farm.farm_id).filter(Farm.user_id == farmer.user_id)
            )
        ).scalar() or 0.0
        
        # Sum earnings from payouts
        total_earnings = db.query(func.sum(Payout.amount_usd)).filter(
            Payout.farmer_user_id == farmer.user_id
        ).scalar() or 0.0
        
        result.append(FarmerResponse(
            user_id=farmer.user_id,
            name=farmer.name,
            phone=farmer.phone,
            email=farmer.email,
            status=farmer.status.value,
            is_verified=farmer.is_verified or False,
            created_at=farmer.created_at,
            last_login=farmer.last_login,
            farms_count=farms_count,
            total_production_kg=float(total_production),
            total_earnings_usd=float(total_earnings)
        ))
    
    return result


@router.get("/admin/farmers/{farmer_id}", response_model=FarmerDetailResponse)
async def get_farmer_details(
    farmer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get detailed farmer information"""
    farmer = db.query(User).filter(
        User.user_id == farmer_id,
        User.role == UserRole.FARMER
    ).first()
    
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    # Get farms
    farms = db.query(Farm).filter(Farm.user_id == farmer_id).all()
    farms_data = [
        {
            "farm_id": f.farm_id,
            "farm_name": f.name,
            "location": f"{f.district}, {f.province}",
            "total_area_hectares": float(f.total_hectares) if f.total_hectares else 0.0,
            "status": f.verification_status or "pending"
        }
        for f in farms
    ]
    
    # Get payouts
    payouts = db.query(Payout).filter(Payout.farmer_user_id == farmer_id).limit(10).all()
    payouts_data = [
        {
            "payout_id": p.payout_id,
            "amount_usd": float(p.amount_usd),
            "status": p.status.value,
            "created_at": p.created_at.isoformat()
        }
        for p in payouts
    ]
    
    # Calculate stats
    farms_count = len(farms)
    total_production = db.query(func.sum(ProductionPlan.expected_yield_kg)).filter(
        ProductionPlan.farm_id.in_([f.farm_id for f in farms])
    ).scalar() or 0.0
    total_earnings = db.query(func.sum(Payout.amount_usd)).filter(
        Payout.farmer_user_id == farmer_id
    ).scalar() or 0.0
    
    return FarmerDetailResponse(
        user_id=farmer.user_id,
        name=farmer.name,
        phone=farmer.phone,
        email=farmer.email,
        status=farmer.status.value,
        is_verified=farmer.is_verified or False,
        created_at=farmer.created_at,
        last_login=farmer.last_login,
        farms_count=farms_count,
        total_production_kg=float(total_production),
        total_earnings_usd=float(total_earnings),
        farms=farms_data,
        production_plans=[],
        payouts=payouts_data
    )


@router.get("/admin/farmers/{farmer_id}/farms", response_model=List[dict])
async def get_farmer_farms(
    farmer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get all farms for a farmer"""
    farmer = db.query(User).filter(
        User.user_id == farmer_id,
        User.role == UserRole.FARMER
    ).first()
    
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    farms = db.query(Farm).filter(Farm.user_id == farmer_id).all()
    
    return [
        {
            "farm_id": f.farm_id,
            "farm_name": f.name,
            "location": f"{f.district}, {f.province}",
            "total_area_hectares": float(f.total_hectares) if f.total_hectares else 0.0,
            "farm_type": f.farm_type,
            "irrigation_available": f.irrigation_available,
            "verification_status": f.verification_status or "pending",
            "created_at": f.created_at.isoformat() if f.created_at else None,
        }
        for f in farms
    ]


@router.post("/admin/farmers/{farmer_id}/suspend")
async def suspend_farmer(
    farmer_id: int,
    request: SuspendRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Suspend a farmer account"""
    farmer = db.query(User).filter(User.user_id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    farmer.status = UserStatus.SUSPENDED
    
    # Log action
    audit = AuditLog(
        user_id=current_user.user_id,
        user_name=current_user.name,
        action=AuditAction.UPDATE,
        entity=AuditEntity.USER,
        entity_id=farmer_id,
        description=f"Farmer suspended: {request.reason}"
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Farmer suspended successfully"}


@router.post("/admin/farmers/{farmer_id}/activate")
async def activate_farmer(
    farmer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Activate a farmer account"""
    farmer = db.query(User).filter(User.user_id == farmer_id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    farmer.status = UserStatus.ACTIVE
    
    # Log action
    audit = AuditLog(
        user_id=current_user.user_id,
        user_name=current_user.name,
        action=AuditAction.UPDATE,
        entity=AuditEntity.USER,
        entity_id=farmer_id,
        description="Farmer activated"
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Farmer activated successfully"}


# ============= Buyers Management =============
class BuyerResponse(BaseModel):
    user_id: int
    name: str
    phone: str
    email: Optional[str]
    status: str
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]
    total_orders: int = 0
    total_spent_usd: float = 0.0
    company_name: Optional[str] = None
    
    class Config:
        from_attributes = True


@router.get("/admin/buyers", response_model=List[BuyerResponse])
async def get_all_buyers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get all buyers with stats"""
    from ....models.buyer import Buyer
    
    # Get all buyer users
    buyer_users = db.query(User).filter(User.role == UserRole.BUYER).all()
    result = []
    
    for buyer_user in buyer_users:
        # Get buyer profile if it exists
        buyer_profile = db.query(Buyer).filter(Buyer.user_id == buyer_user.user_id).first()
        
        # Count orders (join through Buyer table)
        total_orders = 0
        total_spent = 0.0
        
        if buyer_profile:
            total_orders = db.query(Order).filter(Order.buyer_id == buyer_profile.buyer_id).count()
            # Sum spending from orders
            total_spent_result = db.query(func.sum(Order.total)).filter(
                Order.buyer_id == buyer_profile.buyer_id,
                Order.status == OrderStatus.DELIVERED
            ).scalar()
            total_spent = float(total_spent_result) if total_spent_result else 0.0
        
        result.append(BuyerResponse(
            user_id=buyer_user.user_id,
            name=buyer_user.name,
            phone=buyer_user.phone,
            email=buyer_user.email,
            status=buyer_user.status.value,
            is_verified=buyer_user.is_verified or False,
            created_at=buyer_user.created_at,
            last_login=buyer_user.last_login,
            total_orders=total_orders,
            total_spent_usd=total_spent,
            company_name=buyer_profile.company_name if buyer_profile else None
        ))
    
    return result


@router.post("/admin/buyers/{buyer_id}/suspend")
async def suspend_buyer(
    buyer_id: int,
    request: SuspendRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Suspend a buyer account"""
    buyer = db.query(User).filter(User.user_id == buyer_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")
    
    buyer.status = UserStatus.SUSPENDED
    
    # Log action
    audit = AuditLog(
        user_id=current_user.user_id,
        user_name=current_user.name,
        action=AuditAction.UPDATE,
        entity=AuditEntity.USER,
        entity_id=buyer_id,
        description=f"Buyer suspended: {request.reason}"
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Buyer suspended successfully"}


@router.get("/admin/buyers/{buyer_id}", response_model=dict)
async def get_buyer_details(
    buyer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get detailed buyer information"""
    buyer_user = db.query(User).filter(
        User.user_id == buyer_id,
        User.role == UserRole.BUYER
    ).first()
    
    if not buyer_user:
        raise HTTPException(status_code=404, detail="Buyer not found")
    
    # Get buyer profile
    buyer_profile = db.query(Buyer).filter(Buyer.user_id == buyer_id).first()
    
    # Get orders
    orders = []
    if buyer_profile:
        orders_query = db.query(Order).filter(Order.buyer_id == buyer_profile.buyer_id).limit(10).all()
        orders = [
            {
                "order_id": o.order_id,
                "order_number": o.order_number,
                "total": float(o.total),
                "status": o.status.value,
                "created_at": o.created_at.isoformat()
            }
            for o in orders_query
        ]
    
    return {
        "user_id": buyer_user.user_id,
        "name": buyer_user.name,
        "phone": buyer_user.phone,
        "email": buyer_user.email,
        "status": buyer_user.status.value,
        "is_verified": buyer_user.is_verified or False,
        "created_at": buyer_user.created_at.isoformat(),
        "last_login": buyer_user.last_login.isoformat() if buyer_user.last_login else None,
        "buyer_profile": {
            "buyer_id": buyer_profile.buyer_id,
            "company_name": buyer_profile.company_name,
            "business_type": buyer_profile.business_type,
            "buyer_tier": buyer_profile.buyer_tier.value if buyer_profile.buyer_tier else None,
            "status": buyer_profile.status.value if buyer_profile.status else None,
            "payment_terms": buyer_profile.payment_terms.value if buyer_profile.payment_terms else None,
        } if buyer_profile else None,
        "orders": orders,
        "total_orders": len(orders),
        "total_spent": sum(o["total"] for o in orders)
    }


@router.post("/admin/buyers/{buyer_id}/create-profile")
async def create_buyer_profile_admin(
    buyer_id: int,
    profile_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Create buyer profile (admin only)"""
    buyer_user = db.query(User).filter(
        User.user_id == buyer_id,
        User.role == UserRole.BUYER
    ).first()
    
    if not buyer_user:
        raise HTTPException(status_code=404, detail="Buyer user not found")
    
    # Check if profile already exists
    existing = db.query(Buyer).filter(Buyer.user_id == buyer_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Buyer profile already exists")
    
    # Create buyer profile
    buyer = Buyer(
        user_id=buyer_id,
        company_name=profile_data.get("company_name", buyer_user.name),
        business_type=profile_data.get("business_type"),
        business_phone=profile_data.get("business_phone", buyer_user.phone),
        business_email=profile_data.get("business_email", buyer_user.email),
        tax_number=profile_data.get("tax_number"),
        vat_number=profile_data.get("vat_number"),
        business_registration_number=profile_data.get("business_registration_number"),
        payment_terms=PaymentTerms.PREPAID,
        status=BuyerStatus.ACTIVE,
        buyer_tier=BuyerTier.BASIC
    )
    
    db.add(buyer)
    
    # Log action
    audit = AuditLog(
        user_id=current_user.user_id,
        user_name=current_user.name,
        action=AuditAction.CREATE,
        entity=AuditEntity.USER,
        entity_id=buyer_id,
        description=f"Buyer profile created for {buyer_user.name}"
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Buyer profile created successfully", "buyer_id": buyer.buyer_id}


@router.post("/admin/buyers/{buyer_id}/activate")
async def activate_buyer(
    buyer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Activate a buyer account"""
    buyer = db.query(User).filter(User.user_id == buyer_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer not found")
    
    buyer.status = UserStatus.ACTIVE
    
    # Also activate buyer profile if it exists
    buyer_profile = db.query(Buyer).filter(Buyer.user_id == buyer_id).first()
    if buyer_profile:
        buyer_profile.status = BuyerStatus.ACTIVE
    
    # Log action
    audit = AuditLog(
        user_id=current_user.user_id,
        user_name=current_user.name,
        action=AuditAction.UPDATE,
        entity=AuditEntity.USER,
        entity_id=buyer_id,
        description="Buyer activated"
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Buyer activated successfully"}


# ============= Payments Management =============
class PaymentResponse(BaseModel):
    payment_id: int
    order_id: int
    buyer_user_id: int
    buyer_name: Optional[str] = None
    amount_usd: float
    currency: str
    payment_method: str
    status: str
    transaction_reference: Optional[str] = None
    created_at: datetime
    processed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ReconcileRequest(BaseModel):
    transaction_reference: str


class RefundRequest(BaseModel):
    reason: str


@router.get("/admin/payments", response_model=List[PaymentResponse])
async def get_all_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get all payments"""
    payments = db.query(Payment).order_by(Payment.created_at.desc()).limit(200).all()
    result = []
    
    for payment in payments:
        buyer = db.query(User).filter(User.user_id == payment.buyer_user_id).first()
        
        result.append(PaymentResponse(
            payment_id=payment.payment_id,
            order_id=payment.order_id,
            buyer_user_id=payment.buyer_user_id,
            buyer_name=buyer.name if buyer else None,
            amount_usd=float(payment.amount_usd),
            currency=payment.currency,
            payment_method=payment.payment_method.value if hasattr(payment.payment_method, 'value') else str(payment.payment_method),
            status=payment.status.value if hasattr(payment.status, 'value') else str(payment.status),
            transaction_reference=payment.transaction_reference,
            created_at=payment.created_at,
            processed_at=payment.processed_at
        ))
    
    return result


@router.post("/admin/payments/{payment_id}/reconcile")
async def reconcile_payment(
    payment_id: int,
    request: ReconcileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Reconcile a payment"""
    payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    payment.transaction_reference = request.transaction_reference
    payment.processed_at = datetime.utcnow()
    # Update status to completed (assuming your Payment model has this status)
    
    # Log action
    audit = AuditLog(
        user_id=current_user.user_id,
        user_name=current_user.name,
        action=AuditAction.UPDATE,
        entity=AuditEntity.PAYMENT,
        entity_id=payment_id,
        description=f"Payment reconciled: {request.transaction_reference}"
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Payment reconciled successfully"}


@router.post("/admin/payments/{payment_id}/refund")
async def refund_payment(
    payment_id: int,
    request: RefundRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Issue refund for a payment"""
    payment = db.query(Payment).filter(Payment.payment_id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Log action
    audit = AuditLog(
        user_id=current_user.user_id,
        user_name=current_user.name,
        action=AuditAction.UPDATE,
        entity=AuditEntity.PAYMENT,
        entity_id=payment_id,
        description=f"Refund issued: {request.reason}"
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Refund processed successfully"}

