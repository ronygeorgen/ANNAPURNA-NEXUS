import random
import time
import redis
from django.conf import settings
from django.utils import timezone
from twilio.rest import Client
from ration_cards_app.models import OTPVerification

class OTPService:
    def __init__(self):
        self.redis_client = redis.Redis.from_url(settings.REDIS_URL)
        self.twilio_client = Client(
            settings.TWILIO_ACCOUNT_SID, 
            settings.TWILIO_AUTH_TOKEN
        )

    def can_send_otp(self, user_email, card_number):
        # Check if OTP was recently sent
        cache_key = f"otp_cooldown:{user_email}:{card_number}"
        last_sent = self.redis_client.get(cache_key)
        
        if last_sent:
            time_elapsed = time.time() - float(last_sent)
            if time_elapsed < settings.OTP_RESEND_COOLDOWN:
                return False
        
        return True

    def generate_otp(self, user_email, card_number, phone_number):
        # Check if OTP can be sent
        if not self.can_send_otp(user_email, card_number):
            raise ValueError(f"Please wait {settings.OTP_RESEND_COOLDOWN} seconds before requesting a new OTP")

        # Generate 4-digit OTP
        otp = str(random.randint(1000, 9999))
        
        # Create or update OTP verification record
        try:
            otp_record = OTPVerification.objects.get(
                user=user_email, 
                card_number=card_number, 
                phone_number=phone_number,
                is_verified=False
            )
            
            # Reset attempts and update OTP
            otp_record.otp = otp
            otp_record.attempts = 0
            otp_record.created_at = timezone.now()
            otp_record.save()
        except OTPVerification.DoesNotExist:
            # Create new record if no existing unverified record
            otp_record = OTPVerification.objects.create(
                user=user_email,
                card_number=card_number,
                phone_number=phone_number,
                otp=otp,
                attempts=0
            )
        
        # Store in Redis with expiration
        cache_key = f"otp:{user_email}:{card_number}"
        self.redis_client.setex(cache_key, settings.OTP_EXPIRATION_TIME, otp)
        
        # Store cooldown timestamp
        cooldown_key = f"otp_cooldown:{user_email}:{card_number}"
        self.redis_client.setex(cooldown_key, settings.OTP_RESEND_COOLDOWN, str(time.time()))
        
        return otp

    def send_otp(self, user_email, card_number, phone_number):
        otp = self.generate_otp(user_email, card_number, phone_number)
        
        # Send via Twilio
        message = self.twilio_client.messages.create(
            body=f"Your OTP for ration card number {card_number} is: {otp}",
            from_=int(settings.TWILIO_PHONE_NUMBER),
            to='+91'+phone_number
        )
        
        return message.sid

    def verify_otp(self, user_email, card_number, user_otp):
        try:
            otp_record = OTPVerification.objects.get(
                user=user_email, 
                card_number=card_number, 
                is_verified=False
            )
            
            # Check maximum attempts
            if otp_record.attempts >= settings.MAX_OTP_ATTEMPTS:
                return {
                    'verified': False, 
                    'message': 'Max attempts reached. Please request a new OTP.'
                }
            
            # Check OTP expiration (5 minutes)
            time_since_creation = timezone.now() - otp_record.created_at
            if time_since_creation.total_seconds() > settings.OTP_EXPIRATION_TIME:
                return {
                    'verified': False, 
                    'message': 'OTP has expired. Please request a new one.'
                }
            
            # Check Redis for OTP
            cache_key = f"otp:{user_email}:{card_number}"
            stored_otp = self.redis_client.get(cache_key)
            
            if stored_otp and stored_otp.decode() == user_otp:
                # Mark as verified
                otp_record.is_verified = True
                otp_record.save()
                
                # Clear Redis
                self.redis_client.delete(cache_key)
                
                return {
                    'verified': True, 
                    'message': 'OTP verified successfully'
                }
            else:
                # Increment attempts
                otp_record.attempts += 1
                otp_record.save()
                
                return {
                    'verified': False, 
                    'message': 'Invalid OTP. Please try again.',
                    'remaining_attempts': settings.MAX_OTP_ATTEMPTS - otp_record.attempts
                }
        
        except OTPVerification.DoesNotExist:
            return {
                'verified': False, 
                'message': 'No OTP request found'
            }