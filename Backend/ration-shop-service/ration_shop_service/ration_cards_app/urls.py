# ration_cards_app/urls.py
from django.contrib import admin
from django.urls import path
from .views import RationCardRegistrationView, RationCardListView, VerifyCardView


urlpatterns = [
    path('create/', RationCardRegistrationView.as_view(), name='ration-card-registration'),
    path('fetch/', RationCardListView.as_view(), name='ration-card-list'),
    path('verify/<str:card_number>/', VerifyCardView.as_view(), name='verify-card'),
]