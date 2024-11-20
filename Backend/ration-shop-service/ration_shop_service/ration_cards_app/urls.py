# ration_cards_app/urls.py
from django.contrib import admin
from django.urls import path, include
from .views import RationCardRegistrationView, RationCardListView


urlpatterns = [
    path('create/', RationCardRegistrationView.as_view(), name='ration-card-registration'),
    path('fetch/', RationCardListView.as_view(), name='ration-card-list'),
]