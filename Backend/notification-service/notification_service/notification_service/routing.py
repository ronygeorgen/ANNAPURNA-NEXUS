# # notifications/routing.py
from django.urls import re_path
from notifications.consumers import NotificationConsumer
from chat.consumers import ChatConsumer
from videocall.consumers import VideoCallConsumer

websocket_urlpatterns = [
    re_path(r'ws/notifications/(?P<user_id>\w+)/$', NotificationConsumer.as_asgi()),
    # Chat consumers
    # Single route for both regular users and sub-admins
    re_path(r'ws/chat/(?P<user_id>\w+)/(?P<shop_id>\w+)/$', ChatConsumer.as_asgi()),
    # Video call consumers
    re_path(r'ws/video/(?P<shop_id>\w+)/(?P<user_id>\w+)/$', VideoCallConsumer.as_asgi())
]