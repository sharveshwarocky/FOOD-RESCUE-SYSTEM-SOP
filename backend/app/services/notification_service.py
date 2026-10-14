from app.extensions import db
from app.models.notification import Notification
from app.services.sms_service import send_sms

def create_notification(user_id, title, message, notif_type='INFO', send_sms_alert=False, recipient_phone=None):
    try:
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notif_type
        )
        db.session.add(notif)
        db.session.commit()

        if send_sms_alert and recipient_phone:
            send_sms(recipient_phone, f"{title}: {message}")

        return notif
    except Exception as e:
        db.session.rollback()
        print(f"[Notification Service Error] {str(e)}")
        return None
