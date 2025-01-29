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
        UserOnlineStatus.objects.update_or_create(
            user_id=self.user_id,
            shop_id=self.shop_id,
            defaults={
                'is_online': is_online,
                'last_seen': timezone.now(),
                'connection_id': self.channel_name if is_online else None,
                'sub_admin_email': self.user_email if self.is_sub_admin else None
            }
        )

    @database_sync_to_async
    def get_user_connection(self, user_id, shop_id):
        try:
            return UserOnlineStatus.objects.get(
                user_id=user_id,
                shop_id=shop_id,
                is_online=True
            )
        except UserOnlineStatus.DoesNotExist:
            return None

    @database_sync_to_async
    def create_or_update_call(self, room_id, caller_id, receiver_id, status):
        return VideoCall.objects.update_or_create(
            room_id=room_id,
            defaults={
                'initiator_id': caller_id,
                'receiver_id': receiver_id,
                'shop_id': self.shop_id,
                'status': status,
                'started_at': timezone.now() if status == 'active' else None,
                'ended_at': timezone.now() if status == 'ended' else None
            }
        )

    async def disconnect(self, close_code):
        # Update online status to offline
        await self.update_online_status(False)
        
        # If in a call, mark it as ended
        if hasattr(self, 'current_room_id'):
            await self.create_or_update_call(
                self.current_room_id,
                self.user_id,
                None,  # receiver_id not needed for disconnect
                'ended'
            )
            
            # Notify others in the room about disconnection
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'call_ended',
                    'message': {
                        'type': 'call_ended',
                        'room_id': self.current_room_id,
                        'user_id': self.user_id
                    }
                }
            )
        
        # Leave room
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive_json(self, content):
        message_type = content.get('type')
        room_id = content.get('room_id')
        caller_id = content.get('caller_id')
        receiver_id = content.get('receiver_id')

        # For WebRTC signaling messages, send directly to the recipient
        if message_type in ['offer', 'answer', 'ice_candidate']:
            # Determine the recipient (if you're the caller, send to receiver and vice versa)
            recipient_id = receiver_id if str(caller_id) == str(self.user_id) else caller_id
            
            # Get recipient's connection
            recipient_status = await self.get_user_connection(recipient_id, self.shop_id)
            
            if recipient_status and recipient_status.connection_id:
                # Send directly to the recipient's channel
                await self.channel_layer.send(
                    recipient_status.connection_id,
                    {
                        'type': message_type,
                        'message': content
                    }
                )
            return

        # For call control messages, handle them differently
        if message_type == 'call_request':
            self.current_room_id = room_id
            await self.create_or_update_call(room_id, caller_id, receiver_id, 'pending')
            # Broadcast call request to allow UI updates for all users
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'call_request',
                    'message': content
                }
            )

        elif message_type == 'call_accepted':
            await self.create_or_update_call(room_id, caller_id, receiver_id, 'active')
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'call_accepted',
                    'message': content
                }
            )

        elif message_type == 'call_ended':
            await self.create_or_update_call(room_id, caller_id, receiver_id, 'ended')
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'call_ended',
                    'message': content
                }
            )
            if hasattr(self, 'current_room_id'):
                delattr(self, 'current_room_id')

    # Handlers for different message types
    async def call_request(self, event):
        await self.send_json(event['message'])

    async def call_accepted(self, event):
        await self.send_json(event['message'])

    async def offer(self, event):
        await self.send_json(event['message'])

    async def answer(self, event):
        await self.send_json(event['message'])

    async def ice_candidate(self, event):
        await self.send_json(event['message'])

    async def call_ended(self, event):
        await self.send_json(event['message'])