from app.routes.auth import auth_bp
from app.routes.admin import admin_bp
from app.routes.donor import donor_bp
from app.routes.ngo import ngo_bp
from app.routes.volunteer import volunteer_bp
from app.routes.notification import notification_bp
from app.routes.location import location_bp

__all__ = [
    'auth_bp', 'admin_bp', 'donor_bp', 'ngo_bp',
    'volunteer_bp', 'notification_bp', 'location_bp'
]
