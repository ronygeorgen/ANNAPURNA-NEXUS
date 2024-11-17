import uuid
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import exceptions
from .models import SubAdminAuth
import jwt
from django.conf import settings
from django.core.cache import cache
from datetime import datetime
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        access_token = self.get_header(request)
        raw_token = self.get_raw_token(access_token)
        if not raw_token:
            return None
        
        try:
            

            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)
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
        if not user_id:
            raise exceptions.AuthenticationFailed('Invalid token payload')

        user = SubAdminAuth.objects.get(
            sub_admin_id=user_id,
        )
        return user

# class RationShopJWTAuthentication(JWTAuthentication):
#     def authenticate(self, request):
#         # Get token from Authorization header
#         header = self.get_header(request)
#         if not header:
#             return None

#         raw_token = self.get_raw_token(header)
#         if not raw_token:
#             return None
        
#         validated_token = self.get_validated_token(raw_token)
#         try:
#             # Verify the JWT token
#             payload = jwt.decode(
#                 raw_token,
#                 settings.SECRET_KEY,
#                 algorithms=['HS256']
#             )

#             # Create a user instance from token payload
#             user = self.get_user(validated_token)
#             print('im hereee user validated token =',user)

#             return (user, validated_token)

#         except jwt.ExpiredSignatureError:
#             raise exceptions.AuthenticationFailed('Token has expired')
#         except jwt.InvalidTokenError as e:
#             raise exceptions.AuthenticationFailed(f'Invalid token: {str(e)}')
#         except Exception as e:
#             raise exceptions.AuthenticationFailed(f'Authentication failed: {str(e)}')

#     def get_user(self, payload):
#         user_id = payload.get('user_id')
#         if not user_id:
#             raise exceptions.AuthenticationFailed('Invalid token payload')

#         print('user_id=',user_id)
#         user = SubAdminAuth.objects.get(
#             sub_admin_id=user_id,
#         )
#         print('user email:',user.email)
#         return user










# class AdminTokenAuthentication(JWTAuthentication):
#     def get_validated_token(self, raw_token):
#         try:
#             signing_key = str(settings.SECRET_KEY)
            
#             validated_token = jwt.decode(
#                 raw_token,
#                 signing_key,
#                 algorithms=['HS256']
#             )

#             jti = validated_token.get('jti')
#             if jti and cache.get(f'blacklisted_token_{jti}'):
#                 raise exceptions.AuthenticationFailed('Token has been blacklisted')
            
#             return validated_token
#         except jwt.ExpiredSignatureError:
#             raise exceptions.AuthenticationFailed('Token has expired')
#         except jwt.InvalidTokenError:
#             raise exceptions.AuthenticationFailed('Invalid token')
#         except TypeError as e:
#             print(f"Token decoding error: {e}")
#             print(f"Signing Key Type: {type(settings.SIMPLE_JWT['SIGNING_KEY'])}")
#             print(f"Signing Key Value: {settings.SIMPLE_JWT['SIGNING_KEY']}")
#             raise exceptions.AuthenticationFailed('Invalid token configuration')
    
#     def get_user(self, validated_token):
#         user_id = validated_token.get('user_id')
#         if not user_id:
#             raise exceptions.AuthenticationFailed('Invalid token payload')
        
#         user = AdminAuth(
#             admin_id=user_id,
#             email=validated_token.get('email'),
#             is_active=True
#         )
#         return user
    
#     def authenticate(self, request):
#         header = self.get_header(request)
#         if not header:
#             return None

#         raw_token = self.get_raw_token(header)
#         if not raw_token:
#             return None

#         validated_token = self.get_validated_token(raw_token)
#         user = self.get_user(validated_token)
        
#         return (user, validated_token)
    
#     @staticmethod
#     def create_token(user):
#         """
#         Creates a new token for a user with essential claims
#         """
#         payload = {
#             'user_id': user.admin_id,
#             'email': user.email,
#             'iat': datetime.utcnow(),
#             'jti': str(uuid.uuid4())  # Unique token identifier
#         }
        
#         # Ensure signing key is a string
#         signing_key = str(settings.SIMPLE_JWT['SIGNING_KEY'])
        
#         return jwt.encode(
#             payload,
#             signing_key,
#             algorithm='HS256'
#         )

#     @staticmethod
#     def blacklist_token(jti):
#         """
#         Blacklists a token by its JTI
#         """
#         cache.set(
#             f'blacklisted_token_{jti}',
#             True,
#             timeout=settings.SIMPLE_JWT.get('ACCESS_TOKEN_LIFETIME').total_seconds()
#         )