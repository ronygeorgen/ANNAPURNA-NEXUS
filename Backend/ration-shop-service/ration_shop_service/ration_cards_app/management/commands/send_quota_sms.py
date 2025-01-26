from django.core.management.base import BaseCommand
from ration_cards_app.tasks import send_remaining_quota_sms, reset_remaining_quantities

class Command(BaseCommand):
    help = 'Send SMS notifications for remaining ration quotas and reset remaining quantities'

    def handle(self, *args, **options):
        # Schedule the task to send SMS notifications
        # sms_result = send_remaining_quota_sms.delay()
        # self.stdout.write(
        #     self.style.SUCCESS(
        #         f'Quota SMS task scheduled with ID: {sms_result.id}'
        #     )
        # )

        # Schedule the task to reset remaining quantities
        reset_result = reset_remaining_quantities.delay()
        self.stdout.write(
            self.style.SUCCESS(
                f'Reset remaining quantities task scheduled with ID: {reset_result.id}'
            )
        )
