import os
from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.extensions import db
from app.models import User, Donor, NGO, Donation, Request as FoodRequest
from app.utils.decorators import role_required, approved_required
from app.utils.logger import log_action
from app.utils.validators import allowed_file
from app.services.notification_service import create_notification

donor_bp = Blueprint('donor', __name__, url_prefix='/api/donor')

@donor_bp.route('/post-food', methods=['POST'])
@jwt_required()
@role_required(['DONOR'])
@approved_required
def post_food():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or not user.donor_profile:
        return jsonify({'success': False, 'message': 'Donor profile not found'}), 404

    donor = user.donor_profile

    # Extract Form Data
    title = request.form.get('title', '').strip()
    description = request.form.get('description', '').strip()
    food_type = request.form.get('food_type', 'Cooked Meals').strip()
    quantity = request.form.get('quantity', '').strip()
    pickup_address = request.form.get('pickup_address', donor.address or '').strip()
    latitude = float(request.form.get('latitude', donor.latitude or 0.0))
    longitude = float(request.form.get('longitude', donor.longitude or 0.0))
    allowed_ngo_id = request.form.get('allowed_ngo_id')
    if allowed_ngo_id and allowed_ngo_id != 'null':
        allowed_ngo_id = int(allowed_ngo_id)
    else:
        allowed_ngo_id = None

    # Optional expiry tracking fields (ISO 8601; normalized to naive UTC)
    def parse_utc_datetime(field_name):
        raw = request.form.get(field_name, '').strip()
        if not raw:
            return None
        try:
            parsed = datetime.fromisoformat(raw.replace('Z', '+00:00'))
        except ValueError:
            return None
        if parsed.tzinfo is not None:
            parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
        return parsed

    prep_time = parse_utc_datetime('prep_time')
    expiry_time = parse_utc_datetime('expiry_time')
    if request.form.get('prep_time', '').strip() and prep_time is None:
        return jsonify({'success': False, 'message': 'Invalid preparation time format'}), 400
    if request.form.get('expiry_time', '').strip() and expiry_time is None:
        return jsonify({'success': False, 'message': 'Invalid expiry time format'}), 400
    if prep_time and expiry_time and expiry_time <= prep_time:
        return jsonify({'success': False, 'message': 'Expiry time must be after the preparation time'}), 400
    if expiry_time and expiry_time <= datetime.utcnow():
        return jsonify({'success': False, 'message': 'Expiry time must be in the future'}), 400

    if not title or not quantity or not pickup_address:
        return jsonify({'success': False, 'message': 'Title, quantity, and pickup address are required'}), 400

    # Image upload handling
    image_filename = None
    if 'image' in request.files:
        file = request.files['image']
        if file and allowed_file(file.filename):
            filename = secure_filename(f"food_{int(datetime.utcnow().timestamp())}_{file.filename}")
            upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'food')
            os.makedirs(upload_dir, exist_ok=True)
            file.save(os.path.join(upload_dir, filename))
            image_filename = f"/uploads/food/{filename}"

    donation = Donation(
        donor_id=donor.id,
        title=title,
        description=description,
        food_type=food_type,
        quantity=quantity,
        image=image_filename,
        pickup_address=pickup_address,
        latitude=latitude,
        longitude=longitude,
        allowed_ngo_id=allowed_ngo_id,
        prep_time=prep_time,
        expiry_time=expiry_time,
        status='APPROVED'  # Auto approved for instant workflow demo
    )
    db.session.add(donation)
    db.session.commit()

    log_action(user_id, "DONATION_POSTED", "Donation", donation.id, f"Donor posted surplus food '{title}' ({quantity})")

    # Notify all approved NGOs
    ngos = NGO.query.all()
    for n in ngos:
        if n.user and (allowed_ngo_id is None or allowed_ngo_id == n.id):
            create_notification(
                user_id=n.user.id,
                title="New Food Donation Posted",
                message=f"New food '{title}' ({quantity}) is available for request from {donor.organization_name or user.username}.",
                notif_type="INFO",
                send_sms_alert=True,
                recipient_phone=n.user.phone
            )

    return jsonify({
        'success': True,
        'message': 'Surplus food posted successfully!',
        'donation': donation.to_dict()
    }), 201

