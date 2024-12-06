# ration_shops_app/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (RationShopViewSet, 
                    SubAdminListView, 
                    SubAdminProfileView,
                    SubAdminProfilePictureUpload,
                    SubAdminShopImageUpload,
                    SubAdminShopImageDelete, ShopDisplayAtUser, GetShopIDandName)

router = DefaultRouter()
router.register(r'create', RationShopViewSet, basename='ration-shop')

urlpatterns = [
    path('', include(router.urls)),
    
    path('sub-admins/', SubAdminListView.as_view(), name='sub-admin-list'),

    path('profile/', SubAdminProfileView.as_view(), name='get_shop_profile'),
    path('profile/update/', SubAdminProfileView.as_view(), name='update_shop_profile'),
    path('profile/upload_picture/', SubAdminProfilePictureUpload.as_view(), name='upload_profile_picture'),
    path('profile/upload_shop_image/', SubAdminShopImageUpload.as_view(), name='upload_shop_image'),
    path('profile/delete_shop_image/<int:image_id>/', SubAdminShopImageDelete.as_view(), name='delete_shop_image'),
    path('shops/', ShopDisplayAtUser.as_view(), name='display-shop'),
    path('fetch-all-shops/', GetShopIDandName.as_view(), name='get-shop-id-name'),
]
