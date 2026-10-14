from datetime import datetime
from app.extensions import db

class Assignment(db.Model):
    __tablename__ = 'assignments'
    
    id = db.Column(db.Integer, primary_key=True)
    request_id = db.Column(db.Integer, db.ForeignKey('requests.id'), nullable=False)
    volunteer_id = db.Column(db.Integer, db.ForeignKey('volunteers.id'), nullable=False)
    status = db.Column(db.String(30), default='ASSIGNED')  # ASSIGNED, ACCEPTED, REJECTED, CANCELLED
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)
    accepted_at = db.Column(db.DateTime, nullable=True)
    rejected_at = db.Column(db.DateTime, nullable=True)

    deliveries = db.relationship('Delivery', backref='assignment', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        req_info = self.request.to_dict() if self.request else {}
        vol_info = self.volunteer.to_dict() if self.volunteer else {}
        return {
            'id': self.id,
            'request_id': self.request_id,
            'volunteer_id': self.volunteer_id,
            'volunteer_name': vol_info.get('full_name') or vol_info.get('username') or 'Volunteer',
            'volunteer_phone': vol_info.get('phone'),
            'vehicle_type': vol_info.get('vehicle_type'),
            'status': self.status,
            'assigned_at': self.assigned_at.isoformat() if self.assigned_at else None,
            'accepted_at': self.accepted_at.isoformat() if self.accepted_at else None,
            'rejected_at': self.rejected_at.isoformat() if self.rejected_at else None,
            'request_details': req_info
        }
