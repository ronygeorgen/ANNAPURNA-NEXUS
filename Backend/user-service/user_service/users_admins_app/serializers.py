from rest_framework import serializers
from .models import Account
from django.contrib.auth import authenticate

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = Account
        fields = ['email', 'password']
    
    def create(self, validated_data):
        user = Account.objects.create_user(
            email = validated_data['email'],
            password = validated_data['password'],
        )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(username=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        if not user.is_active:
            raise serializers.ValidationError("User account is disabled")
        if not user.email_verified:  # Add email verification check here
            raise serializers.ValidationError("Email not verified")
        return {
            'email': data['email'],
            'password': data['password'],
            'user': user  
        }
class CreateSubAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = Account
        fields = ['email', 'password']
    
    def create(self, validated_data):
        user = Account.objects.create_subuser(
            email = validated_data['email'],
            password = validated_data['password'],
        )
        return user

class GoogleAuthSerializer(serializers.Serializer):
    auth_token = serializers.CharField()
    
    def validate_auth_token(self, auth_token):
        if not auth_token:
            raise serializers.ValidationError("Auth token is required")
        return auth_token

class GoogleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['id', 'email', 'first_name', 'last_name', 'is_active', 'is_user']
        read_only_fields = ['id', 'is_active', 'is_user']