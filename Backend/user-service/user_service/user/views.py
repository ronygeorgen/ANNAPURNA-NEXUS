from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
import json

@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            response_data = {
                "status": "success",
                "message": "User registered successfully",
                "user": {
                    "username": data.get('username'),
                    "email": data.get('email')
                }
            }
            return JsonResponse(response_data, status=201)
        except json.JSONDecodeError:
            return JsonResponse({"status": "error", "message": "Invalid JSON"}, status=400)
        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=500)

# Don't forget to add this view to your urls.py
# path('register/', RegisterView.as_view(), name='register'),