from confluent_kafka import Consumer, KafkaError
import json
from django.conf import settings
from .models import AdminAuth, SubAdminAuth
import logging

logger = logging.getLogger(__name__)

class UserEventsConsumer:
    def __init__(self):
        logger.info("Initializing Kafka consumer...")
        config = {
            'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
            'group.id': settings.KAFKA_CONSUMER_GROUP,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': True,
            'max.poll.interval.ms': 300000
        }
        logger.info(f"Consumer config: {config}")
        self.consumer = Consumer(config)
        self.consumer.subscribe([settings.KAFKA_TOPIC_USER_EVENTS])
        logger.info(f"Subscribed to topic: {settings.KAFKA_TOPIC_USER_EVENTS}")
        self.running = True

    def process_messages(self):
        logger.info("Starting to process messages...")
        try:
            while self.running:
                msg = self.consumer.poll(timeout=1.0)

                if msg is None:
                    continue
                if msg.error():
                    logger.error(f"Consumer error: {msg.error()}")
                    continue

                try:
                    data = json.loads(msg.value().decode('utf-8'))
                    logger.info(f"Received message: {data}")
                    event_type = data.get('event_type')
                    
                    if event_type in ['admin_created', 'admin_updated']:
                        logger.info(f"Processing admin event: {event_type}")
                        self._handle_admin_auth(data['admin_data'])
                    elif event_type in ['sub_admin_created', 'sub_admin_updated']:
                        logger.info(f"Processing sub-admin event: {event_type}")
                        self._handle_sub_admin_sync(data['sub_admin_data'])

                except json.JSONDecodeError as e:
                    logger.error(f"Error decoding message: {e}")
                except Exception as e:
                    logger.error(f"Error processing message: {e}", exc_info=True)

        except Exception as e:
            logger.error(f"Consumer error: {e}", exc_info=True)
        finally:
            self.close()

    def _handle_admin_auth(self, data):
        """Store or update admin authentication details"""
        try:
            AdminAuth.objects.update_or_create(
                admin_id=data['id'],
                defaults={
                    'email': data['email'],
                    'auth_token': data['auth_token'],
                    'is_active': data['is_active']
                }
            )
        except Exception as e:
            print(f"Error handling admin auth: {e}")

    def _handle_sub_admin_sync(self, data):
        """Store or update sub-admin details (no auth needed)"""
        try:
            SubAdminAuth.objects.update_or_create(
                sub_admin_id=data['id'],
                defaults={
                    'email': data['email'],
                    'is_active': data['is_active']
                }
            )
        except Exception as e:
            print(f"Error handling sub-admin sync: {e}")

    def close(self):
        """Cleanup consumer resources"""
        try:
            self.running = False
            self.consumer.close()
        except Exception as e:
            print(f"Error closing consumer: {e}")