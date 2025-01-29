from django.core.management.base import BaseCommand
from notifications.kafka_consumer import KafkaNotificationConsumer

class Command(BaseCommand):
    help = 'Runs the Kafka consumer for notifications'

    def handle(self, *args, **options):
        self.stdout.write('Starting Kafka consumer...')
        consumer = KafkaNotificationConsumer()
        try:
            consumer.start()
        except KeyboardInterrupt:
            self.stdout.write(self.style.SUCCESS('Stopping Kafka consumer...'))
            consumer.stop()