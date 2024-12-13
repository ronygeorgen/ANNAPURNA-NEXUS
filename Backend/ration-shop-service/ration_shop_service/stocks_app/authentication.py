import uuid
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import exceptions
from ration_shops_app.models import SubAdminAuth
import jwt
from django.conf import settings
from django.core.cache import cache
from datetime import datetime
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class CookieJWTAuthenticationStock(JWTAuthentication):
    def authenticate(self, request):
        access_token = self.get_header(request)
        raw_token = self.get_raw_token(access_token)

        if not raw_token:
            return None
        
        try:
            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)
            print('print user',user)
            return (user, validated_token)
        except TokenError:
            print('im in token error exception')
            # Let the refresh token view handle token refresh
            return None
        except Exception as e:
            print('exception: ',e)
            return None

    def get_user(self, payload):
        user_id = payload.get('user_id')
        email = payload.get('email')
        if not user_id and not email:
            raise exceptions.AuthenticationFailed('Invalid token payload')

        user = SubAdminAuth.objects.get(
            sub_admin_id=user_id,
        )
        return user
    
class UserJWTAuthenticationStock(JWTAuthentication):
    def authenticate(self, request):
        access_token = self.get_header(request)
        print('access token ', access_token)
        raw_token = self.get_raw_token(access_token)

        if not raw_token:
            return None
        
        try:
            payload = jwt.decode(
                raw_token,
                settings.SECRET_KEY,
                algorithms=['HS256']
            )
            return (payload, None)
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid token')
        except Exception as e:
            raise exceptions.AuthenticationFailed(str(e))

    def has_permission(self, request, view):
        # Implement the has_permission logic here
        return True