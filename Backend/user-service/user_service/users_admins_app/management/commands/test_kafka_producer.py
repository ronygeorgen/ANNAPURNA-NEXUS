from django.core.management.base import BaseCommand
from users_admins_app.signals import publish_user_event

class Command(BaseCommand):
    help = 'Test Kafka producer by sending a test message'

    def handle(self, *args, **options):
        test_data = {
            'id': 999,
            'email': 'test@example.com',
            'is_active': True,
            'is_subadmin': True,
            'created_at': '2024-10-30T00:00:00Z'
        }
        publish_user_event('sub_admin_created', test_data)
        self.stdout.write(self.style.SUCCESS('Test message sent'))