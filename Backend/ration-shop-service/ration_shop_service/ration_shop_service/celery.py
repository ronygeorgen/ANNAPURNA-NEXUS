import os
from celery import Celery
from django.conf import settings

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ration_shop_service.settings')

# Create Celery app
app = Celery('ration_shop_service')

# Configure Celery using Django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Autodiscover tasks from all registered Django apps
app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)