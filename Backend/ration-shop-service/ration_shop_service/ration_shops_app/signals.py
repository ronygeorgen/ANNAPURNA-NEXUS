from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import RationShop
from confluent_kafka import Producer
from django.conf import settings
import json

class KafkaShopProducer:
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

def publish_ration_shop_event(event_type, shop_data):
    try:
        producer = KafkaShopProducer.get_instance()
        message = {
            'event_type': event_type,
            'shop_data': shop_data
        }
        message_bytes = json.dumps(message).encode('utf-8')
        print(f'Publishing message: {message}')

        producer.produce(
            topic=settings.KAFKA_TOPIC_RATION_SHOP_CREATION_EVENTS,
            value=message_bytes,
            callback=KafkaShopProducer.delivery_callback
        )
        producer.poll(0)
    
    except Exception as e:
        print(f"Error publishing to kafka: {str(e)}")

@receiver(post_save, sender=RationShop)
def publish_ration_shop_changes(sender, instance, created, **kwargs):
    if instance.is_active:
        owner_account_id = instance.owner.sub_admin_id if instance.owner else None
        created_by_account_id = instance.created_by.sub_admin_id if instance.created_by else None
        shop_data = {
            'id': instance.shop_id,
            'name': instance.name,
            'owner_id': owner_account_id,
            'mobile_number': instance.mobile_number,
            'location': instance.location,
            'is_active': instance.is_active,
            'created_by_id': created_by_account_id,
        }

        event_type = 'ration_shop_created' if created else 'ration_shop_updated'
        publish_ration_shop_event(event_type, shop_data)