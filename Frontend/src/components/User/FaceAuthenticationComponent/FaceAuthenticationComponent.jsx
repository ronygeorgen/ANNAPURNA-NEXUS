import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import api from '../../../services/api';
import { useNavigate, useLocation, Link } from 'react-router-dom';


const FaceAuthenticationComponent = () => {
    const webcamRef = useRef(null);
    const [error, setError] = useState(null);
    const location = useLocation();
    const shop = location.state?.shop;
    const cardDetails = location.state?.cardDetails;
    const cardNumber = cardDetails?.card_number || 'N/A';
    console.log('card details in face recognition component: ',cardDetails);
    
    

    const captureAndAuthenticate = async () => {
        const imageSrc = webcamRef.current.getScreenshot();
        
        // Convert base64 to file
        const blob = await (await fetch(imageSrc)).blob();
        const file = new File([blob], 'captured_face.jpg', { type: 'image/jpeg' });

        const formData = new FormData();
        formData.append('live_image', file);
        formData.append('card_number', cardNumber);

        try {
            const response = await api.post('/ration-card/face-auth/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.authenticated) {
                // Proceed to next step
                console.log('Authentication successful');
            }
        } catch (err) {
            setError(err.response.data.error);
        }
    };

    return (
        <div>
            <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
            />
            <button onClick={captureAndAuthenticate}>
                Authenticate Face
            </button>
            {error && <p>{error}</p>}
        </div>
    );
};

export default FaceAuthenticationComponent;