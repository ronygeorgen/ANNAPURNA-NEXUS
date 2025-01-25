import uuid
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
import json
from rest_framework.permissions import IsAuthenticated
from .authentication import SubAdminJWTAuthentication
from ration_shops_app.models import RationShop, SubAdminAuth
from .models import RationCard, FamilyMember, CardType
from .serializers import RationCardSerializer, FamilyMemberSerializer, RationCardRetrieveSerializer, CardVerificationSerializer, CardTypeSerializer
from .authentication import UserJWTAuthenticationCards
from django.utils import timezone
from django.core.exceptions import ValidationError
from stocks_app.models import Quota
from ration_shops_app.models import SubAdminAuth
from .models import QuotaAllocation
import face_recognition
import numpy as np
import cv2
import os
from django.conf import settings
import math
from scipy.spatial import distance
from skimage.metrics import structural_similarity
from .services.otp_services import OTPService
from rest_framework.exceptions import NotFound



class RationCardRegistrationView(APIView):
    authentication_classes = [UserJWTAuthenticationCards]
    parser_classes = (MultiPartParser, FormParser)

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        print("Request DATA:", request.data)
        print("Request FILES:", request.FILES)

        try:
            jwt_payload = request.user

            # Extract and validate family members data
            family_members_data = json.loads(request.data.get('family_members', '[]'))

            family_members = []
            for index, member_data in enumerate(family_members_data):
                # Construct key for the family member image
                face_image_key = f'family_members[{index}].image'

                # Process each family member
                processed_member_data = member_data.copy()

                # Assign image if provided
                if face_image_key in request.FILES:
                    processed_member_data['face_image'] = request.FILES[face_image_key]

                # Validate and save family member
                serializer = FamilyMemberSerializer(data=processed_member_data)
                if serializer.is_valid(raise_exception=True):
                    family_member = serializer.save()
                    family_members.append(family_member)

            # Validate the shop instance
            shop_id = request.data.get('registered_shop')
            try:
                shop_instance = RationShop.objects.get(shop_id=shop_id)
            except RationShop.DoesNotExist:
                return Response({'message': 'Invalid shop selected'}, status=status.HTTP_400_BAD_REQUEST)

            # Prepare ration card data
            card_data = {
                'head_name': request.data.get('head_name'),
                'head_age': request.data.get('head_age'),
                'head_monthly_income': request.data.get('head_monthly_income'),
                'head_aadhaar': request.data.get('head_aadhaar'),
                'mobile_number': request.data.get('mobile_number'),
                'household_address': request.data.get('household_address'),
                'registered_shop': shop_instance.shop_id,
                'requester_id': jwt_payload['user_id'],
                'requester_email': jwt_payload['email'],
            }

            # Assign supporting document
            if 'supporting_document' in request.FILES:
                card_data['supporting_document'] = request.FILES['supporting_document']

            # Create the ration card
            card_serializer = RationCardSerializer(data=card_data)
            if card_serializer.is_valid(raise_exception=True):
                ration_card = card_serializer.save()

                # Associate family members with the ration card
                ration_card.family_members.set(family_members)

                return Response({
                    'message': 'Ration card application submitted successfully',
                    'card_number': ration_card.card_number
                }, status=status.HTTP_201_CREATED)

        except json.JSONDecodeError:
            return Response({'message': 'Invalid family members data format'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            transaction.set_rollback(True)
            return Response({'message': 'Failed to create ration card', 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class RationCardListView(APIView):
    authentication_classes = [SubAdminJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            sub_admin = request.user
            
            # First check if the sub_admin has any active shops
            if not RationShop.objects.filter(owner=sub_admin, is_active=True).exists():
                return Response(
                    {'error': 'No active shops found for this sub-admin'}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            # Get ration cards for all shops owned by the sub-admin
            ration_cards = RationCard.objects.filter(
                registered_shop__owner=sub_admin,
                registered_shop__is_active=True,
                status__in=['PENDING', 'SHOP_VERIFIED', 'ADMIN_APPROVED', 'SHOP_REJECTED', 'ADMIN_REJECTED']
            ).select_related(
                'registered_shop',
                'card_type'
            ).prefetch_related(
                'family_members'
            ).order_by('-created_at')

            # Add filtering by status if provided in query params
            status_filter = request.query_params.get('status')
            if status_filter:
                ration_cards = ration_cards.filter(status=status_filter.upper())

            # Add filtering by shop if provided in query params
            shop_id = request.query_params.get('shop_id')
            if shop_id:
                ration_cards = ration_cards.filter(registered_shop__shop_id=shop_id)

            serializer = RationCardRetrieveSerializer(ration_cards, many=True)
            return Response({
                'count': ration_cards.count(),
                'results': serializer.data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {
                    'error': 'Failed to retrieve ration cards',
                    'details': str(e)
                }, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VerifyCardView(APIView):
    authentication_classes = [UserJWTAuthenticationCards]

    def get(self, request, card_number, *args, **kwargs):
        if not card_number:
            return Response(
                {'message': 'Card number is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Get card details with related data
            card = RationCard.objects.select_related(
                'card_type',
                'registered_shop'
            ).get(
                card_number=card_number,
                is_active=True
            )
            
            

            # Serialize and return card data
            serializer = CardVerificationSerializer(card)
            return Response(serializer.data)

        except RationCard.DoesNotExist:
            return Response(
                {'message': 'Invalid or inactive card number'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'message': 'An error occurred while verifying the card'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FetchCardForAdminView(APIView):
    authentication_classes = [SubAdminJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, shop_id, *args, **kwargs):
        try:
            
            # First check whether the shop is active
            if not RationShop.objects.filter(shop_id=shop_id, is_active=True).exists():
                return Response(
                    {'error': 'This shop is not active'}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            # Get ration cards for the shop
            ration_cards = RationCard.objects.filter(
                registered_shop__shop_id=shop_id,
                registered_shop__is_active=True,
                status__in=['PENDING', 'SHOP_VERIFIED', 'ADMIN_APPROVED', 'SHOP_REJECTED', 'ADMIN_REJECTED']
            ).select_related(
                'registered_shop',
                'card_type'
            ).prefetch_related(
                'family_members'
            ).order_by('-created_at')

            # Add filtering by status if provided in query params
            status_filter = request.query_params.get('status')
            if status_filter:
                ration_cards = ration_cards.filter(status=status_filter.upper())

            # Add filtering by shop if provided in query params
            shop_id = request.query_params.get('shop_id')
            if shop_id:
                ration_cards = ration_cards.filter(registered_shop__shop_id=shop_id)

            serializer = RationCardRetrieveSerializer(ration_cards, many=True)
            return Response({
                'count': ration_cards.count(),
                'results': serializer.data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {
                    'error': 'Failed to retrieve ration cards',
                    'details': str(e)
                }, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        


class QuotaInfoView(APIView):
    def get(self, request):
        card_type = request.query_params.get('cardType', 'antyodaya')
        shop_id = request.query_params.get('shopId')

        # Retrieve the ration card
        try:
            ration_card = RationCard.objects.get(
                card_type__name=card_type,
                registered_shop_id=shop_id
            )
        except RationCard.DoesNotExist:
            return Response({
                'regular_quota': [],
                'additional_quota': []
            }, status=200)

        # Get max quantities
        max_quantities = ration_card.max_quantities or {}

        # Prepare response
        response_data = {
            'regular_quota': [],
            'additional_quota': []
        }

        # Transform max quantities into the format your frontend expects
        for category, items in max_quantities.items():
            quota_key = 'regular_quota' if category == 'regular' else 'additional_quota'
            
            for item_name, item_details in items.items():
                quota_item = {
                    'item_name': item_name,
                    'max_quantity': item_details['max_quantity'],
                    'price_per_unit': item_details['price_per_unit'],
                    'item_unit': item_details.get('unit', 'kg')
                }
                response_data[quota_key].append(quota_item)

        return Response(response_data)
    
class RationCardShopVerificationView(APIView):
    def patch(self, request, card_number):
        try:
            print(card_number)
            # Find the ration card
            ration_card = RationCard.objects.get(card_number=card_number)
            
            # Get shop verified by (sub admin)
            shop_id = request.data.get('shop_verified_by')
            shop = RationShop.objects.get(shop_id=shop_id)
            
            # Update verification details
            ration_card.shop_verified_by = shop
            ration_card.shop_verification_notes = request.data.get('shop_verification_notes', '')
            ration_card.shop_verified_at = timezone.now()
            ration_card.status = 'SHOP_VERIFIED'
            
            # Validate and save
            ration_card.full_clean()
            ration_card.save()
            
            # Return updated card details
            return Response({
                'message': 'Card verified successfully',
                'card_number': ration_card.card_number,
                'status': ration_card.status,
            }, status=200)
        
        except RationCard.DoesNotExist:
            return Response({'error': 'Card not found'}, status=404)
        
        except SubAdminAuth.DoesNotExist:
            return Response({'error': 'Invalid sub-admin'}, status=400)
        
        except ValidationError as e:
            return Response({'error': str(e)}, status=400)
        
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class FetchCardTypes(APIView):
    def get(self, request):
        try:
            card_types = CardType.objects.filter(is_active=True)
            serializer = CardTypeSerializer(card_types, many=True)
            return Response({'cardType': serializer.data}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

        
class RationCardVerificationView(APIView):

    def patch(self, request, card_number):
        try:
            # Fetch the ration card
            ration_card = RationCard.objects.get(card_number=card_number)

            # Get card type
            card_type_name = request.data.get('card_type')
            if card_type_name:
                card_type = CardType.objects.get(name=card_type_name)
                ration_card.card_type = card_type

            # Get admin details from request
            admin_email = request.data.get('admin_email')
            
            try:
                # Find the SubAdminAuth corresponding to the email
                admin = SubAdminAuth.objects.get(email=admin_email)
                ration_card.admin_verified_by = admin
            except SubAdminAuth.DoesNotExist:
                return Response(
                    {'error': 'Admin not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            # Update verification details
            ration_card.status = request.data.get('status', 'ADMIN_APPROVED')
            ration_card.admin_verification_notes = request.data.get('admin_verification_notes', '')
            ration_card.admin_verified_at = timezone.now()

            # Save the ration card
            ration_card.save()

            # If the card is approved, automatically allocate quotas
            if ration_card.status == 'ADMIN_APPROVED' and ration_card.card_type:
                # Method to automatically allocate quotas
                self.auto_allocate_quotas(ration_card)

            # Serialize and return updated card
            serializer = RationCardSerializer(ration_card)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except RationCard.DoesNotExist:
            return Response(
                {'error': 'Ration card not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except CardType.DoesNotExist:
            return Response(
                {'error': 'Invalid card type'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def auto_allocate_quotas(self, ration_card):
        """
        Automatically allocate quotas for an approved ration card
        """
        from django.db import transaction
        from stocks_app.models import Quota
        from ration_cards_app.models import QuotaAllocation

        if not ration_card.card_type:
            return False

        # Find all quotas for this card type
        quotas = Quota.objects.filter(
            card_type=ration_card.card_type,
            month=timezone.now().month,
            year=timezone.now().year
        )

        if not quotas.exists():
            print(f"No quotas found for card type {ration_card.card_type} in current month")
            return False

        # Use transaction to ensure data integrity
        with transaction.atomic():
            # Clear any existing quota allocations for this card
            QuotaAllocation.objects.filter(ration_card=ration_card).delete()

            # Create new quota allocations
            for quota in quotas:
                # Calculate max allowed quantity
                max_quantity = ration_card.calculate_family_size() * quota.max_quantity

                QuotaAllocation.objects.create(
                    ration_card=ration_card,
                    item=quota.item,
                    quota=quota,
                    allocated_quantity=max_quantity,
                    remaining_quantity=max_quantity,
                    is_used=False
                )

        return True


class FaceAuthenticationView(APIView):
    def post(self, request):
        live_video = request.FILES.get('live_video')
        live_image = request.FILES.get('live_image')
        card_number = request.POST.get('card_number')
        video_path = None

        if not card_number:
            return Response({'error': 'Card number is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if live_video:
                # Save and process video
                video_path = self.save_uploaded_video(live_video)
                frames = self.extract_frames(video_path)
                os.unlink(video_path)  # Clean up video file
                return self.authenticate_face(frames, card_number)

            elif live_image:
                # Save and process image
                image_path = self.save_uploaded_image(live_image)
                try:
                    image = cv2.imread(image_path)
                    return self.authenticate_face([image], card_number)
                finally:
                    os.unlink(image_path)  # Always clean up temp image

            else:
                return Response({'error': 'No image or video uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            # Cleanup video file in case of errors
            if video_path and os.path.exists(video_path):
                os.unlink(video_path)
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def save_uploaded_video(self, live_video):
        """Save uploaded video to a temporary location"""
        video_dir = os.path.join(settings.MEDIA_ROOT, 'liveness_videos')
        os.makedirs(video_dir, exist_ok=True)
        filename = f"{uuid.uuid4()}.webm"
        full_path = os.path.join(video_dir, filename)
        with open(full_path, 'wb') as destination:
            for chunk in live_video.chunks():
                destination.write(chunk)
        return full_path

    def save_uploaded_image(self, live_image):
        """Save uploaded image to a temporary location"""
        image_dir = os.path.join(settings.MEDIA_ROOT, 'liveness_images')
        os.makedirs(image_dir, exist_ok=True)
        filename = f"{uuid.uuid4()}.jpg"
        full_path = os.path.join(image_dir, filename)
        with open(full_path, 'wb') as destination:
            for chunk in live_image.chunks():
                destination.write(chunk)
        return full_path

    def extract_frames(self, video_path, max_frames=10):
        """Extract frames from video"""
        frames = []
        video = cv2.VideoCapture(video_path)
        frame_count = 0
        while frame_count < max_frames:
            ret, frame = video.read()
            if not ret:
                break
            frames.append(frame)
            frame_count += 1
        video.release()
        return frames


    def authenticate_face(self, frames, card_number):
        try:
            # Retrieve stored face encoding
            stored_face_encoding = self.get_stored_face_encoding(card_number)
            if stored_face_encoding is None:
                return Response({'error': 'No stored face found for this ration card'},
                                status=status.HTTP_404_NOT_FOUND)

            # Comprehensive liveness and authentication check
            liveness_result = self.advanced_liveness_check(frames, stored_face_encoding)
            
            if not liveness_result['is_live']:
                return Response({
                    'error': liveness_result['details'],
                    'reason': liveness_result['reason']
                }, status=status.HTTP_403_FORBIDDEN)

            return Response({
                'status': 'success',
                'message': 'Face authenticated successfully',
                'similarity_score': liveness_result.get('similarity_score', 0)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': f"Authentication error: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def advanced_liveness_check(self, frames, stored_face_encoding, eye_open_threshold=0.3, similarity_threshold=0.6):
        """
        Advanced liveness detection with multiple checks
        
        Args:
            frames (list): List of captured video frames
            stored_face_encoding (numpy.ndarray): Stored face encoding
            eye_open_threshold (float): Minimum eye aspect ratio to consider eyes open
            similarity_threshold (float): Minimum similarity to consider a match
        
        Returns:
            dict: Liveness detection result
        """
        # Validate input
        if not frames or len(frames) < 3:
            return {
                'is_live': False, 
                'details': 'Insufficient frames for authentication',
                'reason': 'Not enough frames captured'
            }

        # Convert frames to RGB
        rgb_frames = [cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) for frame in frames]
        
        # Detect faces and landmarks
        face_detections = []
        for frame in rgb_frames:
            # Detect faces
            face_locations = face_recognition.face_locations(frame)
            face_encodings = face_recognition.face_encodings(frame, face_locations)
            
            # Store detection results
            face_detections.append({
                'locations': face_locations,
                'encodings': face_encodings
            })

        # Validate face detection
        valid_detections = [det for det in face_detections if det['locations']]
        if len(valid_detections) < len(frames) * 0.5:
            return {
                'is_live': False, 
                'details': 'Face not consistently detected',
                'reason': 'Inconsistent face detection'
            }

        # Eye openness check
        def calculate_eye_aspect_ratio(eye):
            """Calculate eye aspect ratio"""
            A = distance.euclidean(eye[1], eye[5])
            B = distance.euclidean(eye[2], eye[4])
            C = distance.euclidean(eye[0], eye[3])
            return (A + B) / (2.0 * C)

        # Aggregate eye openness and face matching results
        eye_open_results = []
        face_match_results = []
        frame_similarities = []

        for frame, detection in zip(rgb_frames, face_detections):
            if not detection['locations']:
                continue

            # Face landmarks for eye openness
            try:
                face_landmarks = face_recognition.face_landmarks(frame, detection['locations'])
                
                # Check eye openness
                if face_landmarks:
                    left_eye = face_landmarks[0]['left_eye']
                    right_eye = face_landmarks[0]['right_eye']
                    
                    left_ear = calculate_eye_aspect_ratio(left_eye)
                    right_ear = calculate_eye_aspect_ratio(right_eye)
                    
                    # Eyes are open if both eyes have aspect ratio above threshold
                    is_eyes_open = left_ear > eye_open_threshold and right_ear > eye_open_threshold
                    eye_open_results.append(is_eyes_open)
                else:
                    eye_open_results.append(False)
            except Exception:
                eye_open_results.append(False)

            # Face matching
            if detection['encodings']:
                # Compare with stored face encoding
                matches = face_recognition.compare_faces(
                    [stored_face_encoding], 
                    detection['encodings'][0], 
                    tolerance=0.5  # Adjust tolerance as needed
                )
                face_match_results.append(matches[0])

                # Calculate similarity score
                face_distance = face_recognition.face_distance(
                    [stored_face_encoding], 
                    detection['encodings'][0]
                )
                frame_similarities.append(1 - face_distance[0])

        # Evaluate results
        # Eyes must be open in majority of frames
        eye_open_percentage = sum(eye_open_results) / len(eye_open_results) * 100
        
        # Face must match in majority of frames
        face_match_percentage = sum(face_match_results) / len(face_match_results) * 100
        
        # Calculate average similarity
        avg_similarity = np.mean(frame_similarities) if frame_similarities else 0

        # Final liveness check
        is_live = (
            eye_open_percentage > 70 and  # Eyes open in >70% of frames
            face_match_percentage > 70 and  # Face match in >70% of frames
            avg_similarity > similarity_threshold  # Minimum similarity threshold
        )

        return {
            'is_live': is_live,
            'details': 'Liveness check result' if is_live else 'Liveness check failed',
            'reason': (
                'Live face detected' if is_live else 
                (
                    'Closed eyes' if eye_open_percentage <= 70 else
                    'Face mismatch' if face_match_percentage <= 70 else
                    'Low similarity'
                )
            ),
            'eye_open_percentage': eye_open_percentage,
            'face_match_percentage': face_match_percentage,
            'similarity_score': avg_similarity
        }


    def check_liveness(self, frames, threshold=0.7):
        """
        Advanced liveness detection with strict eye-open and real-face checks
        """
        if len(frames) < 3:
            return {
                'is_live': False, 
                'details': 'Insufficient frames for liveness detection',
                'raw_results': []
            }

        try:
            # Convert frames to RGB
            rgb_frames = [cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) for frame in frames]
            
            # Detect faces and landmarks
            face_locations = []
            face_landmarks = []
            for frame in rgb_frames:
                locations = face_recognition.face_locations(frame)
                landmarks = face_recognition.face_landmarks(frame) if locations else []
                face_locations.append(locations)
                face_landmarks.append(landmarks)
            
            # Validate consistent face detection
            valid_face_frames = [i for i, locs in enumerate(face_locations) if locs]
            if len(valid_face_frames) < len(frames) * 0.5:
                return {
                    'is_live': False, 
                    'details': 'Face not consistently detected',
                    'raw_results': []
                }
            
            # Strict eye-open detection
            eye_open_check = self.detect_eye_openness(face_landmarks)
            if not eye_open_check['is_eyes_open']:
                return {
                    'is_live': False, 
                    'details': 'Eyes were closed during authentication',
                    'raw_results': eye_open_check
                }
            
            # Anti-replay detection
            anti_replay_check = self.detect_anti_replay(rgb_frames)
            if not anti_replay_check['is_live']:
                return {
                    'is_live': False, 
                    'details': 'Possible replay attack detected',
                    'raw_results': anti_replay_check
                }
            
            return {
                'is_live': True,
                'details': 'Liveness detection passed',
                'raw_results': {
                    'eye_openness': eye_open_check,
                    'anti_replay': anti_replay_check
                }
            }
        
        except Exception as e:
            print(f"Liveness detection error: {e}")
            return {
                'is_live': False, 
                'details': f'Liveness detection failed: {str(e)}',
                'raw_results': []
            }

    def detect_eye_openness(self, face_landmarks_list):
        """
        Strictly check if eyes are consistently open across frames
        """
        if not face_landmarks_list:
            return {'is_eyes_open': False, 'details': 'No face landmarks detected'}
        
        eye_open_frames = 0
        total_frames = len(face_landmarks_list)
        
        for landmarks_list in face_landmarks_list:
            if not landmarks_list:
                continue
            
            for landmarks in landmarks_list:
                # Extract eye landmarks
                left_eye = landmarks.get('left_eye', [])
                right_eye = landmarks.get('right_eye', [])
                
                if not left_eye or not right_eye:
                    continue
                
                # Calculate eye aspect ratio
                def eye_aspect_ratio(eye):
                    # Vertical eye landmarks
                    A = distance.euclidean(eye[1], eye[5])
                    B = distance.euclidean(eye[2], eye[4])
                    # Horizontal eye landmark
                    C = distance.euclidean(eye[0], eye[3])
                    
                    # Eye aspect ratio
                    ear = (A + B) / (2.0 * C)
                    return ear
                
                left_ear = eye_aspect_ratio(left_eye)
                right_ear = eye_aspect_ratio(right_eye)
                
                # Eyes are considered open if EAR is above threshold
                # Lower threshold means eyes must be more open
                if left_ear > 0.3 and right_ear > 0.3:
                    eye_open_frames += 1
        
        # Check if eyes are open in majority of frames
        eye_open_percentage = (eye_open_frames / total_frames) * 100
        
        return {
            'is_eyes_open': eye_open_percentage > 70,  # Eyes must be open in 70% of frames
            'open_percentage': eye_open_percentage,
            'details': f'Eyes open in {eye_open_percentage:.2f}% of frames'
        }

    def detect_anti_replay(self, rgb_frames):
        """
        Advanced anti-replay detection
        Checks for:
        1. Texture variation
        2. Color histogram differences
        3. Edge detection
        4. Possible screen/image artifacts
        """
        if len(rgb_frames) < 2:
            return {'is_live': False, 'details': 'Insufficient frames'}
        
        texture_variations = []
        color_histogram_variations = []
        edge_variations = []
        
        for i in range(1, len(rgb_frames)):
            prev_frame = rgb_frames[i-1]
            curr_frame = rgb_frames[i]
            
            # Grayscale for texture analysis
            prev_gray = cv2.cvtColor(prev_frame, cv2.COLOR_RGB2GRAY)
            curr_gray = cv2.cvtColor(curr_frame, cv2.COLOR_RGB2GRAY)
            
            # Texture variation using structural similarity index
            texture_score = structural_similarity(prev_gray, curr_gray)
            texture_variations.append(texture_score)
            
            # Color histogram comparison
            prev_hist = cv2.calcHist([prev_frame], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
            curr_hist = cv2.calcHist([curr_frame], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
            hist_score = cv2.compareHist(prev_hist, curr_hist, cv2.HISTCMP_CORREL)
            color_histogram_variations.append(hist_score)
            
            # Edge detection variation
            prev_edges = cv2.Canny(prev_gray, 100, 200)
            curr_edges = cv2.Canny(curr_gray, 100, 200)
            edge_variation = np.sum(np.abs(prev_edges - curr_edges)) / (prev_edges.shape[0] * prev_edges.shape[1])
            edge_variations.append(edge_variation)
        
        # Analyze variations
        texture_avg = np.mean(texture_variations)
        color_hist_avg = np.mean(color_histogram_variations)
        edge_avg = np.mean(edge_variations)
        
        # Scoring logic (adjust thresholds as needed)
        is_live = (
            texture_avg > 0.7 and  # Structural similarity
            color_hist_avg > 0.5 and  # Color histogram correlation
            edge_avg > 0.1  # Edge variation
        )
        
        return {
            'is_live': is_live,
            'details': {
                'texture_variation': texture_avg,
                'color_histogram_variation': color_hist_avg,
                'edge_variation': edge_avg
            }
        }

    def save_frame_as_image(self, frame):
        """Save a single frame as a temporary image"""
        temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp_frames')
        os.makedirs(temp_dir, exist_ok=True)
        filename = f"{uuid.uuid4()}.jpg"
        full_path = os.path.join(temp_dir, filename)
        cv2.imwrite(full_path, frame)
        return full_path

    def get_stored_face_encoding(self, card_number):
        """Retrieve stored face encoding for a ration card number"""
        try:
            # Directly import the models to ensure they're accessible
            from .models import RationCard, FamilyMember

            ration_card = RationCard.objects.get(card_number=card_number)
            family_member = ration_card.family_members.first()
            
            if family_member and family_member.face_encoding:
                # Convert binary face encoding back to numpy array
                stored_encoding = np.frombuffer(family_member.face_encoding, dtype=np.float64)
                return stored_encoding
            
            return None
        except RationCard.DoesNotExist:
            print(f"No ration card found with number: {card_number}")
            return None
        except Exception as e:
            print(f"Error retrieving face encoding: {e}")
            return None



class OTPView(APIView):
    def post(self, request):
        
        user_email = request.data.get('user_email')
        card_number = request.data.get('card_number')
        phone_number = request.data.get('phone_number')
        
        if not all([user_email, card_number, phone_number]):
            return Response({
                'error': 'Missing required fields'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            otp_service = OTPService()
            otp_service.send_otp(user_email, card_number, phone_number)
            
            return Response({
                'message': 'OTP sent successfully',
                'hint': 'OTP is valid for 5 minutes'
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyOtpView(APIView):
    def post(self, request):
        user_email = request.data.get('user_email')
        card_number = request.data.get('card_number')
        otp = request.data.get('otp')
        
        if not all([user_email, card_number, otp]):
            return Response({
                'error': 'Missing required fields'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        otp_service = OTPService()
        result = otp_service.verify_otp(user_email, card_number, otp)
        
        if result['verified']:
            return Response({
                'message': result['message']
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': result['message'],
                'remaining_attempts': result.get('remaining_attempts', 0)
            }, status=status.HTTP_400_BAD_REQUEST)

class UserRequestedCards(APIView):
    def get(self, request):
        try:
            user_email = request.query_params.get('user_email')
            if not user_email:
                return Response({
                    'error': 'User email is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            cards = RationCard.objects.filter(
                requester_email=user_email
            ).order_by('-created_at')

            serializer = RationCardRetrieveSerializer(cards, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SubAdminRegisteredCardsView(APIView):
    def get(self, request, *args, **kwargs):
        shop_id = request.GET.get('shop_id')
        
        if not shop_id:
            return Response({'error': 'Shop ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            total_cards = RationCard.objects.filter(
                registered_shop_id=shop_id,
                status='ADMIN_APPROVED'
            ).count()

            # Always return count, even if 0
            return Response({'total_cards': total_cards}, status=status.HTTP_200_OK)

        except Exception as e:
            # Return 0 for any error
            return Response({'total_cards': 0}, status=status.HTTP_200_OK)


class SubAdminPendingCardsView(APIView):
    def get(self, request, *args, **kwargs):
        shop_id = request.GET.get('shop_id')
        
        if not shop_id:
            return Response({'error': 'Shop ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            pending_cards = RationCard.objects.filter(
                registered_shop_id=shop_id,
                status='PENDING'
            ).count()

            # Always return count, even if 0
            return Response({'pending_cards': pending_cards}, status=status.HTTP_200_OK)

        except Exception as e:
            # Return 0 for any error
            return Response({'pending_cards': 0}, status=status.HTTP_200_OK)