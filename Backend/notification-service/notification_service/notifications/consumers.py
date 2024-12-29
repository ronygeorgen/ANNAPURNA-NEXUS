from channels.generic.websocket import AsyncJsonWebsocketConsumer
import json
from channels.db import database_sync_to_async
from .models import Notification

class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'notifications_{self.user_id}'

        # Add debug prints
        print(f"WebSocket connecting for user: {self.user_id}")
        print(f"Group name: {self.room_group_name}")

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        print(f"Connected to group: {self.room_group_name}")
        await self.accept()
        print("WebSocket connection accepted")
        await self.send_past_notifications()
    
    @database_sync_to_async
    def get_unread_notifications(self):
        return list(Notification.objects.filter(
            user_id=self.user_id,
            is_read=False
        ).order_by('-created_at').values(
            'id', 
            'message', 
            'order_id', 
            'created_at', 
            'is_read'
        ))
    
    async def send_past_notifications(self):
        notifications = await self.get_unread_notifications()
        if notifications:
            await self.send_json({
                'type': 'past_notifications',
                'messages': [
                    {
                        'id': str(notif['id']),
                        'message': notif['message'],
                        'order_id': str(notif['order_id']) if notif['order_id'] else None,
                        'created_at': notif['created_at'].isoformat(),
                        'is_read': notif['is_read']
                    }
                    for notif in notifications
                ]
            })

    async def disconnect(self, close_code):
        print(f"WebSocket disconnecting for user: {self.user_id}")
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print("Disconnected from group")

    async def notification_message(self, event):
        print(f"Received notification event at consumer.py: {event}")
        try:
            # Send notification to WebSocket
            await self.send_json({
                'type': 'notification',
                'message': event['message']
            })
            print("Notification sent to client")
        except Exception as e:
            print(f"Error sending notification: {str(e)}")
    
    @database_sync_to_async
    def mark_notifications_read(self):
        Notification.objects.filter(
            user_id=self.user_id,
            is_read=False
        ).update(is_read=True)
    
    async def receive_json(self, content):
        if content.get('type') == 'make_read':
            await self.mark_notifications_read()
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'notifications_read'
                }
            )
    
    async def notifications_read(self, event):
        await self.send_json({
            'type': 'notifications_read'
        })