@donor_bp.route('/my-donations', methods=['GET'])
@jwt_required()
@role_required(['DONOR'])
def get_my_donations():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or not user.donor_profile:
        return jsonify({'success': False, 'message': 'Donor profile not found'}), 404

    donations = Donation.query.filter_by(donor_id=user.donor_profile.id).order_by(Donation.created_at.desc()).all()
    return jsonify({'success': True, 'donations': [d.to_dict() for d in donations]})

@donor_bp.route('/requests', methods=['GET'])
@jwt_required()
@role_required(['DONOR'])
def get_donor_requests():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or not user.donor_profile:
        return jsonify({'success': False, 'message': 'Donor profile not found'}), 404

    donor = user.donor_profile
    requests_list = FoodRequest.query.join(Donation).filter(Donation.donor_id == donor.id).order_by(FoodRequest.requested_at.desc()).all()
    return jsonify({'success': True, 'requests': [r.to_dict() for r in requests_list]})

@donor_bp.route('/requests/<int:request_id>/respond', methods=['POST'])
@jwt_required()
@role_required(['DONOR'])
@approved_required
def respond_to_ngo_request(request_id):
    data = request.get_json() or {}
    action = data.get('action', '').upper()  # ACCEPT or REJECT

    if action not in ['ACCEPT', 'REJECT']:
        return jsonify({'success': False, 'message': 'Action must be ACCEPT or REJECT'}), 400

    food_req = FoodRequest.query.get(request_id)
    if not food_req:
        return jsonify({'success': False, 'message': 'Request not found'}), 404

    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if food_req.donation.donor_id != user.donor_profile.id:
        return jsonify({'success': False, 'message': 'Unauthorized action'}), 403

    if action == 'ACCEPT':
        food_req.status = 'ACCEPTED'
        food_req.donation.status = 'DONOR_ACCEPTED'
        msg = f"Donor accepted NGO request for '{food_req.donation.title}'"
    else:
        food_req.status = 'REJECTED'
        food_req.donation.status = 'APPROVED'  # Re-open for other NGOs
        msg = f"Donor rejected NGO request for '{food_req.donation.title}'"

    food_req.responded_at = datetime.utcnow()
    db.session.commit()

    log_action(user_id, f"DONOR_REQUEST_{action}", "Request", food_req.id, msg)

    if food_req.ngo and food_req.ngo.user:
        create_notification(
            user_id=food_req.ngo.user.id,
            title=f"Food Request {action}ED",
            message=f"Donor has {action.lower()}ed your request for '{food_req.donation.title}'.",
            notif_type="SUCCESS" if action == 'ACCEPT' else "WARNING",
            send_sms_alert=True,
            recipient_phone=food_req.ngo.user.phone
        )

    return jsonify({'success': True, 'message': f"Request {action.lower()}ed successfully", 'request': food_req.to_dict()})

@donor_bp.route('/donations/<int:donation_id>/cancel', methods=['POST'])
@jwt_required()
@role_required(['DONOR'])
def cancel_donation(donation_id):
    """
    Cancellation Rule:
    Donor can cancel a donation ONLY within 20 minutes of posting.
    Current time <= created_at + 20 minutes
    Cannot cancel if picked up, delivered, or completed.
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    donation = Donation.query.get(donation_id)

    if not donation or donation.donor_id != user.donor_profile.id:
        return jsonify({'success': False, 'message': 'Donation not found or unauthorized'}), 404

    # 20-minute window check
    now = datetime.utcnow()
    time_limit = donation.created_at + timedelta(minutes=20)
    if now > time_limit:
        return jsonify({
            'success': False,
            'message': 'Cancellation window expired! Donations can only be cancelled within 20 minutes of posting.'
        }), 400

    # Status check
    invalid_cancel_statuses = ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED']
    if donation.status in invalid_cancel_statuses:
        return jsonify({
            'success': False,
            'message': f"Cannot cancel donation in '{donation.status}' state."
        }), 400

    donation.status = 'CANCELLED'
    donation.cancelled_at = now
    db.session.commit()

    log_action(user_id, "DONATION_CANCELLED", "Donation", donation.id, f"Donor cancelled donation '{donation.title}' within 20-minute window")

    return jsonify({'success': True, 'message': 'Donation cancelled successfully', 'donation': donation.to_dict()})
