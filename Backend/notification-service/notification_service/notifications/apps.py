from django.apps import AppConfig
import threading
import os

class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'
    kafka_thread = None
    consumer = None

    def ready(self):
        # Prevent running twice in development
        if os.environ.get('RUN_MAIN') != 'true' and not self.kafka_thread:
            try:
                from .kafka_consumer import KafkaNotificationConsumer
                
                # Store the consumer instance as a class attribute
                self.consumer = KafkaNotificationConsumer()
                
                # Store the thread as a class attribute
                self.kafka_thread = threading.Thread(
                    target=self.consumer.start, 
                    daemon=True,
                    name='KafkaConsumerThread'
                )
                self.kafka_thread.start()
                print("Kafka consumer thread started successfully")
                
            except Exception as e:
                print(f"Error starting Kafka consumer: {e}")

    def stop(self):
        if self.consumer:
            self.consumer.stop()
        if self.kafka_thread:
            self.kafka_thread.join(timeout=5)