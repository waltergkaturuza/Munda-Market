from fastapi import APIRouter
from .endpoints import (
    auth,
    farmers,
    buyers,
    crops,
    production,
    listings,
    orders,
    logistics,
    invoices,
    analytics,
    payments,
    shipments,
    qc,
    admin
)

# Create main API router
api_router = APIRouter()

# Include endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(farmers.router, prefix="/farmers", tags=["Farmers"])
api_router.include_router(buyers.router, prefix="/buyers", tags=["Buyers"])
api_router.include_router(crops.router, prefix="/crops", tags=["Crops"])
api_router.include_router(production.router, prefix="/production", tags=["Production"])
api_router.include_router(listings.router, prefix="/listings", tags=["Listings"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(logistics.router, prefix="/logistics", tags=["Logistics"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["Invoices"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(shipments.router, prefix="/shipments", tags=["Shipments"])
api_router.include_router(qc.router, prefix="/qc", tags=["Quality Control"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administration"])
