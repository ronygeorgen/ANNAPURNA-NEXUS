from django.urls import include, path
from . import views
urlpatterns = [
    path('register/',views.register.as_view(), name = 'register')
]