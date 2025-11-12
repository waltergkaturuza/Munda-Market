from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from pydantic import BaseModel

from ....core.database import get_db
from ....core.auth import get_current_active_user, require_buyer
from ....models.user import User, UserRole
from ....models.buyer import Buyer
from ....models.order import Order, OrderStatus
from ....models.crop import Crop
from ....models.pricing import Listing

router = APIRouter()


# ============= Pydantic Models =============
class BuyerDashboardStats(BaseModel):
    total_orders: int
    active_orders: int
    completed_orders: int
    total_spent: float
    monthly_spent: float
    average_order_value: float
    available_crops_count: int
    pending_payments: float
    recent_orders_count: int


class BuyerOrderSummary(BaseModel):
    order_id: int
    order_number: str
    total: float
    status: str
    created_at: datetime
    crop_names: List[str]


# ============= Buyer Dashboard Endpoints =============
@router.get("/dashboard/stats", response_model=BuyerDashboardStats)
async def get_buyer_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """Get dashboard statistics for the current buyer"""
    
    # Get buyer record
    buyer = db.query(Buyer).filter(Buyer.user_id == current_user.user_id).first()
    if not buyer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Buyer profile not found"
        )
    
    # Orders stats
    total_orders = db.query(Order).filter(Order.buyer_id == buyer.buyer_id).count()
    
    active_orders = db.query(Order).filter(
        Order.buyer_id == buyer.buyer_id,
        Order.status.in_([
            OrderStatus.PENDING_PAYMENT,
            OrderStatus.CONFIRMED,
            OrderStatus.PREPARING,
            OrderStatus.DISPATCHED,
            OrderStatus.IN_TRANSIT
        ])
    ).count()
    
    completed_orders = db.query(Order).filter(
        Order.buyer_id == buyer.buyer_id,
        Order.status == OrderStatus.DELIVERED
    ).count()
    
    # Revenue/spending stats
    total_spent_result = db.query(func.sum(Order.total)).filter(
        Order.buyer_id == buyer.buyer_id,
        Order.status == OrderStatus.DELIVERED
    ).scalar()
    total_spent = float(total_spent_result) if total_spent_result else 0.0
    
    # Monthly spending (current month)
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_spent_result = db.query(func.sum(Order.total)).filter(
        Order.buyer_id == buyer.buyer_id,
        Order.status == OrderStatus.DELIVERED,
        Order.actual_delivery_date >= month_start
    ).scalar()
    monthly_spent = float(monthly_spent_result) if monthly_spent_result else 0.0
    
    # Average order value
    average_order_value = total_spent / completed_orders if completed_orders > 0 else 0.0
    
    # Available crops count (active listings)
    available_crops_count = db.query(Listing).filter(
        Listing.is_active == True
    ).distinct(Listing.crop_id).count()
    
    # Pending payments (orders in PENDING_PAYMENT status)
    pending_payments_result = db.query(func.sum(Order.total)).filter(
        Order.buyer_id == buyer.buyer_id,
        Order.status == OrderStatus.PENDING_PAYMENT
    ).scalar()
    pending_payments = float(pending_payments_result) if pending_payments_result else 0.0
    
    # Recent orders (last 7 days)
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_orders_count = db.query(Order).filter(
        Order.buyer_id == buyer.buyer_id,
        Order.created_at >= week_ago
    ).count()
    
    return BuyerDashboardStats(
        total_orders=total_orders,
        active_orders=active_orders,
        completed_orders=completed_orders,
        total_spent=total_spent,
        monthly_spent=monthly_spent,
        average_order_value=average_order_value,
        available_crops_count=available_crops_count,
        pending_payments=pending_payments,
        recent_orders_count=recent_orders_count
    )


@router.get("/orders/recent", response_model=List[BuyerOrderSummary])
async def get_recent_orders(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """Get recent orders for the current buyer"""
    
    # Get buyer record
    buyer = db.query(Buyer).filter(Buyer.user_id == current_user.user_id).first()
    if not buyer:
        return []
    
    # Get recent orders
    orders = db.query(Order).filter(
        Order.buyer_id == buyer.buyer_id
    ).order_by(Order.created_at.desc()).limit(limit).all()
    
    result = []
    for order in orders:
        # Get crop names from order items
        from ....models.order import OrderItem
        order_items = db.query(OrderItem).filter(
            OrderItem.order_id == order.order_id
        ).all()
        
        crop_names = []
        for item in order_items:
            crop = db.query(Crop).filter(Crop.crop_id == item.crop_id).first()
            if crop:
                crop_names.append(crop.name)
        
        result.append(BuyerOrderSummary(
            order_id=order.order_id,
            order_number=order.order_number,
            total=float(order.total),
            status=order.status.value,
            created_at=order.created_at,
            crop_names=crop_names
        ))
    
    return result


@router.get("/profile", response_model=dict)
async def get_buyer_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """Get buyer profile information"""
    
    buyer = db.query(Buyer).filter(Buyer.user_id == current_user.user_id).first()
    if not buyer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Buyer profile not found"
        )
    
    return {
        "buyer_id": buyer.buyer_id,
        "user_id": buyer.user_id,
        "company_name": buyer.company_name,
        "business_type": buyer.business_type,
        "business_phone": buyer.business_phone,
        "business_email": buyer.business_email,
        "buyer_tier": buyer.buyer_tier.value if buyer.buyer_tier else None,
        "status": buyer.status.value if buyer.status else None,
        "payment_terms": buyer.payment_terms.value if buyer.payment_terms else None,
        "credit_limit": float(buyer.credit_limit) if buyer.credit_limit else 0.0,
        "current_credit_used": float(buyer.current_credit_used) if buyer.current_credit_used else 0.0,
        "is_verified": buyer.is_verified,
        "total_orders": buyer.total_orders,
        "total_spent": float(buyer.total_spent) if buyer.total_spent else 0.0,
        "average_order_value": float(buyer.average_order_value) if buyer.average_order_value else 0.0,
        "created_at": buyer.created_at.isoformat() if buyer.created_at else None,
        "last_order_date": buyer.last_order_date.isoformat() if buyer.last_order_date else None,
    }
