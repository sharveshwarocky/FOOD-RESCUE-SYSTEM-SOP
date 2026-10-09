from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user import User
from app.models.donor import Donor
from app.models.ngo import NGO
from app.models.volunteer import Volunteer
from app.utils.captcha import generate_captcha, verify_captcha
from app.utils.validators import validate_registration_payload
from app.utils.logger import log_action

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/captcha', methods=['GET'])
def get_captcha():
    captcha_id, code = generate_captcha()
    return jsonify({
        'success': True,
        'captcha_id': captcha_id,
        'code': code  # Rendered visually in frontend
    })

@auth_bp.route('/captcha/verify', methods=['POST'])
def check_captcha():
    data = request.get_json() or {}
    captcha_id = data.get('captcha_id')
    user_code = data.get('code')
    valid = verify_captcha(captcha_id, user_code)
    return jsonify({'success': valid, 'message': 'CAPTCHA valid' if valid else 'Invalid CAPTCHA code'})

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    role = data.get('role', '').upper()
    phone = data.get('phone', '').strip()
    captcha_id = data.get('captcha_id')
    captcha_code = data.get('captcha_code')

    # CAPTCHA verification
    if not verify_captcha(captcha_id, captcha_code):
        return jsonify({'success': False, 'message': 'Invalid or expired CAPTCHA code'}), 400

    if role not in ['DONOR', 'NGO', 'VOLUNTEER']:
        return jsonify({'success': False, 'message': 'Invalid user role specified'}), 400

    is_valid, err_msg = validate_registration_payload(data, role)
    if not is_valid:
        return jsonify({'success': False, 'message': err_msg}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({'success': False, 'message': 'Username or Email already registered'}), 409

    # Create User
    new_user = User(
        username=username,
        email=email,
        role=role,
        phone=phone,
        is_approved=False,
        approval_status='PENDING'
    )
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.flush()  # get user.id

    # Role specific profile creation
    if role == 'DONOR':
        donor = Donor(
            user_id=new_user.id,
            organization_name=data.get('organization_name', username),
            address=data.get('address', ''),
            latitude=float(data.get('latitude', 0.0) or 0.0),
            longitude=float(data.get('longitude', 0.0) or 0.0)
        )
        db.session.add(donor)
    elif role == 'NGO':
        ngo = NGO(
            user_id=new_user.id,
            ngo_name=data.get('ngo_name'),
            registration_number=data.get('registration_number'),
            address=data.get('address', ''),
            latitude=float(data.get('latitude', 0.0) or 0.0),
            longitude=float(data.get('longitude', 0.0) or 0.0)
        )
        db.session.add(ngo)
    elif role == 'VOLUNTEER':
        volunteer = Volunteer(
            user_id=new_user.id,
            full_name=data.get('full_name'),
            vehicle_type=data.get('vehicle_type', 'Bike'),
            address=data.get('address', ''),
            latitude=float(data.get('latitude', 0.0) or 0.0),
            longitude=float(data.get('longitude', 0.0) or 0.0)
        )
        db.session.add(volunteer)

    db.session.commit()
    log_action(new_user.id, "USER_REGISTERED", "User", new_user.id, f"Registered new {role} account ({username})")

    return jsonify({
        'success': True,
        'message': 'Registration successful! Your account is pending Admin approval.',
        'user': new_user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')
    captcha_id = data.get('captcha_id')
    captcha_code = data.get('captcha_code')

    if not verify_captcha(captcha_id, captcha_code):
        return jsonify({'success': False, 'message': 'Invalid or expired CAPTCHA code'}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'success': False, 'message': 'Invalid username or password'}), 401

    if user.role != 'ADMIN' and user.approval_status == 'REJECTED':
        return jsonify({'success': False, 'message': 'Your account registration was rejected by Admin.'}), 403

    if user.role != 'ADMIN' and user.approval_status == 'DEACTIVATED':
        return jsonify({'success': False, 'message': 'Your account is deactivated. Contact Admin.'}), 403

    token = create_access_token(identity=str(user.id))
    log_action(user.id, "USER_LOGIN", "User", user.id, f"User '{username}' logged in successfully.")

    profile_data = {}
    if user.role == 'DONOR' and user.donor_profile:
        profile_data = user.donor_profile.to_dict()
    elif user.role == 'NGO' and user.ngo_profile:
        profile_data = user.ngo_profile.to_dict()
    elif user.role == 'VOLUNTEER' and user.volunteer_profile:
        profile_data = user.volunteer_profile.to_dict()

    return jsonify({
        'success': True,
        'message': 'Login successful!',
        'token': token,
        'user': {**user.to_dict(), 'profile': profile_data}
    })

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    profile_data = {}
    if user.role == 'DONOR' and user.donor_profile:
        profile_data = user.donor_profile.to_dict()
    elif user.role == 'NGO' and user.ngo_profile:
        profile_data = user.ngo_profile.to_dict()
    elif user.role == 'VOLUNTEER' and user.volunteer_profile:
        profile_data = user.volunteer_profile.to_dict()

    return jsonify({
        'success': True,
        'user': {**user.to_dict(), 'profile': profile_data}
    })
