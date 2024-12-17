import cv2
import numpy as np
import dlib
import mediapipe as mp
from scipy.spatial import distance as dist
from django.conf import settings
import tensorflow as tf

class AdvancedLivenessDetector:
    def __init__(self):
        # Haar Cascades
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
        
        # Dlib eye and landmark detector
        self.eye_detector = dlib.get_frontal_face_detector()
        self.landmark_predictor = dlib.shape_predictor(settings.SHAPE_PREDICTOR_PATH)
        
        # MediaPipe for head pose estimation
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            min_detection_confidence=0.5, 
            min_tracking_confidence=0.5
        )
        
        # Optional: Texture analysis model (can be commented out if not used)
        # try:
        #     self.texture_model = tf.keras.models.load_model(settings.LIVENESS_MODEL_PATH)
        #     self._print_model_details()
        # except Exception as e:
        #     print(f"Warning: Could not load texture model: {e}")
        #     self.texture_model = None
        
        # Tracking variables for head movement
        self.prev_landmarks = None
        self.movement_threshold = 20  # pixels
        
        # Blink tracking
        self.blink_counter = 0
        self.total_blinks = 0
    
    def _print_model_details(self):
        """
        Print details about the loaded texture model
        """
        if self.texture_model:
            try:
                print("Model Input Shape:", self.texture_model.input_shape)
                print("Model output Shape:", self.texture_model.output_shape)
                print("Model Summary:")
                self.texture_model.summary()
            except Exception as e:
                print(f"Error printing model details: {e}")


    def detect_liveness(self, image):
        """
        Comprehensive liveness detection with multiple checks
        """
        # Handle file-like or numpy array input
        if hasattr(image, 'read'):
            image_array = np.frombuffer(image.read(), np.uint8)
            image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        
        # Haar cascade face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, 1.3, 5)
        
        # No face detected
        if len(faces) == 0:
            return False
        
        # Multi-stage liveness checks
        checks = [
            self._haar_face_eye_detection(image, gray, faces),
            self._blink_detection(image),
            self._head_movement_analysis(image)
        ]

        # Log which checks passed/failed
        for i, check_result in enumerate(checks):
            print(f"Check {i+1} result: {check_result}")
        
        # Optional texture analysis if model is loaded
        # if self.texture_model:
        #     try:
        #         checks.append(self._texture_analysis(image))
        #     except Exception as e:
        #         print(f"Texture analysis failed: {e}")
        
        # Require at least 2 out of available checks to pass
        return sum(checks) == 3

    def _haar_face_eye_detection(self, image, gray, faces):
        """
        Detect faces and eyes using Haar cascades
        """
        for (x, y, w, h) in faces:
            # Region of interest for eyes
            roi_gray = gray[y:y+h, x:x+w]
            eyes = self.eye_cascade.detectMultiScale(roi_gray)
            
            # Require at least one eye detected
            return len(eyes) > 0
        return False

    def _blink_detection(self, image):
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.eye_detector(gray)
        
        if not faces:
            print("No faces detected for blink detection")
            return False
        
        for face in faces:
            try:
                landmarks = self.landmark_predictor(gray, face)
                
                left_eye = self._get_eye_landmarks(landmarks, 36, 42)
                right_eye = self._get_eye_landmarks(landmarks, 42, 48)
                
                left_ear = self._eye_aspect_ratio(left_eye)
                right_ear = self._eye_aspect_ratio(right_eye)
                
                ear = (left_ear + right_ear) / 2.0
                
                print(f"Eye Aspect Ratio: {ear}")
                
                # More aggressive blink detection
                # Allow for partial blinks or different eye shapes
                is_blink = ear < 0.3  # Raised threshold slightly
                print(f"Is Blink: {is_blink}")
                return is_blink
            
            except Exception as e:
                print(f"Blink detection error: {e}")
        
        return False

    def _get_eye_landmarks(self, landmarks, start, end):
        """
        Extract eye landmarks
        """
        return [(landmarks.part(i).x, landmarks.part(i).y) 
                for i in range(start, end)]

    def _eye_aspect_ratio(self, eye):
        """
        Calculate eye aspect ratio
        """
        # Vertical eye landmarks
        A = dist.euclidean(eye[1], eye[5])
        B = dist.euclidean(eye[2], eye[4])
        
        # Horizontal eye landmark
        C = dist.euclidean(eye[0], eye[3])
        
        # Calculate aspect ratio
        ear = (A + B) / (2.0 * C)
        return ear

    def _head_movement_analysis(self, image):
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(image_rgb)
        
        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                # Extract key head movement landmarks with absolute coordinates
                landmarks = np.array([
                    (lm.x * image.shape[1], lm.y * image.shape[0], lm.z) 
                    for lm in face_landmarks.landmark
                ])
                
                # First time detection handling
                if self.prev_landmarks is None:
                    self.prev_landmarks = landmarks
                    print("First time landmark detection")
                    # Immediately return True to allow movement
                    return True
                
                # Calculate movement
                movement = np.mean(np.abs(landmarks - self.prev_landmarks))
                
                print(f"Head Movement: {movement}")
                
                # Update previous landmarks
                self.prev_landmarks = landmarks
                
                # More lenient movement detection
                is_moving = movement > 0.05  # Lowered threshold
                print(f"Is Moving: {is_moving}")
                return is_moving
        
        print("No face landmarks detected")
        return False

    def _texture_analysis(self, image):
        """
        Machine learning-based texture analysis
        Detect potential photo/screen replay attacks
        """
        # Check if texture model is loaded
        if self.texture_model is None:
            return False
        
        try:
            # Resize and preprocess image
            processed_image = cv2.resize(image, (224, 224))
            processed_image = processed_image.astype('float32') / 255.0
            
            input_image = np.expand_dims(processed_image, axis=0)
            
            # Reshape to match model's expected input
            
            # Predict liveness probability
            prediction = self.texture_model.predict(input_image)
            
            return prediction[0][0] > 0.7  # 70% confidence of being live
        except Exception as e:
            print(f"Texture analysis prediction error: {e}")
            return False



