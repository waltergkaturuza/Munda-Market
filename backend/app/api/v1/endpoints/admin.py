from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from pydantic import BaseModel

from ....core.database import get_db
from ....core.auth import get_current_active_user, require_staff
from ....models.user import User, UserRole, UserStatus
from ....models.order import Order, OrderStatus
from ....models.farm import Farm
from ....models.crop import Crop
from ....models.production import ProductionPlan, ProductionStatus
from ....models.payment import Payout, PayoutStatus
from ....models.audit import AuditLog, AuditAction, AuditEntity
from ....models.pricing import PriceRule
from ....services.inventory_alerts import generate_inventory_alerts

router = APIRouter()


# ============= Dashboard Stats =============
class DashboardStats(BaseModel):
    total_farmers: int
    active_farmers: int
    total_buyers: int
    active_buyers: int
    total_orders: int
    orders_pending: int
    orders_in_transit: int
    orders_delivered_today: int
    total_revenue_usd: float
    revenue_this_month_usd: float
    pending_payouts_usd: float
    pending_kyc_count: int


@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get dashboard statistics for admin console"""
    
    # Farmers stats
    total_farmers = db.query(User).filter(User.role == UserRole.FARMER).count()
    active_farmers = db.query(User).filter(
        User.role == UserRole.FARMER,
        User.status == UserStatus.ACTIVE
    ).count()
    
    # Buyers stats
    total_buyers = db.query(User).filter(User.role == UserRole.BUYER).count()
    active_buyers = db.query(User).filter(
        User.role == UserRole.BUYER,
        User.status == UserStatus.ACTIVE
    ).count()
    
    # Orders stats
    total_orders = db.query(Order).count()
    orders_pending = db.query(Order).filter(Order.status == OrderStatus.PENDING_PAYMENT).count()
    orders_in_transit = db.query(Order).filter(Order.status == OrderStatus.DISPATCHED).count()
    
    # Orders delivered today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    orders_delivered_today = db.query(Order).filter(
        Order.status == OrderStatus.DELIVERED,
        Order.actual_delivery_date != None,
        Order.actual_delivery_date >= today_start
    ).count()
    
    # Revenue stats
    total_revenue = db.query(func.sum(Order.total)).filter(
        Order.status == OrderStatus.DELIVERED
    ).scalar() or 0.0
    
    # Revenue this month
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    revenue_this_month = db.query(func.sum(Order.total)).filter(
        Order.status == OrderStatus.DELIVERED,
        Order.actual_delivery_date != None,
        Order.actual_delivery_date >= month_start
    ).scalar() or 0.0
    
    # Pending payouts
    pending_payouts = db.query(func.sum(Payout.amount_usd)).filter(
        Payout.status == PayoutStatus.PENDING
    ).scalar() or 0.0
    
    # Pending KYC
    pending_kyc = db.query(User).filter(
        User.status == UserStatus.PENDING,
        User.is_verified == False
    ).count()
    
    return DashboardStats(
        total_farmers=total_farmers,
        active_farmers=active_farmers,
        total_buyers=total_buyers,
        active_buyers=active_buyers,
        total_orders=total_orders,
        orders_pending=orders_pending,
        orders_in_transit=orders_in_transit,
        orders_delivered_today=orders_delivered_today,
        total_revenue_usd=float(total_revenue),
        revenue_this_month_usd=float(revenue_this_month),
        pending_payouts_usd=float(pending_payouts),
        pending_kyc_count=pending_kyc
    )


# ============= KYC Management =============
class KYCSubmission(BaseModel):
    user_id: int
    name: str
    phone: str
    email: Optional[str]
    role: str
    status: str
    verification_documents: Optional[str]
    created_at: datetime
    is_verified: bool
    
    class Config:
        from_attributes = True


class KYCReviewRequest(BaseModel):
    user_id: int
    approved: bool
    notes: Optional[str] = None


@router.get("/admin/kyc/pending", response_model=List[KYCSubmission])
async def get_pending_kyc(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get pending KYC submissions"""
    pending_users = db.query(User).filter(
        User.status == UserStatus.PENDING,
        or_(User.is_verified == False, User.is_verified == None)
    ).all()
    
    return [KYCSubmission.model_validate(user) for user in pending_users]


