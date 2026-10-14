from datetime import datetime
from app.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # ADMIN, DONOR, NGO, VOLUNTEER
    phone = db.Column(db.String(20), nullable=True)
    is_approved = db.Column(db.Boolean, default=False)
    approval_status = db.Column(db.String(20), default='PENDING')  # PENDING, APPROVED, REJECTED, DEACTIVATED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    donor_profile = db.relationship('Donor', backref='user', uselist=False, cascade="all, delete-orphan")
    ngo_profile = db.relationship('NGO', backref='user', uselist=False, cascade="all, delete-orphan")
    volunteer_profile = db.relationship('Volunteer', backref='user', uselist=False, cascade="all, delete-orphan")
    notifications = db.relationship('Notification', backref='user', lazy=True, cascade="all, delete-orphan")
    logs = db.relationship('Log', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'phone': self.phone,
            'is_approved': self.is_approved,
            'approval_status': self.approval_status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
