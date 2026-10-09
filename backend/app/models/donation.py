from datetime import datetime, timedelta
from app.extensions import db

class Donation(db.Model):
    __tablename__ = 'donations'
    
    EXPIRING_SOON_THRESHOLD = timedelta(hours=2)  # Flag donations expiring within 2 hours

    id = db.Column(db.Integer, primary_key=True)
    donor_id = db.Column(db.Integer, db.ForeignKey('donors.id'), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    food_type = db.Column(db.String(50), nullable=False)  # Cooked Meals, Raw Groceries, Bakery Items, Fruits & Veggies, Packaged Goods
    quantity = db.Column(db.String(50), nullable=False)  # e.g., "50 kg", "20 Meals"
    image = db.Column(db.String(255), nullable=True)
    pickup_address = db.Column(db.String(255), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    allowed_ngo_id = db.Column(db.Integer, db.ForeignKey('ngos.id'), nullable=True)  # Optional specific NGO permission
    prep_time = db.Column(db.DateTime, nullable=True)   # When the food was prepared (naive UTC)
    expiry_time = db.Column(db.DateTime, nullable=True) # Safe-consumption deadline (naive UTC)
    status = db.Column(db.String(30), default='PENDING_ADMIN_APPROVAL')
    # PENDING_ADMIN_APPROVAL, APPROVED, NGO_REQUESTED, DONOR_ACCEPTED, VOLUNTEER_ASSIGNED, PICKED_UP, OUT_FOR_DELIVERY, DELIVERED, COMPLETED, REJECTED, CANCELLED, EXPIRED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    cancelled_at = db.Column(db.DateTime, nullable=True)

    requests = db.relationship('Request', backref='donation', lazy=True, cascade="all, delete-orphan")

    def expiry_state(self):
        """Computed on read (no background worker): NO_EXPIRY_INFO, FRESH, EXPIRING_SOON, EXPIRED."""
        if not self.expiry_time:
            return 'NO_EXPIRY_INFO'
        now = datetime.utcnow()
        if now >= self.expiry_time:
            return 'EXPIRED'
        if self.expiry_time - now <= self.EXPIRING_SOON_THRESHOLD:
            return 'EXPIRING_SOON'
        return 'FRESH'

    def to_dict(self):
        donor_info = self.donor.to_dict() if self.donor else {}
        
        # Determine accepted NGO and assigned volunteer if applicable
        accepted_req = next((r for r in self.requests if r.status in ['ACCEPTED', 'COMPLETED']), None)
        accepted_ngo_name = accepted_req.ngo.ngo_name if accepted_req and accepted_req.ngo else None
        accepted_ngo_id = accepted_req.ngo_id if accepted_req else None
        
        assigned_vol_name = None
        if accepted_req and accepted_req.assignments:
            active_assign = next((a for a in accepted_req.assignments if a.status in ['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED']), None)
            if active_assign and active_assign.volunteer:
                assigned_vol_name = active_assign.volunteer.full_name

        return {
            'id': self.id,
            'donor_id': self.donor_id,
            'donor_name': donor_info.get('organization_name') or donor_info.get('username') or 'Donor',
            'donor_phone': donor_info.get('phone'),
            'title': self.title,
            'description': self.description,
            'food_type': self.food_type,
            'quantity': self.quantity,
            'image': self.image,
            'pickup_address': self.pickup_address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'allowed_ngo_id': self.allowed_ngo_id,
            'prep_time': self.prep_time.isoformat() if self.prep_time else None,
            'expiry_time': self.expiry_time.isoformat() if self.expiry_time else None,
            'expiry_state': self.expiry_state(),
            'status': self.status,
            'accepted_ngo_id': accepted_ngo_id,
            'accepted_ngo_name': accepted_ngo_name,
            'assigned_volunteer_name': assigned_vol_name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None
        }
