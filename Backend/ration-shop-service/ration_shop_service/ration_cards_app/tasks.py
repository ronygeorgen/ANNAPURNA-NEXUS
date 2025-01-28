from celery import shared_task
from django.utils import timezone
from django.conf import settings
from twilio.rest import Client
from .models import RationCard, QuotaAllocation
from datetime import datetime
import calendar
from .services.otp_services import OTPService

@shared_task
def send_remaining_quota_sms():
    # Check if it's the last week of the month
    today = timezone.now()
    days_in_month = calendar.monthrange(today.year, today.month)[1]
    
    # Only run if in the last week
    if today.day >= days_in_month - 6:
        # Twilio client setup
        twilio_client = Client(
            settings.TWILIO_ACCOUNT_SID, 
            settings.TWILIO_AUTH_TOKEN
        )

        # Current month and year
        current_month = today.month
        current_year = today.year

        # Find cards with remaining quotas
        ration_cards = RationCard.objects.filter(
            is_active=True,
            status='ADMIN_APPROVED',
            mobile_number__isnull=False
        )

        for card in ration_cards:
            # Check remaining quotas for current month
            remaining_quotas = QuotaAllocation.objects.filter(
                ration_card=card,
                quota__month=current_month,
                quota__year=current_year,
                remaining_quantity__gt=0
            )

            if remaining_quotas.exists():
                # Prepare SMS message
                items_list = ', '.join([
                    f"{qa.item.name}: {qa.remaining_quantity}" 
                    for qa in remaining_quotas
                ])
                
                message = (
                    f"Attention Ration Card Holder! "
                    f"You have remaining subsidies this month: {items_list}. "
                    "Visit your nearest ration shop to claim before month-end."
                )

                try:
                    twilio_client.messages.create(
                        body=message,
                        from_=settings.TWILIO_PHONE_NUMBER,
                        to='+91'+card.mobile_number
                    )
                except Exception as e:
                    print(f"Failed to send SMS to {card.mobile_number}: {e}")

        return "Quota SMS notifications completed"
    
    return "Not the last week of the month"


@shared_task
def reset_remaining_quantities():
    today = timezone.now()
    days_in_month = calendar.monthrange(today.year, today.month)[1]

    # Only reset on the last day of the month
    if today.day == days_in_month:
        # Get current month and year
        current_month = timezone.now().month
        current_year = timezone.now().year

        # Update all quota allocations for the current month to zero
        QuotaAllocation.objects.filter(
            quota__month=current_month,
            quota__year=current_year,
            remaining_quantity__gt=0
        ).update(
            remaining_quantity=0,
            is_used=True
        )

        return "Remaining quantities reset for the month"


@shared_task
def send_otp_task(user_email, card_number, phone_number):
    otp_service = OTPService()
    return otp_service.send_otp(user_email, card_number, phone_number)