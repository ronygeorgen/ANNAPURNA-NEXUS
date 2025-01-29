from django.urls import path, include
from .views import check_online_status

urlpatterns = [
    path('video-call/check-online-status/<str:shop_id>/', check_online_status, name='check-online-status'),
]
