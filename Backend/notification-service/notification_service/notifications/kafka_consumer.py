from confluent_kafka import Consumer, KafkaError
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification
import json
import threading
import time

class KafkaNotificationConsumer:
    def __init__(self):
        self.config = {
            'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
            'group.id': settings.KAFKA_CONSUMER_GROUP,
            'auto.offset.reset': 'earliest',
            'session.timeout.ms': 45000,
            'heartbeat.interval.ms': 15000,
            'max.poll.interval.ms': 300000,
        }
        self.consumer = None
        self.running = False
        self.connect_with_retry()

    def connect_with_retry(self):
        while not self.consumer:
            try:
                self.consumer = Consumer(self.config)
                self.consumer.subscribe([settings.KAFKA_TOPIC_ORDER_EVENTS])
                print("Successfully connected to Kafka")
                return
            except Exception as e:
                print(f"Failed to connect to Kafka: {e}")
                time.sleep(5)  # Wait before retrying

    def start(self):
        self.running = True
        
        while self.running:
            try:
                msg = self.consumer.poll(1.0)
                
                if msg is None:
                    continue
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        continue
                    else:
                        print(f"Kafka error: {msg.error()}")
                        self.reconnect()
                        continue

                print(f"Received message from Kafka: {msg.value()}")  # Debug log
                value = json.loads(msg.value().decode('utf-8'))
                self.process_message(value)
                
            except Exception as e:
                print(f"Error in Kafka consumer loop: {e}")
                self.reconnect()

    def reconnect(self):
        print("Attempting to reconnect to Kafka...")
        try:
            self.consumer.close()
        except:
            pass
        self.consumer = None
        self.connect_with_retry()

    def process_message(self, value):
        try:
            print(f"Processing message: {value}")  # Debug log
            if value['event_type'] == 'order_processed':
                order_data = value['order_data']
                user_id = order_data['userId']
                message = f"Your order #{order_data['order_id']} for card number {order_data['card_number']} has been processed"
                
                # Create notification
                notification, created = Notification.objects.get_or_create(
                    user_id=user_id,
                    order_id=order_data['order_id'],
                    message=message,
                    defaults={
                        'user_email': order_data.get('user_email', ''),
                    }
                )
                
                if created:
                    notification_data = {
                        'id': str(notification.id),
                        'message': message,
                        'order_id': order_data['order_id'],
                        'created_at': notification.created_at.isoformat(),
                        'is_read': notification.is_read
                    }
                    
                    print(f"Sending notification to websocket: {notification_data}")  # Debug log
                    channel_layer = get_channel_layer()
                    async_to_sync(channel_layer.group_send)(
                        f"notifications_{user_id}",
                        {
                            'type': 'notification_message',
                            'message': notification_data
                        }
                    )
                    print("Notification sent successfully")  # Debug log
        except Exception as e:
            print(f"Error in process_message: {str(e)}")
            raise

    def stop(self):
        self.running = False
        if self.consumer:
            self.consumer.close()