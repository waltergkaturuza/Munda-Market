from fastapi import APIRouter
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
import json
import os

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
