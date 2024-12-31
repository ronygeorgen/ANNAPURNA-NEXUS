from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ChatRoom, ChatMessage
from django.utils import timezone
from urllib.parse import parse_qs

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.shop_id = self.scope['url_route']['kwargs']['shop_id']
        
        query_string = self.scope['query_string'].decode()
        query_params = parse_qs(query_string)
        self.is_sub_admin = query_params.get('is_sub_Admin', [None])[0] == 'true'
        self.user_email = query_params.get('email', [None])[0]

        # Join both personal and shop-wide groups
        self.personal_room = f'chat_{self.shop_id}_{self.user_id}'
        self.shop_room = f'shop_{self.shop_id}'
        
        # Always join personal room
        await self.channel_layer.group_add(self.personal_room, self.channel_name)
        
        # Sub-admin also joins shop-wide room
        if self.is_sub_admin:
            await self.channel_layer.group_add(self.shop_room, self.channel_name)

        await self.accept()

        # Send initial data
        if self.is_sub_admin:
            await self.send_user_list()
        await self.send_chat_history()

    @database_sync_to_async
    def get_user_list(self):
        return list(ChatRoom.objects.filter(shop_id=self.shop_id).values(
            'id', 'user_id', 'user_email', 'last_message', 'last_message_time'
        ))

    @database_sync_to_async
    def get_chat_history(self, user_id=None):
        target_user_id = user_id if user_id else self.user_id
        try:
            room = ChatRoom.objects.get(shop_id=self.shop_id, user_id=target_user_id)
            messages = ChatMessage.objects.filter(room=room).order_by('created_at')
            
            message_data = []
            for msg in messages:
                message_data.append({
                    'id': str(msg.id),
                    'sender_id': msg.sender_id,
                    'sender_type': msg.sender_type,
                    'message': msg.message,
                    'created_at': msg.created_at.isoformat(),
                    'is_read': msg.is_read,
                    'room': {
                        'user_id': room.user_id,
                        'user_email': room.user_email
                    }
                })

            # Mark unread messages as read if needed (only for non-sub-admins)
            if not self.is_sub_admin:
                unread_messages = messages.filter(is_read=False, sender_type='shop')
                for msg in unread_messages:
                    msg.is_read = True
                    msg.read_at = timezone.now()
                    msg.save()

            return message_data
        except ChatRoom.DoesNotExist:
            return []

    async def send_user_list(self):
        users = await self.get_user_list()
        for user in users:
            if user['last_message_time']:
                user['last_message_time'] = user['last_message_time'].isoformat()
        await self.send_json({
            'type': 'user_list',
            'users': users
        })

    async def send_chat_history(self, user_id=None):
        history = await self.get_chat_history(user_id)
        await self.send_json({
            'type': 'chat_history',
            'messages': history
        })

    @database_sync_to_async
    def save_message(self, message_content, sender_id, sender_type, target_user_id=None):
        user_id = target_user_id if target_user_id else self.user_id
        
        # Get or create chat room
        room, created = ChatRoom.objects.get_or_create(
            shop_id=self.shop_id,
            user_id=user_id,
            defaults={'user_email': self.user_email} if self.user_email else {}
        )
        
        # Create message
        message = ChatMessage.objects.create(
            room=room,
            sender_id=sender_id,
            sender_type=sender_type,
            message=message_content,
            is_read=False
        )

        # Update room's last message
        room.last_message = message_content
        room.last_message_time = timezone.now()
        room.save()

        # Return message data
        return {
            'id': str(message.id),
            'sender_id': message.sender_id,
            'sender_type': message.sender_type,
            'message': message.message,
            'created_at': message.created_at.isoformat(),
            'is_read': message.is_read,
            'room': {
                'user_id': room.user_id,
                'user_email': room.user_email
            }
        }

    async def receive_json(self, content):
        message_type = content.get('type')
        
        if message_type == 'chat_message':
            message_content = content.get('message')
            target_user_id = content.get('user_id')  # For admin sending to specific user
            
            sender_id = self.user_id
            sender_type = 'shop' if self.is_sub_admin else 'user'
            
            # Save message to database
            saved_message = await self.save_message(
                message_content, 
                sender_id, 
                sender_type, 
                target_user_id
            )
            
            # Determine target room based on sender type
            if self.is_sub_admin:
                target_room = f'chat_{self.shop_id}_{target_user_id}'
            else:
                target_room = self.shop_room
            
            # Send to target room
            await self.channel_layer.group_send(
                target_room,
                {
                    'type': 'chat_message',
                    'message': saved_message
                }
            )
            
            # Also send to sender's room if different
            sender_room = self.personal_room
            if sender_room != target_room:
                await self.channel_layer.group_send(
                    sender_room,
                    {
                        'type': 'chat_message',
                        'message': saved_message
                    }
                )
        
        elif message_type == 'get_chat_history':
            target_user_id = content.get('user_id')
            await self.send_chat_history(target_user_id)

    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send_json({
            'type': 'chat_message',
            'message': event['message']
        })

    async def disconnect(self, close_code):
        # Leave all groups
        await self.channel_layer.group_discard(self.personal_room, self.channel_name)
        if self.is_sub_admin:
            await self.channel_layer.group_discard(self.shop_room, self.channel_name)