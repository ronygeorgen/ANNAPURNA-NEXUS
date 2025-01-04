from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import UserOnlineStatus
from django.utils import timezone
from datetime import timedelta

@api_view(['GET'])
def get_active_sub_admins(request, shopId):
    try:
        # Offline cutoff time: 1 minute ago
        cutoff_time = timezone.now() - timedelta(minutes=1)

        # Fetch active users with sub_admin_email
        active_users = UserOnlineStatus.objects.filter(
            user_id=shopId,
            is_online=True,
            last_seen__gte=cutoff_time
        ).values('user_id', 'last_seen')
        print('Active users:', active_users)

        # Build response
        user_details = []
        for user in active_users:
            user_details.append({
                'id': user.get('user_id','1'),
                'name': user.get('sub_admin_email', 'N/A'),
                'email': user.get('sub_admin_email', 'N/A'),
                'last_seen': user['last_seen'].isoformat()
            })
        print('User details:', user_details)

        return Response({'sub_admins': user_details}, status=200)

    except Exception as e:
        # Return detailed error response
        print('Error:', e)
        return Response({'error': str(e)}, status=500)
