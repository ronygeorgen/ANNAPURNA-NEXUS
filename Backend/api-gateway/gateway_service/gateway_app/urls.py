from django.urls import path
from .views import (RegisterView, LoginView, LogoutView,AdminLoginView, 
                    CreateSubAdminView, SubAdminLoginView, CreateRationShopView, 
                    GetSubAdminView, RefreshView, SubAdminProfileView,
                    SubAdminProfilePictureUploadView, SubAdminShopImageUploadView,
                    SubAdminShopImageDeleteView,)
urlpatterns = [
    path('user/register/', RegisterView.as_view(), name = 'register'),
    path('user/login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('user/admin-login/', AdminLoginView.as_view(), name='admin-login'),
    path('user/create-sub-admin/', CreateSubAdminView.as_view(), name='create-sub-admin'),
    path('user/sub-admin-login/', SubAdminLoginView.as_view(), name='create-sub-admin'),
    path('ration-shop/sub-admins/', GetSubAdminView.as_view(), name='get-sub-admin'),
    path('ration-shop/create/', CreateRationShopView.as_view(), name='create-ration-shop'),
    path('refresh-token/', RefreshView.as_view(), name='refresh-view'),

    path('ration-shop/profile/', SubAdminProfileView.as_view()),
    path('ration-shop/profile/update/', SubAdminProfileView.as_view()),
    path('ration-shop/profile/upload_picture/', SubAdminProfilePictureUploadView.as_view()),
    path('ration-shop/profile/upload_shop_image/', SubAdminShopImageUploadView.as_view()),
    path('ration-shop/profile/delete_shop_image/<int:image_id>/', SubAdminShopImageDeleteView.as_view()),
]