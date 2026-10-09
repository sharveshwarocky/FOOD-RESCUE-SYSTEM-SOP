import os
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.extensions import db
from app.models import User, Volunteer, Assignment, Delivery, VolunteerLocation, Donation, Request as FoodRequest
from app.utils.decorators import role_required, approved_required
from app.utils.logger import log_action
from app.utils.validators import allowed_file
from app.utils.geo import haversine_km
from app.services.notification_service import create_notification

volunteer_bp = Blueprint('volunteer', __name__, url_prefix='/api/volunteer')

@volunteer_bp.route('/available-tasks', methods=['GET'])
@jwt_required()
@role_required(['VOLUNTEER'])
@approved_required
def get_available_tasks():
    """
    Workflow Step: Notify ALL Volunteers -> Volunteers Can Accept
    Returns open broadcast tasks where an NGO has accepted a donation
    and no volunteer has claimed it yet.
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    vol = user.volunteer_profile

    # Volunteer's latest coordinates
    latest_loc = VolunteerLocation.query.filter_by(volunteer_id=vol.id).order_by(VolunteerLocation.timestamp.desc()).first()
    vol_lat = latest_loc.latitude if latest_loc else vol.latitude
    vol_lon = latest_loc.longitude if latest_loc else vol.longitude

    # Find accepted requests where donation is in NGO_ACCEPTED status
    open_requests = FoodRequest.query.join(Donation).filter(
        Donation.status == 'NGO_ACCEPTED',
        FoodRequest.status == 'ACCEPTED'
    ).all()

    tasks = []
    for req in open_requests:
        # Check if an active assignment already exists
        active_assign = Assignment.query.filter_by(request_id=req.id).filter(
            Assignment.status.in_(['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'])
        ).first()
        if active_assign:
            continue

        donation = req.donation
        ngo = req.ngo

        # Compute proximity distance
        pickup_lat = donation.latitude if donation.latitude is not None else (donation.donor.latitude if donation.donor else None)
        pickup_lon = donation.longitude if donation.longitude is not None else (donation.donor.longitude if donation.donor else None)
        distance = haversine_km(pickup_lat, pickup_lon, vol_lat, vol_lon)

        tasks.append({
            'request_id': req.id,
            'donation_id': donation.id,
            'title': donation.title,
            'food_type': donation.food_type,
            'quantity': donation.quantity,
            'description': donation.description,
            'pickup_address': donation.pickup_address,
            'pickup_latitude': pickup_lat,
            'pickup_longitude': pickup_lon,
            'donor_name': donation.donor.organization_name if donation.donor else 'Donor',
            'donor_phone': donation.donor.user.phone if donation.donor and donation.donor.user else None,
            'ngo_id': ngo.id if ngo else None,
            'ngo_name': ngo.ngo_name if ngo else 'NGO Shelter',
            'ngo_address': ngo.address if ngo else '',
            'ngo_phone': ngo.user.phone if ngo and ngo.user else None,
            'distance_km': distance,
            'expiry_state': donation.expiry_state(),
            'expiry_time': donation.expiry_time.isoformat() if donation.expiry_time else None,
            'status': donation.status,
            'created_at': req.requested_at.isoformat() if req.requested_at else None
        })

    # Sort nearest first if distance is available
    tasks.sort(key=lambda x: (x['distance_km'] is None, x['distance_km'] if x['distance_km'] is not None else 0))

    return jsonify({'success': True, 'tasks': tasks})

@volunteer_bp.route('/claim-task', methods=['POST'])
@jwt_required()
@role_required(['VOLUNTEER'])
@approved_required
def claim_task():
    """
    Workflow Step: First Volunteer Accepts -> Volunteer Assigned
    Atomic claim with race-condition check.
    """
    data = request.get_json() or {}
    request_id = data.get('request_id')

    if not request_id:
        return jsonify({'success': False, 'message': 'Request ID is required'}), 400

    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    vol = user.volunteer_profile

    # Lock & Check: Verify food request
    food_req = FoodRequest.query.get(request_id)
    if not food_req:
        return jsonify({'success': False, 'message': 'Delivery request not found'}), 404

    donation = food_req.donation
    if not donation or donation.status != 'NGO_ACCEPTED':
        return jsonify({
            'success': False,
            'message': 'This delivery task has already been claimed by another volunteer.'
        }), 409

    # Race condition check: Verify no other volunteer has claimed it
    existing = Assignment.query.filter_by(request_id=request_id).filter(
        Assignment.status.in_(['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'])
    ).first()

    if existing:
        return jsonify({
            'success': False,
            'message': 'This delivery task has already been claimed by another volunteer.'
        }), 409

    # Assign to current volunteer
    assignment = Assignment(
        request_id=food_req.id,
        volunteer_id=vol.id,
        status='ACCEPTED',
        accepted_at=datetime.utcnow()
    )
    db.session.add(assignment)
    db.session.flush()

    # Initialize delivery record
    delivery = Delivery(
        assignment_id=assignment.id,
        status='ASSIGNED'
    )
    db.session.add(delivery)

    # Update donation status
    donation.status = 'VOLUNTEER_ASSIGNED'
    db.session.commit()

    log_action(user_id, "VOLUNTEER_CLAIMED_TASK", "Assignment", assignment.id, f"Volunteer '{vol.full_name}' claimed delivery task for '{donation.title}'")

    # Notify NGO
    if food_req.ngo and food_req.ngo.user:
        create_notification(
            user_id=food_req.ngo.user.id,
            title="Volunteer Assigned for Delivery",
            message=f"Volunteer {vol.full_name} has accepted the delivery task for '{donation.title}'. Pickup in progress.",
            notif_type="SUCCESS",
            send_sms_alert=True,
            recipient_phone=food_req.ngo.user.phone
        )

    # Notify Donor
    if donation.donor and donation.donor.user:
        create_notification(
            user_id=donation.donor.user.id,
            title="Volunteer Assigned for Pickup",
            message=f"Volunteer {vol.full_name} is on the way to pick up '{donation.title}'.",
            notif_type="INFO"
        )

    return jsonify({
        'success': True,
        'message': f"You have successfully claimed the delivery task for '{donation.title}'!",
        'assignment': assignment.to_dict()
    }), 201

@volunteer_bp.route('/assignments', methods=['GET'])
@jwt_required()
@role_required(['VOLUNTEER'])
@approved_required
def get_volunteer_assignments():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    vol = user.volunteer_profile

    assignments = Assignment.query.filter_by(volunteer_id=vol.id).order_by(Assignment.assigned_at.desc()).all()
    return jsonify({'success': True, 'assignments': [a.to_dict() for a in assignments]})

@volunteer_bp.route('/assignments/<int:assignment_id>/respond', methods=['POST'])
@jwt_required()
@role_required(['VOLUNTEER'])
@approved_required
def respond_assignment(assignment_id):
    """
    Race condition guard:
    Only ONE volunteer can accept an assignment.
    """
    data = request.get_json() or {}
    action = data.get('action', '').upper()  # ACCEPT or REJECT

    if action not in ['ACCEPT', 'REJECT']:
        return jsonify({'success': False, 'message': 'Action must be ACCEPT or REJECT'}), 400

    assignment = Assignment.query.get(assignment_id)
    if not assignment:
        return jsonify({'success': False, 'message': 'Assignment not found'}), 404

    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    vol = user.volunteer_profile

    # Ownership check first: unauthorized volunteers must not learn assignment state
    if assignment.volunteer_id != vol.id:
        return jsonify({'success': False, 'message': 'This assignment is not assigned to you'}), 403

    # Check race condition: if already accepted by someone else
    if action == 'ACCEPT' and assignment.status in ['ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED']:
        return jsonify({
            'success': False,
            'message': 'This assignment has already been accepted by another volunteer.'
        }), 409

    if action == 'ACCEPT':
        assignment.status = 'ACCEPTED'
        assignment.accepted_at = datetime.utcnow()
        msg = f"Volunteer '{vol.full_name}' accepted the assignment"

        # Create Delivery object
        delivery = Delivery(
            assignment_id=assignment.id,
            status='ASSIGNED'
        )
        db.session.add(delivery)
    else:
        assignment.status = 'REJECTED'
        assignment.rejected_at = datetime.utcnow()
        msg = f"Volunteer '{vol.full_name}' rejected the assignment"

    db.session.commit()

    log_action(user_id, f"VOLUNTEER_ASSIGNMENT_{action}", "Assignment", assignment.id, msg)

    # Notifications
    req = assignment.request
    if req:
        if req.ngo and req.ngo.user:
            create_notification(
                user_id=req.ngo.user.id,
                title=f"Volunteer {action}ed Delivery",
                message=f"Volunteer {vol.full_name} has {action.lower()}ed the delivery assignment for '{req.donation.title}'.",
                notif_type="INFO"
            )

    return jsonify({'success': True, 'message': f"Assignment {action.lower()}ed", 'assignment': assignment.to_dict()})

@volunteer_bp.route('/update-status', methods=['POST'])
@jwt_required()
@role_required(['VOLUNTEER'])
@approved_required
def update_delivery_status():
    """
    Status workflow transitions:
    ASSIGNED -> ACCEPTED -> PICKED_UP -> OUT_FOR_DELIVERY -> DELIVERED -> COMPLETED
    """
    data = request.get_json() or {}
    assignment_id = data.get('assignment_id')
    new_status = data.get('status', '').upper()

    valid_statuses = ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED']
    if new_status not in valid_statuses:
        return jsonify({'success': False, 'message': 'Invalid status transition'}), 400

    assignment = Assignment.query.get(assignment_id)
    if not assignment:
        return jsonify({'success': False, 'message': 'Assignment not found'}), 404

    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    vol = user.volunteer_profile

    # Ownership check: only the assigned volunteer may update the status
    if assignment.volunteer_id != vol.id:
        return jsonify({'success': False, 'message': 'This assignment is not assigned to you'}), 403

    # Enforce documented workflow: ASSIGNED -> ACCEPTED -> PICKED_UP -> OUT_FOR_DELIVERY -> DELIVERED
    allowed_previous = {
        'PICKED_UP': ['ACCEPTED'],
        'OUT_FOR_DELIVERY': ['PICKED_UP'],
        'DELIVERED': ['OUT_FOR_DELIVERY']
    }
    if assignment.status not in allowed_previous[new_status]:
        return jsonify({
            'success': False,
            'message': f"Invalid status transition: cannot move from '{assignment.status}' to '{new_status}'."
        }), 400

    delivery = Delivery.query.filter_by(assignment_id=assignment_id).first()
    if not delivery:
        delivery = Delivery(assignment_id=assignment_id)
        db.session.add(delivery)

    delivery.status = new_status
    assignment.status = new_status
    if assignment.request and assignment.request.donation:
        assignment.request.donation.status = new_status

    if new_status == 'PICKED_UP':
        delivery.pickup_time = datetime.utcnow()
        delivery.pickup_latitude = vol.latitude
        delivery.pickup_longitude = vol.longitude
    elif new_status == 'DELIVERED':
        delivery.delivery_time = datetime.utcnow()
        delivery.delivery_latitude = vol.latitude
        delivery.delivery_longitude = vol.longitude

    db.session.commit()

    log_action(user_id, f"DELIVERY_STATUS_{new_status}", "Delivery", delivery.id, f"Volunteer updated delivery status to {new_status}")

    # Send Notifications to NGO & Donor
    req = assignment.request
    if req:
        if req.ngo and req.ngo.user:
            create_notification(
                user_id=req.ngo.user.id,
                title=f"Delivery Status: {new_status}",
                message=f"Food rescue delivery status updated to {new_status} by Volunteer {vol.full_name}.",
                notif_type="INFO",
                send_sms_alert=True,
                recipient_phone=req.ngo.user.phone
            )
        if req.donation and req.donation.donor and req.donation.donor.user:
            create_notification(
                user_id=req.donation.donor.user.id,
                title=f"Food Status: {new_status}",
                message=f"Your donated food status is now {new_status}.",
                notif_type="INFO"
            )

    return jsonify({'success': True, 'message': f"Delivery status updated to {new_status}", 'delivery': delivery.to_dict()})

@volunteer_bp.route('/upload-proof', methods=['POST'])
@jwt_required()
@role_required(['VOLUNTEER'])
@approved_required
def upload_delivery_proof():
    assignment_id = request.form.get('assignment_id')
    delivery = Delivery.query.filter_by(assignment_id=assignment_id).first()
    if not delivery:
        return jsonify({'success': False, 'message': 'Delivery record not found'}), 404

    # Ownership check: only the assigned volunteer may upload proof
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or not user.volunteer_profile or delivery.assignment.volunteer_id != user.volunteer_profile.id:
        return jsonify({'success': False, 'message': 'This delivery is not assigned to you'}), 403

    if 'proof_image' in request.files:
        file = request.files['proof_image']
        if file and allowed_file(file.filename):
            filename = secure_filename(f"proof_{int(datetime.utcnow().timestamp())}_{file.filename}")
            upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'delivery')
            os.makedirs(upload_dir, exist_ok=True)
            file.save(os.path.join(upload_dir, filename))
            delivery.proof_image = f"/uploads/delivery/{filename}"
            delivery.status = 'DELIVERED'

            # Keep assignment and donation in sync with the delivered state
            assignment = delivery.assignment
            if assignment:
                assignment.status = 'DELIVERED'
                if assignment.request and assignment.request.donation:
                    assignment.request.donation.status = 'DELIVERED'

            db.session.commit()

            log_action(get_jwt_identity(), "DELIVERY_PROOF_UPLOADED", "Delivery", delivery.id, f"Volunteer uploaded delivery proof; status set to DELIVERED")

            return jsonify({'success': True, 'message': 'Delivery proof photo uploaded successfully', 'delivery': delivery.to_dict()})

    return jsonify({'success': False, 'message': 'No valid image file uploaded'}), 400

@volunteer_bp.route('/location', methods=['POST'])
@jwt_required()
def record_location():
    """
    POST /api/volunteer/location
    GPS Tracking Endpoint for navigator.geolocation.watchPosition()
    """
    data = request.get_json() or {}
    latitude = float(data.get('latitude', 0.0))
    longitude = float(data.get('longitude', 0.0))

    user_id = int(get_jwt_identity()) if get_jwt_identity() is not None else None
    user = User.query.get(user_id) if user_id else None

    vol = None
    if user and user.volunteer_profile:
        vol = user.volunteer_profile
        vol.latitude = latitude
        vol.longitude = longitude

        loc_entry = VolunteerLocation(
            volunteer_id=vol.id,
            latitude=latitude,
            longitude=longitude,
            timestamp=datetime.utcnow()
        )
        db.session.add(loc_entry)
        db.session.commit()

    return jsonify({
        'success': True,
        'volunteer_id': vol.id if vol else None,
        'latitude': latitude,
        'longitude': longitude,
        'timestamp': datetime.utcnow().isoformat()
    })
