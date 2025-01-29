from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import UserOnlineStatus


@api_view(['GET'])
def check_online_status(request, shop_id):
    try:
        # Use filter() to handle multiple records
        is_online = UserOnlineStatus.objects.filter(
            shop_id=shop_id,
            is_online=True
        ).exists()  # Checks if at least one match exists

        return Response({'is_online': is_online})
    except Exception as e:
        # Generic error handling
        return Response({'error': str(e)}, status=500)
