from celery import shared_task
from .services.otp_services import OTPService

@shared_task
def send_otp_task(phone_number):
    otp_service = OTPService()
    return otp_service.send_otp(phone_number)