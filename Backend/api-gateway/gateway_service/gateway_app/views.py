from django.http import JsonResponse
from django.shortcuts import render
from django.views import View

# Create your views here.
class register(View):
    def get(self, request):
        data={
            'status':'success'
        }
        return JsonResponse(data)