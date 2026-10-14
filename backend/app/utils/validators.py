import os
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_registration_payload(data, role):
    required = ['username', 'email', 'password', 'phone']
    for req in required:
        if not data.get(req):
            return False, f"Field '{req}' is required."
    
    role = role.upper()
    if role == 'NGO' and not data.get('ngo_name'):
        return False, "Field 'ngo_name' is required for NGO registration."
    if role == 'NGO' and not data.get('registration_number'):
        return False, "Field 'registration_number' is required for NGO registration."
    if role == 'VOLUNTEER' and not data.get('full_name'):
        return False, "Field 'full_name' is required for Volunteer registration."
        
    return True, None
