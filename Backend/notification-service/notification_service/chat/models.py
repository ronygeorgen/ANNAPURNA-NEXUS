from django.db import models
from django.utils import timezone

class ChatRoom(models.Model):
    """
    Represents a chat room between a shop and a user.
    Uses email and string IDs from Redux store.
    """
    shop_id = models.CharField(max_length=255)
    user_id = models.CharField(max_length=255)
    user_email = models.EmailField()
    last_message = models.TextField(null=True, blank=True)
    last_message_time = models.DateTimeField(null=True)
    created_at = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('shop_id', 'user_id')
        indexes = [
            models.Index(fields=['shop_id', 'last_message_time']),
            models.Index(fields=['user_id', 'user_email'])
        ]

    def __str__(self):
        return f"Chat between Shop {self.shop_id} and User {self.user_email}"

class ChatMessage(models.Model):
    """
    Represents individual messages within a chat room.
    """

    room = models.ForeignKey(
        ChatRoom, 
        on_delete=models.CASCADE, 
        related_name='messages'
    )
    sender_id = models.CharField(max_length=255)
    sender_type = models.CharField(
        max_length=10,
    )
    message = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['room', 'created_at']),
            models.Index(fields=['sender_id', 'sender_type'])
        ]

    def __str__(self):
        return f"Message from {self.sender_type} ({self.sender_id}) in {self.room}"