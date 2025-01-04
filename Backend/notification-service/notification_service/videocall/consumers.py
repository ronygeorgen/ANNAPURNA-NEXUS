# consumers.py
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from .models import VideoCall, UserOnlineStatus
from django.utils import timezone
from urllib.parse import parse_qs

class VideoCallConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.shop_id = self.scope['url_route']['kwargs']['shop_id']
        
        # Parse query parameters
        query_string = self.scope['query_string'].decode()
        query_params = parse_qs(query_string)
        self.is_sub_admin = query_params.get('is_sub_admin', [None])[0] == 'true'
        self.user_email = query_params.get('email', [None])[0]
        
        # Update online status
        await self.update_online_status(True)
        
        # Join room for signaling
        self.room_group_name = f'video_{self.shop_id}'
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()

    @database_sync_to_async
    def update_online_status(self, is_online):
        # Only update status if it's a sub-admin
        if self.is_sub_admin:
            UserOnlineStatus.objects.update_or_create(
                user_id=self.user_id,
                shop_id=self.shop_id,
                defaults={
                    'is_online': is_online,
                    'last_seen': timezone.now(),
                    'connection_id': self.channel_name if is_online else None,
                    'sub_admin_email': self.user_email
                }
            )

    async def disconnect(self, close_code):
        # Update online status to offline
        await self.update_online_status(False)
        
        # Leave room
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive_json(self, content):
        message_type = content.get('type')
        
        if message_type == 'call_request':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'call_request',
                    'message': {
                        'type': 'call_request',
                        'caller_id': self.user_id,
                        'receiver_id': content.get('receiver_id')
                    }
                }
            )

        elif message_type in ['offer', 'answer', 'ice_candidate']:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': message_type,
                    'message': content
                }
            )

        elif message_type == 'end_call':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'call_ended',
                    'message': {
                        'type': 'call_ended',
                        'caller_id': self.user_id,
                        'receiver_id': content.get('receiver_id')
                    }
                }
            )

    # Handlers for different message types
    async def call_request(self, event):
        await self.send_json(event['message'])

    async def offer(self, event):
        await self.send_json(event['message'])

    async def answer(self, event):
        await self.send_json(event['message'])

    async def ice_candidate(self, event):
        await self.send_json(event['message'])

    async def call_ended(self, event):
        await self.send_json(event['message'])

