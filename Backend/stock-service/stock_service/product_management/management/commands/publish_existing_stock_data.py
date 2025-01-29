# In stock-service/management/commands/publish_existing_stock_data.py
from django.core.management.base import BaseCommand
from django.conf import settings
from confluent_kafka import Producer
import json

from product_management.models import ShopStock, Item, Quota

class KafkaStockDataPublisher:
    @classmethod
    def get_producer(cls):
        config = {
            'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
            'acks': 'all',
            'retries': 5,
            'client.id': settings.KAFKA_CLIENT_ID,
        }
        return Producer(config)

    @classmethod
    def delivery_callback(cls, err, msg):
        if err:
            print(f'Message delivery failed: {err}')
        else:
            print(f'Message delivered to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}')

class Command(BaseCommand):
    help = 'Publish existing stock data to Kafka'

    def handle(self, *args, **options):
        # Create Kafka producer
        producer = KafkaStockDataPublisher.get_producer()
        topic = settings.KAFKA_TOPIC_STOCK_EVENTS

        # Fetch all existing shop stocks
        shop_stocks = ShopStock.objects.select_related('item', 'item__category').all()

        total_records = 0
        for stock in shop_stocks:
            try:
                # Prepare stock data
                stock_data = {
                    'shop_id': stock.shop_id,
                    'item_name': stock.item.name,
                    'item_category': stock.item.category.name,
                    'total_quantity': stock.total_quantity,
                    'remaining_quantity': stock.remaining_quantity,
                    'unit': stock.item.unit,
                    'last_updated': stock.last_updated.isoformat()
                }

                # Try to fetch corresponding Quota information
                try:
                    quota = Quota.objects.get(
                        item=stock.item, 
                        card_type__is_active=True
                    )
                    stock_data.update({
                        'max_quantity_per_person': quota.max_quantity,
                        'price_per_unit': str(quota.price_per_unit),
                        'card_type': quota.card_type.name
                    })
                except Quota.DoesNotExist:
                    self.stdout.write(self.style.WARNING(
                        f"No quota found for item {stock.item.name}"
                    ))

                # Prepare Kafka message
                message = {
                    'event_type': 'existing_stock_data',
                    'stock_data': stock_data
                }
                message_bytes = json.dumps(message).encode('utf-8')

                # Produce message
                producer.produce(
                    topic=topic,
                    value=message_bytes,
                    callback=KafkaStockDataPublisher.delivery_callback
                )
                
                total_records += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f"Error processing stock {stock.id}: {str(e)}"
                ))

        # Ensure all messages are sent
        producer.flush()

        self.stdout.write(self.style.SUCCESS(
            f'Successfully published {total_records} existing stock records to Kafka'
        ))