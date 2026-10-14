from flask import request
from app.extensions import db
from app.models.log import Log

def log_action(user_id, action, entity_type=None, entity_id=None, description=""):
    try:
        ip_address = request.remote_addr if request else "127.0.0.1"
        log_entry = Log(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            ip_address=ip_address
        )
        db.session.add(log_entry)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(f"[AuditLogger Error] Failed to log action '{action}': {str(e)}")
