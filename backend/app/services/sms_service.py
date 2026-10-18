import os

def send_sms(to_phone, message_text):
    """
    Mock SMS Service with optional Twilio hook.
    Always logs to console and returns status payload.
    """
    print(f"\n==========================================")
    print(f"[MOCK SMS DISPATCH]")
    print(f"To: {to_phone}")
    print(f"Message: {message_text}")
    print(f"==========================================\n")

    # Optional Twilio Integration
    twilio_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    twilio_auth = os.environ.get('TWILIO_AUTH_TOKEN')
    twilio_phone = os.environ.get('TWILIO_PHONE_NUMBER')

    if twilio_sid and twilio_auth and twilio_phone:
        try:
            from twilio.rest import Client
            client = Client(twilio_sid, twilio_auth)
            client.messages.create(
                body=message_text,
                from_=twilio_phone,
                to=to_phone
            )
            print(f"[TWILIO SMS] Real SMS sent to {to_phone}")
        except Exception as e:
            print(f"[TWILIO SMS ERROR] Could not dispatch real SMS: {str(e)}")

    return {'success': True, 'recipient': to_phone, 'message': message_text}
