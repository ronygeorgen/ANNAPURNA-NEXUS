from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Account
from confluent_kafka import Producer
from django.conf import settings
import json

class KafkaUserProducer:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            # Confluent Kafka Producer configuration
            config = {
                'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
                'acks': 'all',
                'retries': 5,
                'client.id': 'user_service_producer'
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
    
def publish_user_event(event_type, user_data):
    try:
        producer = KafkaUserProducer.get_instance()
        # Fix: Change sub_admin_data to admin_data based on event type
        message = {
            'event_type': event_type,
            'sub_admin_data' if 'sub_admin' in event_type else 'admin_data': user_data
        }
        message_bytes = json.dumps(message).encode('utf-8')
        
        print(f"Publishing message: {message}")  # Add debug logging
        
        producer.produce(
            topic=settings.KAFKA_TOPIC_USER_EVENTS,  # Use settings value
            value=message_bytes,
            callback=KafkaUserProducer.delivery_callback
        )
        producer.poll(0)
        
    except Exception as e:
        print(f"Error publishing to Kafka: {str(e)}")

@receiver(post_save, sender=Account)
def publish_subadmin_changes(sender, instance, created, **kwargs):
    if instance.is_subadmin:
        user_data = {
            'id': instance.id,
            'email': instance.email,
            'is_active': instance.is_active,
            'is_subadmin': instance.is_subadmin,
            'auth_token': instance.auth_token.key if hasattr(instance, 'auth_token') else None,
            'created_at': instance.date_joined.isoformat()
        }

        event_type = 'sub_admin_created' if created else 'sub_admin_updated'
        publish_user_event(event_type, user_data)