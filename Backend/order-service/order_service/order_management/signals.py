# order-service/orders/signals.py
from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from confluent_kafka import Producer
from django.conf import settings
import json
from .models import Order

class KafkaOrderProducer:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            config = {
                'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
                'acks': 'all',
                'retries': 5,
                'client.id': settings.KAFKA_CLIENT_ID,
            }
            cls._instance = Producer(config)
        return cls._instance
    
    @classmethod
    def close(cls):
        if cls._instance is not None:
            cls._instance.flush()
            cls._instance.close()
            cls._instance = None

    @classmethod
    def delivery_callback(cls, err, msg):
        if err:
            print(f'Message delivery failed: {err}')
        else:
            print(f'Message delivered to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}')

def publish_order_event(event_type, order_data):
    try:
        producer = KafkaOrderProducer.get_instance()
        message = {
            'event_type': event_type,
            'order_data': order_data
        }
        message_bytes = json.dumps(message).encode('utf-8')
        
        print(f"Publishing order message: {message}")
        
        producer.produce(
            topic=settings.KAFKA_TOPIC_ORDER_EVENTS,
            value=message_bytes,
            callback=KafkaOrderProducer.delivery_callback
        )
        producer.poll(0)
        
    except Exception as e:
        print(f"Error publishing to Kafka: {str(e)}")

def prepare_order_data(instance):
    """Helper function to prepare order data"""
    order_items_data = []
    for item in instance.order_items.all():
        order_items_data.append({
            'item_name': item.item_name,
            'quantity': item.quantity,
        })

    return {
        'order_id': str(instance.order_id),
        'card_number': instance.card_number,
        'shop_id': instance.shop,
        'items': order_items_data,
        'status': instance.status
    }

# Signal for when order_items M2M relationship changes
@receiver(m2m_changed, sender=Order.order_items.through)
def order_items_changed(sender, instance, action, **kwargs):
    """Handle changes to order items"""
    if action == "post_add" and instance.status == 'PENDING':
        order_data = prepare_order_data(instance)
        publish_order_event('order_processed', order_data)

# Signal for when order status changes
@receiver(post_save, sender=Order)
def order_status_changed(sender, instance, created, **kwargs):
    """Handle changes to order status"""
    if not created and instance.status == 'PENDING':
        # Only publish if order items exist
        if instance.order_items.exists():
            order_data = prepare_order_data(instance)
            publish_order_event('order_processed', order_data)