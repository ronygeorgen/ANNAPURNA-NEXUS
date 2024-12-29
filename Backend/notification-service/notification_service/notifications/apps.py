from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'

    def ready(self):
        from .kafka_consumer import KafkaNotificationConsumer
        import threading
        
        # Start Kafka consumer in a separate thread
        consumer = KafkaNotificationConsumer()
        thread = threading.Thread(target=consumer.start, daemon=True)
        thread.start()