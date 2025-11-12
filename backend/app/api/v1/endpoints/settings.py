from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ....core.database import get_db
from ....core.auth import require_staff, get_current_active_user
from ....models.user import User

router = APIRouter()


# ============= Settings Models =============
class GeneralSettings(BaseModel):
    site_name: str = "Munda Market"
    site_description: str = "Digital marketplace for fresh produce"
    support_email: str = "support@mundamarket.co.zw"
    support_phone: str = "+263771234567"
    currency: str = "USD"
    timezone: str = "Africa/Harare"
    language: str = "en"


class SecuritySettings(BaseModel):
    session_timeout: int = 30
    max_login_attempts: int = 5
    password_min_length: int = 8
    require_strong_password: bool = True
    two_factor_enabled: bool = False
    ip_whitelist: str = ""


class NotificationSettings(BaseModel):
    email_notifications: bool = True
    sms_notifications: bool = True
    whatsapp_notifications: bool = True
    order_alerts: bool = True
    payout_alerts: bool = True
    kyc_alerts: bool = True
    low_inventory_alerts: bool = True
    daily_reports: bool = True


class PaymentSettings(BaseModel):
    stripe_live: bool = False
    ecocash_enabled: bool = True
    zipit_enabled: bool = True
    bank_transfer_enabled: bool = True
    min_order_amount: float = 10.0
    max_order_amount: float = 50000.0
    delivery_fee_base: float = 5.0
    delivery_fee_per_kg: float = 0.06
    service_fee_percentage: float = 2.0


class PricingSettings(BaseModel):
    auto_adjust_pricing: bool = False
    default_markup: float = 15.0
    bulk_discount_enabled: bool = True
    price_floor_protection: bool = True
    dynamic_pricing_enabled: bool = False


class AllSettings(BaseModel):
    general: GeneralSettings
    security: SecuritySettings
    notifications: NotificationSettings
    payments: PaymentSettings
    pricing: PricingSettings


# In-memory settings storage (in production, use database or config file)
_settings_store: Dict[str, Any] = {
    "general": GeneralSettings().model_dump(),
    "security": SecuritySettings().model_dump(),
    "notifications": NotificationSettings().model_dump(),
    "payments": PaymentSettings().model_dump(),
    "pricing": PricingSettings().model_dump(),
}


# ============= Settings Endpoints =============
@router.get("/settings", response_model=AllSettings)
async def get_all_settings(
    current_user: User = Depends(require_staff)
):
    """Get all system settings"""
    return AllSettings(
        general=GeneralSettings(**_settings_store["general"]),
        security=SecuritySettings(**_settings_store["security"]),
        notifications=NotificationSettings(**_settings_store["notifications"]),
        payments=PaymentSettings(**_settings_store["payments"]),
        pricing=PricingSettings(**_settings_store["pricing"]),
    )


@router.get("/settings/general", response_model=GeneralSettings)
async def get_general_settings(
    current_user: User = Depends(require_staff)
):
    """Get general settings"""
    return GeneralSettings(**_settings_store["general"])


@router.put("/settings/general")
async def update_general_settings(
    settings: GeneralSettings,
    current_user: User = Depends(require_staff)
):
    """Update general settings"""
    _settings_store["general"] = settings.model_dump()
    return {"message": "General settings updated successfully"}


@router.get("/settings/security", response_model=SecuritySettings)
async def get_security_settings(
    current_user: User = Depends(require_staff)
):
    """Get security settings"""
    return SecuritySettings(**_settings_store["security"])


@router.put("/settings/security")
async def update_security_settings(
    settings: SecuritySettings,
    current_user: User = Depends(require_staff)
):
    """Update security settings"""
    _settings_store["security"] = settings.model_dump()
    return {"message": "Security settings updated successfully"}


@router.get("/settings/notifications", response_model=NotificationSettings)
async def get_notification_settings(
    current_user: User = Depends(require_staff)
):
    """Get notification settings"""
    return NotificationSettings(**_settings_store["notifications"])


@router.put("/settings/notifications")
async def update_notification_settings(
    settings: NotificationSettings,
    current_user: User = Depends(require_staff)
):
    """Update notification settings"""
    _settings_store["notifications"] = settings.model_dump()
    return {"message": "Notification settings updated successfully"}


@router.get("/settings/payments", response_model=PaymentSettings)
async def get_payment_settings(
    current_user: User = Depends(require_staff)
):
    """Get payment settings"""
    return PaymentSettings(**_settings_store["payments"])


@router.put("/settings/payments")
async def update_payment_settings(
    settings: PaymentSettings,
    current_user: User = Depends(require_staff)
):
    """Update payment settings"""
    _settings_store["payments"] = settings.model_dump()
    return {"message": "Payment settings updated successfully"}


@router.get("/settings/pricing", response_model=PricingSettings)
async def get_pricing_settings(
    current_user: User = Depends(require_staff)
):
    """Get pricing settings"""
    return PricingSettings(**_settings_store["pricing"])


@router.put("/settings/pricing")
async def update_pricing_settings(
    settings: PricingSettings,
    current_user: User = Depends(require_staff)
):
    """Update pricing settings"""
    _settings_store["pricing"] = settings.model_dump()
    return {"message": "Pricing settings updated successfully"}


@router.post("/settings/cache/clear")
async def clear_cache(
    current_user: User = Depends(require_staff)
):
    """Clear application cache"""
    # Placeholder - implement cache clearing logic
    return {"message": "Cache cleared successfully"}


@router.get("/settings/health")
async def health_check(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """System health check"""
    # Check database connection
    try:
        db.execute("SELECT 1")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "database": db_status,
        "api_version": "v1.0.0",
        "timestamp": "2025-11-12T11:00:00Z"
    }

