from confluent_kafka import Consumer, KafkaError
import json
from django.conf import settings
from .models import QuotaAllocation, RationCard
from stocks_app.models import Item
import logging

logger = logging.getLogger(__name__)

class OrderEventsConsumer:
    def __init__(self):
        logger.info("Initializing Order Events Consumer...")
        config = {
            'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
            'group.id': settings.KAFKA_CONSUMER_GROUP_ORDERS,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': True,
        }
        self.consumer = Consumer(config)
        self.consumer.subscribe([settings.KAFKA_TOPIC_ORDER_EVENTS])
        self.running = True

    def process_messages(self):
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
                    logger.info(f"Received order message: {data}")
                    
                    if data['event_type'] == 'order_processed':
                        self._handle_order_processed(data['order_data'])
                        
                except json.JSONDecodeError as e:
                    logger.error(f"Error decoding message: {e}")
                except Exception as e:
                    logger.error(f"Error processing message: {e}", exc_info=True)

        except Exception as e:
            logger.error(f"Consumer error: {e}", exc_info=True)
        finally:
            self.close()

    def _handle_order_processed(self, order_data):
        """Update QuotaAllocation remaining quantities based on order"""
        try:
            ration_card = RationCard.objects.get(card_number=order_data['card_number'])
            
            for item_data in order_data['items']:
                item = Item.objects.get(name=item_data['item_name'])
                
                # Get the latest quota allocation for this item and card
                quota_allocation = QuotaAllocation.objects.filter(
                    ration_card=ration_card,
                    item=item,
                    # is_used=False
                ).order_by('-allocated_at').first()
                
                if quota_allocation:
                    # Update remaining quantity
                    new_remaining = quota_allocation.remaining_quantity - item_data['quantity']
                    if new_remaining < 0:
                        logger.error(f"Insufficient quota for item {item.name}")
                        continue
                        
                    quota_allocation.remaining_quantity = new_remaining
                    quota_allocation.is_used = new_remaining <= 0
                    quota_allocation.save()
                    
                    logger.info(f"Updated quota allocation for card {ration_card.card_number}, "
                              f"item {item.name}: remaining={new_remaining}")

        except RationCard.DoesNotExist:
            logger.error(f"Ration card not found: {order_data['card_number']}")
        except Exception as e:
            logger.error(f"Error handling order processed: {e}", exc_info=True)

    def close(self):
        try:
            self.running = False
            self.consumer.close()
        except Exception as e:
            logger.error(f"Error closing consumer: {e}")