# management/commands/consume_stock_events.py
from django.core.management.base import BaseCommand
from ration_cards_app.consumers import start_stock_events_consumer

class Command(BaseCommand):
    help = 'Starts Kafka consumer for stock events'

    def handle(self, *args, **options):
        self.stdout.write('Starting stock events consumer...')
        start_stock_events_consumer()