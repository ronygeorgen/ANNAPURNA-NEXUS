from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RationShopViewSet, SubAdminListView

router = DefaultRouter()
router.register(r'create', RationShopViewSet, basename='ration-shop-create')

urlpatterns = [
    path('', include(router.urls)),
    path('sub-admins/', SubAdminListView.as_view(), name='sub-admin-list'),
]