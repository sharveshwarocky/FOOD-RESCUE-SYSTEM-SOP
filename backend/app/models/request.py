from datetime import datetime
from app.extensions import db

class Request(db.Model):
    __tablename__ = 'requests'
    
    id = db.Column(db.Integer, primary_key=True)
    donation_id = db.Column(db.Integer, db.ForeignKey('donations.id'), nullable=False)
    ngo_id = db.Column(db.Integer, db.ForeignKey('ngos.id'), nullable=False)
    status = db.Column(db.String(30), default='PENDING')  # PENDING, ACCEPTED, REJECTED, CANCELLED
    quality_status = db.Column(db.String(30), default='VERIFIED')  # VERIFIED, FLAGGED, REJECTED
    quality_notes = db.Column(db.Text, nullable=True)
    requested_at = db.Column(db.DateTime, default=datetime.utcnow)
    responded_at = db.Column(db.DateTime, nullable=True)

    assignments = db.relationship('Assignment', backref='request', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        ngo_info = self.ngo.to_dict() if self.ngo else {}
        donation_info = self.donation.to_dict() if self.donation else {}
        return {
            'id': self.id,
            'donation_id': self.donation_id,
            'donation_title': donation_info.get('title'),
            'donation_food_type': donation_info.get('food_type'),
            'donation_quantity': donation_info.get('quantity'),
            'donation_image': donation_info.get('image'),
            'donation_pickup_address': donation_info.get('pickup_address'),
            'donor_name': donation_info.get('donor_name'),
            'ngo_id': self.ngo_id,
            'ngo_name': ngo_info.get('ngo_name'),
            'ngo_phone': ngo_info.get('phone'),
            'ngo_address': ngo_info.get('address'),
            'status': self.status,
            'quality_status': self.quality_status,
            'quality_notes': self.quality_notes,
            'requested_at': self.requested_at.isoformat() if self.requested_at else None,
            'responded_at': self.responded_at.isoformat() if self.responded_at else None
        }
