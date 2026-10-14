from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import (
    User, Volunteer, Donor, NGO, Donation,
    Request as FoodRequest, Assignment, Delivery, VolunteerLocation
)

location_bp = Blueprint('location', __name__, url_prefix='/api/location')

@location_bp.route('/live-feed', methods=['GET'])
@jwt_required()
def get_live_feed():
    """
    Universal real-time live tracking feed accessible to all authenticated roles
    (ADMIN, NGO, DONOR, VOLUNTEER).
    Returns volunteers, donors, NGOs, active delivery routes, and caller context.
    """
    identity = get_jwt_identity()
    user_id = int(identity) if identity is not None else None
    user = User.query.get(user_id) if user_id else None

    current_user_data = {
        'id': user.id if user else None,
        'username': user.username if user else None,
        'role': user.role if user else None,
        'latitude': None,
        'longitude': None,
        'name': user.username if user else 'User'
    }

    if user:
        if user.role == 'DONOR' and user.donor_profile:
            current_user_data['latitude'] = user.donor_profile.latitude
            current_user_data['longitude'] = user.donor_profile.longitude
            current_user_data['name'] = user.donor_profile.organization_name or user.username
        elif user.role == 'NGO' and user.ngo_profile:
            current_user_data['latitude'] = user.ngo_profile.latitude
            current_user_data['longitude'] = user.ngo_profile.longitude
            current_user_data['name'] = user.ngo_profile.ngo_name
        elif user.role == 'VOLUNTEER' and user.volunteer_profile:
            latest = VolunteerLocation.query.filter_by(volunteer_id=user.volunteer_profile.id).order_by(VolunteerLocation.timestamp.desc()).first()
            current_user_data['latitude'] = latest.latitude if latest else user.volunteer_profile.latitude
            current_user_data['longitude'] = latest.longitude if latest else user.volunteer_profile.longitude
            current_user_data['name'] = user.volunteer_profile.full_name

    # 1. Volunteers with latest live ping and active assignment info
    volunteers = Volunteer.query.all()
    vol_list = []
    for v in volunteers:
        latest = VolunteerLocation.query.filter_by(volunteer_id=v.id).order_by(VolunteerLocation.timestamp.desc()).first()
        lat = latest.latitude if (latest and latest.latitude) else v.latitude
        lng = latest.longitude if (latest and latest.longitude) else v.longitude

        # Check active assignment
        active_assign = Assignment.query.filter(
            Assignment.volunteer_id == v.id,
            Assignment.status.in_(['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'])
        ).order_by(Assignment.assigned_at.desc()).first()

        active_task = None
        if active_assign and active_assign.request:
            req = active_assign.request
            donation = req.donation
            ngo = req.ngo
            donor = donation.donor if donation else None
            active_task = {
                'assignment_id': active_assign.id,
                'status': active_assign.status,
                'donation_title': donation.title if donation else 'Food Package',
                'quantity': donation.quantity if donation else '',
                'pickup_address': donation.pickup_address if donation else (donor.address if donor else None),
                'pickup_latitude': donation.latitude if (donation and donation.latitude) else (donor.latitude if donor else None),
                'pickup_longitude': donation.longitude if (donation and donation.longitude) else (donor.longitude if donor else None),
                'donor_name': donor.organization_name if donor else (donation.donor.user.username if donation and donation.donor and donation.donor.user else 'Donor'),
                'donor_phone': donor.user.phone if (donor and donor.user) else None,
                'dropoff_address': ngo.address if ngo else None,
                'dropoff_latitude': ngo.latitude if ngo else None,
                'dropoff_longitude': ngo.longitude if ngo else None,
                'ngo_name': ngo.ngo_name if ngo else 'NGO Hub',
                'ngo_phone': ngo.user.phone if (ngo and ngo.user) else None
            }

        vol_list.append({
            'volunteer_id': v.id,
            'user_id': v.user_id,
            'full_name': v.full_name,
            'phone': v.user.phone if v.user else None,
            'vehicle_type': v.vehicle_type or 'Bike',
            'is_available': v.is_available,
            'latitude': lat,
            'longitude': lng,
            'timestamp': latest.timestamp.isoformat() if latest else None,
            'active_task': active_task
        })

    # 2. Donors with coordinates and active surplus food
    donors = Donor.query.all()
    donor_list = []
    for d in donors:
        active_donations_count = Donation.query.filter(
            Donation.donor_id == d.id,
            Donation.status.in_(['APPROVED', 'DONOR_ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'])
        ).count()

        donor_list.append({
            'donor_id': d.id,
            'user_id': d.user_id,
            'organization_name': d.organization_name or (d.user.username if d.user else 'Donor'),
            'phone': d.user.phone if d.user else None,
            'address': d.address,
            'latitude': d.latitude,
            'longitude': d.longitude,
            'active_donations_count': active_donations_count
        })

    # 3. Approved NGOs with coordinates
    ngos = NGO.query.all()
    ngo_list = []
    for n in ngos:
        if n.user and n.user.approval_status != 'APPROVED' and n.user.is_approved is False:
            continue
        active_requests_count = FoodRequest.query.filter(
            FoodRequest.ngo_id == n.id,
            FoodRequest.status.in_(['PENDING', 'ACCEPTED'])
        ).count()

        ngo_list.append({
            'ngo_id': n.id,
            'user_id': n.user_id,
            'ngo_name': n.ngo_name,
            'registration_number': n.registration_number,
            'phone': n.user.phone if n.user else None,
            'address': n.address,
            'latitude': n.latitude,
            'longitude': n.longitude,
            'active_requests_count': active_requests_count
        })

    # 4. Active Deliveries / Assignments
    active_assignments = Assignment.query.filter(
        Assignment.status.in_(['ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'OUT_FOR_DELIVERY'])
    ).all()

    active_deliveries = []
    for a in active_assignments:
        req = a.request
        if not req:
            continue
        donation = req.donation
        ngo = req.ngo
        donor = donation.donor if donation else None
        vol = a.volunteer
        vol_latest = VolunteerLocation.query.filter_by(volunteer_id=vol.id).order_by(VolunteerLocation.timestamp.desc()).first() if vol else None

        active_deliveries.append({
            'assignment_id': a.id,
            'request_id': req.id,
            'status': a.status,
            'assigned_at': a.assigned_at.isoformat() if a.assigned_at else None,
            'donation': {
                'id': donation.id if donation else None,
                'title': donation.title if donation else 'Food Donation',
                'food_type': donation.food_type if donation else '',
                'quantity': donation.quantity if donation else '',
                'pickup_address': donation.pickup_address if donation else (donor.address if donor else None),
                'latitude': donation.latitude if (donation and donation.latitude) else (donor.latitude if donor else None),
                'longitude': donation.longitude if (donation and donation.longitude) else (donor.longitude if donor else None)
            },
            'donor': {
                'id': donor.id if donor else None,
                'name': donor.organization_name if donor else 'Donor',
                'phone': donor.user.phone if (donor and donor.user) else None,
                'address': donor.address if donor else None,
                'latitude': donor.latitude if donor else None,
                'longitude': donor.longitude if donor else None
            },
            'ngo': {
                'id': ngo.id if ngo else None,
                'name': ngo.ngo_name if ngo else 'NGO',
                'phone': ngo.user.phone if (ngo and ngo.user) else None,
                'address': ngo.address if ngo else None,
                'latitude': ngo.latitude if ngo else None,
                'longitude': ngo.longitude if ngo else None
            },
            'volunteer': {
                'id': vol.id if vol else None,
                'name': vol.full_name if vol else 'Volunteer',
                'phone': vol.user.phone if (vol and vol.user) else None,
                'vehicle_type': vol.vehicle_type if vol else 'Bike',
                'latitude': vol_latest.latitude if (vol_latest and vol_latest.latitude) else (vol.latitude if vol else None),
                'longitude': vol_latest.longitude if (vol_latest and vol_latest.longitude) else (vol.longitude if vol else None),
                'last_ping': vol_latest.timestamp.isoformat() if vol_latest else None
            }
        })

    return jsonify({
        'success': True,
        'current_user': current_user_data,
        'volunteers': vol_list,
        'donors': donor_list,
        'ngos': ngo_list,
        'active_deliveries': active_deliveries
    })

@location_bp.route('/volunteers', methods=['GET'])
@jwt_required()
def get_all_locations():
    """Returns all volunteers with latest GPS ping."""
    volunteers = Volunteer.query.all()
    results = []
    for v in volunteers:
        latest = VolunteerLocation.query.filter_by(volunteer_id=v.id).order_by(VolunteerLocation.timestamp.desc()).first()
        results.append({
            'volunteer_id': v.id,
            'full_name': v.full_name,
            'phone': v.user.phone if v.user else None,
            'latitude': latest.latitude if (latest and latest.latitude) else v.latitude,
            'longitude': latest.longitude if (latest and latest.longitude) else v.longitude,
            'vehicle_type': v.vehicle_type,
            'is_available': v.is_available,
            'timestamp': latest.timestamp.isoformat() if latest else None
        })
    return jsonify({'success': True, 'volunteers': results})

@location_bp.route('/update', methods=['POST'])
@jwt_required()
def update_location():
    """
    GPS Recording Endpoint: accepts latitude and longitude and updates
    the authenticated user profile and live ping table.
    """
    data = request.get_json() or {}
    try:
        latitude = float(data.get('latitude', 0.0))
        longitude = float(data.get('longitude', 0.0))
    except (ValueError, TypeError):
        return jsonify({'success': False, 'message': 'Invalid latitude or longitude'}), 400

    if latitude == 0.0 and longitude == 0.0:
        return jsonify({'success': False, 'message': 'Latitude and longitude cannot be 0,0'}), 400

    identity = get_jwt_identity()
    user_id = int(identity) if identity is not None else None
    user = User.query.get(user_id) if user_id else None

    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    now = datetime.utcnow()

    if user.role == 'VOLUNTEER' and user.volunteer_profile:
        vol = user.volunteer_profile
        vol.latitude = latitude
        vol.longitude = longitude
        loc = VolunteerLocation(
            volunteer_id=vol.id,
            latitude=latitude,
            longitude=longitude,
            timestamp=now
        )
        db.session.add(loc)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Volunteer location updated',
            'role': 'VOLUNTEER',
            'latitude': latitude,
            'longitude': longitude,
            'timestamp': now.isoformat()
        })
    elif user.role == 'DONOR' and user.donor_profile:
        donor = user.donor_profile
        donor.latitude = latitude
        donor.longitude = longitude
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Donor location updated',
            'role': 'DONOR',
            'latitude': latitude,
            'longitude': longitude
        })
    elif user.role == 'NGO' and user.ngo_profile:
        ngo = user.ngo_profile
        ngo.latitude = latitude
        ngo.longitude = longitude
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'NGO location updated',
            'role': 'NGO',
            'latitude': latitude,
            'longitude': longitude
        })

    return jsonify({'success': True, 'message': 'Location received', 'latitude': latitude, 'longitude': longitude})
