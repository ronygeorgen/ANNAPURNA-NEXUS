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
                user_id = order_data['userId']  # Extract user ID
                message = f"Your order #{order_data['order_id']} for card number {order_data['card_number']} has been processed"
                print(message)

                # Create notification in database
                notification = Notification.objects.create(
                    user_id=user_id,
                    message=message,
                    order_id=order_data['order_id']
                )
                print(f"Notification created with ID: {notification.id}")

                # Prepare the message for WebSocket
                notification_data = {
                    'id': str(notification.id),
                    'message': message,
                    'order_id': order_data['order_id'],
                    'created_at': notification.created_at.isoformat(),
                    'is_read': notification.is_read
                }

                # Get channel layer and send to group
                channel_layer = get_channel_layer()
                print(f"Sending to group: notifications_{user_id}")
                print(f"Message data: {notification_data}")

                async_to_sync(channel_layer.group_send)(
                    f"notifications_{user_id}",
                    {
                        'type': 'notification_message',
                        'message': notification_data
                    }
                )
                print("Message sent to channel layer successfully")
        except Exception as e:
            print(f"Error in process_message: {str(e)}")
            import traceback
            print(traceback.format_exc())

    def stop(self):
        self.running = False
        self.consumer.close()