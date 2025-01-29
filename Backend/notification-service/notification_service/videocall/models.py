from django.db import models
from django.utils import timezone

# Create your models here.

class VideoCall(models.Model):
    """
    Represents a video call session between users
    """
    room_id = models.CharField(max_length=255, unique=True)
    initiator_id = models.CharField(max_length=255)
    receiver_id = models.CharField(max_length=255)
    shop_id = models.CharField(max_length=255)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('active', 'Active'),
            ('ended', 'Ended'),
            ('missed', 'Missed'),
        ],
        default='pending'
    )
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [
            models.Index(fields=['room_id']),
            models.Index(fields=['initiator_id', 'receiver_id']),
            models.Index(fields=['shop_id', 'status']),
        ]

    def __str__(self):
        return f"Video call {self.room_id} between {self.initiator_id} and {self.receiver_id}"
    

class UserOnlineStatus(models.Model):
    """
    Tracks real-time online/offline status of users
    """
    user_id = models.CharField(max_length=255, unique=True)
    shop_id = models.CharField(max_length=255)
    sub_admin_email = models.EmailField(null=True, blank=True)
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(auto_now=True)
    connection_id = models.CharField(max_length=255, null=True, blank=True)  # stores channel name
    
    class Meta:
        indexes = [
            models.Index(fields=['shop_id', 'is_online']),
            models.Index(fields=['user_id', 'last_seen'])
        ]

    def __str__(self):
        return f"User {self.user_id} - {'Online' if self.is_online else 'Offline'}"