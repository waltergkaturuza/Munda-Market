from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum
from ..core.database import Base


class QCType(str, Enum):
    PRE_HARVEST = "pre_harvest"         # Field inspection before harvest
    POST_HARVEST = "post_harvest"       # Inspection after harvest
    PRE_COLLECTION = "pre_collection"   # Inspection before pickup
    IN_TRANSIT = "in_transit"          # Quality check during transport
    PRE_DELIVERY = "pre_delivery"      # Final check before delivery
    RANDOM_AUDIT = "random_audit"      # Random quality audit
    COMPLAINT = "complaint"            # Quality complaint investigation


class QCResult(str, Enum):
    PASS = "pass"
    CONDITIONAL_PASS = "conditional_pass"  # Pass with minor issues noted
    FAIL = "fail"
    PENDING = "pending"


class QCCheck(Base):
    __tablename__ = "qc_checks"
    
    # Primary key
    qc_id = Column(Integer, primary_key=True, index=True)
    
    # QC identification
    qc_number = Column(String(50), nullable=False, unique=True, index=True)
    
    # What is being checked (either shipment or lot)
    shipment_id = Column(Integer, ForeignKey("shipments.shipment_id"), nullable=True, index=True)
    lot_id = Column(Integer, ForeignKey("lots.lot_id"), nullable=True, index=True)
    
    # QC type and context
    qc_type = Column(SQLEnum(QCType), nullable=False)
    
    # Inspector information
    inspector_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    inspector_name = Column(String(100), nullable=False)
    
    # Location of inspection
    inspection_location = Column(String(200), nullable=True)
    inspection_latitude = Column(Float, nullable=True)
    inspection_longitude = Column(Float, nullable=True)
    
    # Sample information
    sample_size_kg = Column(Float, nullable=True)
    total_batch_kg = Column(Float, nullable=True)
    sample_percentage = Column(Float, nullable=True)
    
    # Quality measurements (JSON)
    # Example checklist structure:
    # {
    #   "appearance": {"score": 9, "max": 10, "notes": "Excellent color"},
    #   "size": {"measurement": 6.5, "unit": "cm", "min": 5, "max": 8, "pass": true},
    #   "weight": {"measurement": 150, "unit": "g", "min": 100, "max": 200, "pass": true},
    #   "brix": {"measurement": 12.5, "unit": "°Brix", "min": 10, "pass": true},
    #   "firmness": {"score": 8, "max": 10, "notes": "Good firmness"},
    #   "defects": {"count": 2, "max_allowed": 5, "types": ["minor bruising"], "pass": true}
    # }
    checklist_json = Column(Text, nullable=False)
    
    # Overall results
    pass_fail = Column(SQLEnum(QCResult), nullable=False)
    overall_grade = Column(String(10), nullable=True)  # A, B, C
    quality_score = Column(Float, nullable=True)  # 0-100
    
    # Specific measurements
    brix_reading = Column(Float, nullable=True)
    moisture_content = Column(Float, nullable=True)
    ph_level = Column(Float, nullable=True)
    temperature_at_check = Column(Float, nullable=True)
    
    # Defect tracking
    defect_count = Column(Integer, default=0)
    defect_types = Column(Text, nullable=True)  # JSON array
    defect_severity = Column(String(20), nullable=True)  # minor, major, critical
    
    # Pesticide and safety
    pesticide_residue_check = Column(Boolean, default=False)
    pesticide_test_result = Column(String(20), nullable=True)  # pass, fail, not_tested
    phi_compliance = Column(Boolean, nullable=True)  # Pre-harvest interval compliance
    
    # Packaging and presentation
    packaging_condition = Column(String(50), nullable=True)
    labeling_accurate = Column(Boolean, nullable=True)
    weight_accuracy_percentage = Column(Float, nullable=True)
    
    # Environmental conditions during check
    ambient_temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    
    # Documentation
    notes = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    corrective_actions = Column(Text, nullable=True)
    
    # Photos and evidence
    photos = Column(Text, nullable=True)  # JSON array of photo URLs
    
    # Follow-up tracking
    requires_followup = Column(Boolean, default=False)
    followup_date = Column(DateTime(timezone=True), nullable=True)
    followup_completed = Column(Boolean, default=False)
    
    # Impact on order/shipment
    approved_for_shipment = Column(Boolean, nullable=True)
    price_adjustment_percentage = Column(Float, nullable=True)
    
    # Compliance and certifications
    meets_export_standards = Column(Boolean, nullable=True)
    certification_compliant = Column(Boolean, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    inspection_completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    inspector = relationship("User", foreign_keys=[inspector_user_id])
    shipment = relationship("Shipment", foreign_keys=[shipment_id])
    lot = relationship("Lot", back_populates="qc_checks")
    
    @property
    def defect_rate_percentage(self):
        """Calculate defect rate as percentage"""
        if self.sample_size_kg and self.sample_size_kg > 0:
            # This would need to be calculated based on defect weight
            # For now, return a simple calculation
            return (self.defect_count / (self.sample_size_kg * 10)) * 100  # Assuming ~10 items per kg
        return None
    
    @property
    def is_export_ready(self):
        """Check if product meets export standards"""
        return (self.pass_fail == QCResult.PASS and 
                self.meets_export_standards == True and
                self.pesticide_test_result in ["pass", "not_tested"] and
                self.phi_compliance == True)
    
    def __repr__(self):
        return f"<QCCheck(id={self.qc_id}, type='{self.qc_type}', result='{self.pass_fail}', score={self.quality_score})>"
