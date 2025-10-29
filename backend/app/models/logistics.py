from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum
from ..core.database import Base


class ShipmentStatus(str, Enum):
    PENDING = "pending"
    ALLOCATED = "allocated"
    DISPATCHED = "dispatched"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    FAILED_DELIVERY = "failed_delivery"
    RETURNED = "returned"
    CANCELLED = "cancelled"


class VehicleType(str, Enum):
    MOTORCYCLE = "motorcycle"
    VAN = "van"
    TRUCK_SMALL = "truck_small"
    TRUCK_MEDIUM = "truck_medium"
    TRUCK_LARGE = "truck_large"
    REFRIGERATED = "refrigerated"


class TemperatureZone(str, Enum):
    AMBIENT = "ambient"           # Room temperature
    COOL = "cool"                # 10-15°C
    COLD = "cold"                # 2-8°C
    FROZEN = "frozen"            # Below 0°C


class Shipment(Base):
    __tablename__ = "shipments"
    
    # Primary key
    shipment_id = Column(Integer, primary_key=True, index=True)
    
    # Order reference
    order_id = Column(Integer, ForeignKey("orders.order_id"), nullable=False, index=True)
    
    # Shipment identification
    shipment_number = Column(String(50), nullable=False, unique=True, index=True)
    tracking_number = Column(String(100), nullable=True, unique=True, index=True)
    
    # Carrier/transporter information
    carrier_id = Column(Integer, ForeignKey("users.user_id"), nullable=True, index=True)  # If carrier is a user
    carrier_name = Column(String(100), nullable=False)
    carrier_phone = Column(String(20), nullable=True)
    
    # Vehicle and capacity
    vehicle_type = Column(SQLEnum(VehicleType), nullable=False)
    vehicle_registration = Column(String(20), nullable=True)
    vehicle_capacity_kg = Column(Float, nullable=True)
    
    # Temperature requirements (JSON)
    # Example: {"zone": "cold", "min_temp": 2, "max_temp": 8, "humidity": "80-90%"}
    temp_requirements_json = Column(Text, nullable=True)
    
    # Pickup information
    pickup_address_line1 = Column(String(200), nullable=False)
    pickup_address_line2 = Column(String(200), nullable=True)
    pickup_city = Column(String(100), nullable=False)
    pickup_district = Column(String(100), nullable=False)
    pickup_contact_name = Column(String(100), nullable=True)
    pickup_contact_phone = Column(String(20), nullable=True)
    
    # Delivery information (copied from order but can be updated)
    delivery_address_line1 = Column(String(200), nullable=False)
    delivery_address_line2 = Column(String(200), nullable=True)
    delivery_city = Column(String(100), nullable=False)
    delivery_district = Column(String(100), nullable=False)
    delivery_contact_name = Column(String(100), nullable=True)
    delivery_contact_phone = Column(String(20), nullable=True)
    delivery_instructions = Column(Text, nullable=True)
    
    # Timing
    pickup_scheduled = Column(DateTime(timezone=True), nullable=True)
    pickup_actual = Column(DateTime(timezone=True), nullable=True)
    delivery_scheduled = Column(DateTime(timezone=True), nullable=True)
    delivery_actual = Column(DateTime(timezone=True), nullable=True)
    
    # Route and distance
    estimated_distance_km = Column(Float, nullable=True)
    actual_distance_km = Column(Float, nullable=True)
    estimated_duration_hours = Column(Float, nullable=True)
    
    # Status tracking
    status = Column(SQLEnum(ShipmentStatus), default=ShipmentStatus.PENDING)
    
    # Weight and dimensions
    total_weight_kg = Column(Float, nullable=False)
    declared_value = Column(Float, nullable=True)
    
    # Service level
    express_delivery = Column(Boolean, default=False)
    signature_required = Column(Boolean, default=True)
    
    # Cost information
    shipping_cost = Column(Float, nullable=True)
    fuel_surcharge = Column(Float, nullable=True)
    cold_chain_surcharge = Column(Float, nullable=True)
    
    # External tracking
    tracking_link = Column(String(500), nullable=True)
    external_tracking_id = Column(String(100), nullable=True)
    
    # GPS and live tracking
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    last_location_update = Column(DateTime(timezone=True), nullable=True)
    
    # Temperature monitoring
    temperature_logs = Column(Text, nullable=True)  # JSON array of temp readings
    temperature_alerts = Column(Text, nullable=True)  # JSON array of alerts
    
    # Proof of delivery
    pod_signature_url = Column(String(500), nullable=True)
    pod_photo_urls = Column(Text, nullable=True)  # JSON array of photo URLs
    pod_notes = Column(Text, nullable=True)
    
    # Issues and exceptions
    delivery_notes = Column(Text, nullable=True)
    exception_notes = Column(Text, nullable=True)
    
    # Driver information
    driver_name = Column(String(100), nullable=True)
    driver_phone = Column(String(20), nullable=True)
    driver_license = Column(String(50), nullable=True)
    
    # Insurance and liability
    insurance_reference = Column(String(100), nullable=True)
    insurance_value = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    dispatched_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    order = relationship("Order", back_populates="shipments")
    carrier = relationship("User", foreign_keys=[carrier_id])
    
    @property
    def is_temperature_controlled(self):
        """Check if shipment requires temperature control"""
        return self.temp_requirements_json is not None
    
    @property
    def estimated_delivery_window_hours(self):
        """Calculate estimated delivery window in hours"""
        if self.pickup_scheduled and self.delivery_scheduled:
            return (self.delivery_scheduled - self.pickup_scheduled).total_seconds() / 3600
        return None
    
    @property
    def actual_delivery_time_hours(self):
        """Calculate actual delivery time in hours"""
        if self.pickup_actual and self.delivery_actual:
            return (self.delivery_actual - self.pickup_actual).total_seconds() / 3600
        return None
    
    @property
    def is_on_time(self):
        """Check if delivery was made on time"""
        if self.delivery_actual and self.delivery_scheduled:
            return self.delivery_actual <= self.delivery_scheduled
        return None
    
    def __repr__(self):
        return f"<Shipment(id={self.shipment_id}, number='{self.shipment_number}', status='{self.status}')>"
