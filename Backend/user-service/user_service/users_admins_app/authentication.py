from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from django.http import JsonResponse
from rest_framework import status
import time
import jwt
from rest_framework import exceptions
from django.conf import settings
from django.contrib.auth import get_user_model


class UserJWTAuthenticationCards(JWTAuthentication):
    def authenticate(self, request):
        exempt_paths = [
            '/register/', 
            '/login/',
            '/logout/',
            '/admin-login/',
            '/sub-admin-login/',
            '/refresh-token/',
            '/google-auth/',
            '/verify-otp/',
            '/resend-otp/',
        ]
        if any(request.path.endswith(path) for path in exempt_paths):
            return None
        access_token = self.get_header(request)
        raw_token = self.get_raw_token(access_token)

        if not raw_token:
            return None
        
        try:
            payload = jwt.decode(
                raw_token,
                settings.SECRET_KEY,
                algorithms=['HS256']
            )
            User = get_user_model()
            try:
                user = User.objects.get(id=payload.get('user_id'))
                return (user, None)
            except User.DoesNotExist:
                return None
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid token')
        except Exception as e:
            raise exceptions.AuthenticationFailed(str(e))