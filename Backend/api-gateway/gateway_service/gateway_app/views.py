from django.http import JsonResponse
from django.shortcuts import render
from django.views import View
from .user_srvc import auth
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
# Create your views here.

@method_decorator(csrf_exempt, name='dispatch')
class register(View):
    def post(self, request):
        response = auth.register(request)
        return response