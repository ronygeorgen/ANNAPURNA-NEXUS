from confluent_kafka import Consumer, KafkaError
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification
import json
import threading

class KafkaNotificationConsumer:
    def __init__(self):
        self.config = {
            'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
            'group.id': settings.KAFKA_CONSUMER_GROUP,
            'auto.offset.reset': 'earliest'
        }
        self.consumer = Consumer(self.config)
        self.running = False

    def start(self):
        self.consumer.subscribe([settings.KAFKA_TOPIC_ORDER_EVENTS])
        self.running = True
        
        while self.running:
            msg = self.consumer.poll(1.0)
            
            if msg is None:
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    continue
                else:
                    print(f"Error: {msg.error()}")
                    continue

            try:
                value = json.loads(msg.value().decode('utf-8'))
                self.process_message(value)
            except Exception as e:
                print(f"Error processing message: {e}")

    def process_message(self, value):
        try:
            if value['event_type'] == 'order_processed':
                order_data = value['order_data']
                user_id = order_data['userId']
                message = f"Your order #{order_data['order_id']} for card number {order_data['card_number']} has been processed"
                
                # Check if notification exists
                notification, created = Notification.objects.get_or_create(
                    user_id=user_id,
                    order_id=order_data['order_id'],
                    message=message,
                    defaults={
                        'user_email': order_data.get('user_email', ''),
                    }
                )
                
                if created:  # Only send WebSocket message if new notification
                    notification_data = {
                        'id': str(notification.id),
                        'message': message,
                        'order_id': order_data['order_id'],
                        'created_at': notification.created_at.isoformat(),
                        'is_read': notification.is_read
                    }
                    
                    channel_layer = get_channel_layer()
                    async_to_sync(channel_layer.group_send)(
                        f"notifications_{user_id}",
                        {
                            'type': 'notification_message',
                            'message': notification_data
                        }
                    )
        except Exception as e:
            print(f"Error in process_message: {str(e)}")

    def stop(self):
        self.running = False
        self.consumer.close()