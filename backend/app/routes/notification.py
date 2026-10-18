from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.notification import Notification

notification_bp = Blueprint('notification', __name__, url_prefix='/api/notifications')

@notification_bp.route('', methods=['GET'])
@jwt_required()
def get_user_notifications():
    user_id = get_jwt_identity()
    notifs = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    return jsonify({'success': True, 'notifications': [n.to_dict() for n in notifs]})

@notification_bp.route('/<int:notif_id>/read', methods=['POST'])
@jwt_required()
def mark_as_read(notif_id):
    user_id = get_jwt_identity()
    notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first()
    if notif:
        notif.is_read = True
        db.session.commit()
        return jsonify({'success': True, 'notification': notif.to_dict()})
    return jsonify({'success': False, 'message': 'Notification not found'}), 404
