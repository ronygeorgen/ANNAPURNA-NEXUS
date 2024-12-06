from django.urls import path
from .views import OrderCreateView, OrderListView, OrderListSubAdminView, OrderListUserView, OrderListUserCardBasedView, StripeView, StripeOrderSaveView, VerifyOrderStripe, OrderedProductsCountView, RevenueView
urlpatterns = [
    path('order-create/', OrderCreateView.as_view(), name='orders-create'),
    path('order-list/', OrderListView.as_view(), name='order-list-admin'),
    path('order-list-sub-admin/', OrderListSubAdminView.as_view(), name='order-list-sub-admin'),
    path('order-list-user/', OrderListUserView.as_view(), name='order-list-user'),
    path('order-list-cardbased/', OrderListUserCardBasedView.as_view(), name='order-list-cardbased'),
    path('create-checkout-session/', StripeView.as_view(), name='create-checkout-session'),
    path('save-stripe-order/', StripeOrderSaveView.as_view(), name='save-stripe-order'),
    path('order-fetch-stripe/<str:order_id>/', VerifyOrderStripe.as_view(), name='verify-order-stripe'),
    path('ordered-products-count/', OrderedProductsCountView.as_view(), name='ordered-products-count'),
    path('revenue/', RevenueView.as_view(), name='revenue'),
]