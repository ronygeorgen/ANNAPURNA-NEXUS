# jwt_middleware.py with additional debugging
import logging
import jwt
from django.http import JsonResponse
from rest_framework import status
from django.conf import settings  # Ensure correct settings import for secret

logger = logging.getLogger(__name__)

def jwt_middleware(get_response):
    def middleware(request):
        exempt_paths = [
            '/register/', 
            '/login/',
            '/logout/',
            '/admin-login/',
            '/sub-admin-login/',
            '/refresh-token/'
        ]

        if any(request.path.endswith(path) for path in exempt_paths):
            return get_response(request)

        token = request.COOKIES.get('access_token')
        if not token:
            return JsonResponse({'error': 'Authentication requiredddd'}, status=status.HTTP_401_UNAUTHORIZED)

        # Log the token structure to ensure it is well-formed
        logger.info(f"Retrieved Token: {token}")
        
        try:
            # Decode with explicit algorithm; use the same secret key as user-service
            jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            logger.info("Token decoded successfully.")
            return get_response(request)
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired. gateway")
            return JsonResponse({'error': 'Token expired'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError as e:
            # Log specific error for debugging
            logger.error(f"Invalid token format or content: {str(e)}")
            return JsonResponse({'error': 'Invalid token format'}, status=status.HTTP_401_UNAUTHORIZED)

    return middleware
