from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import User, NGO, Donation, Request as FoodRequest, Assignment, Delivery, VolunteerLocation
from app.utils.decorators import role_required, approved_required
from app.utils.serializers import iso_utc
from app.utils.logger import log_action
from app.services.notification_service import create_notification

ngo_bp = Blueprint('ngo', __name__, url_prefix='/api/ngo')

@ngo_bp.route('/available-donations', methods=['GET'])
@jwt_required()
@role_required(['NGO'])
@approved_required
def get_available_donations():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    ngo = user.ngo_profile

    donations = Donation.query.filter(
        Donation.status.in_(['APPROVED', 'NGO_REQUESTED']),
        (Donation.allowed_ngo_id.is_(None)) | (Donation.allowed_ngo_id == ngo.id)
    ).order_by(Donation.created_at.desc()).all()

    return jsonify({'success': True, 'donations': [d.to_dict() for d in donations]})

@ngo_bp.route('/request-food', methods=['POST'])
@jwt_required()
@role_required(['NGO'])
@approved_required
def request_food():
    data = request.get_json() or {}
    donation_id = data.get('donation_id')
    quality_status = data.get('quality_status', 'VERIFIED')
    quality_notes = data.get('quality_notes', 'Verified fresh and safe for distribution.')

    donation = Donation.query.get(donation_id)
    if not donation:
        return jsonify({'success': False, 'message': 'Donation not found'}), 404

    if donation.expiry_state() == 'EXPIRED':
        return jsonify({'success': False, 'message': f"'{donation.title}' has expired and can no longer be requested."}), 400

    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    ngo = user.ngo_profile

    existing = FoodRequest.query.filter_by(donation_id=donation_id, ngo_id=ngo.id) \
        .filter(FoodRequest.status.in_(['PENDING', 'ACCEPTED'])).first()
    if existing:
        return jsonify({'success': False, 'message': 'You have already submitted a request for this donation'}), 400

    food_req = FoodRequest(
        donation_id=donation_id,
        ngo_id=ngo.id,
        status='PENDING',
        quality_status=quality_status,
        quality_notes=quality_notes
    )
    db.session.add(food_req)

    donation.status = 'NGO_REQUESTED'
    db.session.commit()

    log_action(user_id, "NGO_FOOD_REQUESTED", "Request", food_req.id, f"NGO '{ngo.ngo_name}' requested donation '{donation.title}'")

    if donation.donor and donation.donor.user:
        create_notification(
            user_id=donation.donor.user.id,
            title="New Food Request from NGO",
            message=f"NGO '{ngo.ngo_name}' has requested your food donation '{donation.title}'. Please accept or reject.",
            notif_type="INFO",
            send_sms_alert=True,
            recipient_phone=donation.donor.user.phone
        )

    return jsonify({'success': True, 'message': 'Food request submitted to Donor', 'request': food_req.to_dict()})

@ngo_bp.route('/my-requests', methods=['GET'])
@jwt_required()
@role_required(['NGO'])
def get_my_requests():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    ngo = user.ngo_profile

    requests_list = FoodRequest.query.filter_by(ngo_id=ngo.id).order_by(FoodRequest.requested_at.desc()).all()
    return jsonify({'success': True, 'requests': [r.to_dict() for r in requests_list]})

@ngo_bp.route('/assignments/<int:request_id>/location', methods=['GET'])
@jwt_required()
@role_required(['NGO'])
def get_assigned_volunteer_location(request_id):
    food_req = FoodRequest.query.get(request_id)
    if not food_req:
        return jsonify({'success': False, 'message': 'Request not found'}), 404

    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or not user.ngo_profile or food_req.ngo_id != user.ngo_profile.id:
        return jsonify({'success': False, 'message': 'Request does not belong to your NGO'}), 403

    assignment = Assignment.query.filter_by(request_id=request_id).order_by(Assignment.assigned_at.desc()).first()
    if not assignment or not assignment.volunteer:
        return jsonify({'success': False, 'message': 'No volunteer assigned yet'}), 404

    vol = assignment.volunteer
    latest_loc = VolunteerLocation.query.filter_by(volunteer_id=vol.id).order_by(VolunteerLocation.timestamp.desc()).first()

    return jsonify({
        'success': True,
        'volunteer_id': vol.id,
        'volunteer_name': vol.full_name,
        'phone': vol.user.phone if vol.user else None,
        'vehicle_type': vol.vehicle_type,
        'latitude': latest_loc.latitude if latest_loc else vol.latitude,
        'longitude': latest_loc.longitude if latest_loc else vol.longitude,
        'timestamp': iso_utc(latest_loc.timestamp) if latest_loc else None
    })

@ngo_bp.route('/assignments', methods=['GET'])
@jwt_required()
@role_required(['NGO'])
@approved_required
def get_ngo_assignments():
    """Delivery assignments belonging to the current NGO's requests."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    ngo = user.ngo_profile
    assignments = Assignment.query.join(FoodRequest, Assignment.request_id == FoodRequest.id) \
        .filter(FoodRequest.ngo_id == ngo.id) \
        .order_by(Assignment.assigned_at.desc()).all()
    return jsonify({'success': True, 'assignments': [a.to_dict() for a in assignments]})

@ngo_bp.route('/confirm-delivery', methods=['POST'])
@jwt_required()
@role_required(['NGO'])
@approved_required
def confirm_delivery():
    data = request.get_json() or {}
    delivery_id = data.get('delivery_id')
    beneficiary_count = int(data.get('beneficiary_count', 0))
    beneficiary_notes = data.get('beneficiary_notes', '')

    delivery = Delivery.query.get(delivery_id)
    if not delivery:
        delivery = Delivery.query.filter_by(assignment_id=delivery_id).first()
    if not delivery:
        return jsonify({'success': False, 'message': 'Delivery record not found'}), 404

    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    ngo = user.ngo_profile

    assignment = delivery.assignment
    if not assignment or not assignment.request or assignment.request.ngo_id != ngo.id:
        return jsonify({'success': False, 'message': 'Delivery does not belong to your NGO'}), 403

    if assignment.request.donation.expiry_state() == 'EXPIRED':
        return jsonify({'success': False, 'message': 'Cannot confirm delivery: the donation has expired.'}), 400

    delivery.beneficiary_count = beneficiary_count
    delivery.beneficiary_notes = beneficiary_notes
    delivery.status = 'COMPLETED'
    delivery.delivery_time = datetime.utcnow()

    if assignment:
        assignment.status = 'COMPLETED'
        if assignment.request:
            assignment.request.status = 'COMPLETED'
            if assignment.request.donation:
                assignment.request.donation.status = 'COMPLETED'

    db.session.commit()

    log_action(user_id, "DELIVERY_CONFIRMED_NGO", "Delivery", delivery.id, f"NGO '{ngo.ngo_name}' confirmed delivery and fed {beneficiary_count} beneficiaries.")

    return jsonify({'success': True, 'message': 'Delivery marked as COMPLETED! Analytics updated.', 'delivery': delivery.to_dict()})
