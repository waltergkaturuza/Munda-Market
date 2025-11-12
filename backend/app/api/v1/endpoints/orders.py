from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import json
import os

from ....core.database import get_db
from ....core.auth import get_current_active_user
from ....models.user import User
from ....models.order import Order, OrderStatus
from ....models.crop import Crop

router = APIRouter()

ORDERS_FILE = os.path.join(os.path.dirname(__file__), '../../../..', 'orders_mvp.json')


class OrderItemIn(BaseModel):
    id: str
    name: str
    price: float = Field(ge=0)
    qtyKg: float = Field(gt=0)


class OrderIn(BaseModel):
    items: List[OrderItemIn]
    delivery_district: Optional[str] = None
    delivery_address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None

    @field_validator('items')
    @classmethod
    def validate_items(cls, v):
        if not v or len(v) == 0:
            raise ValueError('Order must contain at least one item')
        return v


@router.post("/preview")
async def preview_order(order: OrderIn):
    # Per-item lines
    lines = [
        {
            "id": i.id,
            "name": i.name,
            "qtyKg": i.qtyKg,
            "unit_price": i.price,
            "line_total": round(i.price * i.qtyKg, 2),
        }
        for i in order.items
    ]
    subtotal = round(sum(x["line_total"] for x in lines), 2)
    total_kg = round(sum(i.qtyKg for i in order.items), 2)

    # Simple delivery estimate with district modifier
    base = 5.0
    per_kg = 0.06
    modifier = 1.0
    if order.delivery_district:
        d = order.delivery_district.lower()
        if d.startswith('bulawayo'):
            modifier = 1.2
        elif d.startswith('harare'):
            modifier = 0.9
    delivery_fee = round((base + per_kg * total_kg) * modifier, 2)
    service_fee = round(0.02 * subtotal, 2)
    total = round(subtotal + delivery_fee + service_fee, 2)
    return {
        "lines": lines,
        "total_kg": total_kg,
        "subtotal": round(subtotal, 2),
        "delivery_fee": delivery_fee,
        "service_fee": service_fee,
        "total": total,
        "currency": "USD",
    }


@router.post("/")
async def submit_order(order: OrderIn):
    preview = await preview_order(order)
    record = {
        "order_number": f"M-{str(abs(hash(json.dumps(order.model_dump(), sort_keys=True))))[:6]}",
        "order": order.model_dump(),
        "totals": preview,
    }
    try:
        existing = []
        if os.path.exists(ORDERS_FILE):
            with open(ORDERS_FILE, 'r', encoding='utf-8') as f:
                existing = json.load(f)
        existing.append(record)
        with open(ORDERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(existing, f, indent=2)
    except Exception:
        # If file write fails, still return the record
        pass
    return record


# Admin endpoint to list all orders
class OrderResponse(BaseModel):
    order_id: int
    buyer_user_id: int
    buyer_name: Optional[str] = None
    crop_id: int
    crop_name: Optional[str] = None
    quantity_kg: float
    unit_price_usd: float
    total_amount_usd: float
    status: str
    delivery_date: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("/", response_model=List[OrderResponse])
async def list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    status: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000)
):
    """List all orders (admin/ops only or user's own orders)"""
    query = db.query(Order)
    
    # If not admin/ops, only show user's own orders
    if current_user.role.value not in ['ADMIN', 'OPS']:
        query = query.filter(Order.buyer_user_id == current_user.user_id)
    
    if status:
        query = query.filter(Order.status == status)
    
    orders = query.order_by(Order.created_at.desc()).limit(limit).all()
    result = []
    
    for order in orders:
        buyer = db.query(User).filter(User.user_id == order.buyer_user_id).first()
        crop = db.query(Crop).filter(Crop.crop_id == order.crop_id).first()
        
        result.append(OrderResponse(
            order_id=order.order_id,
            buyer_user_id=order.buyer_user_id,
            buyer_name=buyer.name if buyer else None,
            crop_id=order.crop_id,
            crop_name=crop.name if crop else None,
            quantity_kg=float(order.quantity_kg),
            unit_price_usd=float(order.unit_price_usd),
            total_amount_usd=float(order.total_price_usd),
            status=order.status.value,
            delivery_date=order.delivery_date,
            created_at=order.created_at
        ))
    
    return result


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update order status (admin/ops only)"""
    if current_user.role.value not in ['ADMIN', 'OPS']:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not authorized")
    
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Order not found")
    
    try:
        order.status = OrderStatus(status)
        db.commit()
        return {"message": "Order status updated successfully"}
    except ValueError:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
