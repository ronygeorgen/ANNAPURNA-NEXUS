# ration_cards_app/urls.py
from django.contrib import admin
from django.urls import path
from .views import (RationCardRegistrationView, 
                    RationCardListView, VerifyCardView,FetchCardTypes, RationCardVerificationView,
                    FetchCardForAdminView, QuotaInfoView, RationCardShopVerificationView, FaceAuthenticationView)


urlpatterns = [
    path('create/', RationCardRegistrationView.as_view(), name='ration-card-registration'),
    path('fetch/', RationCardListView.as_view(), name='ration-card-list'),
    path('verify/<str:card_number>/', VerifyCardView.as_view(), name='verify-card'),
    path('fetch-shop-card-admin/<int:shop_id>/', FetchCardForAdminView.as_view(), name='admin-fetch-shop-card'),
    path('quota-info/', QuotaInfoView.as_view(), name='quota-info'),
    path('<str:card_number>/shop-verify/', RationCardShopVerificationView.as_view(), name='ration-card-shop-verification'),
    path('card-types/', FetchCardTypes.as_view(), name='ration-card-shop-verification'),
    path('verify-card-admin/<str:card_number>/', RationCardVerificationView.as_view(), name='verify-card-admin'),
    path('face-auth/', FaceAuthenticationView.as_view(), name='verify-card-admin'),
]