@router.post("/admin/kyc/review")
async def review_kyc(
    review: KYCReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Approve or reject KYC submission"""
    user = db.query(User).filter(User.user_id == review.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if review.approved:
        user.status = UserStatus.ACTIVE
        user.is_verified = True
    else:
        user.status = UserStatus.DEACTIVATED
    
    # Log the action
    audit_log = AuditLog(
        user_id=current_user.user_id,
        user_name=current_user.name,
        action=AuditAction.APPROVE if review.approved else AuditAction.REJECT,
        entity=AuditEntity.USER,
        entity_id=user.user_id,
        description=f"KYC {'approved' if review.approved else 'rejected'}: {review.notes or 'No notes'}"
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": "KYC review completed successfully"}


# ============= Inventory Management =============
class InventoryItem(BaseModel):
    crop_id: int
    crop_name: str
    available_quantity_kg: float
    farms_growing: int
    avg_harvest_days: int
    base_price_usd_per_kg: float


@router.get("/admin/inventory/available", response_model=List[InventoryItem])
async def get_available_inventory(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get available inventory across all farms"""
    crops = db.query(Crop).filter(Crop.is_active == True).all()
    inventory_items = []
    
    for crop in crops:
        # Count farms growing this crop (any active production)
        farms_growing = db.query(ProductionPlan).join(Farm).filter(
            ProductionPlan.crop_id == crop.crop_id,
            ProductionPlan.status.in_([ProductionStatus.PLANTED, ProductionStatus.GROWING, ProductionStatus.FLOWERING])
        ).count()
        
        # Calculate available quantity (sum of harvest-ready production plans)
        available_qty = db.query(func.sum(ProductionPlan.expected_yield_kg)).filter(
            ProductionPlan.crop_id == crop.crop_id,
            ProductionPlan.status == ProductionStatus.HARVEST_READY
        ).scalar() or 0.0
        
        inventory_items.append(InventoryItem(
            crop_id=crop.crop_id,
            crop_name=crop.name,
            available_quantity_kg=float(available_qty),
            farms_growing=farms_growing,
            avg_harvest_days=crop.typical_growing_days or 90,
            base_price_usd_per_kg=float(crop.base_price_usd_per_kg)
        ))
    
    return inventory_items


# ============= Pricing Rules =============
class PricingRule(BaseModel):
    rule_id: int
    crop_id: int
    crop_name: Optional[str] = None
    min_quantity_kg: Optional[float] = None
    max_quantity_kg: Optional[float] = None
    markup_percentage: float
    priority: int
    active: bool
    
    class Config:
        from_attributes = True


class CreatePricingRuleRequest(BaseModel):
    crop_id: int
    min_quantity_kg: Optional[float] = None
    max_quantity_kg: Optional[float] = None
    markup_percentage: float
    priority: int = 1
    active: bool = True


@router.get("/admin/pricing/rules", response_model=List[PricingRule])
async def get_pricing_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get all pricing rules"""
    rules = db.query(PriceRule).order_by(PriceRule.priority.desc()).all()
    result = []
    
    for rule in rules:
        crop = db.query(Crop).filter(Crop.crop_id == rule.crop_id).first()
        rule_dict = {
            "rule_id": rule.rule_id,
            "crop_id": rule.crop_id,
            "crop_name": crop.name if crop else None,
            "min_quantity_kg": rule.min_quantity_kg,
            "max_quantity_kg": rule.max_quantity_kg,
            "markup_percentage": float(rule.markup_percentage),
            "priority": rule.priority,
            "active": rule.active
        }
        result.append(PricingRule(**rule_dict))
    
    return result


@router.post("/admin/pricing/rules", response_model=PricingRule)
async def create_pricing_rule(
    rule_data: CreatePricingRuleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Create new pricing rule"""
    new_rule = PriceRule(
        crop_id=rule_data.crop_id,
        min_quantity_kg=rule_data.min_quantity_kg,
        max_quantity_kg=rule_data.max_quantity_kg,
        markup_percentage=rule_data.markup_percentage,
        priority=rule_data.priority,
        active=rule_data.active
    )
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    
    crop = db.query(Crop).filter(Crop.crop_id == new_rule.crop_id).first()
    
    return PricingRule(
        rule_id=new_rule.rule_id,
        crop_id=new_rule.crop_id,
        crop_name=crop.name if crop else None,
        min_quantity_kg=new_rule.min_quantity_kg,
        max_quantity_kg=new_rule.max_quantity_kg,
        markup_percentage=float(new_rule.markup_percentage),
        priority=new_rule.priority,
        active=new_rule.active
    )


@router.delete("/admin/pricing/rules/{rule_id}")
async def delete_pricing_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Delete pricing rule"""
    rule = db.query(PriceRule).filter(PriceRule.rule_id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Pricing rule not found")
    
    db.delete(rule)
    db.commit()
    
    return {"message": "Pricing rule deleted successfully"}


# ============= Payouts Management =============
class PayoutResponse(BaseModel):
    payout_id: int
    farmer_user_id: int
    farmer_name: Optional[str] = None
    amount_usd: float
    currency: str
    status: str
    payment_method: str
    transaction_reference: Optional[str] = None
    created_at: datetime
    processed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


@router.get("/admin/payouts/pending", response_model=List[PayoutResponse])
async def get_pending_payouts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get pending payouts"""
    payouts = db.query(Payout).filter(Payout.status == PayoutStatus.PENDING).all()
    result = []
    
    for payout in payouts:
        farmer = db.query(User).filter(User.user_id == payout.farmer_user_id).first()
        result.append(PayoutResponse(
            payout_id=payout.payout_id,
            farmer_user_id=payout.farmer_user_id,
            farmer_name=farmer.name if farmer else None,
            amount_usd=float(payout.amount_usd),
            currency=payout.currency,
            status=payout.status.value,
            payment_method=payout.payment_method,
            transaction_reference=payout.transaction_reference,
            created_at=payout.created_at,
            processed_at=payout.processed_at
        ))
    
    return result


@router.get("/admin/payouts", response_model=List[PayoutResponse])
async def get_all_payouts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get all payouts"""
    payouts = db.query(Payout).order_by(Payout.created_at.desc()).limit(limit).all()
    result = []
    
    for payout in payouts:
        farmer = db.query(User).filter(User.user_id == payout.farmer_user_id).first()
        result.append(PayoutResponse(
            payout_id=payout.payout_id,
            farmer_user_id=payout.farmer_user_id,
            farmer_name=farmer.name if farmer else None,
            amount_usd=float(payout.amount_usd),
            currency=payout.currency,
            status=payout.status.value,
            payment_method=payout.payment_method,
            transaction_reference=payout.transaction_reference,
            created_at=payout.created_at,
            processed_at=payout.processed_at
        ))
    
    return result


class ProcessPayoutRequest(BaseModel):
    transaction_reference: Optional[str] = None


@router.post("/admin/payouts/{payout_id}/process")
async def process_payout(
    payout_id: int,
    request: ProcessPayoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Process a payout"""
    payout = db.query(Payout).filter(Payout.payout_id == payout_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")
    
    payout.status = PayoutStatus.PROCESSED
    payout.transaction_reference = request.transaction_reference
    payout.processed_at = datetime.utcnow()
    
    # Log the action
    audit_log = AuditLog(
        user_id=current_user.user_id,
        user_name=current_user.name,
        action=AuditAction.PAYOUT,
        entity=AuditEntity.PAYOUT,
        entity_id=payout_id,
        description=f"Payout processed: {request.transaction_reference or 'No reference'}"
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": "Payout processed successfully"}


# ============= Messaging =============
class MessageResponse(BaseModel):
    message_id: int
    recipient_user_id: int
    recipient_name: Optional[str] = None
    recipient_phone: Optional[str] = None
    channel: str
    message_body: str
    status: str
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None


@router.get("/admin/messages", response_model=List[MessageResponse])
async def get_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get message history"""
    # Placeholder: return empty list for now
    # In production, this would query a messages table
    return []


class SendMessageRequest(BaseModel):
    recipient_user_ids: List[int]
    channel: str  # SMS, WHATSAPP, EMAIL
    message_body: str


@router.post("/admin/messages/send")
async def send_message(
    request: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Send message to users"""
    # Placeholder implementation
    # In production, integrate with WhatsApp/SMS/Email services
    
    # Log the action
    audit_log = AuditLog(
        user_id=current_user.user_id,
        user_name=current_user.name,
        action=AuditAction.CREATE,
        entity=AuditEntity.SYSTEM,
        description=f"Message sent via {request.channel} to {len(request.recipient_user_ids)} recipients"
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": "Messages sent successfully", "count": len(request.recipient_user_ids)}


# ============= Audit Logs =============
class AuditLogResponse(BaseModel):
    audit_id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    action: str
    entity: Optional[str] = None
    entity_id: Optional[int] = None
    ip_address: Optional[str] = None
    description: Optional[str] = None
    ts: datetime
    
    class Config:
        from_attributes = True


@router.get("/admin/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get audit logs with optional filters"""
    query = db.query(AuditLog)
    
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action.contains(action))
    if entity_type:
        query = query.filter(AuditLog.entity == entity_type)
    
    logs = query.order_by(AuditLog.ts.desc()).limit(limit).all()
    result = []
    
    for log in logs:
        result.append(AuditLogResponse(
            audit_id=log.audit_id,
            user_id=log.user_id,
            user_name=log.user_name,
            action=log.action.value if hasattr(log.action, 'value') else str(log.action),
            entity=log.entity.value if hasattr(log.entity, 'value') else str(log.entity),
            entity_id=log.entity_id,
            ip_address=log.ip_address,
            description=log.description,
            ts=log.ts
        ))
    
    return result


# ============= Inventory Alert Generation =============
@router.post("/inventory/generate-alerts")
async def trigger_alert_generation(
    buyer_id: Optional[int] = Query(None, description="Optional: Generate alerts for specific buyer"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Manually trigger inventory alert generation (admin only)"""
    result = generate_inventory_alerts(db, buyer_user_id=buyer_id)
    return {
        "message": "Alert generation completed",
        "alerts_created": result["alerts_created"],
        "alerts_updated": result["alerts_updated"],
        "preferences_processed": result["total_processed"]
    }
