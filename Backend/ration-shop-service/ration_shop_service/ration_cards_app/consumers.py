# consumers.py
from confluent_kafka import Consumer, KafkaError
from django.conf import settings
import json
import logging
import traceback

logger = logging.getLogger(__name__)

class StockEventsConsumer:
    def __init__(self):
        """Initialize Kafka consumer with configuration"""
        logger.info("Initializing Stock Events Kafka consumer...")
        config = {
            'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
            'group.id': settings.KAFKA_CONSUMER_GROUP_STOCK,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': False,  # Recommended to manage commits manually
            'max.poll.interval.ms': 300000  # Increase timeout to prevent rebalancing
        }
        logger.info(f"Consumer config: {config}")
        
        # Create consumer and subscribe to topic
        self.consumer = Consumer(config)
        self.topic = settings.KAFKA_TOPIC_STOCK_EVENTS
        self.consumer.subscribe([self.topic])
        logger.info(f"Subscribed to topic: {self.topic}")
        
        # Running flag for controlled consumption
        self.running = True

    def process_messages(self):
        """Main message processing loop"""
        logger.info("Starting to process stock events...")
        
        try:
            while self.running:
                # Poll for messages with a short timeout
                msg = self.consumer.poll(timeout=1.0)

                # Skip if no message
                if msg is None:
                    continue

                # Handle Kafka errors
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        logger.info("Reached end of partition")
                        continue
                    else:
                        logger.error(f"Kafka consumer error: {msg.error()}")
                        break

                try:
                    # Decode and parse message
                    message_str = msg.value().decode('utf-8')
                    event = json.loads(message_str)
                    logger.info(f"Received event: {event}")

                    # Process specific event types
                    self._process_stock_event(event)

                    # Manually commit offset
                    self.consumer.commit()

                except json.JSONDecodeError as e:
                    logger.error(f"JSON Decode Error: {e}")
                    logger.error(f"Raw message: {message_str}")
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
                    logger.error(traceback.format_exc())

        except KeyboardInterrupt:
            logger.info("Consumer interrupted")
        finally:
            self.close()

    def _process_stock_event(self, event):
        """Process individual stock events"""
        # Validate event type
        if event.get('event_type') not in ['existing_stock_data', 'stock_created', 'stock_updated']:
            logger.warning(f"Unhandled event type: {event.get('event_type')}")
            return

        # Extract stock data
        stock_data = event.get('stock_data', {})
        
        try:
            # Dynamic import to avoid circular imports
            from .models import DataFromSrockService

            # Update or create stock entry
            stock_entry, created = DataFromSrockService.objects.update_or_create(
                item_name=stock_data.get('item_name'),
                item_category=stock_data.get('item_category'),
                defaults={
                    'card_type_name': stock_data.get('card_type', ''),
                    'max_quantity_per_person': stock_data.get('max_quantity_per_person', 0),
                    'price_per_unit': stock_data.get('price_per_unit', 0)
                }
            )
            
            logger.info(f"{'Created' if created else 'Updated'} stock entry: {stock_entry}")

        except Exception as e:
            logger.error(f"Error saving stock data: {e}")
            logger.error(traceback.format_exc())

    def close(self):
        """Cleanup consumer resources"""
        try:
            self.running = False
            self.consumer.close()
            logger.info("Kafka consumer closed successfully")
        except Exception as e:
            logger.error(f"Error closing consumer: {e}")

# Optional: Function to start consumer (can be used in management commands)
def start_stock_events_consumer():
    consumer = StockEventsConsumer()
    consumer.process_messages()