# In stock-service/product_management/management/commands/test_kafka_producer.py
from django.core.management.base import BaseCommand
from confluent_kafka import Producer
import json
from django.conf import settings

class Command(BaseCommand):
    help = 'Produce a test message to Kafka'

    def handle(self, *args, **options):
        conf = {
            'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
        }

        producer = Producer(conf)

        test_message = {
            'event_type': 'test_message',
            'message': 'Hello, Kafka! This is a test message.I am Rony'
        }

        def delivery_report(err, msg):
            if err is not None:
                self.stdout.write(self.style.ERROR(f'Message delivery failed: {err}'))
            else:
                self.stdout.write(self.style.SUCCESS(
                    f'Message delivered to {msg.topic()} [{msg.partition()}]'
                ))

        producer.produce(
            settings.KAFKA_TOPIC_STOCK_EVENTS, 
            json.dumps(test_message).encode('utf-8'),
            callback=delivery_report
        )

        producer.flush()
        self.stdout.write(self.style.SUCCESS('Test message production completed'))
    # Modify the test producer to add more verbose logging
    def delivery_report(err, msg):
        if err is not None:
            print(f'Message delivery FAILED: {err}')
            print(f'Message: {msg}')
        else:
            print(f'Message delivered to {msg.topic()} [{msg.partition()}]')
            print(f'Message Value: {msg.value()}')
