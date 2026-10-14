import random
import string
import time

# Memory store for active CAPTCHA challenges: { captcha_id: { code: str, expires_at: float } }
CAPTCHA_STORE = {}

def generate_captcha():
    code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
    captcha_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=12))
    CAPTCHA_STORE[captcha_id] = {
        'code': code,
        'expires_at': time.time() + 300  # Valid 5 minutes
    }
    return captcha_id, code

def verify_captcha(captcha_id, user_code):
    if not captcha_id or captcha_id not in CAPTCHA_STORE:
        return False
    entry = CAPTCHA_STORE[captcha_id]
    if time.time() > entry['expires_at']:
        del CAPTCHA_STORE[captcha_id]
        return False
    
    is_valid = entry['code'].upper() == str(user_code).strip().upper()
    del CAPTCHA_STORE[captcha_id]  # Single use
    return is_valid
