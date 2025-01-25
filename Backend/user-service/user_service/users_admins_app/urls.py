from django.urls import path
from .views import *

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('admin-login/', AdminLoginView.as_view(), name='admin-login'),
    path('create-sub-admin/', CreateSubAdminView.as_view(), name='create_sub_admin'),
    path('sub-admin-login/', SubAdminLoginView.as_view(), name='create_sub_admin'),
    path('refresh-token/', RefreshTokenView.as_view(), name='token_refresh'),
    path('user-count/', UserCountView.as_view(), name='token_refresh'),
    path('update-location/', UpdateLocationView.as_view(), name='update_location'),
]