from django.urls import path, include
from .views import get_active_sub_admins

urlpatterns = [
    path('<str:shopId>/sub-admins/active/', get_active_sub_admins, name='active-sub-admins'),
]
