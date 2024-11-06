from django.core.management.base import BaseCommand
from ration_shops_app.signals import publish_ration_shop_event

class Command(BaseCommand):
    help = 'Test Kafka producer by sending a test message'

    def handle(self, *args, **options):
        test_data = {
            'id': 6,
            'name': 'test4',
            'owner_id': 38,
            'mobile_number': '123456789',
            'location': 'kerala',
            'is_active': True,
            'created_by_id': 37,
        }
        publish_ration_shop_event('ration_shop_created', test_data)
        self.stdout.write(self.style.SUCCESS('Test message sent'))