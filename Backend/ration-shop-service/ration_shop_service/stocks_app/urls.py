from django.urls import path
from .views import ProductManagementView, QuotaInfoView

urlpatterns = [
    path('create/', ProductManagementView.as_view(), name='product-create'),
    path('quota-info/', QuotaInfoView.as_view(), name='quota-info'),
]