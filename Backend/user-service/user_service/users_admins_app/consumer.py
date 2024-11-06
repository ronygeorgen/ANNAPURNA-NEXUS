from confluent_kafka import Consumer
import json
from django.conf import settings
from .models import RationShop, Account
import logging

logger = logging.getLogger(__name__)

class RationShopEventsConsumer:
    def __init__(self):
        logger.info("Initializing kafka consumer in user-service..")
        config = {
            'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
            'group.id': settings.KAFKA_CONSUMER_GROUP,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': True,
            'max.poll.interval.ms': 300000
        }
        logger.info(f"Consumer config: {config}")
        self.consumer = Consumer(config)
        self.consumer.subscribe([settings.KAFKA_TOPIC_RATION_SHOP_CREATION_EVENTS])
        logger.info(f"Subscribed to topic:{settings.KAFKA_TOPIC_RATION_SHOP_CREATION_EVENTS}")
        self.running = True

    def process_messages(self):
        logger.info("starting to process messages....")
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

                    if event_type in ['ration_shop_created', 'ration_shop_updated']:
                        logger.info(f"Processing ration shop event: {event_type}")
                        self._handle_ration_shop_sync(data['shop_data'])
                except json.JSONDecodeError as e:
                    logger.error(f"Error decoding message: {e}")
                except Exception as e:
                    logger.error(f"Error processing message: {e}", exc_info=True)

        except Exception as e:
            logger.error(f"Consumer error: {e}", exc_info=True)
        finally:
            self.close()
    
    def _handle_ration_shop_sync(self, data):
        try:
            # Validate and retrieve the owner and creator
            owner = Account.objects.get(id=data['owner_id']) if data.get('owner_id') else None
            created_by = Account.objects.get(id=data['created_by_id']) if data.get('created_by_id') else None

            # Synchronize or update RationShop data
            RationShop.objects.update_or_create(
                shop_id=data['id'],
                defaults={
                    'name': data['name'],
                    'owner': owner,
                    'mobile_number': data['mobile_number'],
                    'location': data['location'],
                    'is_active': data['is_active'],
                    'created_by': created_by,
                }
            )
        except Account.DoesNotExist as e:
            logger.error(f"Account not found for ID: {e}")
        except Exception as e:
            logger.error(f"Error handling ration shop sync: {e}")
    
    def close(self):
        try:
            self.running = False
            self.consumer.close()
            logger.info("Kafka consumer closed successfully")
        except Exception as e:
            logger.error(f"Error closing consumer: {e}")