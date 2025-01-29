from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ShopStock, Item, Category, Quota
from confluent_kafka import Producer
from django.conf import settings
import json

class KafkaStockProducer:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            # Confluent Kafka Producer configuration
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
            cls._instance.flush()  # Ensure all messages are sent
            cls._instance.close()
            cls._instance = None

    @classmethod
    def delivery_callback(cls, err, msg):
        if err:
            print(f'Message delivery failed: {err}')
        else:
            print(f'Message delivered to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}')
    
def publish_stock_event(event_type, stock_data):
    try:
        producer = KafkaStockProducer.get_instance()
        message = {
            'event_type': event_type,
            'stock_data': stock_data
        }
        message_bytes = json.dumps(message).encode('utf-8')
        
        print(f"Publishing stock message: {message}")  # Debug logging
        
        producer.produce(
            topic=settings.KAFKA_TOPIC_STOCK_EVENTS,  # New topic for stock events
            value=message_bytes,
            callback=KafkaStockProducer.delivery_callback
        )
        producer.poll(0)
        
    except Exception as e:
        print(f"Error publishing to Kafka: {str(e)}")

@receiver(post_save, sender=ShopStock)
def publish_stock_changes(sender, instance, created, **kwargs):
    # Prepare stock data to be sent to ration shop service
    stock_data = {
        'shop_id': instance.shop_id,
        'item_name': instance.item.name,
        'item_category': instance.item.category.name,
        'total_quantity': instance.total_quantity,
        'remaining_quantity': instance.remaining_quantity,
        'unit': instance.item.unit,
        'last_updated': instance.last_updated.isoformat()
    }

    # Fetch corresponding Quota information
    try:
        quota = Quota.objects.get(
            item=instance.item, 
            card_type__is_active=True
        )
        stock_data.update({
            'max_quantity_per_person': quota.max_quantity,
            'price_per_unit': str(quota.price_per_unit),
            'card_type': quota.card_type.name
        })
    except Quota.DoesNotExist:
        # Log or handle cases where no quota is found
        pass

    event_type = 'stock_created' if created else 'stock_updated'
    publish_stock_event(event_type, stock_data)