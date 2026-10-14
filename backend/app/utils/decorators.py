from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from app.models.user import User

def role_required(allowed_roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = int(get_jwt_identity()) if get_jwt_identity() is not None else None
            user = User.query.get(user_id) if user_id else None
            if not user:
                return jsonify({'success': False, 'message': 'User not found'}), 404
            
            # Roles comparison (case-insensitive)
            user_role = user.role.upper()
            allowed = [r.upper() for r in allowed_roles]
            if user_role not in allowed:
                return jsonify({'success': False, 'message': 'Access forbidden: Insufficient role permissions'}), 403
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def approved_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = int(get_jwt_identity()) if get_jwt_identity() is not None else None
        user = User.query.get(user_id) if user_id else None
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Admin is always approved
        if user.role.upper() != 'ADMIN' and user.approval_status != 'APPROVED':
            return jsonify({
                'success': False, 
                'message': 'Account pending approval. Operational activities restricted until Admin approves your account.'
            }), 403
            
        return fn(*args, **kwargs)
    return wrapper
