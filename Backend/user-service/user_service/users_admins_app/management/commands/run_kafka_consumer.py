from django.core.management.base import BaseCommand
from users_admins_app.consumer import RationShopEventsConsumer

class Command(BaseCommand):
    help = 'Runs the Kafka consumer for user events'

    def handle(self, *args, **options):
        self.stdout.write('Starting Kafka consumer...')
        consumer = RationShopEventsConsumer()
        try:
            consumer.process_messages()
        except KeyboardInterrupt:
            self.stdout.write('\nStopping consumer...')
            consumer.close()
            self.stdout.write(self.style.SUCCESS('Consumer stopped successfully'))