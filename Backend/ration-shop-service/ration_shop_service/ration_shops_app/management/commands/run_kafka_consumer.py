from django.core.management.base import BaseCommand
from ration_shops_app.consumers import UserEventsConsumer

class Command(BaseCommand):
    help = 'Runs the Kafka consumer for user events'

    def handle(self, *args, **options):
        self.stdout.write('Starting Kafka consumer...')
        consumer = UserEventsConsumer()
        try:
            consumer.process_messages()
        except KeyboardInterrupt:
            self.stdout.write('\nStopping consumer...')
            consumer.close()
            self.stdout.write(self.style.SUCCESS('Consumer stopped successfully'))