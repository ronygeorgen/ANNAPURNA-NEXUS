from django.core.management.base import BaseCommand
from ration_cards_app.consumers import OrderEventsConsumer

class Command(BaseCommand):
    help = 'Runs the Kafka consumer for order events'

    def handle(self, *args, **options):
        self.stdout.write('Starting Order Events Consumer...')
        consumer = OrderEventsConsumer()
        try:
            consumer.process_messages()
        except KeyboardInterrupt:
            self.stdout.write('\nStopping consumer...')
            consumer.close()
            self.stdout.write(self.style.SUCCESS('Consumer stopped successfully'))