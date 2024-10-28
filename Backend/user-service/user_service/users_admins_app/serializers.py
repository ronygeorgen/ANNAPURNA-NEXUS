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
        elif not user.is_active:
            raise serializers.ValidationError("User account is disabled")
        return data

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