"""
ASGI config for notification_service project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

# notification_service/asgi.py
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'notification_service.settings')
django.setup()
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from .routing import websocket_urlpatterns
from channels.auth import AuthMiddlewareStack


application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})