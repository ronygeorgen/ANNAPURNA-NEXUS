from django.urls import path
from .views import *
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
    path('user/user-count/', GetUsersCount.as_view(), name='refresh-view'),
    path('user/update-location/', UpdateLocation.as_view(), name='update-location'),
    path('user/google-auth/', GoogleLoginView.as_view(), name='google-login'),
    path('user/verify-otp/', VerifySignupOtp.as_view()),
    path('user/resend-otp/', ResendSignupOtp.as_view()),
    


    path('ration-shop/profile/', SubAdminProfileView.as_view()),
    path('ration-shop/profile/update/', SubAdminProfileView.as_view()),
    path('ration-shop/profile/upload_picture/', SubAdminProfilePictureUploadView.as_view()),
    path('ration-shop/profile/upload_shop_image/', SubAdminShopImageUploadView.as_view()),
    path('ration-shop/profile/delete_shop_image/<int:image_id>/', SubAdminShopImageDeleteView.as_view()),
    path('ration-shop/shops/', GetRationShopsAtUserSide.as_view()),
    path('ration-shop/fetch-all-shops/', GetAllShops.as_view()),
    path('ration-shop/search/', GetSearchedShops.as_view()),

    path('ration-card/create/', CreateRationCard.as_view()),
    path('ration-card/fetch/', GetRationCards.as_view()),
    path('ration-card/verify/<str:card_number>/', VerifyRationCardByNumber.as_view()),
    path('ration-card/fetch-shop-card-admin/<int:shop_id>/', FetchCardForAdminView.as_view()),
    path('ration-card/<str:card_number>/shop-verify/', ShopVerifyCard.as_view()),
    path('ration-card/verify-card-admin/<str:card_number>/', AdminVerifyCard.as_view()),
    path('ration-card/card-types/', FetchCardTypes.as_view()),
    path('ration-card/face-auth/', FaceAuth.as_view()),
    path('ration-card/send-otp/', SendOtp.as_view()),
    path('ration-card/verify-otp/', VerifyOtp.as_view()),
    path('ration-card/user-requested-cards/', RequestedCardsUser.as_view()),

    path('product-management/create/', CreateProductItems.as_view()),
    path('product-management/quota-info/', GetQuotaInfo.as_view()),

    path('order-management/order-create/', CreateOrder.as_view()),
    path('order-management/order-list/', GetOrders.as_view()),
    path('order-management/order-list-sub-admin/', GetOrdersSubAdmin.as_view()),
    path('order-management/order-list-user/', GetOrdersUser.as_view()),
    path('order-management/order-list-cardbased/', GetAllShopsCardbased.as_view()),
    path('order-management/create-checkout-session/', StripePay.as_view()),
    path('order-management/save-stripe-order/', SaveStripeOrder.as_view()),
    path('order-management/order-fetch-stripe/<str:order_id>/', VerifyOrderStripe.as_view()),
    path('order-management/ordered-products-count/', OrderedProductsCountAdmin.as_view()),
    path('order-management/revenue/', OrderRevenueAdmin.as_view()),
    path('dashboard/metrics/', DashboardMatrix.as_view()),
    path('order-management/user-addresses/<str:user_email>/', PreviousAddress.as_view()),

    path('notification/video-call/check-online-status/<str:shopId>/', ActiveSubAdmins.as_view()),
]